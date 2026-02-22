-- Comprehensive RLS Policy Fix for task_submissions table
-- This table was blocking inserts with 401 Unauthorized

-- Step 1: Disable RLS temporarily to modify policies
ALTER TABLE task_submissions DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies on task_submissions
DROP POLICY IF EXISTS "Allow public read" ON task_submissions;
DROP POLICY IF EXISTS "Allow public insert" ON task_submissions;
DROP POLICY IF EXISTS "Allow public update" ON task_submissions;
DROP POLICY IF EXISTS "Allow public delete" ON task_submissions;
DROP POLICY IF EXISTS "task_submissions_insert_policy" ON task_submissions;
DROP POLICY IF EXISTS "task_submissions_select_policy" ON task_submissions;
DROP POLICY IF EXISTS "task_submissions_update_policy" ON task_submissions;
DROP POLICY IF EXISTS "task_submissions_delete_policy" ON task_submissions;
DROP POLICY IF EXISTS "Allow all reads on task_submissions" ON task_submissions;
DROP POLICY IF EXISTS "Allow all inserts on task_submissions" ON task_submissions;
DROP POLICY IF EXISTS "Allow all updates on task_submissions" ON task_submissions;
DROP POLICY IF EXISTS "Allow all deletes on task_submissions" ON task_submissions;
DROP POLICY IF EXISTS "Allow insert submissions" ON task_submissions;
DROP POLICY IF EXISTS "Allow read submissions" ON task_submissions;
DROP POLICY IF EXISTS "Allow update submissions" ON task_submissions;

-- Step 3: Re-enable RLS
ALTER TABLE task_submissions ENABLE ROW LEVEL SECURITY;

-- Step 4: Create new permissive policies
-- SELECT - Allow reading all submissions (employer views submissions, leaderboards, etc)
CREATE POLICY "task_submissions_select" 
  ON task_submissions 
  FOR SELECT 
  TO anon, authenticated 
  USING (true);

-- INSERT - Allow creating submissions (workers submit proofs)
CREATE POLICY "task_submissions_insert" 
  ON task_submissions 
  FOR INSERT 
  TO anon, authenticated 
  WITH CHECK (true);

-- UPDATE - Allow updating submissions (approve/reject, status changes)
CREATE POLICY "task_submissions_update" 
  ON task_submissions 
  FOR UPDATE 
  TO anon, authenticated 
  USING (true) 
  WITH CHECK (true);

-- DELETE - Allow deleting submissions (worker cancels pending submission)
CREATE POLICY "task_submissions_delete" 
  ON task_submissions 
  FOR DELETE 
  TO anon, authenticated 
  USING (true);

-- Step 5: Verify policies are in place
SELECT 
  policyname,
  permissive,
  qual as condition
FROM pg_policies 
WHERE tablename = 'task_submissions' 
ORDER BY policyname;
