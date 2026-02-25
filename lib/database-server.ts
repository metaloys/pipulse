/**
 * SERVER-SIDE DATABASE FUNCTIONS
 * 
 * This file mirrors lib/database.ts but uses server-side Supabase credentials.
 * 
 * CRITICAL: This file should ONLY be imported in app/api/ routes (server-side).
 * Never import this in client components or pages.
 * 
 * Uses:
 * - SUPABASE_URL (no NEXT_PUBLIC prefix)
 * - SUPABASE_SERVICE_ROLE_KEY (no NEXT_PUBLIC prefix)
 * 
 * This allows:
 * - Bypassing RLS policies (admin operations)
 * - Accessing protected data
 * - Performing server-side mutations securely
 */

import { createClient } from '@supabase/supabase-js';
import type {
  DatabaseTask,
  DatabaseUser,
  DatabaseTaskSubmission,
  DatabaseTransaction,
  DatabaseStreak,
  DatabaseDispute,
  DatabaseNotification,
} from './types';

// ============================================================================
// INITIALIZATION - SERVER-SIDE CREDENTIALS ONLY
// ============================================================================

function getServerSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing server-side Supabase configuration. ' +
      'Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in environment variables.'
    );
  }

  return createClient(url, key);
}

// ============================================================================
// USERS - SERVER-SIDE OPERATIONS
// ============================================================================

export async function serverGetUserById(userId: string) {
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('User')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }
    return data as DatabaseUser | null;
  } catch (error) {
    console.error('Error in serverGetUserById:', error);
    return null;
  }
}

export async function serverGetUserByUsername(username: string) {
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('User')
      .select('*')
      .eq('pi_username', username)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }
    return data as DatabaseUser | null;
  } catch (error) {
    console.error('Error in serverGetUserByUsername:', error);
    return null;
  }
}

export async function serverUpdateUser(
  userId: string,
  updates: Partial<DatabaseUser>
) {
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('User')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error updating user:', error);
      return null;
    }
    return data as DatabaseUser;
  } catch (error) {
    console.error('Error in serverUpdateUser:', error);
    return null;
  }
}

export async function serverUpdateUserEarnings(
  userId: string,
  amountEarned: number
) {
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('User')
      .select('total_earnings')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) {
      console.error('Error fetching user for earnings update:', error);
      return null;
    }

    const newEarnings = (data.total_earnings || 0) + amountEarned;

    const { data: updated, error: updateError } = await supabase
      .from('User')
      .update({ total_earnings: newEarnings })
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (updateError) {
      console.error('Error updating user earnings:', updateError);
      return null;
    }

    console.log(
      `✅ User earnings updated: +${amountEarned}π (new total: ${newEarnings}π)`
    );
    return updated;
  } catch (error) {
    console.error('Error in serverUpdateUserEarnings:', error);
    return null;
  }
}

export async function serverIncrementUserTaskCount(
  userId: string,
  count: number = 1
) {
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('User')
      .select('total_tasks_completed')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) {
      console.error('Error fetching user for task count update:', error);
      return null;
    }

    const newCount = (data.total_tasks_completed || 0) + count;

    const { data: updated, error: updateError } = await supabase
      .from('User')
      .update({ total_tasks_completed: newCount })
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (updateError) {
      console.error('Error updating user task count:', updateError);
      return null;
    }

    console.log(
      `✅ User task count updated: +${count} (new total: ${newCount})`
    );
    return updated;
  } catch (error) {
    console.error('Error in serverIncrementUserTaskCount:', error);
    return null;
  }
}

export async function serverUpdateUserStatsAfterApproval(
  userId: string,
  piAmount: number
) {
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('User')
      .select('total_earnings, total_tasks_completed')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) {
      console.error('Error fetching user for stats update:', error);
      return null;
    }

    const updated = {
      total_earnings: (data.total_earnings || 0) + piAmount,
      total_tasks_completed: (data.total_tasks_completed || 0) + 1,
    };

    const { data: result, error: updateError } = await supabase
      .from('User')
      .update(updated)
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (updateError) {
      console.error('Error updating user stats:', updateError);
      return null;
    }

    console.log(
      `✅ Updated user stats: +${piAmount}π earned, +1 task completed`
    );
    return result;
  } catch (error) {
    console.error('Error in serverUpdateUserStatsAfterApproval:', error);
    return null;
  }
}

