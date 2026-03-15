import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tasks/employer?employerId=xxx - Get tasks by employer
 */
export async function GET(request: NextRequest) {
  try {
    const employerId = request.nextUrl.searchParams.get('employerId');
    
    if (!employerId) {
      return NextResponse.json(
        { error: 'Missing employerId parameter' },
        { status: 400 }
      );
    }

    const tasks = await prisma.task.findMany({
      where: {
        employerId: employerId,
        deletedAt: null,
      },
      include: {
        employer: {
          select: {
            id: true,
            piUsername: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform to match expected format
    const formattedTasks = tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      category: task.category,
      piReward: task.piReward,
      pi_reward: task.piReward,
      slotsAvailable: task.slotsAvailable,
      slots_available: task.slotsAvailable,
      slotsRemaining: task.slotsRemaining,
      slots_remaining: task.slotsRemaining,
      employerId: task.employerId,
      employer_id: task.employerId,
      status: task.status,
      task_status: task.status,
      createdAt: task.createdAt,
      expiresAt: task.expiresAt,
      employer: task.employer,
    }));

    return NextResponse.json(
      { tasks: formattedTasks },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error fetching employer tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
