import { supabase } from './supabase';
import type { DatabaseTask, DatabaseUser, DatabaseTaskSubmission, DatabaseTransaction, DatabaseStreak } from './types';

// ============ USERS ============

export async function getUserByUsername(username: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('pi_username', username)
    .single();

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
    .single();

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
    .single();

  if (error) {
    console.error('Error creating user:', error);
    return null;
  }
  return data as DatabaseUser;
}

export async function updateUser(userId: string, updates: Partial<DatabaseUser>) {
  const { data, error } = await supabase
    .from('users')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

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
    .single();

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
    .single();

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
    .single();

  if (error) {
    console.error('Error updating task:', error);
    return null;
  }
  return data as DatabaseTask;
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
    .single();

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
    .single();

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
    .single();

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
    .single();

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
    .single();

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
    .single();

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
    .single();

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
    .single();

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
  const user = await getUserById(userId);
  if (!user) return null;

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
    totalEarnings: user.total_earnings,
    tasksCompleted: user.total_tasks_completed,
    currentStreak: user.current_streak,
    level: user.level,
    availableTasksCount: submissions.filter(s => s.submission_status === 'pending').length,
  };
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
    .single();

  if (error) {
    console.error('Error updating transaction status:', error);
    return null;
  }

  return data as DatabaseTransaction;
}