// ============================================================================
// TASKS - SERVER-SIDE OPERATIONS
// ============================================================================

export async function serverGetAllTasks() {
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('Task')
      .select('*')
      .eq('task_status', 'available')
      .gt('slots_remaining', 0)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
    return data as DatabaseTask[];
  } catch (error) {
    console.error('Error in serverGetAllTasks:', error);
    return [];
  }
}

export async function serverGetTaskById(taskId: string) {
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('Task')
      .select('*')
      .eq('id', taskId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching task:', error);
      return null;
    }
    return data as DatabaseTask;
  } catch (error) {
    console.error('Error in serverGetTaskById:', error);
    return null;
  }
}

export async function serverUpdateTask(
  taskId: string,
  updates: Partial<DatabaseTask>
) {
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('Task')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', taskId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error updating task:', error);
      return null;
    }
    return data as DatabaseTask;
  } catch (error) {
    console.error('Error in serverUpdateTask:', error);
    return null;
  }
}

export async function serverGetTasksByEmployer(employerId: string) {
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('Task')
      .select('*')
      .eq('employer_id', employerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching employer tasks:', error);
      return [];
    }
    return data as DatabaseTask[];
  } catch (error) {
    console.error('Error in serverGetTasksByEmployer:', error);
    return [];
  }
}

// ============================================================================
// TASK SUBMISSIONS - SERVER-SIDE OPERATIONS
// ============================================================================

export async function serverGetTaskSubmissions(taskId: string) {
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('Submission')
      .select('*')
      .eq('task_id', taskId)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching task submissions:', error);
      return [];
    }
    return data as DatabaseTaskSubmission[];
  } catch (error) {
    console.error('Error in serverGetTaskSubmissions:', error);
    return [];
  }
}

export async function serverGetWorkerSubmissions(workerId: string) {
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('Submission')
      .select('*')
      .eq('worker_id', workerId)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching worker submissions:', error);
      return [];
    }
    return data as DatabaseTaskSubmission[];
  } catch (error) {
    console.error('Error in serverGetWorkerSubmissions:', error);
    return [];
  }
}

export async function serverUpdateSubmission(
  submissionId: string,
  updates: Partial<DatabaseTaskSubmission>
) {
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('Submission')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', submissionId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error updating submission:', error);
      return null;
    }
    return data as DatabaseTaskSubmission;
  } catch (error) {
    console.error('Error in serverUpdateSubmission:', error);
    return null;
  }
}

export async function serverCreateSubmission(
  submission: Omit<DatabaseTaskSubmission, 'id' | 'created_at' | 'updated_at'>
) {
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('Submission')
      .insert([submission])
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error creating submission:', error);
      return null;
    }
    return data as DatabaseTaskSubmission;
  } catch (error) {
    console.error('Error in serverCreateSubmission:', error);
    return null;
  }
}

// ============================================================================
// TRANSACTIONS - SERVER-SIDE OPERATIONS
// ============================================================================

export async function serverCreateTransaction(
  transaction: Omit<DatabaseTransaction, 'id' | 'created_at' | 'updated_at'>
) {
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('Transaction')
      .insert([transaction])
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error creating transaction:', error);
      return null;
    }
    return data as DatabaseTransaction;
  } catch (error) {
    console.error('Error in serverCreateTransaction:', error);
    return null;
  }
}

export async function serverGetUserTransactions(userId: string) {
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('Transaction')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
    return data as DatabaseTransaction[];
  } catch (error) {
    console.error('Error in serverGetUserTransactions:', error);
    return [];
  }
}

export async function serverGetAllTransactions() {
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('Transaction')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
    return data as DatabaseTransaction[];
  } catch (error) {
    console.error('Error in serverGetAllTransactions:', error);
    return [];
  }
}

export async function serverUpdateTransactionStatus(
  transactionId: string,
  status: 'completed' | 'failed' | 'pending'
) {
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('Transaction')
      .update({
        transaction_status: status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', transactionId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error updating transaction status:', error);
      return null;
    }
    return data as DatabaseTransaction;
  } catch (error) {
    console.error('Error in serverUpdateTransactionStatus:', error);
    return null;
  }
}

