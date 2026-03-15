import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { RejectSubmissionSchema, validateRequest } from '@/lib/validators';

export const dynamic = 'force-dynamic';

/**
 * Reject a submission with mandatory reason
 * POST /api/submissions/reject
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📥 Reject submission request:', { 
      submissionId: body.submissionId,
      workerId: body.workerId,
    });

    // Validate input
    const validation = validateRequest(RejectSubmissionSchema, body);
    if (!validation.success) {
      console.error('❌ Validation error:', validation.error);
      return NextResponse.json({ error: 'Invalid input: ' + validation.error }, { status: 400 });
    }

    const { submissionId, rejectionReason, workerId } = validation.data;

    // 1. Fetch submission and verify it exists and is SUBMITTED
    console.log('🔍 Fetching submission:', submissionId);
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { task: true, worker: true },
    });

    if (!submission) {
      console.error('❌ Submission not found:', submissionId);
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    if (submission.status !== 'SUBMITTED') {
      console.error('❌ Submission is not in SUBMITTED status:', submission.status);
      return NextResponse.json(
        { error: `Cannot reject submission with status: ${submission.status}` },
        { status: 400 }
      );
    }

    // 2. Verify worker matches
    if (submission.workerId !== workerId) {
      console.error('❌ Worker mismatch:', { submissionId, workerId, actualWorkerId: submission.workerId });
      return NextResponse.json(
        { error: 'Worker ID mismatch' },
        { status: 403 }
      );
    }

    // 3. Update submission to REJECTED
    console.log('✏️ Updating submission to REJECTED...');
    const rejectedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: 'REJECTED',
        rejectionReason: rejectionReason,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // 4. Update task status back to AVAILABLE so other workers can accept
    // ONLY if this was the only submission for this worker
    console.log('✏️ Updating task status back to AVAILABLE...');
    const otherPendingSubmissions = await prisma.submission.count({
      where: {
        taskId: submission.taskId,
        workerId: { not: workerId },
        status: 'SUBMITTED',
      },
    });

    // If no other workers have pending submissions, mark task as available again
    if (otherPendingSubmissions === 0) {
      await prisma.task.update({
        where: { id: submission.taskId },
        data: {
          status: 'AVAILABLE',
          slotsRemaining: submission.task.slotsRemaining + 1, // Give slot back
          updatedAt: new Date(),
        },
      });
      console.log('✅ Task marked AVAILABLE again, slot restored');
    }

    console.log(
      `✅ Submission rejected for worker ${submission.worker.piUsername}`,
      `Reason: ${rejectionReason.substring(0, 50)}...`
    );

    return NextResponse.json(
      {
        success: true,
        submission: rejectedSubmission,
        message: 'Submission rejected successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Submission rejection error:', error);
    return NextResponse.json(
      { error: 'Failed to reject submission', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
