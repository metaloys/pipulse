-- ============================================================================
-- PIPULSE DATABASE CLEANUP - DELETE ALL SAMPLE DATA
-- ============================================================================
-- Copy and paste this entire block into Supabase SQL Editor
-- Then click RUN (or press Ctrl+Enter)
-- ============================================================================

-- Step 1: Delete all transactions (no dependencies)
DELETE FROM transactions;

-- Step 2: Delete all task submissions
DELETE FROM task_submissions;

-- Step 3: Delete all streaks
DELETE FROM streaks;

-- Step 4: Delete all tasks
DELETE FROM tasks;

-- Step 5: Delete all users
DELETE FROM users;

-- Step 6: Verify all data is deleted (should show 0 for all counts)
SELECT 
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM tasks) as tasks,
  (SELECT COUNT(*) FROM task_submissions) as submissions,
  (SELECT COUNT(*) FROM transactions) as transactions,
  (SELECT COUNT(*) FROM streaks) as streaks;

-- Step 8: VERIFY RLS POLICIES STILL EXIST (should show 16 policies)
SELECT schemaname, tablename, policyname FROM pg_policies 
WHERE tablename IN ('users', 'tasks', 'task_submissions', 'transactions', 'streaks') 
ORDER BY tablename;

-- Step 9: VERIFY INDEXES STILL EXIST (should show 11 indexes)
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('users', 'tasks', 'task_submissions', 'transactions', 'streaks')
ORDER BY tablename;

-- ============================================================================
-- EXPECTED RESULTS:
-- ============================================================================
-- After Step 6: All counts should be 0 (users, tasks, submissions, transactions, streaks)
-- After Step 8: Should list 16 RLS policies (security rules preserved)
-- After Step 9: Should list 11 performance indexes (database optimization preserved)
-- ============================================================================
-- NOTE: We skip ALTER SEQUENCE because Supabase auto-manages these
-- The sequences will automatically reset when new data is inserted
-- ============================================================================
