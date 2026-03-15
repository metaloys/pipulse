import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { RequestRevisionSchema, validateRequest } from '@/lib/validators';

export const dynamic = 'force-dynamic';

/**
 * Request a revision for a submission with mandatory reason
 * POST /api/submissions/request-revision
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📥 Request revision request:', { 
      submissionId: body.submissionId,
      workerId: body.workerId,
    });

    // Validate input
    const validation = validateRequest(RequestRevisionSchema, body);
    if (!validation.success) {
      console.error('❌ Validation error:', validation.error);
      return NextResponse.json({ error: 'Invalid input: ' + validation.error }, { status: 400 });
    }

    const { submissionId, revisionReason, workerId } = validation.data;

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
        { error: `Cannot request revision on submission with status: ${submission.status}` },
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

    // 3. Update submission to REVISION_REQUESTED
    console.log('✏️ Updating submission to REVISION_REQUESTED...');
    const revisionSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: 'REVISION_REQUESTED',
        revisionReason: revisionReason,
        revisionRequestedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log(
      `✅ Revision requested for worker ${submission.worker.piUsername}`,
      `Reason: ${revisionReason.substring(0, 50)}...`
    );

    return NextResponse.json(
      {
        success: true,
        submission: revisionSubmission,
        message: 'Revision requested successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Request revision error:', error);
    return NextResponse.json(
      { error: 'Failed to request revision', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
