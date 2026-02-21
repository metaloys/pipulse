-- ============================================================================
-- PIPULSE DISPUTES TABLE - Add to Supabase
-- ============================================================================
-- This table tracks worker disputes against rejection decisions
-- Run this SQL in Supabase SQL Editor to create the table and policies
-- ============================================================================

-- Create disputes table
CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES task_submissions(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  employer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dispute_reason TEXT NOT NULL,
  original_rejection_reason TEXT,
  dispute_status VARCHAR(50) NOT NULL CHECK (dispute_status IN ('pending', 'resolved', 'dismissed', 'approved')),
  admin_ruling VARCHAR(50) CHECK (admin_ruling IN ('in_favor_of_worker', 'in_favor_of_employer')),
  admin_notes TEXT,
  admin_id UUID REFERENCES users(id),
  pi_amount_in_dispute DECIMAL(10, 4) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX disputes_worker_id_idx ON disputes(worker_id);
CREATE INDEX disputes_employer_id_idx ON disputes(employer_id);
CREATE INDEX disputes_submission_id_idx ON disputes(submission_id);
CREATE INDEX disputes_status_idx ON disputes(dispute_status);
CREATE INDEX disputes_created_at_idx ON disputes(created_at DESC);

-- Enable Row Level Security
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for disputes table

-- Workers can view their own disputes
CREATE POLICY "Users can view their own disputes"
  ON disputes FOR SELECT
  USING (
    auth.uid() = worker_id OR 
    auth.uid() = employer_id OR
    (SELECT user_role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- Workers can create disputes for their submissions
CREATE POLICY "Workers can create disputes"
  ON disputes FOR INSERT
  WITH CHECK (
    auth.uid() = worker_id AND
    (SELECT submission_status FROM task_submissions WHERE id = submission_id) = 'rejected'
  );

-- Admins can update disputes (set ruling)
CREATE POLICY "Admins can update disputes"
  ON disputes FOR UPDATE
  USING (
    (SELECT user_role FROM users WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT user_role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================================
-- AFTER RUNNING THIS SQL:
-- ============================================================================
-- 1. You'll have a new 'disputes' table in your database
-- 2. Workers can create disputes against rejections
-- 3. Admins can view and rule on all disputes
-- 4. Payment system can be triggered based on admin ruling
-- ============================================================================
