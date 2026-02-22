-- ============================================================================
-- Migration 001: Marketplace Trust System Implementation
-- Fixes critical gaps in worker-employer communication and trust
-- ============================================================================

-- ============================================================================
-- PROBLEM 1: Notifications System for Rejection Feedback
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (
    type IN (
      'submission_approved',
      'submission_rejected',
      'revision_requested',
      'dispute_resolved',
      'payment_received',
      'task_completed'
    )
  ),
  title text NOT NULL,
  message text NOT NULL,
  related_task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  related_submission_id uuid REFERENCES task_submissions(id) ON DELETE SET NULL,
  related_dispute_id uuid REFERENCES disputes(id) ON DELETE SET NULL,
  is_read boolean DEFAULT false,
  read_at timestamp DEFAULT NULL,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Indexes for fast notification queries
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_is_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================================================
-- PROBLEM 2: Revision Workflow - Add Revision Status to Submissions
-- ============================================================================

-- Alter task_submissions to add revision tracking
ALTER TABLE task_submissions 
  ADD COLUMN IF NOT EXISTS revision_number integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS revision_requested_reason text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS revision_requested_at timestamp DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS resubmitted_at timestamp DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS employer_notes text DEFAULT NULL;

-- Update submission_status check constraint to include revision_requested
ALTER TABLE task_submissions
  DROP CONSTRAINT IF EXISTS task_submissions_submission_status_check;

ALTER TABLE task_submissions
  ADD CONSTRAINT task_submissions_submission_status_check CHECK (
    submission_status IN (
      'submitted',
      'revision_requested',
      'revision_resubmitted',
      'approved',
      'rejected',
      'disputed'
    )
  );

-- ============================================================================
-- PROBLEM 3: Auto-Approval Trigger After 48 Hours
-- ============================================================================

-- Create a function for auto-approval
CREATE OR REPLACE FUNCTION auto_approve_submissions()
RETURNS void AS $$
BEGIN
  -- Auto-approve submissions that are still submitted after 48 hours
  UPDATE task_submissions
  SET 
    submission_status = 'approved',
    reviewed_at = now(),
    employer_notes = 'Automatically approved after 48-hour review period'
  WHERE 
    submission_status = 'submitted' 
    AND submitted_at < (now() - interval '48 hours')
    AND reviewed_at IS NULL;

  -- Create approval notifications for auto-approved submissions
  INSERT INTO notifications (user_id, type, title, message, related_task_id, related_submission_id)
  SELECT 
    ts.worker_id,
    'submission_approved',
    'Your submission was automatically approved!',
    'Your submission was automatically approved after 48 hours without employer review. Payment has been processed.',
    ts.task_id,
    ts.id
  FROM task_submissions ts
  WHERE 
    ts.submission_status = 'approved'
    AND ts.reviewed_at = now()
    AND ts.employer_notes = 'Automatically approved after 48-hour review period';

  -- Trigger payments for auto-approved submissions (will be handled by separate function)
END;
$$ LANGUAGE plpgsql;

-- Create pg_cron extension if not exists (for scheduled jobs)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule auto-approval check to run every 30 minutes
SELECT cron.schedule('auto-approve-submissions', '*/30 * * * *', 'SELECT auto_approve_submissions()');

-- ============================================================================
-- PROBLEM 4: Worker Submissions History - Already tracked in submissions table
-- ============================================================================

-- Add index for efficient worker submission queries
CREATE INDEX IF NOT EXISTS idx_task_submissions_worker_id ON task_submissions(worker_id);
CREATE INDEX IF NOT EXISTS idx_task_submissions_worker_status ON task_submissions(worker_id, submission_status);
CREATE INDEX IF NOT EXISTS idx_task_submissions_submitted_at ON task_submissions(submitted_at DESC);

-- ============================================================================
-- PROBLEM 5: Privacy Model - RLS Policies for Data Access Control
-- ============================================================================

-- Enable RLS on critical tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS TABLE RLS POLICIES
-- ============================================================================

-- Public data: username, level, leaderboard position, posted tasks (if employer)
CREATE POLICY "users_public_data_readable" ON users
  FOR SELECT
  USING (true);  -- Everyone can see public profile data

-- Workers can see and update their own data
CREATE POLICY "users_own_data_updatable" ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_own_data_readable" ON users
  FOR SELECT
  USING (auth.uid() = id);

-- ============================================================================
-- TASK_SUBMISSIONS TABLE RLS POLICIES
-- ============================================================================

-- Workers can see their own submissions
CREATE POLICY "submissions_own_readable" ON task_submissions
  FOR SELECT
  USING (auth.uid() = worker_id);

-- Employers can see submissions for their own tasks
CREATE POLICY "submissions_employer_readable" ON task_submissions
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT employer_id FROM tasks WHERE tasks.id = task_submissions.task_id
    )
  );

-- Workers can insert their own submissions
CREATE POLICY "submissions_own_insertable" ON task_submissions
  FOR INSERT
  WITH CHECK (auth.uid() = worker_id);

-- Employers can update submissions for their tasks (approve/reject/request revision)
CREATE POLICY "submissions_employer_updatable" ON task_submissions
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT employer_id FROM tasks WHERE tasks.id = task_submissions.task_id
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT employer_id FROM tasks WHERE tasks.id = task_submissions.task_id
    )
  );

-- ============================================================================
-- NOTIFICATIONS TABLE RLS POLICIES
-- ============================================================================

