/**
 * Submission Workflow API
 * 
 * Endpoints:
 * POST /api/submissions/submit - Submit a task
 * POST /api/submissions/approve - Approve a submission
 * POST /api/submissions/reject - Reject a submission
 * POST /api/submissions/request-revision - Request revision
 * GET /api/submissions/worker - Get worker's submission history
 * GET /api/submissions/stats - Get worker submission stats
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  submitTaskSubmission,
  approveTaskSubmission,
  rejectTaskSubmission,
  requestTaskRevision,
  getWorkerSubmissions,
  getWorkerSubmissionStats,
} from '@/lib/database';

/**
 * POST /api/submissions/submit
 * Submit a new task submission or revision
 */
export async function POST(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  try {
    const body = await req.json();
    const userId = req.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing user ID' },
        { status: 401 }
      );
    }

    // Submit endpoint
    if (pathname.includes('/submit')) {
      const { taskId, proofContent, submissionType, revisionNumber } = body;

      if (!taskId || !proofContent || !submissionType) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }

      const submission = await submitTaskSubmission({
        taskId,
        workerId: userId,
        proofContent,
        submissionType,
        revisionNumber,
      });

      if (!submission) {
        return NextResponse.json(
          { error: 'Failed to submit task' },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { submission, message: 'Submission created successfully' },
        { status: 201 }
      );
    }

    // Approve endpoint
    if (pathname.includes('/approve')) {
      const { submissionId, taskId, taskReward, employerNotes } = body;

      if (!submissionId || !taskId || !taskReward) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }

      // Verify user is the employer
      // TODO: Add employer verification

      const success = await approveTaskSubmission({
        submissionId,
        taskId,
        workerId: body.workerId, // From request body
        taskReward,
        employerNotes,
      });

      if (!success) {
        return NextResponse.json(
          { error: 'Failed to approve submission' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Submission approved and payment processed',
      });
    }

    // Reject endpoint
    if (pathname.includes('/reject')) {
      const { submissionId, taskId, workerId, rejectionReason, employerNotes } = body;

      if (!submissionId || !taskId || !workerId || !rejectionReason) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }

      const success = await rejectTaskSubmission({
        submissionId,
        taskId,
        workerId,
        rejectionReason,
        employerNotes,
      });

      if (!success) {
        return NextResponse.json(
          { error: 'Failed to reject submission' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Submission rejected and worker notified',
      });
    }

    // Request revision endpoint
    if (pathname.includes('/request-revision')) {
      const { submissionId, taskId, workerId, revisionReason, employerNotes } = body;

      if (!submissionId || !taskId || !workerId || !revisionReason) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }

      const success = await requestTaskRevision({
        submissionId,
        taskId,
        workerId,
        revisionReason,
        employerNotes,
      });

      if (!success) {
        return NextResponse.json(
          { error: 'Failed to request revision' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Revision requested and worker notified with 7-day deadline',
      });
    }

    return NextResponse.json(
      { error: 'Unknown endpoint' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error in submissions API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/submissions/worker
 * Get worker's submission history
 */
export async function GET(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing user ID' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);

    // Worker submissions history endpoint
    if (pathname.includes('/worker')) {
      const status = searchParams.get('status');
      const limit = parseInt(searchParams.get('limit') || '50');
      const offset = parseInt(searchParams.get('offset') || '0');

      const submissions = await getWorkerSubmissions(userId);

      return NextResponse.json({ submissions });
    }

    // Worker submission stats endpoint
    if (pathname.includes('/stats')) {
      const stats = await getWorkerSubmissionStats(userId);
      return NextResponse.json({ stats });
    }

    return NextResponse.json(
      { error: 'Unknown endpoint' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error in submissions GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
