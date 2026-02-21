-- PiPulse Database Setup
-- This script creates all tables needed for the micro-task marketplace

-- 1. USERS TABLE
-- Stores worker and employer profiles
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pi_username TEXT UNIQUE NOT NULL,
  pi_wallet_address TEXT UNIQUE NOT NULL,
  user_role TEXT NOT NULL CHECK (user_role IN ('worker', 'employer')),
  level TEXT NOT NULL DEFAULT 'Newcomer' CHECK (level IN ('Newcomer', 'Established', 'Advanced', 'Elite Pioneer')),
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_active_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  total_earnings DECIMAL(10, 2) DEFAULT 0,
  total_tasks_completed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TASKS TABLE
-- Stores all posted tasks from employers
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('app-testing', 'survey', 'translation', 'audio-recording', 'photo-capture', 'content-review', 'data-labeling')),
  pi_reward DECIMAL(10, 2) NOT NULL,
  time_estimate INTEGER NOT NULL, -- in minutes
  requirements TEXT[] DEFAULT '{}',
  slots_available INTEGER NOT NULL,
  slots_remaining INTEGER NOT NULL,
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  employer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_status TEXT NOT NULL DEFAULT 'available' CHECK (task_status IN ('available', 'in-progress', 'completed', 'cancelled')),
  instructions TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TASK_SUBMISSIONS TABLE
-- Stores worker submissions for tasks
CREATE TABLE task_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  proof_content TEXT NOT NULL,
  submission_type TEXT NOT NULL CHECK (submission_type IN ('text', 'photo', 'audio', 'file')),
  submission_status TEXT NOT NULL DEFAULT 'pending' CHECK (submission_status IN ('pending', 'approved', 'rejected', 'resubmitted')),
  rejection_reason TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. TRANSACTIONS TABLE
-- Tracks all Pi coin transfers and payments
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  pipulse_fee DECIMAL(10, 2) NOT NULL DEFAULT 0, -- 15% of amount
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('payment', 'refund', 'fee', 'bonus')),
  transaction_status TEXT NOT NULL DEFAULT 'completed' CHECK (transaction_status IN ('pending', 'completed', 'failed')),
  pi_blockchain_txid TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. STREAKS TABLE
-- Tracks daily completion streaks for gamification
CREATE TABLE streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_active_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  streak_bonus_earned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CREATE INDEXES FOR PERFORMANCE
CREATE INDEX idx_tasks_employer_id ON tasks(employer_id);
CREATE INDEX idx_tasks_category ON tasks(category);
CREATE INDEX idx_tasks_status ON tasks(task_status);
CREATE INDEX idx_tasks_deadline ON tasks(deadline);
CREATE INDEX idx_task_submissions_task_id ON task_submissions(task_id);
CREATE INDEX idx_task_submissions_worker_id ON task_submissions(worker_id);
CREATE INDEX idx_task_submissions_status ON task_submissions(submission_status);
CREATE INDEX idx_transactions_sender_id ON transactions(sender_id);
CREATE INDEX idx_transactions_receiver_id ON transactions(receiver_id);
CREATE INDEX idx_transactions_task_id ON transactions(task_id);
CREATE INDEX idx_streaks_user_id ON streaks(user_id);

-- ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES FOR USERS TABLE
-- Anyone can read public user profiles
CREATE POLICY "users_select_policy" ON users
  FOR SELECT USING (true);

-- Users can only update their own profile
CREATE POLICY "users_update_policy" ON users
  FOR UPDATE USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

-- RLS POLICIES FOR TASKS TABLE
-- Anyone can read available tasks
CREATE POLICY "tasks_select_policy" ON tasks
  FOR SELECT USING (true);

-- Only employers can insert tasks
CREATE POLICY "tasks_insert_policy" ON tasks
  FOR INSERT WITH CHECK (auth.uid()::text = employer_id::text);

-- Only task employer can update their tasks
CREATE POLICY "tasks_update_policy" ON tasks
  FOR UPDATE USING (auth.uid()::text = employer_id::text)
  WITH CHECK (auth.uid()::text = employer_id::text);

-- RLS POLICIES FOR TASK_SUBMISSIONS TABLE
-- Workers can see their own submissions
CREATE POLICY "task_submissions_select_policy" ON task_submissions
  FOR SELECT USING (auth.uid()::text = worker_id::text OR 
                   EXISTS (SELECT 1 FROM tasks WHERE id = task_id AND employer_id = auth.uid()));

-- Workers can insert submissions
CREATE POLICY "task_submissions_insert_policy" ON task_submissions
  FOR INSERT WITH CHECK (auth.uid()::text = worker_id::text);

-- RLS POLICIES FOR TRANSACTIONS TABLE
-- Users can see transactions they're involved in
CREATE POLICY "transactions_select_policy" ON transactions
  FOR SELECT USING (auth.uid()::text = sender_id::text OR auth.uid()::text = receiver_id::text);

-- RLS POLICIES FOR STREAKS TABLE
-- Users can see their own streak
CREATE POLICY "streaks_select_policy" ON streaks
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Users can update their own streak
CREATE POLICY "streaks_update_policy" ON streaks
  FOR UPDATE USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

COMMIT;
