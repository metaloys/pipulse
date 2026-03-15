import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/users/stats?userId=xxx - Get user stats
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        totalEarnings: true,
        totalTasksCompleted: true,
        currentStreak: true,
        userRole: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get daily and weekly earnings from transactions
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const dailyTransactions = await prisma.transaction.findMany({
      where: {
        receiverId: userId,
        createdAt: {
          gte: today,
        },
      },
      select: {
        amount: true,
      },
    });

    const weeklyTransactions = await prisma.transaction.findMany({
      where: {
        receiverId: userId,
        createdAt: {
          gte: weekAgo,
        },
      },
      select: {
        amount: true,
      },
    });

    const dailyEarnings = dailyTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const weeklyEarnings = weeklyTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

    const stats = {
      dailyEarnings,
      weeklyEarnings,
      totalEarnings: user.totalEarnings || 0,
      tasksCompleted: user.totalTasksCompleted || 0,
      currentStreak: user.currentStreak || 0,
      level: getLevelFromEarnings(user.totalEarnings || 0),
      availableTasksCount: 0, // Will be calculated separately
    };

    return NextResponse.json(
      { stats },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

function getLevelFromEarnings(totalEarnings: number): string {
  if (totalEarnings < 10) return 'NEWCOMER';
  if (totalEarnings < 50) return 'EXPLORER';
  if (totalEarnings < 100) return 'PIONEER';
  if (totalEarnings < 500) return 'EXPERT';
  return 'MASTER';
}
