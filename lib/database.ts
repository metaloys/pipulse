import { supabase } from './supabase';
import type { DatabaseTask, DatabaseUser, DatabaseTaskSubmission, DatabaseTransaction, DatabaseStreak } from './types';

// ============ USERS ============

export async function getUserByUsername(username: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('pi_username', username)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }
  return data as DatabaseUser | null;
}

export async function getUserById(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }
  return data as DatabaseUser | null;
}

export async function createUser(user: Omit<DatabaseUser, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('users')
    .insert([user])
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error creating user:', error);
    return null;
  }
  return data as DatabaseUser;
}

/**
 * Create or update user on first authentication with Pi Network
 * This is called right after a user authenticates to ensure they exist in Supabase
 * 
 * @param userId - Pi Network user ID (uid)
 * @param username - Pi Network username
 * @returns The created or updated user record
 */
export async function createOrUpdateUserOnAuth(userId: string, username: string) {
  try {
    // First check if user exists by ID
    let existingUser = await getUserById(userId);
    
    if (existingUser) {
      console.log("✅ User already exists in database:", username);
      return existingUser;
    }

    // Also check by username in case ID changed (shouldn't happen, but be safe)
    existingUser = await getUserByUsername(username);
    if (existingUser) {
      console.log("✅ User found by username:", username, "- Using existing ID:", existingUser.id);
      return existingUser;
    }

    // User doesn't exist, create them
    console.log("📝 Creating new user in database:", username);
    const { data, error } = await supabase
      .from('users')
      .insert([{
        id: userId,
        pi_username: username,
        pi_wallet_address: '', // Empty for now, can be set later
        user_role: 'worker', // Default role - users start as workers
        level: 'Newcomer',
        current_streak: 0,
        longest_streak: 0,
        last_active_date: new Date().toISOString(),
        total_earnings: 0,
        total_tasks_completed: 0,
      }])
      .select()
      .maybeSingle();

    if (error) {
      // If it's a 409 (duplicate), try to fetch the existing user by username
      if (error.code === 'PGRST109' || error.status === 409) {
        console.warn("⚠️ User likely already exists (409). Fetching by username:", username);
        const byUsername = await getUserByUsername(username);
        if (byUsername) {
          console.log("✅ Found existing user by username:", username);
          return byUsername;
        }
      }
      console.error("❌ Failed to create user:", username, error);
      return null;
    }

    if (data) {
      console.log("✅ User created successfully:", username);
      return data as DatabaseUser;
    }

    return null;
  } catch (error) {
    console.error("Error in createOrUpdateUserOnAuth:", error);
    return null;
  }
}

export async function updateUser(userId: string, updates: Partial<DatabaseUser>) {
  const { data, error } = await supabase
    .from('users')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error updating user:', error);
    return null;
  }
  return data as DatabaseUser;
}

// ============ TASKS ============

export async function getAllTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('task_status', 'available')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
  return data as DatabaseTask[];
}

export async function getTasksByCategory(category: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('category', category)
    .eq('task_status', 'available')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
  return data as DatabaseTask[];
}

export async function getTaskById(taskId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching task:', error);
    return null;
  }
  return data as DatabaseTask;
}

export async function createTask(task: Omit<DatabaseTask, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('tasks')
    .insert([task])
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error creating task:', error);
    return null;
  }
  return data as DatabaseTask;
}

export async function updateTask(taskId: string, updates: Partial<DatabaseTask>) {
  const { data, error } = await supabase
    .from('tasks')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', taskId)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error updating task:', error);
    return null;
  }
  return data as DatabaseTask;
}

export async function deleteTask(taskId: string) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (error) {
    console.error('Error deleting task:', error);
    throw new Error('Failed to delete task');
  }
  return true;
}

export async function getTasksByEmployer(employerId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('employer_id', employerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching employer tasks:', error);
    return [];
  }
  return data as DatabaseTask[];
}

// ============ TASK SUBMISSIONS ============

export async function submitTask(submission: Omit<DatabaseTaskSubmission, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('task_submissions')
    .insert([submission])
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error submitting task:', error);
    return null;
  }
  return data as DatabaseTaskSubmission;
}

export async function getWorkerSubmissions(workerId: string) {
  const { data, error } = await supabase
    .from('task_submissions')
    .select('*')
    .eq('worker_id', workerId)
    .order('submitted_at', { ascending: false });

  if (error) {
    console.error('Error fetching worker submissions:', error);
    return [];
  }
  return data as DatabaseTaskSubmission[];
}

