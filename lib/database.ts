import { supabase } from './supabase';
import type { DatabaseTask, DatabaseUser, DatabaseTaskSubmission, DatabaseTransaction, DatabaseStreak, DatabaseDispute } from './types';

// ============ USERS ============

export async function getUserByUsername(username: string) {
  const { data, error } = await supabase
    .from('User')
    .select('*')
    .eq('piUsername', username)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }
  return data as DatabaseUser | null;
}

export async function getUserById(userId: string) {
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
}

export async function createUser(user: Omit<DatabaseUser, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('User')
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
 * CRITICAL FIX: Proper duplicate handling with unique constraint on pi_wallet_address
 * 
 * Flow:
 * 1. Check if user exists by id
 * 2. If found return immediately
 * 3. If not found, check by pi_username
 * 4. If found by username, return existing user
 * 5. Only insert if truly not found by BOTH id and username
 * 6. NEVER send pi_wallet_address in insert - set to null or omit
 * 
 * @param userId - Pi Network user ID (uid)
 * @param username - Pi Network username (unique identifier)
 * @returns The created or updated user record
 */
export async function createOrUpdateUserOnAuth(userId: string, username: string) {
  try {
    // STEP 1: Check by ID first
    console.log(`🔍 Step 1: Checking if user exists by ID: ${userId}`);
    let existingUser = await getUserById(userId);
    
    if (existingUser) {
      console.log(`✅ User found by ID: ${username} (ID: ${existingUser.id})`);
      return existingUser;
    }

    // STEP 2: Check by username
    console.log(`🔍 Step 2: Checking if user exists by username: ${username}`);
    existingUser = await getUserByUsername(username);
    
    if (existingUser) {
      console.log(`✅ User found by username: ${username} (ID: ${existingUser.id})`);
      return existingUser;
    }

    // STEP 3: User truly doesn't exist - create them
    console.log(`📝 Step 3: Creating new user: ${username}`);
    const { data, error } = await supabase
      .from('User')
      .insert([{
        id: userId,
        piUsername: username,
        piWalletAddress: null, // CRITICAL FIX: Don't send empty string, use null
        userRole: 'worker', // Default role - users start as workers
        level: 'Newcomer',
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: new Date().toISOString(),
        totalEarnings: 0,
        totalTasksCompleted: 0,
      }])
      .select()
      .maybeSingle();

    if (error) {
      console.error(`❌ Failed to create user ${username}:`, error);
      
      // If 409 conflict, try to fetch again - might have been created by concurrent request
      if ((error as any).status === 409) {
        console.warn(`⚠️ 409 conflict - attempting recovery by fetching user...`);
        const byId = await getUserById(userId);
        if (byId) {
          console.log(`✅ Recovered user by ID after 409: ${username}`);
          return byId;
        }
        const byUsername = await getUserByUsername(username);
        if (byUsername) {
          console.log(`✅ Recovered user by username after 409: ${username}`);
          return byUsername;
        }
      }
      
      return null;
    }

    if (data) {
      console.log(`✅ User created successfully: ${username}`);
      return data as DatabaseUser;
    }

    return null;
  } catch (error) {
    console.error(`❌ Error in createOrUpdateUserOnAuth for ${username}:`, error);
    return null;
  }
}

export async function updateUser(userId: string, updates: Partial<DatabaseUser>) {
  const { data, error } = await supabase
    .from('User')
    .update({ ...updates, updatedAt: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error updating user:', error);
    return null;
  }
  return data as DatabaseUser;
}

/**
 * Switch user role between 'worker' and 'employer'
 * Uses direct UPDATE to avoid query issues
 */
export async function switchUserRole(userId: string, newRole: 'worker' | 'employer') {
  console.log(`🔄 Switching role for user ${userId} to ${newRole}...`);
  
  const { data, error } = await supabase
    .from('User')
    .update({ 
      userRole: newRole,
      updatedAt: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .maybeSingle();

  if (error) {
    console.error(`❌ Error switching role for ${userId}:`, error);
    return null;
  }

  if (data) {
    console.log(`✅ Role switched successfully to ${newRole}:`, data.userRole);
    return data as DatabaseUser;
  }

  return null;
}

// ============ TASKS ============

export async function getAllTasks() {
  const { data, error } = await supabase
    .from('Task')
    .select(`
      *,
      employer:User!employerId(
        id,
        piUsername
      )
    `)
    .eq('taskStatus', 'available')
    .gt('slotsRemaining', 0)  // Only show tasks with available slots
    .order('createdAt', { ascending: false });

  if (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
  return data as DatabaseTask[];
}

export async function getTasksByCategory(category: string) {
  const { data, error } = await supabase
    .from('Task')
    .select(`
      *,
      employer:User!employerId(
        id,
        piUsername
      )
    `)
    .eq('category', category)
    .eq('taskStatus', 'available')
    .gt('slotsRemaining', 0)  // Only show tasks with available slots
    .order('createdAt', { ascending: false });

  if (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
  return data as DatabaseTask[];
}

export async function getTaskById(taskId: string) {
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
}

export async function createTask(task: Omit<DatabaseTask, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('Task')
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
  // Build a clean update object with ONLY the fields we want to send
  // Never spread raw database objects - they may contain unwanted fields
  const cleanUpdates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  // Only copy known fields explicitly from the DatabaseTask interface (snake_case)
  if (updates.slots_remaining !== undefined) cleanUpdates.slots_remaining = updates.slots_remaining;
  if (updates.slots_available !== undefined) cleanUpdates.slots_available = updates.slots_available;
  if (updates.task_status !== undefined) cleanUpdates.task_status = updates.task_status;
  if (updates.deadline !== undefined) cleanUpdates.deadline = updates.deadline;
  if (updates.title !== undefined) cleanUpdates.title = updates.title;
  if (updates.description !== undefined) cleanUpdates.description = updates.description;
  if (updates.instructions !== undefined) cleanUpdates.instructions = updates.instructions;
  if (updates.category !== undefined) cleanUpdates.category = updates.category;

  // Auto-evaluate task_status based on slots and deadline
  if (updates.slots_remaining !== undefined) {
    const currentTask = await getTaskById(taskId);
    const slotsRemaining = updates.slots_remaining;
    const deadline = currentTask?.deadline ? new Date(currentTask.deadline) : null;
    const now = new Date();
    const hasSlots = slotsRemaining > 0;
    const notExpired = deadline ? deadline > now : true;
    cleanUpdates.task_status = (hasSlots && notExpired) ? 'available' : 'completed';
    console.log(`📊 Task status: slots=${slotsRemaining}, expired=${!notExpired}, status=${cleanUpdates.task_status}`);
  }

  const { data, error } = await supabase
    .from('Task')
    .update(cleanUpdates)
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
    .from('Task')
    .delete()
    .eq('id', taskId);

  if (error) {
    console.error('Error deleting task:', error);
    return false; // Return false on error instead of throwing
  }
  return true;
}

export async function getTasksByEmployer(employerId: string) {
  const { data, error } = await supabase
    .from('Task')
    .select(`
      *,
      employer:User!employerId(
        id,
        piUsername
      )
    `)
    .eq('employerId', employerId)
    .order('createdAt', { ascending: false });

  if (error) {
    console.error('Error fetching employer tasks:', error);
    return [];
  }
  return data as DatabaseTask[];
}

// ============ TASK SUBMISSIONS ============

export async function submitTask(data: any) {
  const submissionRecord = {
    id: crypto.randomUUID(),
    taskId: data.task_id || data.taskId,
    workerId: data.worker_id || data.workerId,
    proofContent: data.proof_content || data.proofContent,
    submissionType: (data.submission_type || data.submissionType)?.toUpperCase(),
    status: 'SUBMITTED', // Always start with SUBMITTED status
    agreedReward: data.agreed_reward || data.agreedReward,
    rejectionReason: data.rejection_reason || null,
    revisionNumber: data.revision_number || 0,
    revisionReason: data.revision_requested_reason || data.revisionReason || null,
    revisionRequestedAt: data.revision_requested_at || data.revisionRequestedAt || null,
    resubmittedAt: data.resubmitted_at || data.resubmittedAt || null,
    adminNotes: data.employer_notes || data.admin_notes || data.adminNotes || null,
    submittedAt: data.submitted_at || data.submittedAt || new Date().toISOString(),
    reviewedAt: data.reviewed_at || data.reviewedAt || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const { data: result, error } = await supabase
    .from('Submission')
    .insert([submissionRecord])
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error submitting task:', error);
    return null;
  }
  return result;
}

export async function getWorkerSubmissions(workerId: string) {
  const { data, error } = await supabase
    .from('Submission')
    .select('*')
    .eq('workerId', workerId)
    .order('submittedAt', { ascending: false });

  if (error) {
    console.error('Error fetching worker submissions:', error);
    return [];
  }
  return data as DatabaseTaskSubmission[];
}

export async function getTaskSubmissions(taskId: string) {
  const { data, error } = await supabase
    .from('Submission')
    .select('*')
    .eq('taskId', taskId)
    .order('submittedAt', { ascending: false });

  if (error) {
    console.error('Error fetching task submissions:', error);
    return [];
  }
  return data as DatabaseTaskSubmission[];
}

export async function approveSubmission(submissionId: string) {
  const { data, error } = await supabase
    .from('Submission')
    .update({ 
      status: 'APPROVED', 
      reviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
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
    .from('Submission')
    .update({ 
      status: 'REJECTED', 
      rejectionReason: reason,
      reviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
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
    .from('Transaction')
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
    .from('Transaction')
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
    .from('Transaction')
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
    .from('Streak')
    .select('*')
    .eq('userId', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching streak:', error);
    return null;
  }
  return data as DatabaseStreak | null;
}

export async function createStreak(userId: string) {
  const { data, error } = await supabase
    .from('Streak')
    .insert([{
      userId: userId,
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: new Date().toISOString(),
      streakBonusEarned: false
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
    .from('Streak')
    .update({ ...updates, updatedAt: new Date().toISOString() })
    .eq('userId', userId)
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
    .from('User')
    .select('id, piUsername, totalEarnings, totalTasksCompleted')
    .eq('userRole', 'worker')
    .order('totalEarnings', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
  return data;
}

// ============ STATS ============

/**
 * Get user stats - ALL calculated dynamically from transactions table
 * NEVER read from stored columns - always compute from actual payment records
 * This ensures consistency and accuracy
 * 
 * @param userId The user ID to get stats for
 * @returns Stats object with daily, weekly, total earnings and tasks
 */
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

    // CRITICAL FIX: Calculate all earnings dynamically from transactions table
    // Never read from stored columns - they can become stale
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Fetch all transactions for this user as receiver
    const { data: allTransactions, error: txError } = await supabase
      .from('Transaction')
      .select('id, amount, pipulseFee, createdAt, status')
      .eq('receiverId', userId)
      .eq('status', 'COMPLETED')
      .order('createdAt', { ascending: false });

    if (txError) {
      console.error('Error fetching transactions for stats:', txError);
      return {
        dailyEarnings: 0,
        weeklyEarnings: 0,
        totalEarnings: 0,
        tasksCompleted: 0,
        currentStreak: 0,
        level: user.level || 'Newcomer',
        availableTasksCount: 0,
      };
    }

    const transactions = allTransactions || [];

    // Calculate net earnings (amount - fee) for each period
    const totalEarnings = transactions.reduce((sum, t: any) => {
      const netAmount = (t.amount || 0) - (t.pipulseFee || 0);
      return sum + netAmount;
    }, 0);

    const weeklyEarnings = transactions
      .filter((t: any) => (t.createdAt || '') >= sevenDaysAgo)
      .reduce((sum, t: any) => {
        const netAmount = (t.amount || 0) - (t.pipulseFee || 0);
        return sum + netAmount;
      }, 0);

    const dailyEarnings = transactions
      .filter((t: any) => (t.createdAt || '') >= oneDayAgo)
      .reduce((sum, t: any) => {
        const netAmount = (t.amount || 0) - (t.pipulseFee || 0);
        return sum + netAmount;
      }, 0);

    const submissions = await getWorkerSubmissions(userId);

    return {
      dailyEarnings: parseFloat((parseFloat(String(dailyEarnings || 0)) || 0).toFixed(2)),
      weeklyEarnings: parseFloat((parseFloat(String(weeklyEarnings || 0)) || 0).toFixed(2)),
      totalEarnings: parseFloat((parseFloat(String(totalEarnings || 0)) || 0).toFixed(2)),
      tasksCompleted: transactions.length, // Count of completed transactions
      currentStreak: user.current_streak || 0,
      level: user.level || 'Newcomer',
      availableTasksCount: submissions.filter((s: any) => s.submission_status === 'submitted').length,
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
    .from('Transaction')
    .select('pipulseFee')
    .eq('type', 'fee')
    .eq('status', 'completed')
    .gte('timestamp', today.toISOString());

  if (error) {
    console.error('Error fetching today commissions:', error);
    return 0;
  }

  return data.reduce((sum, t) => sum + (t.pipulseFee || 0), 0);
}

/**
 * Get total Pi commissions collected this month
 */
export async function getMonthCommissions() {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const { data, error } = await supabase
    .from('Transaction')
    .select('pipulseFee')
    .eq('type', 'fee')
    .eq('status', 'completed')
    .gte('timestamp', monthStart.toISOString());

  if (error) {
    console.error('Error fetching month commissions:', error);
    return 0;
  }

  return data.reduce((sum, t) => sum + (t.pipulseFee || 0), 0);
}

/**
 * Get all transactions for a specific date range
 */
export async function getTransactionsByDateRange(startDate: Date, endDate: Date) {
  const { data, error } = await supabase
    .from('Transaction')
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
    .from('Transaction')
    .select('*')
    .eq('status', 'pending')
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
    .from('Transaction')
    .update({ 
      status: status,
      updatedAt: new Date().toISOString()
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
    .from('Dispute')
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
    .from('Dispute')
    .select('*')
    .order('createdAt', { ascending: false });

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
    .from('Dispute')
    .select('*')
    .eq('disputeStatus', 'pending')
    .order('createdAt', { ascending: false });

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
    .from('Dispute')
    .select('*')
    .eq('workerId', workerId)
    .order('createdAt', { ascending: false });

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
    .from('Dispute')
    .select('*')
    .eq('employerId', employerId)
    .order('createdAt', { ascending: false });

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
    .from('Dispute')
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
    .from('Dispute')
    .update({
      disputeStatus: 'resolved',
      adminRuling: ruling,
      adminNotes: adminNotes,
      adminId: adminId,
      resolvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
    .from('Dispute')
    .select('id')
    .eq('submissionId', submissionId)
    .eq('disputeStatus', 'pending')
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
    .from('Dispute')
    .select('*', { count: 'exact', head: true })
    .eq('dispute_status', 'pending');

  if (error) {
    console.error('Error counting disputes:', error);
    return 0;
  }
  return data.length;
}

// ============================================================================
// PROBLEM 1: NOTIFICATIONS SYSTEM FOR REJECTION FEEDBACK
// ============================================================================

/**
 * Fetch unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('Notification')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error fetching unread notification count:', error);
    return 0;
  }
}

/**
 * Fetch all notifications for a user (paginated)
 */
export async function getNotifications(
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('Notification')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

/**
 * Fetch unread notifications only
 */
export async function getUnreadNotifications(
  userId: string,
  limit: number = 50
): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('Notification')
      .select('*')
      .eq('user_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching unread notifications:', error);
    return [];
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('Notification')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('Notification')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
}

// ============================================================================
// PROBLEM 2: SUBMISSION WORKFLOW WITH REVISION SUPPORT
// ============================================================================

/**
 * Submit a task submission (initial or revision)
 */
export async function submitTaskSubmission(input: {
  taskId: string;
  workerId: string;
  proofContent: string;
  submissionType: 'text' | 'photo' | 'audio' | 'file';
  revisionNumber?: number;
}): Promise<DatabaseTaskSubmission | null> {
  try {
    const revisionNumber = input.revisionNumber || 1;

    const { data, error } = await supabase
      .from('Submission')
      .insert({
        task_id: input.taskId,
        worker_id: input.workerId,
        proof_content: input.proofContent,
        submission_type: input.submissionType,
        submission_status: revisionNumber > 1 ? 'revision_resubmitted' : 'submitted',
        revision_number: revisionNumber,
        resubmitted_at: revisionNumber > 1 ? new Date().toISOString() : null,
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Remove task revision lock if resubmitting
    if (revisionNumber > 1) {
      await supabase
        .from('task_revision_locks')
        .delete()
        .eq('task_id', input.taskId)
        .eq('worker_id', input.workerId);
    }

    return data as DatabaseTaskSubmission;
  } catch (error) {
    console.error('Error submitting task:', error);
    return null;
  }
}

/**
 * Approve a task submission
 */
export async function approveTaskSubmission(input: {
  submissionId: string;
  taskId: string;
  workerId: string;
  taskReward: number;
  employerNotes?: string;
}): Promise<boolean> {
  try {
    // Update submission status
    const { error: updateError } = await supabase
      .from('Submission')
      .update({
        submission_status: 'approved',
        reviewed_at: new Date().toISOString(),
        employer_notes: input.employerNotes || 'Approved',
      })
      .eq('id', input.submissionId);

    if (updateError) throw updateError;

    // Create approval notification via SQL function
    const { error: notifError } = await supabase
      .rpc('create_approval_notification', {
        p_worker_id: input.workerId,
        p_task_id: input.taskId,
        p_submission_id: input.submissionId,
        p_task_reward: input.taskReward,
      });

    if (notifError) console.error('Error creating notification:', notifError);

    return true;
  } catch (error) {
    console.error('Error approving submission:', error);
    return false;
  }
}

/**
 * Reject a task submission
 */
export async function rejectTaskSubmission(input: {
  submissionId: string;
  taskId: string;
  workerId: string;
  rejectionReason: string;
  employerNotes?: string;
}): Promise<boolean> {
  try {
    // Update submission status
    const { error: updateError } = await supabase
      .from('Submission')
      .update({
        submission_status: 'rejected',
        rejection_reason: input.rejectionReason,
        reviewed_at: new Date().toISOString(),
        employer_notes: input.employerNotes || input.rejectionReason,
      })
      .eq('id', input.submissionId);

    if (updateError) throw updateError;

    // Create rejection notification via SQL function
    const { error: notifError } = await supabase
      .rpc('create_rejection_notification', {
        p_worker_id: input.workerId,
        p_task_id: input.taskId,
        p_submission_id: input.submissionId,
        p_rejection_reason: input.rejectionReason,
      });

    if (notifError) console.error('Error creating notification:', notifError);

    return true;
  } catch (error) {
    console.error('Error rejecting submission:', error);
    return false;
  }
}

/**
 * Request a revision for a task submission (PROBLEM 2)
 * Worker gets 7 days to resubmit, task slot is locked
 */
export async function requestTaskRevision(input: {
  submissionId: string;
  taskId: string;
  workerId: string;
  revisionReason: string;
  employerNotes?: string;
}): Promise<boolean> {
  try {
    // Update submission status to revision_requested
    const { error: updateError } = await supabase
      .from('Submission')
      .update({
        submission_status: 'revision_requested',
        revision_requested_reason: input.revisionReason,
        revision_requested_at: new Date().toISOString(),
        employer_notes: input.employerNotes || input.revisionReason,
      })
      .eq('id', input.submissionId);

    if (updateError) throw updateError;

    // Create revision notification and lock task via SQL function
    const { error: notifError } = await supabase
      .rpc('create_revision_notification', {
        p_worker_id: input.workerId,
        p_task_id: input.taskId,
        p_submission_id: input.submissionId,
        p_revision_reason: input.revisionReason,
      });

    if (notifError) console.error('Error creating revision notification:', notifError);

    return true;
  } catch (error) {
    console.error('Error requesting revision:', error);
    return false;
  }
}

// ============================================================================
// PROBLEM 4: WORKER SUBMISSION HISTORY
// ============================================================================

/**
 * Get all submissions for a worker with filters (PROBLEM 4)
 * Shows complete history including rejected, approved, disputed
 */
export async function getWorkerSubmissionsWithFilters(
  workerId: string,
  filters?: {
    status?: string;
    taskId?: string;
    limit?: number;
    offset?: number;
  }
): Promise<DatabaseTaskSubmission[]> {
  try {
    let query = supabase
      .from('Submission')
      .select('*')
      .eq('worker_id', workerId);

    if (filters?.status) {
      query = query.eq('submission_status', filters.status);
    }

    if (filters?.taskId) {
      query = query.eq('task_id', filters.taskId);
    }

    query = query.order('submitted_at', { ascending: false });

    if (filters?.limit) {
      const offset = filters.offset || 0;
      query = query.range(offset, offset + filters.limit - 1);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as DatabaseTaskSubmission[];
  } catch (error) {
    console.error('Error fetching worker submissions:', error);
    return [];
  }
}

/**
 * Get summary statistics for worker submissions
 */
export async function getWorkerSubmissionStats(
  workerId: string
): Promise<{
  totalSubmissions: number;
  approved: number;
  rejected: number;
  revisionRequested: number;
  disputed: number;
}> {
  try {
    const submissions = await getWorkerSubmissionsWithFilters(workerId);

    return {
      totalSubmissions: submissions.length,
      approved: submissions.filter(s => s.submission_status === 'approved').length,
      rejected: submissions.filter(s => s.submission_status === 'rejected').length,
      revisionRequested: submissions.filter(s => s.submission_status === 'revision_requested').length,
      disputed: submissions.filter(s => s.submission_status === 'disputed').length,
    };
  } catch (error) {
    console.error('Error fetching worker submission stats:', error);
    return {
      totalSubmissions: 0,
      approved: 0,
      rejected: 0,
      revisionRequested: 0,
      disputed: 0,
    };
  }
}

// ============================================================================
// PROBLEM 3: AUTO-APPROVAL TRIGGER AFTER 48 HOURS
// ============================================================================

/**
 * Manually trigger auto-approval of submissions older than 48 hours
 * Can be called via API or scheduled job
 */
export async function triggerAutoApprovals(): Promise<{
  approved: number;
  error?: string;
}> {
  try {
    const { error } = await supabase
      .rpc('auto_approve_submissions');

    if (error) throw error;

    // Count auto-approved submissions
    const { count } = await supabase
      .from('Submission')
      .select('*', { count: 'exact', head: true })
      .eq('submission_status', 'approved')
      .gte('reviewed_at', new Date(Date.now() - 5 * 60 * 1000).toISOString());

    return {
      approved: count || 0,
    };
  } catch (error) {
    console.error('Error triggering auto-approvals:', error);
    return {
      approved: 0,
      error: String(error),
    };
  }
}

// ============================================================================
// PROBLEM 5: PRIVACY MODEL - DATA ACCESS CONTROL
// ============================================================================

/**
 * Get public user profile (username, level, posted tasks)
 * RLS policies ensure private data is not returned
 */
export async function getPublicUserProfile(
  userId: string
): Promise<Partial<DatabaseUser> | null> {
  try {
    const { data, error } = await supabase
      .from('User')
      .select('id, piUsername, level, totalTasksCompleted, totalEarnings')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data as Partial<DatabaseUser>;
  } catch (error) {
    console.error('Error fetching public user profile:', error);
    return null;
  }
}

/**
 * Get full user profile (private data)
 * Only accessible by the user themselves or admins
 * RLS policies enforce this
 */
export async function getPrivateUserProfile(userId: string): Promise<DatabaseUser | null> {
  try {
    const { data, error } = await supabase
      .from('User')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data as DatabaseUser;
  } catch (error) {
    console.error('Error fetching private user profile:', error);
    return null;
  }
}

/**
 * Get transaction details (only for parties involved)
 * RLS policies enforce visibility
 */
export async function getTransactionDetails(transactionId: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('Transaction')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return null;
  }
}

// ============================================================================
// PROBLEM 6: DEFAULT ROLE & EMPLOYER MODE
// ============================================================================

/**
 * Update user's role preference and employer mode
 * Every new user starts as 'worker' by default
 * Only switches to employer mode when user explicitly enables it
 */
export async function updateUserRolePreference(
  userId: string,
  preferences: {
    defaultRole: 'worker' | 'employer';
    employerModeEnabled: boolean;
  }
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('User')
      .update({
        default_role: preferences.defaultRole,
        employer_mode_enabled: preferences.employerModeEnabled,
      })
      .eq('id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating user role preference:', error);
    return false;
  }
}

/**
 * Get user's current mode (worker or employer)
 * Defaults to 'worker' for new users
 */
export async function getUserCurrentMode(userId: string): Promise<'worker' | 'employer'> {
  try {
    const { data, error } = await supabase
      .from('User')
      .select('default_role')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return (data?.default_role || 'worker') as 'worker' | 'employer';
  } catch (error) {
    console.error('Error fetching user mode:', error);
    return 'worker'; // Default to worker
  }
}

/**
 * Check if user can access employer features
 */
export async function canUserAccessEmployerMode(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('User')
      .select('employer_mode_enabled')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data?.employer_mode_enabled || false;
  } catch (error) {
    console.error('Error checking employer mode access:', error);
    return false;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if worker has revision lock on a task
 */
export async function hasRevisionLock(taskId: string, workerId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('task_revision_locks')
      .select('id')
      .eq('task_id', taskId)
      .eq('worker_id', workerId)
      .gt('locked_until', new Date().toISOString())
      .single();

    if (error && error.code !== 'PGRST116') throw error; // 404 is expected
    return !!data;
  } catch (error) {
    console.error('Error checking revision lock:', error);
    return false;
  }
}

/**
 * Subscribe to real-time notification updates
 * Useful for notification bell in app header
 */
export function subscribeToNotifications(
  userId: string,
  callback: (notification: any) => void
) {
  const subscription = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();

  return subscription;
}

// ============ LEADERBOARD ============

export async function getTopEarners(limit: number = 10) {
  const { data, error } = await supabase
    .from('User')
    .select('id, piUsername, level, totalEarnings, totalTasksCompleted')
    .order('totalEarnings', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching top earners:', error);
    return [];
  }

  return (data || []).map((user, index) => ({
    rank: index + 1,
    id: user.id,
    piUsername: user.piUsername,
    level: user.level,
    totalEarnings: user.totalEarnings,
    totalTasksCompleted: user.totalTasksCompleted,
  }));
}

export async function getTopEmployers(limit: number = 10) {
  try {
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
    const employerStats: Record<string, { tasksPosted: number; totalPiSpent: number }> = {};

    tasks.forEach((task: any) => {
      if (!employerStats[task.employerId]) {
        employerStats[task.employerId] = { tasksPosted: 0, totalPiSpent: 0 };
      }
      employerStats[task.employerId].tasksPosted += 1;
      employerStats[task.employerId].totalPiSpent += (task.piReward || 0) * (task.slotsAvailable || 1);
    });

    // Combine user data with employer stats and sort
    const employers = users
      .map((user: any) => ({
        id: user.id,
        piUsername: user.piUsername,
        level: user.level,
        tasksPosted: employerStats[user.id]?.tasksPosted || 0,
        totalPiSpent: employerStats[user.id]?.totalPiSpent || 0,
      }))
      .filter((emp: any) => emp.tasksPosted > 0) // Only show users who posted tasks
      .sort((a: any, b: any) => b.totalPiSpent - a.totalPiSpent)
      .slice(0, limit);

    return employers.map((emp: any, index: number) => ({
      rank: index + 1,
      ...emp,
    }));
  } catch (error) {
    console.error('Error in getTopEmployers:', error);
    return [];
  }
}

export async function getRisingStars(limit: number = 10) {
  const { data, error } = await supabase
    .from('User')
    .select('id, piUsername, level, totalEarnings, totalTasksCompleted, createdAt')
    .gt('createdAt', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
    .gt('totalEarnings', 0)
    .order('totalEarnings', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching rising stars:', error);
    return [];
  }

  return (data || []).map((user, index) => {
    const createdDate = new Date(user.createdAt);
    const daysAsMember = Math.floor(
      (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      rank: index + 1,
      id: user.id,
      piUsername: user.piUsername,
      level: user.level,
      totalEarnings: user.totalEarnings,
      totalTasksCompleted: user.totalTasksCompleted,
      createdAt: user.createdAt,
      daysAsMember: daysAsMember,
    };
  });
}

export async function getUserLeaderboardPosition(
  userId: string,
  leaderboardType: 'earners' | 'employers' = 'earners'
) {
  if (leaderboardType === 'earners') {
    const { data, error } = await supabase
      .from('User')
      .select('totalEarnings')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const { count } = await supabase
      .from('User')
      .select('*', { count: 'exact', head: true })
      .gt('totalEarnings', data.totalEarnings);

    if (count === null) {
      return null;
    }

    return {
      rank: count + 1,
      earnings: data.totalEarnings,
    };
  }

  return null;
}

// ============ USER STATS UPDATES ============

/**
 * Update user's total earnings and task count when submission is approved
 * This is CRITICAL for leaderboard to work - must be called when payment is processed
 */
export async function updateUserEarnings(userId: string, amountEarned: number) {
  try {
    const { data, error } = await supabase
      .from('User')
      .select('totalEarnings')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) {
      console.error('Error fetching user for earnings update:', error);
      return null;
    }

    const newEarnings = (data.totalEarnings || 0) + amountEarned;

    const { data: updated, error: updateError } = await supabase
      .from('User')
      .update({ totalEarnings: newEarnings })
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (updateError) {
      console.error('Error updating user earnings:', updateError);
      return null;
    }

    return updated;
  } catch (error) {
    console.error('Error in updateUserEarnings:', error);
    return null;
  }
}

/**
 * Increment user's total_tasks_completed when submission is approved
 * This is CRITICAL for leaderboard to work - must be called when submission approved
 */
export async function incrementUserTaskCount(userId: string, count: number = 1) {
  try {
    const { data, error } = await supabase
      .from('User')
      .select('totalTasksCompleted')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) {
      console.error('Error fetching user for task count update:', error);
      return null;
    }

    const newCount = (data.totalTasksCompleted || 0) + count;

    const { data: updated, error: updateError } = await supabase
      .from('User')
      .update({ totalTasksCompleted: newCount })
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (updateError) {
      console.error('Error updating user task count:', updateError);
      return null;
    }

    return updated;
  } catch (error) {
    console.error('Error in incrementUserTaskCount:', error);
    return null;
  }
}

/**
 * Batch update user earnings and task count (call both at once)
 * Used when submission is approved and payment is made
 */
export async function updateUserStatsAfterApproval(userId: string, piAmount: number) {
  try {
    const { data, error } = await supabase
      .from('User')
      .select('totalEarnings, totalTasksCompleted')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) {
      console.error('Error fetching user for stats update:', error);
      return null;
    }

    const updated = {
      totalEarnings: (data.totalEarnings || 0) + piAmount,
      totalTasksCompleted: (data.totalTasksCompleted || 0) + 1,
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

    console.log(`✅ Updated user stats: +${piAmount}π earned, +1 task completed`);
    return result;
  } catch (error) {
    console.error('Error in updateUserStatsAfterApproval:', error);
    return null;
  }
}
