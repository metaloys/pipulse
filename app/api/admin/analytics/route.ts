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

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    // Get top earners
    const { data: topEarners, error: earnersError } = await supabase
      .from('User')
      .select('piUsername, totalEarnings, totalTasksCompleted')
      .order('totalEarnings', { ascending: false })
      .limit(10);

    if (earnersError) throw earnersError;

    // Get top workers by task count
    const { data: topWorkers, error: workersError } = await supabase
      .from('User')
      .select('piUsername, totalEarnings, totalTasksCompleted')
      .order('totalTasksCompleted', { ascending: false })
      .limit(10);

    if (workersError) throw workersError;

    // Get daily stats for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: transactions, error: transError } = await supabase
      .from('Transaction')
      .select('created_at, pipulse_fee')
      .gte('created_at', sevenDaysAgo.toISOString());

    if (transError) throw transError;

    // Aggregate daily stats
    const dailyMap = new Map<string, { transactions: number; revenue: number }>();

    (transactions || []).forEach((tx: any) => {
      const date = new Date(tx.created_at).toISOString().split('T')[0];
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { transactions: 0, revenue: 0 });
      }
      const stats = dailyMap.get(date)!;
      stats.transactions += 1;
      stats.revenue += tx.pipulse_fee || 0;
    });

    const dailyStats = Array.from(dailyMap.entries())
      .map(([date, stats]) => ({
        date,
        transactions: stats.transactions,
        revenue: parseFloat(stats.revenue.toFixed(2)),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json(
      {
        topEarners: topEarners || [],
        topWorkers: topWorkers || [],
        dailyStats,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to load analytics' },
      { status: 500 }
    );
  }
}