export async function getTaskSubmissions(taskId: string) {
  const { data, error } = await supabase
    .from('task_submissions')
    .select('*')
    .eq('task_id', taskId)
    .order('submitted_at', { ascending: false });

  if (error) {
    console.error('Error fetching task submissions:', error);
    return [];
  }
  return data as DatabaseTaskSubmission[];
}

export async function approveSubmission(submissionId: string) {
  const { data, error } = await supabase
    .from('task_submissions')
    .update({ 
      submission_status: 'approved', 
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', submissionId)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error approving submission:', error);
    return null;
  }
  return data as DatabaseTaskSubmission;
}

export async function rejectSubmission(submissionId: string, reason: string) {
  const { data, error } = await supabase
    .from('task_submissions')
    .update({ 
      submission_status: 'rejected', 
      rejection_reason: reason,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', submissionId)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error rejecting submission:', error);
    return null;
  }
  return data as DatabaseTaskSubmission;
}

// ============ TRANSACTIONS ============

export async function createTransaction(transaction: Omit<DatabaseTransaction, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('transactions')
    .insert([transaction])
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error creating transaction:', error);
    return null;
  }
  return data as DatabaseTransaction;
}

export async function getUserTransactions(userId: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
  return data as DatabaseTransaction[];
}

export async function getTransactionById(transactionId: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', transactionId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching transaction:', error);
    return null;
  }
  return data as DatabaseTransaction;
}

// ============ STREAKS ============

export async function getUserStreak(userId: string) {
  const { data, error } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching streak:', error);
    return null;
  }
  return data as DatabaseStreak | null;
}

export async function createStreak(userId: string) {
  const { data, error } = await supabase
    .from('streaks')
    .insert([{
      user_id: userId,
      current_streak: 0,
      longest_streak: 0,
      last_active_date: new Date().toISOString(),
      streak_bonus_earned: false
    }])
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error creating streak:', error);
    return null;
  }
  return data as DatabaseStreak;
}

export async function updateStreak(userId: string, updates: Partial<DatabaseStreak>) {
  const { data, error } = await supabase
    .from('streaks')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error updating streak:', error);
    return null;
  }
  return data as DatabaseStreak;
}

// ============ LEADERBOARD ============

export async function getLeaderboard(limit: number = 10) {
  const { data, error } = await supabase
    .from('users')
    .select('id, pi_username, total_earnings, total_tasks_completed')
    .eq('user_role', 'worker')
    .order('total_earnings', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
  return data;
}

// ============ STATS ============

export async function getUserStats(userId: string) {
  try {
    const user = await getUserById(userId);
    if (!user) {
      console.warn('User not found in database:', userId);
      // Return empty real stats instead of null
      return {
        dailyEarnings: 0,
        weeklyEarnings: 0,
        totalEarnings: 0,
        tasksCompleted: 0,
        currentStreak: 0,
        level: 'Newcomer',
        availableTasksCount: 0,
      };
    }

    const transactions = await getUserTransactions(userId);
    const submissions = await getWorkerSubmissions(userId);
    
    const dailyEarnings = transactions
      .filter(t => {
        const date = new Date(t.timestamp);
        const today = new Date();
        return date.toDateString() === today.toDateString() && t.transaction_type === 'payment';
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const weeklyEarnings = transactions
      .filter(t => {
        const date = new Date(t.timestamp);
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return date >= weekAgo && t.transaction_type === 'payment';
      })
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      dailyEarnings,
      weeklyEarnings,
      totalEarnings: user.total_earnings || 0,
      tasksCompleted: user.total_tasks_completed || 0,
      currentStreak: user.current_streak || 0,
      level: user.level || 'Newcomer',
      availableTasksCount: submissions.filter(s => s.submission_status === 'pending').length,
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    // Return empty real stats instead of null
    return {
      dailyEarnings: 0,
      weeklyEarnings: 0,
      totalEarnings: 0,
      tasksCompleted: 0,
      currentStreak: 0,
      level: 'Newcomer',
      availableTasksCount: 0,
    };
  }
}

// ============ PAYMENT MANAGEMENT ============

/**
 * Get total Pi commissions collected today
 */
export async function getTodayCommissions() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const { data, error } = await supabase
    .from('transactions')
    .select('pipulse_fee')
    .eq('transaction_type', 'fee')
    .eq('transaction_status', 'completed')
    .gte('timestamp', today.toISOString());

  if (error) {
    console.error('Error fetching today commissions:', error);
    return 0;
  }

  return data.reduce((sum, t) => sum + (t.pipulse_fee || 0), 0);
}

/**
 * Get total Pi commissions collected this month
 */
export async function getMonthCommissions() {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const { data, error } = await supabase
    .from('transactions')
    .select('pipulse_fee')
    .eq('transaction_type', 'fee')
    .eq('transaction_status', 'completed')
    .gte('timestamp', monthStart.toISOString());

  if (error) {
    console.error('Error fetching month commissions:', error);
    return 0;
  }

  return data.reduce((sum, t) => sum + (t.pipulse_fee || 0), 0);
}

/**
 * Get all transactions for a specific date range
 */
export async function getTransactionsByDateRange(startDate: Date, endDate: Date) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .gte('timestamp', startDate.toISOString())
    .lte('timestamp', endDate.toISOString())
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }

  return data as DatabaseTransaction[];
}

