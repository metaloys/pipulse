import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/payments/complete
 * 
 * Server-side payment completion using Pi Network API
 * This endpoint is called when a payment is ready for server completion
 * 
 * The Pi Network requires completion to happen server-side with the PI_API_KEY
 * Additionally, we update the Supabase database with transaction and user info
 * 
 * Request body: { paymentId: string, txid: string, submissionId?: string, amount?: number, workerId?: string }
 * Response: { success: boolean, message?: string, error?: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { paymentId, txid, submissionId, amount, workerId } = body;

    // Validate required inputs
    if (!paymentId || !txid) {
      return NextResponse.json(
        { success: false, error: 'Missing paymentId or txid' },
        { status: 400 }
      );
    }

    // Get the PI_API_KEY from environment variables
    const apiKey = process.env.PI_API_KEY;
    if (!apiKey) {
      console.error('❌ PI_API_KEY not configured in environment variables');
      return NextResponse.json(
        { success: false, error: 'Server misconfiguration: API key not set' },
        { status: 500 }
      );
    }

    // STEP 1: Call Pi Network API server-side to complete the payment
    console.log(`🔐 Completing payment server-side: ${paymentId}`);
    const piResponse = await fetch(
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

    // Handle Pi Network API response
    if (!piResponse.ok) {
      const errorData = await piResponse.json().catch(() => ({}));
      console.error(`❌ Pi Network API error (${piResponse.status}):`, errorData);
      
      return NextResponse.json(
        {
          success: false,
          error: `Pi Network API error: ${piResponse.status}`,
          details: errorData,
        },
        { status: piResponse.status }
      );
    }

    const completionData = await piResponse.json();
    console.log(`✅ Payment completed on Pi Network: ${paymentId}`);

    // STEP 2: Update Supabase database after successful Pi Network completion
    if (submissionId && workerId && amount) {
      try {
        console.log(`📊 Updating Supabase for submission: ${submissionId}`);

        // Initialize Supabase admin client for backend operations
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || '',
          process.env.SUPABASE_SERVICE_ROLE_KEY || '',
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
          }
        );

        // 2a. Add transaction record
        const { error: txError } = await supabaseAdmin
          .from('transactions')
          .insert([{
            id: `txn_${txid}`,
            payment_id: paymentId,
            worker_id: workerId,
            amount: amount,
            status: 'completed',
            pi_transaction_id: txid,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }]);

        if (txError) {
          console.error(`⚠️ Failed to create transaction record:`, txError);
          // Log but don't fail - Pi Network payment already succeeded
        } else {
          console.log(`✅ Transaction record created`);
        }

        // 2b. Update submission status to completed
        const { error: submissionError } = await supabaseAdmin
          .from('task_submissions')
          .update({
            status: 'completed',
            approved_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', submissionId);

        if (submissionError) {
          console.error(`⚠️ Failed to update submission status:`, submissionError);
        } else {
          console.log(`✅ Submission status updated to completed`);
        }

        // 2c. Update worker's total_earnings
        const { data: userData, error: userFetchError } = await supabaseAdmin
          .from('users')
          .select('total_earnings, total_tasks_completed')
          .eq('id', workerId)
          .maybeSingle();

        if (userFetchError) {
          console.error(`⚠️ Failed to fetch user data:`, userFetchError);
        } else if (userData) {
          const newTotalEarnings = (userData.total_earnings || 0) + amount;
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
            console.error(`⚠️ Failed to update user earnings:`, updateError);
          } else {
            console.log(`✅ Worker earnings updated: ${newTotalEarnings}π, tasks: ${newTasksCompleted}`);
          }
        }
      } catch (dbError) {
        console.error(`⚠️ Database update error (non-critical):`, dbError);
        // Log but don't fail - Pi Network payment already succeeded
        // The database updates are for record-keeping only
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Payment completed successfully',
        data: completionData,
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
