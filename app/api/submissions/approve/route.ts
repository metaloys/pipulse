import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ApproveSubmissionSchema, validateRequest } from '@/lib/validators';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('📥 Approval request:', { submissionId: body.submissionId, workerId: body.workerId });

    // Validate input
    const validation = validateRequest(ApproveSubmissionSchema, body);
    if (!validation.success) {
      console.error('❌ Validation error:', validation.error);
      return NextResponse.json({ error: 'Invalid input: ' + validation.error }, { status: 400 });
    }

    const { submissionId, workerId, agreedReward } = validation.data;

    // 1. Get submission and verify it exists and is SUBMITTED
    console.log('🔍 Fetching submission:', submissionId);
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
    });

    if (!submission || submission.status !== 'SUBMITTED') {
      console.error('❌ Invalid submission or already processed:', submissionId);
      return NextResponse.json(
        { error: 'Invalid submission or already processed' },
        { status: 400 }
      );
    }

    // 2. Get worker to verify they exist
    console.log('🔍 Fetching worker:', workerId);
    const worker = await prisma.user.findUnique({
      where: { id: workerId },
    });

    if (!worker) {
      console.error('❌ Worker not found:', workerId);
      return NextResponse.json(
        { error: 'Worker not found' },
        { status: 404 }
      );
    }

    // 3. Calculate fee and payout (5% platform fee)
    const platformFee = parseFloat((agreedReward * 0.05).toFixed(4));
    const workerPayout = parseFloat((agreedReward - platformFee).toFixed(4));

    console.log(`💰 Payment breakdown: ${agreedReward}π total, ${workerPayout}π to worker, ${platformFee}π fee`);

    // 4. Call Pi API to send real Pi to worker
    let piPaymentSuccessful = false;
    let piPaymentId = null;
    let piBlockchainTxId = null;

    try {
      console.log('📤 Calling Pi API for worker payout...');
      const piResponse = await fetch('https://api.minepi.com/v2/payments', {
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
          uid: worker.piUid,
          payment_type: 'developer_to_user',
        }),
      });

      const piData = await piResponse.json();
      piPaymentSuccessful = piResponse.ok;
      piPaymentId = piData?.identifier;
      piBlockchainTxId = piData?.transaction?.txid;

      console.log('Pi API response:', {
        ok: piResponse.ok,
        identifier: piPaymentId,
        txid: piBlockchainTxId,
      });

      if (!piResponse.ok) {
        console.error('❌ Pi API error:', piData);
      }
    } catch (piError) {
      console.error('❌ Pi API call failed:', piError);
      // Continue with database update even if Pi API fails
      // so we can retry payment manually later
    }

    // 5. Update submission to APPROVED using Prisma
    console.log('✏️ Updating submission status to APPROVED...');
    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: 'APPROVED',
        reviewedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // 6. Update worker earnings and task count using Prisma
    console.log('✏️ Updating worker earnings and task count...');
    const newTotalEarnings = (worker.totalEarnings || 0) + workerPayout;
    const newTasksCompleted = (worker.totalTasksCompleted || 0) + 1;

    const updatedWorker = await prisma.user.update({
      where: { id: workerId },
      data: {
        totalEarnings: newTotalEarnings,
        totalTasksCompleted: newTasksCompleted,
        updatedAt: new Date(),
      },
    });

    // 7. Create Transaction record using Prisma
    console.log('➕ Creating transaction record...');
    const transaction = await prisma.transaction.create({
      data: {
        senderId: 'pipulse_escrow',
        receiverId: workerId,
        amount: workerPayout,
        pipulseFee: platformFee,
        submissionId: submissionId,
        type: 'PAYMENT',
        status: piPaymentSuccessful ? 'COMPLETED' : 'PENDING',
        piBlockchainTxId: piBlockchainTxId,
        timestamp: new Date(),
      },
    });

    console.log(
      `✅ Payment released: ${workerPayout}π to worker ${worker.piUsername}`,
      piPaymentSuccessful ? '(Pi blockchain confirmed)' : '(pending Pi API confirmation)'
    );

    return NextResponse.json(
      {
        success: true,
        workerPayout,
        platformFee,
        piPaymentId,
        piBlockchainTxId,
        newTotalEarnings,
        newTasksCompleted,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Submission approval error:', error);
    return NextResponse.json(
      { error: 'Failed to approve submission', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
