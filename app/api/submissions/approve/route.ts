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
    const { submissionId, taskId, workerId, piReward } = await request.json();

    if (!submissionId || !taskId || !workerId || piReward === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: submissionId, taskId, workerId, piReward' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    const now = new Date().toISOString();

    // 1. Get the current task to get employer ID and current slots
    const { data: taskData, error: taskError } = await supabase
      .from('Task')
      .select('id, employerId, slotsRemaining')
      .eq('id', taskId)
      .single();

    if (taskError || !taskData) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    const employerId = taskData.employerId;

    // 2. Update submission status to APPROVED
    const { data: submissionData, error: submissionError } = await supabase
      .from('Submission')
      .update({
        status: 'APPROVED',
        reviewedAt: now,
        updatedAt: now,
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (submissionError || !submissionData) {
      return NextResponse.json(
        { error: 'Failed to approve submission' },
        { status: 500 }
      );
    }

    // 3. Calculate payment (15% platform fee)
    const pipulseFee = piReward * 0.15;
    const workerPay = piReward - pipulseFee;

    // 4. Create transaction record
    const { error: transactionError } = await supabase
      .from('Transaction')
      .insert({
        senderId: employerId,
        receiverId: workerId,
        amount: workerPay,
        pipulseFee: pipulseFee,
        taskId: taskId,
        submissionId: submissionId,
        type: 'PAYMENT',
        status: 'COMPLETED',
        piBlockchainTxId: null,
        timestamp: now,
      });

    if (transactionError) {
      console.error('Transaction error:', transactionError);
      // Don't fail the whole request if transaction fails, log it
    }

    // 5. Update worker total earnings
    const { data: workerData } = await supabase
      .from('User')
      .select('totalEarnings, totalTasksCompleted')
      .eq('id', workerId)
      .single();

    if (workerData) {
      const newTotalEarnings = (workerData.totalEarnings || 0) + workerPay;
      const newTasksCompleted = (workerData.totalTasksCompleted || 0) + 1;

      await supabase
        .from('User')
        .update({
          totalEarnings: newTotalEarnings,
          totalTasksCompleted: newTasksCompleted,
          updatedAt: now,
        })
        .eq('id', workerId);
    }

    // 6. Update task slots remaining
    const newSlotsRemaining = Math.max(0, taskData.slotsRemaining - 1);
    await supabase
      .from('Task')
      .update({
        slotsRemaining: newSlotsRemaining,
        updatedAt: now,
      })
      .eq('id', taskId);

    return NextResponse.json(
      {
        success: true,
        message: 'Submission approved successfully',
        submission: submissionData,
        transaction: {
          amount: workerPay,
          fee: pipulseFee,
        },
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
