export type TaskCategory = 
  | 'app-testing'
  | 'survey'
  | 'translation'
  | 'audio-recording'
  | 'photo-capture'
  | 'content-review'
  | 'data-labeling';

export type TaskStatus = 'available' | 'in-progress' | 'submitted' | 'completed' | 'rejected';

export type UserRole = 'worker' | 'employer' | 'admin';

export type SubmissionStatus = 'submitted' | 'revision_requested' | 'revision_resubmitted' | 'approved' | 'rejected' | 'disputed';

export type NotificationType = 
  | 'submission_approved' 
  | 'submission_rejected' 
  | 'revision_requested' 
  | 'dispute_resolved' 
  | 'payment_received'
  | 'task_completed';

// Supabase Database Types
export interface DatabaseUser {
  id: string;
  pi_username: string;
  pi_wallet_address: string;
  user_role: UserRole;
  default_role: 'worker' | 'employer'; // Default view mode
  employer_mode_enabled: boolean; // Can switch to employer mode
  level: 'Newcomer' | 'Established' | 'Advanced' | 'Elite Pioneer';
  current_streak: number;
  longest_streak: number;
  last_active_date: string;
  total_earnings: number;
  total_tasks_completed: number;
  created_at: string;
  updated_at: string;
}

export interface DatabaseTask {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  pi_reward: number;
  time_estimate: number;
  requirements: string[];
  slots_available: number;
  slots_remaining: number;
  deadline: string;
  employer_id: string;
  task_status: 'available' | 'in-progress' | 'completed' | 'cancelled';
  instructions: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseTaskSubmission {
  id: string;
  task_id: string;
  worker_id: string;
  proof_content: string;
  submission_type: 'text' | 'photo' | 'audio' | 'file';
  submission_status: SubmissionStatus;
  rejection_reason: string | null;
  revision_number: number;
  revision_requested_reason: string | null;
  revision_requested_at: string | null;
  resubmitted_at: string | null;
  employer_notes: string | null;
  agreed_reward: number; // Price worker agreed to at time of submission
  submitted_at: string;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DatabaseTransaction {
  id: string;
  sender_id: string | null;
  receiver_id: string;
  amount: number;
  pipulse_fee: number;
  task_id: string | null;
  transaction_type: 'payment' | 'refund' | 'fee' | 'bonus';
  transaction_status: 'pending' | 'completed' | 'failed';
  pi_blockchain_txid: string | null;
  timestamp: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_active_date: string;
  streak_bonus_earned: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseDispute {
  id: string;
  submission_id: string;
  task_id: string;
  worker_id: string;
  employer_id: string;
  dispute_reason: string;
  original_rejection_reason: string | null;
  dispute_status: 'pending' | 'resolved' | 'dismissed' | 'approved';
  admin_ruling: 'in_favor_of_worker' | 'in_favor_of_employer' | null;
  admin_notes: string | null;
  admin_id: string | null;
  pi_amount_in_dispute: number;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface DatabaseNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  related_task_id: string | null;
  related_submission_id: string | null;
  related_dispute_id: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  piReward: number;
  timeEstimate: number; // in minutes
  requirements: string[];
  slots: number;
  slotsRemaining: number;
  deadline: string;
  employerId: string;
  employerName: string;
  status: TaskStatus;
  instructions: string;
}

export interface UserStats {
  dailyEarnings: number;
  weeklyEarnings: number;
  totalEarnings: number;
  tasksCompleted: number;
  currentStreak: number;
  level: string;
  availableTasksCount: number;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  earnings: number;
  tasksCompleted: number;
}

export interface TopEarner {
  rank: number;
  id: string;
  pi_username: string;
  level: string;
  total_earnings: number;
  total_tasks_completed: number;
}

export interface TopEmployer {
  rank: number;
  id: string;
  pi_username: string;
  level: string;
  tasks_posted: number;
  total_pi_spent: number;
}

export interface RisingStar {
  rank: number;
  id: string;
  pi_username: string;
  level: string;
  total_earnings: number;
  total_tasks_completed: number;
  created_at: string;
  days_as_member: number;
}

export interface LeaderboardData {
  lastUpdated: string;
  topEarners: TopEarner[];
  topEmployers: TopEmployer[];
  risingStars: RisingStar[];
  userPosition?: {
    rank: number;
    earnings: number;
  } | null;
}