-- Users can only see their own notifications
CREATE POLICY "notifications_own_readable" ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only system can insert notifications (via functions/triggers)
-- Users cannot directly insert
CREATE POLICY "notifications_system_insertable" ON notifications
  FOR INSERT
  WITH CHECK (false);  -- Disabled for direct user inserts

-- Users can update their own notifications (mark as read)
CREATE POLICY "notifications_own_updatable" ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- TRANSACTIONS TABLE RLS POLICIES
-- ============================================================================

-- Users can see transactions they're involved in
CREATE POLICY "transactions_own_readable" ON transactions
  FOR SELECT
  USING (
    auth.uid() = sender_id 
    OR auth.uid() = receiver_id
  );

-- Admin/system can insert transactions (not users directly)
CREATE POLICY "transactions_system_insertable" ON transactions
  FOR INSERT
  WITH CHECK (false);  -- Disabled for direct user inserts

-- ============================================================================
-- DISPUTES TABLE RLS POLICIES
-- ============================================================================

-- Parties involved in disputes can see them
CREATE POLICY "disputes_party_readable" ON disputes
  FOR SELECT
  USING (
    auth.uid() = worker_id 
    OR auth.uid() = employer_id
  );

-- Admins can see all disputes (managed separately)
CREATE POLICY "disputes_admin_readable" ON disputes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.user_role = 'admin'
    )
  );

-- Workers and employers can update disputes they're part of
CREATE POLICY "disputes_party_updatable" ON disputes
  FOR UPDATE
  USING (
    auth.uid() = worker_id 
    OR auth.uid() = employer_id
  )
  WITH CHECK (
    auth.uid() = worker_id 
    OR auth.uid() = employer_id
  );

-- ============================================================================
-- PROBLEM 6: Default Role Implementation
-- ============================================================================

-- Add default_mode column to users if not exists
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS default_role text DEFAULT 'worker',
  ADD COLUMN IF NOT EXISTS employer_mode_enabled boolean DEFAULT false;

-- Constraint to ensure role is valid
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_default_role_check;

ALTER TABLE users
  ADD CONSTRAINT users_default_role_check CHECK (default_role IN ('worker', 'employer'));

-- Index for efficient mode queries
CREATE INDEX IF NOT EXISTS idx_users_employer_mode_enabled ON users(employer_mode_enabled);

-- ============================================================================
-- ADDITIONAL HELPER TABLES AND FUNCTIONS
-- ============================================================================

-- Track task-worker locks during revision period
CREATE TABLE IF NOT EXISTS task_revision_locks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  worker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  locked_until timestamp NOT NULL,
  reason text DEFAULT 'revision_requested',
  created_at timestamp DEFAULT now(),
  UNIQUE(task_id, worker_id)
);

CREATE INDEX idx_task_revision_locks_task_worker ON task_revision_locks(task_id, worker_id);

-- Function to create rejection notification
CREATE OR REPLACE FUNCTION create_rejection_notification(
  p_worker_id uuid,
  p_task_id uuid,
  p_submission_id uuid,
  p_rejection_reason text
)
RETURNS uuid AS $$
DECLARE
  v_notification_id uuid;
BEGIN
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    related_task_id,
    related_submission_id
  ) VALUES (
    p_worker_id,
    'submission_rejected',
    'Your submission was rejected',
    p_rejection_reason,
    p_task_id,
    p_submission_id
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create revision request notification
CREATE OR REPLACE FUNCTION create_revision_notification(
  p_worker_id uuid,
  p_task_id uuid,
  p_submission_id uuid,
  p_revision_reason text
)
RETURNS uuid AS $$
DECLARE
  v_notification_id uuid;
  v_lock_id uuid;
BEGIN
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    related_task_id,
    related_submission_id
  ) VALUES (
    p_worker_id,
    'revision_requested',
    'Revision requested for your submission',
    p_revision_reason,
    p_task_id,
    p_submission_id
  )
  RETURNING id INTO v_notification_id;

  -- Lock the task slot for this worker for 7 days
  INSERT INTO task_revision_locks (
    task_id,
    worker_id,
    locked_until,
    reason
  ) VALUES (
    p_task_id,
    p_worker_id,
    now() + interval '7 days',
    'revision_requested'
  )
  ON CONFLICT (task_id, worker_id) 
  DO UPDATE SET locked_until = now() + interval '7 days';
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create approval notification with payment info
CREATE OR REPLACE FUNCTION create_approval_notification(
  p_worker_id uuid,
  p_task_id uuid,
  p_submission_id uuid,
  p_task_reward numeric
)
RETURNS uuid AS $$
DECLARE
  v_notification_id uuid;
BEGIN
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    related_task_id,
    related_submission_id
  ) VALUES (
    p_worker_id,
    'submission_approved',
    'Your submission was approved!',
    'Your submission has been approved. You have earned ' || p_task_reward || ' π',
    p_task_id,
    p_submission_id
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Allow authenticated users to query notifications
GRANT SELECT, UPDATE ON notifications TO authenticated;
GRANT SELECT ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON task_submissions TO authenticated;

-- ============================================================================
-- MIGRATION METADATA
-- ============================================================================
-- Created: 2026-02-22
-- Purpose: Fix 6 critical marketplace trust issues
-- Changes:
--   1. Notifications system with rejection feedback
--   2. Revision request workflow with task locking
--   3. Auto-approval after 48-hour grace period
--   4. Worker submission history tracking
--   5. RLS policies for privacy (public vs private data)
--   6. Default worker role + employer mode toggle
