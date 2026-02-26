import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(url, key);
}

export async function POST(request: NextRequest) {
  try {
    const { submissionId, workerId, agreedReward } = await request.json();

    if (!submissionId || !workerId || agreedReward === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: submissionId, workerId, agreedReward' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    const now = new Date().toISOString();

    // 1. Get submission and verify it exists and is SUBMITTED
    const { data: submissionData, error: submissionError } = await supabase
      .from('Submission')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (submissionError || !submissionData || submissionData.status !== 'SUBMITTED') {
      return NextResponse.json(
        { error: 'Invalid submission or already processed' },
        { status: 400 }
      );
    }

    // 2. Get worker to verify they exist
    const { data: workerData, error: workerError } = await supabase
      .from('User')
      .select('id, piUsername, totalEarnings, totalTasksCompleted')
      .eq('id', workerId)
      .single();

    if (workerError || !workerData) {
      return NextResponse.json(
        { error: 'Worker not found' },
        { status: 404 }
      );
    }

    // 3. Calculate fee and payout (5% platform fee)
    const platformFee = parseFloat((agreedReward * 0.05).toFixed(4));
    const workerPayout = parseFloat((agreedReward - platformFee).toFixed(4));

    console.log(`💰 Releasing payment: ${agreedReward}π total, ${workerPayout}π to worker, ${platformFee}π fee`);

    // 4. Call Pi API to send real Pi to worker
    let piResponse = null;
    let piData = null;
    let piPaymentSuccessful = false;

    try {
      piResponse = await fetch('https://api.minepi.com/v2/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${process.env.PI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: workerPayout,
          memo: 'PiPulse: Task payment',
          metadata: {
            submissionId: submissionId,
            workerId: workerId,
            type: 'worker_payout',
          },
          uid: workerId,
          payment_type: 'developer_to_user',
        }),
      });

      piData = await piResponse.json();
      piPaymentSuccessful = piResponse.ok;
      console.log('Pi API response:', piData);

      if (!piResponse.ok) {
        console.error('Pi API error:', piData);
      }
    } catch (piError) {
      console.error('Pi API call failed:', piError);
      // Continue with database update even if Pi API fails
      // so we can retry payment manually later
    }

    // 5. Update submission to APPROVED
    await supabase
      .from('Submission')
      .update({
        status: 'APPROVED',
        reviewedAt: now,
        updatedAt: now,
      })
      .eq('id', submissionId);

    // 6. Update worker earnings and task count in User table
    const newTotalEarnings = (workerData.totalEarnings || 0) + workerPayout;
    const newTasksCompleted = (workerData.totalTasksCompleted || 0) + 1;

    await supabase
      .from('User')
      .update({
        totalEarnings: newTotalEarnings,
        totalTasksCompleted: newTasksCompleted,
        updatedAt: now,
      })
      .eq('id', workerId);

    // 7. Create Transaction record with Pi payment details
    await supabase
      .from('Transaction')
      .insert({
        senderId: 'pipulse_escrow',
        receiverId: workerId,
        amount: workerPayout,
        pipulseFee: platformFee,
        submissionId: submissionId,
        type: 'PAYMENT',
        status: piPaymentSuccessful ? 'COMPLETED' : 'PENDING',
        piBlockchainTxId: piData?.transaction?.txid || null,
        timestamp: now,
      });

    console.log(
      `✅ Payment released: ${workerPayout}π to worker ${workerData.piUsername}`,
      piPaymentSuccessful ? '(Pi blockchain confirmed)' : '(pending Pi API confirmation)'
    );

    return NextResponse.json(
      {
        success: true,
        workerPayout,
        platformFee,
        piPaymentId: piData?.identifier,
        piBlockchainTxId: piData?.transaction?.txid,
        newTotalEarnings,
        newTasksCompleted,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Submission approval error:', error);
    return NextResponse.json(
      { error: 'Failed to approve submission', details: String(error) },
      { status: 500 }
    );
  }
}