// ============================================================================
// DISPUTES - SERVER-SIDE OPERATIONS
// ============================================================================

export async function serverGetAllDisputes() {
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('Dispute')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching disputes:', error);
      return [];
    }
    return data as DatabaseDispute[];
  } catch (error) {
    console.error('Error in serverGetAllDisputes:', error);
    return [];
  }
}

export async function serverGetPendingDisputes() {
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('Dispute')
      .select('*')
      .eq('dispute_status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending disputes:', error);
      return [];
    }
    return data as DatabaseDispute[];
  } catch (error) {
    console.error('Error in serverGetPendingDisputes:', error);
    return [];
  }
}

export async function serverResolveDispute(
  disputeId: string,
  ruling: 'in_favor_of_worker' | 'in_favor_of_employer',
  adminNotes: string,
  adminId: string
) {
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('Dispute')
      .update({
        dispute_status: 'resolved',
        admin_ruling: ruling,
        admin_notes: adminNotes,
        admin_id: adminId,
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', disputeId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error resolving dispute:', error);
      return null;
    }
    return data as DatabaseDispute;
  } catch (error) {
    console.error('Error in serverResolveDispute:', error);
    return null;
  }
}

// ============================================================================
// NOTIFICATIONS - SERVER-SIDE OPERATIONS
// ============================================================================

export async function serverCreateNotification(
  notification: Omit<DatabaseNotification, 'id' | 'created_at' | 'updated_at'>
) {
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('Notification')
      .insert([notification])
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error creating notification:', error);
      return null;
    }
    return data as DatabaseNotification;
  } catch (error) {
    console.error('Error in serverCreateNotification:', error);
    return null;
  }
}

export async function serverGetUserNotifications(userId: string) {
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('Notification')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
    return data as DatabaseNotification[];
  } catch (error) {
    console.error('Error in serverGetUserNotifications:', error);
    return [];
  }
}

// ============================================================================
// ADMIN OPERATIONS - SERVER-SIDE ONLY
// ============================================================================

export async function serverGetAllUsers() {
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('User')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all users:', error);
      return [];
    }
    return data as DatabaseUser[];
  } catch (error) {
    console.error('Error in serverGetAllUsers:', error);
    return [];
  }
}

export async function serverGetPlatformStats() {
  try {
    const supabase = getServerSupabase();

    // Total users
    const { count: totalUsers } = await supabase
      .from('User')
      .select('*', { count: 'exact', head: true });

    // Total tasks
    const { count: totalTasks } = await supabase
      .from('Task')
      .select('*', { count: 'exact', head: true });

    // Total transactions
    const { count: totalTransactions } = await supabase
      .from('Transaction')
      .select('*', { count: 'exact', head: true });

    // Total commission
    const { data: transactions } = await supabase
      .from('Transaction')
      .select('pipulse_fee');

    const totalCommission = (transactions || []).reduce(
      (sum: number, t: any) => sum + (t.pipulse_fee || 0),
      0
    );

    return {
      totalUsers: totalUsers || 0,
      totalTasks: totalTasks || 0,
      totalTransactions: totalTransactions || 0,
      totalCommission: parseFloat((parseFloat(String(totalCommission || 0)) || 0).toFixed(2)),
    };
  } catch (error) {
    console.error('Error in serverGetPlatformStats:', error);
    return {
      totalUsers: 0,
      totalTasks: 0,
      totalTransactions: 0,
      totalCommission: 0,
    };
  }
}

export async function serverGetTopEarners(limit: number = 10) {
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('User')
      .select(
        'id, piUsername, level, totalEarnings, totalTasksCompleted'
      )
      .order('totalEarnings', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching top earners:', error);
      return [];
    }

    return (data || []).map((user: any, index) => ({
      rank: index + 1,
      id: user.id,
      pi_username: user.piUsername,
      level: user.level,
      total_earnings: user.totalEarnings,
      total_tasks_completed: user.totalTasksCompleted,
    }));
  } catch (error) {
    console.error('Error in serverGetTopEarners:', error);
    return [];
  }
}