/**
 * Get all pending transactions (not yet completed)
 */
export async function getPendingTransactions() {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('transaction_status', 'pending')
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('Error fetching pending transactions:', error);
    return [];
  }

  return data as DatabaseTransaction[];
}

/**
 * Update transaction status (e.g., pending → completed)
 */
export async function updateTransactionStatus(transactionId: string, status: 'completed' | 'failed' | 'pending') {
  const { data, error } = await supabase
    .from('transactions')
    .update({ 
      transaction_status: status,
      updated_at: new Date().toISOString()
    })
    .eq('id', transactionId)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error updating transaction status:', error);
    return null;
  }

  return data as DatabaseTransaction;
}

// ============ DISPUTES ============

/**
 * Create a new dispute when worker appeals a rejection
 */
export async function createDispute(dispute: Omit<DatabaseDispute, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('disputes')
    .insert([dispute])
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error creating dispute:', error);
    return null;
  }
  return data as DatabaseDispute;
}

/**
 * Get all disputes for admin review
 */
export async function getAllDisputes() {
  const { data, error } = await supabase
    .from('disputes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching disputes:', error);
    return [];
  }
  return data as DatabaseDispute[];
}

/**
 * Get pending disputes (not yet ruled on)
 */
export async function getPendingDisputes() {
  const { data, error } = await supabase
    .from('disputes')
    .select('*')
    .eq('dispute_status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching pending disputes:', error);
    return [];
  }
  return data as DatabaseDispute[];
}

/**
 * Get disputes for a specific worker
 */
export async function getWorkerDisputes(workerId: string) {
  const { data, error } = await supabase
    .from('disputes')
    .select('*')
    .eq('worker_id', workerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching worker disputes:', error);
    return [];
  }
  return data as DatabaseDispute[];
}

/**
 * Get disputes for a specific employer
 */
export async function getEmployerDisputes(employerId: string) {
  const { data, error } = await supabase
    .from('disputes')
    .select('*')
    .eq('employer_id', employerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching employer disputes:', error);
    return [];
  }
  return data as DatabaseDispute[];
}

/**
 * Get a specific dispute by ID
 */
export async function getDisputeById(disputeId: string) {
  const { data, error } = await supabase
    .from('disputes')
    .select('*')
    .eq('id', disputeId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching dispute:', error);
    return null;
  }
  return data as DatabaseDispute;
}

/**
 * Admin rules on a dispute
 */
export async function resolveDispute(
  disputeId: string,
  ruling: 'in_favor_of_worker' | 'in_favor_of_employer',
  adminNotes: string,
  adminId: string
) {
  const { data, error } = await supabase
    .from('disputes')
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
}

/**
 * Check if a submission has an active dispute
 */
export async function hasActiveDispute(submissionId: string) {
  const { data, error } = await supabase
    .from('disputes')
    .select('id')
    .eq('submission_id', submissionId)
    .eq('dispute_status', 'pending')
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking dispute:', error);
    return false;
  }
  return !!data;
}

/**
 * Count pending disputes
 */
export async function getPendingDisputeCount() {
  const { data, error } = await supabase
    .from('disputes')
    .select('*', { count: 'exact', head: true })
    .eq('dispute_status', 'pending');

  if (error) {
    console.error('Error counting disputes:', error);
    return 0;
  }
  return data.length;
}
