import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for admin stats
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

    // Get total commission (sum of all pipulse_fee)
    const { data: transactionData, error: transactionError } = await supabase
      .from('transactions')
      .select('pipulse_fee');

    if (transactionError) throw transactionError;

    const totalCommission = (transactionData || []).reduce((sum: number, t: any) => sum + (t.pipulse_fee || 0), 0);

    // Get daily commission (last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const { data: dailyData, error: dailyError } = await supabase
      .from('transactions')
      .select('pipulse_fee')
      .gte('created_at', oneDayAgo.toISOString());

    if (dailyError) throw dailyError;

    const dailyCommission = (dailyData || []).reduce((sum: number, t: any) => sum + (t.pipulse_fee || 0), 0);

    // Get total users count
    const { count: totalUsers, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (usersError) throw usersError;

    // Get total tasks count
    const { count: totalTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true });

    if (tasksError) throw tasksError;

    // Get completed transactions count
    const { count: completedTransactions, error: completedError } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('transaction_status', 'completed');

    if (completedError) throw completedError;

    // Get pending submissions count
    const { count: pendingSubmissions, error: pendingError } = await supabase
      .from('task_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('submission_status', 'submitted');

    if (pendingError) throw pendingError;

    // Get active tasks count (available or in-progress)
    const { count: activeTasks, error: activeTasksError } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .in('task_status', ['available', 'in-progress']);

    if (activeTasksError) throw activeTasksError;

    return NextResponse.json(
      {
        totalCommission: parseFloat(totalCommission.toFixed(2)),
        dailyCommission: parseFloat(dailyCommission.toFixed(2)),
        totalUsers: totalUsers || 0,
        totalTasks: totalTasks || 0,
        activeTasks: activeTasks || 0,
        pendingSubmissions: pendingSubmissions || 0,
        completedTransactions: completedTransactions || 0,
        dailyActiveUsers,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: 'Failed to load admin statistics' },
      { status: 500 }
    );
  }
}
