-- PHASE 7 MARKETPLACE FLOW FIXES
-- These fixes address critical issues with task editing, slots, pricing, and visibility

-- ============================================================================
-- FIX 1: Add agreed_reward column to task_submissions table
-- Purpose: Store the price worker agreed to at time of task acceptance
-- This protects workers from employers reducing price after submission
-- ============================================================================
ALTER TABLE task_submissions
ADD COLUMN IF NOT EXISTS agreed_reward DECIMAL(10, 2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN task_submissions.agreed_reward IS 'Price in Pi that worker agreed to at time of task submission - immutable for payment protection';

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_task_submissions_agreed_reward 
ON task_submissions(agreed_reward);

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================
-- When this migration runs:
-- 1. All existing submissions will have agreed_reward = 0 (from DEFAULT)
-- 2. After code deployment, new submissions will have correct agreed_reward value
-- 3. For existing submissions with 0 agreed_reward, payment will be skipped
--    (or defaulted to current task.pi_reward - handled in app code)

-- To backfill existing submissions:
-- UPDATE task_submissions 
-- SET agreed_reward = t.pi_reward 
-- FROM tasks t 
-- WHERE task_submissions.task_id = t.id 
--   AND task_submissions.submission_status = 'approved' 
--   AND task_submissions.agreed_reward = 0;
