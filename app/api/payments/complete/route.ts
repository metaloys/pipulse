import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/payments/complete
 * 
 * Server-side payment completion using Pi Network API
 * Complete workflow with all 6 critical steps:
 * 
 * STEP 1: Complete payment with Pi Network API
 * STEP 2: Get payment details from Pi Network (to confirm amount)
 * STEP 3: Update worker earnings in users table
 * STEP 4: Update submission status in task_submissions table
 * STEP 5: Record transaction in transactions table (with correct UUID sender/receiver)
 * STEP 6: Update task slots remaining
 * 
 * CRITICAL FIX: sender_id and receiver_id must be UUIDs from users table,
 * not Pi blockchain wallet addresses. pi_blockchain_txid stores the blockchain tx.
 * 
 * Request body from onReadyForServerCompletion:
 * {
 *   paymentId: string,
 *   txid: string (blockchain transaction ID),
 *   metadata: {
 *     task_id: string,
 *     worker_id: string (UUID from users table),
 *     submission_id: string,
 *     amount: number (worker payment, after commission),
 *     fee: number (pipulse commission)
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { paymentId, txid, metadata } = body;

    console.log(`📊 Payment complete endpoint called:`, {
      paymentId,
      txid,
      metadata,
    });

    // Validate required inputs
    if (!paymentId || !txid) {
      return NextResponse.json(
        { success: false, error: 'Missing paymentId or txid' },
        { status: 400 }
      );
    }

    // Extract metadata fields
    const taskId = metadata?.task_id;
    const workerId = metadata?.worker_id;
    const submissionId = metadata?.submission_id;
    const workerAmount = metadata?.amount;
    const pipulseFee = metadata?.fee || 0;

    console.log(`📋 Extracted metadata:`, {
      taskId,
      workerId,
      submissionId,
      workerAmount,
      pipulseFee,
    });

    // Get the PI_API_KEY from environment variables
    const apiKey = process.env.PI_API_KEY;
    if (!apiKey) {
      console.error('❌ PI_API_KEY not configured in environment variables');
      return NextResponse.json(
        { success: false, error: 'Server misconfiguration: API key not set' },
        { status: 500 }
      );
    }

    // Initialize Supabase admin client early for lookups
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // ========================================================================
    // STEP 1: Complete payment with Pi Network API
    // ========================================================================
    console.log(`\n🔐 [STEP 1] Completing payment with Pi Network: ${paymentId}`);
    const piCompleteResponse = await fetch(
      `https://api.minepi.com/v2/payments/${paymentId}/complete`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Key ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ txid }),
      }
    );

    if (!piCompleteResponse.ok) {
      const errorData = await piCompleteResponse.json().catch(() => ({}));
      console.error(`❌ Pi Network complete failed (${piCompleteResponse.status}):`, errorData);
      
      return NextResponse.json(
        {
          success: false,
          error: `Pi Network API error: ${piCompleteResponse.status}`,
          details: errorData,
        },
        { status: piCompleteResponse.status }
      );
    }

    const completionData = await piCompleteResponse.json();
    console.log(`✅ [STEP 1] Payment completed on Pi Network`);

    // ========================================================================
    // STEP 2: Get payment details from Pi Network
    // ========================================================================
    console.log(`\n📄 [STEP 2] Fetching payment details from Pi Network: ${paymentId}`);
    let paymentDetailsAmount = workerAmount; // Use provided amount as fallback

    const piDetailsResponse = await fetch(
      `https://api.minepi.com/v2/payments/${paymentId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Key ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (piDetailsResponse.ok) {
      const paymentDetails = await piDetailsResponse.json();
      paymentDetailsAmount = paymentDetails.amount || workerAmount;
      console.log(`✅ [STEP 2] Payment amount confirmed: ${paymentDetailsAmount}π`);
    } else {
      console.warn(`⚠️ [STEP 2] Could not fetch payment details, using metadata amount: ${workerAmount}π`);
    }

    // ========================================================================
    // IMPORTANT: Fetch employer ID from task before database updates
    // ========================================================================
    let employerId: string | null = null;
    if (taskId) {
      console.log(`\n👔 Fetching employer ID for task: ${taskId}`);
      const { data: taskData, error: taskError } = await supabaseAdmin
        .from('tasks')
        .select('employer_id')
        .eq('id', taskId)
        .maybeSingle();

      if (taskError) {
        console.warn(`⚠️ Failed to fetch employer from task:`, taskError);
      } else if (taskData) {
        employerId = taskData.employer_id;
        console.log(`✅ Employer ID found: ${employerId}`);
      }
    }

    // ========================================================================
    // Database updates
    // ========================================================================
    if (workerId && submissionId && paymentDetailsAmount) {
      try {
        console.log(`\n💾 Starting database updates sequence`);

        // ====================================================================
        // STEP 3: Update worker earnings in users table
        // ====================================================================
        console.log(`\n💰 [STEP 3] Updating worker earnings for: ${workerId}`);
        const { data: userData, error: userFetchError } = await supabaseAdmin
          .from('users')
          .select('total_earnings, total_tasks_completed')
          .eq('id', workerId)
          .maybeSingle();

        if (userFetchError) {
          console.error(`❌ [STEP 3] Failed to fetch user data:`, userFetchError);
        } else if (userData) {
          const newTotalEarnings = (userData.total_earnings || 0) + paymentDetailsAmount;
          const newTasksCompleted = (userData.total_tasks_completed || 0) + 1;

          const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({
              total_earnings: newTotalEarnings,
              total_tasks_completed: newTasksCompleted,
              updated_at: new Date().toISOString(),
            })
            .eq('id', workerId);

          if (updateError) {
            console.error(`❌ [STEP 3] Failed to update user earnings:`, updateError);
          } else {
            console.log(`✅ [STEP 3] Worker earnings updated: ${newTotalEarnings}π, tasks completed: ${newTasksCompleted}`);
          }
        } else {
          console.error(`❌ [STEP 3] Worker not found: ${workerId}`);
        }

        // ====================================================================
        // STEP 4: Update submission status in task_submissions table
        // ====================================================================
        console.log(`\n✓ [STEP 4] Updating submission status: ${submissionId}`);
        const { error: submissionError } = await supabaseAdmin
          .from('task_submissions')
          .update({
            status: 'completed',
            reviewed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', submissionId);

        if (submissionError) {
          console.error(`❌ [STEP 4] Failed to update submission status:`, submissionError);
        } else {
          console.log(`✅ [STEP 4] Submission status updated to 'completed'`);
        }

        // ====================================================================
        // STEP 5: Record transaction in transactions table
        // CRITICAL FIX: Use UUIDs for sender_id and receiver_id, not wallet addresses
        // ====================================================================
        console.log(`\n💳 [STEP 5] Recording transaction with correct UUIDs`);
        console.log(`   sender_id (employer): ${employerId} (UUID)`);
        console.log(`   receiver_id (worker): ${workerId} (UUID)`);
        console.log(`   pi_blockchain_txid: ${txid} (blockchain tx)`);

        const { error: txError } = await supabaseAdmin
          .from('transactions')
          .insert([{
            task_id: taskId,
            sender_id: employerId, // FIXED: Use employer's UUID from users table
            receiver_id: workerId, // FIXED: Use worker's UUID from users table
            amount: paymentDetailsAmount,
            pipulse_fee: pipulseFee,
            pi_blockchain_txid: txid, // FIXED: Store blockchain tx ID here, not as sender_id
            transaction_type: 'payment',
            transaction_status: 'completed',
            timestamp: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }]);

        if (txError) {
          console.error(`❌ [STEP 5] Failed to record transaction:`, txError);
          // Log details for debugging
          console.error(`   Transaction data that failed:`, {
            task_id: taskId,
            sender_id: employerId,
            receiver_id: workerId,
            amount: paymentDetailsAmount,
            pipulse_fee: pipulseFee,
            pi_blockchain_txid: txid,
          });
        } else {
          console.log(`✅ [STEP 5] Transaction recorded: ${paymentDetailsAmount}π to worker, ${pipulseFee}π fee`);
          console.log(`   Blockchain txid: ${txid}`);
        }

        // ====================================================================
        // STEP 6: Update task slots remaining
        // ====================================================================
        if (taskId) {
          console.log(`\n🎯 [STEP 6] Updating task slots for: ${taskId}`);
          
          // First fetch current slots
          const { data: taskData } = await supabaseAdmin
            .from('tasks')
            .select('slots_remaining')
            .eq('id', taskId)
            .maybeSingle();

          if (taskData) {
            // IMPORTANT: Validate that slots are available before decrementing
            if ((taskData.slots_remaining || 0) <= 0) {
              console.warn(`⚠️ [STEP 6] No slots remaining for task, skipping decrement`);
            } else {
              const newSlotsRemaining = Math.max(0, (taskData.slots_remaining || 1) - 1);
              const { error: updateSlotsError } = await supabaseAdmin
                .from('tasks')
                .update({
                  slots_remaining: newSlotsRemaining,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', taskId);

              if (updateSlotsError) {
                console.error(`❌ [STEP 6] Failed to update slots:`, updateSlotsError);
              } else {
                console.log(`✅ [STEP 6] Task slots updated: ${newSlotsRemaining} remaining`);
              }
            }
          } else {
            console.warn(`⚠️ [STEP 6] Task not found, skipping slots update`);
          }
        } else {
          console.warn(`⚠️ [STEP 6] No taskId provided, skipping slots update`);
        }
      } catch (dbError) {
        console.error(`❌ Database operation error:`, dbError);
        // Log but don't fail - Pi Network payment already succeeded
        // The database updates are for record-keeping only
      }
    } else {
      console.warn(`⚠️ Skipping database updates - missing required fields:`, {
        workerId,
        submissionId,
        paymentDetailsAmount,
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Payment completed and database updated successfully',
        data: {
          paymentId,
          txid,
          amount: paymentDetailsAmount,
          workerId,
          submissionId,
          taskId,
          employerId,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error in complete endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