export async function serverGetTopEmployers(limit: number = 10) {
  try {
    const supabase = getServerSupabase();

    // Fetch all users
    const { data: users, error: usersError } = await supabase
      .from('User')
      .select('id, piUsername, level');

    if (usersError || !users) {
      console.error('Error fetching users:', usersError);
      return [];
    }

    // Fetch all tasks and aggregate by employer
    const { data: tasks, error: tasksError } = await supabase
      .from('Task')
      .select('employerId, piReward, slotsAvailable');

    if (tasksError || !tasks) {
      console.error('Error fetching tasks:', tasksError);
      return [];
    }

    // Aggregate tasks by employer
    const employerStats: Record<
      string,
      { tasks_posted: number; total_pi_spent: number }
    > = {};

    tasks.forEach((task: any) => {
      if (!employerStats[task.employerId]) {
        employerStats[task.employerId] = {
          tasks_posted: 0,
          total_pi_spent: 0,
        };
      }
      employerStats[task.employerId].tasks_posted += 1;
      employerStats[task.employerId].total_pi_spent +=
        (task.piReward || 0) * (task.slotsAvailable || 1);
    });

    // Combine user data with employer stats and sort
    const employers = users
      .map((user: any) => ({
        id: user.id,
        pi_username: user.piUsername,
        level: user.level,
        tasks_posted: employerStats[user.id]?.tasks_posted || 0,
        total_pi_spent: employerStats[user.id]?.total_pi_spent || 0,
      }))
      .filter((emp: any) => emp.tasks_posted > 0) // Only show users who posted tasks
      .sort((a: any, b: any) => b.total_pi_spent - a.total_pi_spent)
      .slice(0, limit);

    return employers.map((emp: any, index: number) => ({
      rank: index + 1,
      ...emp,
    }));
  } catch (error) {
    console.error('Error in serverGetTopEmployers:', error);
    return [];
  }
}

export async function serverGetRisingStars(limit: number = 10) {
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('User')
      .select(
        'id, piUsername, level, totalEarnings, totalTasksCompleted, createdAt'
      )
      .gt(
        'createdAt',
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      ) // Last 30 days
      .gt('totalEarnings', 0)
      .order('totalEarnings', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching rising stars:', error);
      return [];
    }

    return (data || []).map((user: any, index) => {
      const createdDate = new Date(user.createdAt);
      const daysAsMember = Math.floor(
        (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        rank: index + 1,
        id: user.id,
        pi_username: user.piUsername,
        level: user.level,
        total_earnings: user.totalEarnings,
        total_tasks_completed: user.totalTasksCompleted,
        created_at: user.createdAt,
        days_as_member: daysAsMember,
      };
    });
  } catch (error) {
    console.error('Error in serverGetRisingStars:', error);
    return [];
  }
}

// ============================================================================
// TASK SLOTS MANAGEMENT - SERVER-SIDE UTILITY FUNCTIONS
// ============================================================================

/**
 * Fix negative slots in database (cleanup for existing data)
 * Sets slots_remaining to 0 and task_status to 'completed'
 */
