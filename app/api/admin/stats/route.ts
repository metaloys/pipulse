import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * API Route: GET /api/admin/stats
 * Version: 1.2.0 - Environment variable validation enabled
 * Last updated: 2026-02-23 14:30:00Z
 * 
 * This route requires server-side environment variables:
 * - SUPABASE_URL (server-side only)
 * - SUPABASE_SERVICE_ROLE_KEY (server-side admin key)
 */
function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('🔍 [ENV CHECK] SUPABASE_URL:', url ? `EXISTS (${url.length} chars)` : 'UNDEFINED');
  console.log('🔍 [ENV CHECK] SUPABASE_SERVICE_ROLE_KEY:', key ? `EXISTS (${key.length} chars)` : 'UNDEFINED');

  if (!url || !key) {
    console.error('❌ Missing Supabase environment variables:', {
      hasUrl: !!url,
      hasKey: !!key,
      urlValue: url ? url.substring(0, 20) + '...' : 'MISSING',
      keyValue: key ? 'SET' : 'MISSING',
    });
    throw new Error('Missing Supabase configuration');
  }

  return createClient(url, key);
}

export async function GET(request: NextRequest) {
  try {
    console.log('📊 [ADMIN STATS] Starting stats collection...');
    
    const supabase = getSupabaseClient();
    console.log('✅ [ADMIN STATS] Supabase client initialized');

    // Get total commission (sum of all pipulse_fee)
    console.log('📥 [ADMIN STATS] Fetching all transactions...');
    const { data: transactionData, error: transactionError } = await supabase
      .from('transactions')
      .select('pipulse_fee');

    if (transactionError) {
      console.error('❌ [ADMIN STATS] Transaction fetch error:', transactionError);
      throw transactionError;
    }

    const totalCommission = (transactionData || []).reduce((sum: number, t: any) => sum + (t.pipulse_fee || 0), 0);
    console.log('✅ [ADMIN STATS] Total commission:', totalCommission);

    // Get daily commission (last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    console.log('📥 [ADMIN STATS] Fetching daily transactions...');
    const { data: dailyData, error: dailyError } = await supabase
      .from('transactions')
      .select('pipulse_fee')
      .gte('created_at', oneDayAgo.toISOString());

    if (dailyError) {
      console.error('❌ [ADMIN STATS] Daily fetch error:', dailyError);
      throw dailyError;
    }

    const dailyCommission = (dailyData || []).reduce((sum: number, t: any) => sum + (t.pipulse_fee || 0), 0);
    console.log('✅ [ADMIN STATS] Daily commission:', dailyCommission);

    // Get total users count
    console.log('📥 [ADMIN STATS] Counting users...');
    const { count: totalUsers, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (usersError) {
      console.error('❌ [ADMIN STATS] Users count error:', usersError);
      throw usersError;
    }

    console.log('✅ [ADMIN STATS] Total users:', totalUsers);

    // Get total tasks count
    console.log('📥 [ADMIN STATS] Counting tasks...');
    const { count: totalTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true });

    if (tasksError) {
      console.error('❌ [ADMIN STATS] Tasks count error:', tasksError);
      throw tasksError;
    }

    console.log('✅ [ADMIN STATS] Total tasks:', totalTasks);

    // Get completed transactions count
    console.log('📥 [ADMIN STATS] Counting completed transactions...');
    const { count: completedTransactions, error: completedError } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('transaction_status', 'completed');

    if (completedError) {
      console.error('❌ [ADMIN STATS] Completed transactions error:', completedError);
      throw completedError;
    }

    console.log('✅ [ADMIN STATS] Completed transactions:', completedTransactions);

    // Get pending submissions count
    console.log('📥 [ADMIN STATS] Counting pending submissions...');
    const { count: pendingSubmissions, error: pendingError } = await supabase
      .from('task_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('submission_status', 'submitted');

    if (pendingError) {
      console.error('❌ [ADMIN STATS] Pending submissions error:', pendingError);
      throw pendingError;
    }

    console.log('✅ [ADMIN STATS] Pending submissions:', pendingSubmissions);

    // Get active tasks count (available or in-progress)
    console.log('📥 [ADMIN STATS] Counting active tasks...');
    const { count: activeTasks, error: activeTasksError } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .in('task_status', ['available', 'in-progress']);

    if (activeTasksError) {
      console.error('❌ [ADMIN STATS] Active tasks error:', activeTasksError);
      throw activeTasksError;
    }

    console.log('✅ [ADMIN STATS] Active tasks:', activeTasks);

    const response = {
      totalCommission: parseFloat(totalCommission.toFixed(2)),
      dailyCommission: parseFloat(dailyCommission.toFixed(2)),
      totalUsers: totalUsers || 0,
      totalTasks: totalTasks || 0,
      activeTasks: activeTasks || 0,
      pendingSubmissions: pendingSubmissions || 0,
      completedTransactions: completedTransactions || 0,
    };

    console.log('✅ [ADMIN STATS] All stats collected successfully:', response);
    
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('❌ [ADMIN STATS] Fatal error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Failed to load admin statistics',
        details: errorMessage,
        totalCommission: 0,
        dailyCommission: 0,
        totalUsers: 0,
        totalTasks: 0,
        activeTasks: 0,
        pendingSubmissions: 0,
        completedTransactions: 0,
      },
      { status: 500 }
    );
  }
}
