import { NextRequest, NextResponse } from 'next/server';
import { serverGetTopEarners, serverGetTopEmployers, serverGetRisingStars } from '@/lib/database-server';
import type { LeaderboardData } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/leaderboard
 * 
 * Fetches all three leaderboard types:
 * - TOP EARNERS: Users with highest total_earnings
 * - TOP EMPLOYERS: Users who posted tasks with highest total Pi spent
 * - RISING STARS: Users joined in last 30 days with earnings > 0
 * 
 * Query params:
 * - userId (optional): Get current user's leaderboard position
 * - type (optional): 'earners' | 'employers' (for user position lookup)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    // Fetch all three leaderboard types in parallel
    const [topEarners, topEmployers, risingStars] = await Promise.all([
      serverGetTopEarners(10),
      serverGetTopEmployers(10),
      serverGetRisingStars(10),
    ]);

    // User position lookup (if user is not in top 10, calculate their rank)
    let userPosition = null;
    if (userId) {
      try {
        // Fetch the user's earnings
        const userFound = (topEarners as any).find(
          (u: any) => u.id === userId
        );
        if (userFound) {
          userPosition = {
            rank: userFound.rank,
            earnings: userFound.total_earnings,
          };
        }
      } catch (posError) {
        console.error('Error calculating user position:', posError);
      }
    }

    const leaderboardData: LeaderboardData = {
      lastUpdated: new Date().toISOString(),
      topEarners,
      topEmployers,
      risingStars,
      userPosition,
    };

    return NextResponse.json(leaderboardData, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Leaderboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard data' },
      { status: 500 }
    );
  }
}