export async function serverFixNegativeSlots() {
  try {
    const supabase = getServerSupabase();
    
    // Find all tasks with negative slots
    const { data: negativeTasks, error: fetchError } = await supabase
      .from('Task')
      .select('id, slots_remaining, task_status')
      .lt('slots_remaining', 0);

    if (fetchError) {
      console.error('Error fetching negative slots tasks:', fetchError);
      return { fixed: 0, error: fetchError.message };
    }

    if (!negativeTasks || negativeTasks.length === 0) {
      console.log('✅ No negative slots found');
      return { fixed: 0 };
    }

    console.log(`⚠️ Found ${negativeTasks.length} tasks with negative slots`);

    // Update all to 0 and set status to 'completed'
    const { error: updateError } = await supabase
      .from('Task')
      .update({
        slots_remaining: 0,
        task_status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .lt('slots_remaining', 0);

    if (updateError) {
      console.error('Error fixing negative slots:', updateError);
      return { fixed: 0, error: updateError.message };
    }

    console.log(`✅ Fixed ${negativeTasks.length} tasks with negative slots`);
    return { fixed: negativeTasks.length };
  } catch (error) {
    console.error('Error in serverFixNegativeSlots:', error);
    return { fixed: 0, error: String(error) };
  }
}

/**
 * Decrement task slots safely (never below 0, update status when full)
 */
export async function serverDecrementTaskSlots(taskId: string) {
  try {
    const supabase = getServerSupabase();

    // Fetch current slots
    const { data: taskData, error: fetchError } = await supabase
      .from('Task')
      .select('slots_remaining, task_status')
      .eq('id', taskId)
      .maybeSingle();

    if (fetchError || !taskData) {
      console.error('Error fetching task for slot decrement:', fetchError);
      return { success: false, error: fetchError?.message };
    }

    // Check if already at 0
    if ((taskData.slots_remaining || 0) <= 0) {
      console.warn(
        `⚠️ Task ${taskId} already has ${taskData.slots_remaining} slots remaining`
      );
      return { success: false, reason: 'no_slots_available' };
    }

    // Decrement safely
    const newSlotsRemaining = Math.max(0, (taskData.slots_remaining || 1) - 1);
    const newTaskStatus =
      newSlotsRemaining === 0 ? 'completed' : taskData.task_status;

    const { error: updateError } = await supabase
      .from('Task')
      .update({
        slots_remaining: newSlotsRemaining,
        task_status: newTaskStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId);

    if (updateError) {
      console.error('Error decrementing slots:', updateError);
      return { success: false, error: updateError.message };
    }

    console.log(
      `✅ Slot decremented: ${newSlotsRemaining} remaining${
        newSlotsRemaining === 0 ? ' - Task now completed (no slots remaining)' : ''
      }`
    );
    return {
      success: true,
      newSlotsRemaining,
      taskNowFull: newSlotsRemaining === 0,
    };
  } catch (error) {
    console.error('Error in serverDecrementTaskSlots:', error);
    return { success: false, error: String(error) };
  }
}

// ============================================================================
// PLATFORM SETTINGS - SERVER-SIDE OPERATIONS
// ============================================================================

/**
 * Get platform setting by key
 */
export async function serverGetPlatformSetting(key: string): Promise<string | null> {
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('PlatformSettings')
      .select('value')
      .eq('key', key)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching platform setting ${key}:`, error);
      return null;
    }

    return data?.value || null;
  } catch (error) {
    console.error(`Error in serverGetPlatformSetting:`, error);
    return null;
  }
}

/**
 * Get commission rate from platform_settings (default 15%)
 */
export async function serverGetCommissionRate(): Promise<number> {
  try {
    const value = await serverGetPlatformSetting('commission_rate');
    if (value) {
      const rate = parseFloat(value);
      if (!isNaN(rate)) {
        return rate;
      }
    }
    console.warn('Commission rate not set, using default 15%');
    return 15;
  } catch (error) {
    console.error('Error in serverGetCommissionRate:', error);
    return 15;
  }
}

/**
 * Get all platform settings
 */
export async function serverGetAllPlatformSettings(): Promise<Record<string, string>> {
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('PlatformSettings')
      .select('key, value');

    if (error) {
      console.error('Error fetching platform settings:', error);
      return {};
    }

    const settings: Record<string, string> = {};
    (data || []).forEach((row: any) => {
      settings[row.key] = row.value;
    });

    return settings;
  } catch (error) {
    console.error('Error in serverGetAllPlatformSettings:', error);
    return {};
  }
}

/**
 * Update platform setting
 */
export async function serverUpdatePlatformSetting(
  key: string,
  value: string
): Promise<boolean> {
  try {
    const supabase = getServerSupabase();

    // Try to update first
    const { error: updateError } = await supabase
      .from('PlatformSettings')
      .update({
        value,
        updated_at: new Date().toISOString(),
      })
      .eq('key', key);

    // If update failed with no rows, insert instead
    if (updateError && updateError.code === 'PGRST116') {
      const { error: insertError } = await supabase
        .from('PlatformSettings')
        .insert([
          {
            key,
            value,
            updated_at: new Date().toISOString(),
          },
        ]);

      if (insertError) {
        console.error(`Error inserting platform setting ${key}:`, insertError);
        return false;
      }
    } else if (updateError) {
      console.error(`Error updating platform setting ${key}:`, updateError);
      return false;
    }

    console.log(`✅ Platform setting updated: ${key} = ${value}`);
    return true;
  } catch (error) {
    console.error('Error in serverUpdatePlatformSetting:', error);
    return false;
  }
}

