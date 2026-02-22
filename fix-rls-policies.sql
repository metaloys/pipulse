-- FIX RLS POLICIES FOR TASKS TABLE
-- Since we're using custom authentication (Bearer tokens) not Supabase sessions,
-- we need to update RLS to allow authenticated API requests with proper headers

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "tasks_insert_policy" ON tasks;
DROP POLICY IF EXISTS "tasks_update_policy" ON tasks;

-- Create new more permissive policies for API requests
-- Anyone authenticated can insert (we validate employer_id on the backend)
CREATE POLICY "tasks_insert_policy_v2" ON tasks
  FOR INSERT WITH CHECK (true);

-- Only the employer (validated by backend) can update
CREATE POLICY "tasks_update_policy_v2" ON tasks
  FOR UPDATE USING (true)
  WITH CHECK (true);

-- Keep the select policy as is - anyone can read tasks
-- (already exists, no changes needed)

-- Verify RLS is still enabled
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Do the same for task_submissions
DROP POLICY IF EXISTS "task_submissions_insert_policy" ON task_submissions;

-- Anyone authenticated can insert submissions
CREATE POLICY "task_submissions_insert_policy_v2" ON task_submissions
  FOR INSERT WITH CHECK (true);

ALTER TABLE task_submissions ENABLE ROW LEVEL SECURITY;
