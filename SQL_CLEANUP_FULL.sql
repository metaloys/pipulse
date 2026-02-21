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

-- Step 6: Reset auto-increment IDs (so new data starts at ID 1)
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE tasks_id_seq RESTART WITH 1;
ALTER SEQUENCE task_submissions_id_seq RESTART WITH 1;
ALTER SEQUENCE transactions_id_seq RESTART WITH 1;
ALTER SEQUENCE streaks_id_seq RESTART WITH 1;

-- Step 7: VERIFY ALL DATA IS DELETED (should show 0 for all counts)
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
-- After Step 7: All counts should be 0 (users, tasks, submissions, transactions, streaks)
-- After Step 8: Should list 16 RLS policies
-- After Step 9: Should list 11 performance indexes
-- ============================================================================
-- IF YOU SEE ERRORS:
-- ============================================================================
-- Error: "relation does not exist"
--   → You're in wrong Supabase project
--   → Check project name at top of page
--
-- Error: "permission denied"
--   → Not authenticated to Supabase
--   → Log out and log back in
--
-- All rows deleted but counts still show numbers:
--   → Refresh the page
--   → Run Step 7 query again
--
-- ============================================================================
