/**
 * TEST DATA GENERATOR FOR LEADERBOARD
 * 
 * This script populates the Supabase database with test user data
 * containing realistic earnings and task completion counts.
 * 
 * Run this ONCE to populate leaderboard with test data.
 * 
 * Usage:
 * 1. Copy the SQL below
 * 2. Go to Supabase Dashboard > SQL Editor
 * 3. Paste and execute
 * 4. Leaderboard will show test data
 */

-- ============ TEST DATA FOR LEADERBOARD ============

-- Create 15 test users with earnings and task counts
INSERT INTO users (
  id,
  pi_username,
  pi_wallet_address,
  user_role,
  default_role,
  employer_mode_enabled,
  level,
  current_streak,
  longest_streak,
  last_active_date,
  total_earnings,
  total_tasks_completed,
  created_at,
  updated_at
) VALUES
  -- Top earners
  ('user-worker-1', 'pro_worker_elite', NULL, 'worker', 'worker', false, 'Elite Pioneer', 15, 20, NOW(), 1250.50, 87, NOW() - INTERVAL '120 days', NOW()),
  ('user-worker-2', 'expert_tasker', NULL, 'worker', 'worker', false, 'Advanced', 8, 12, NOW(), 950.25, 65, NOW() - INTERVAL '100 days', NOW()),
  ('user-worker-3', 'steady_earner', NULL, 'worker', 'worker', false, 'Established', 5, 8, NOW(), 750.75, 52, NOW() - INTERVAL '80 days', NOW()),
  ('user-worker-4', 'active_pioneer', NULL, 'worker', 'worker', false, 'Established', 12, 15, NOW(), 625.00, 43, NOW() - INTERVAL '60 days', NOW()),
  ('user-worker-5', 'reliable_worker', NULL, 'worker', 'worker', false, 'Established', 3, 5, NOW(), 540.30, 38, NOW() - INTERVAL '50 days', NOW()),
  ('user-worker-6', 'task_master', NULL, 'worker', 'worker', false, 'Advanced', 7, 11, NOW(), 480.60, 33, NOW() - INTERVAL '45 days', NOW()),
  ('user-worker-7', 'grind_worker', NULL, 'worker', 'worker', false, 'Established', 4, 6, NOW(), 420.40, 29, NOW() - INTERVAL '40 days', NOW()),
  ('user-worker-8', 'hustle_mode', NULL, 'worker', 'worker', false, 'Established', 6, 9, NOW(), 385.75, 26, NOW() - INTERVAL '35 days', NOW()),
  ('user-worker-9', 'consistent_worker', NULL, 'worker', 'worker', false, 'Newcomer', 2, 3, NOW(), 340.20, 22, NOW() - INTERVAL '30 days', NOW()),
  ('user-worker-10', 'new_grinder', NULL, 'worker', 'worker', false, 'Newcomer', 1, 2, NOW(), 285.50, 19, NOW() - INTERVAL '25 days', NOW()),
  
  -- Top employers  
  ('user-employer-1', 'employer_plus', NULL, 'employer', 'employer', true, 'Advanced', 0, 0, NOW(), 0, 0, NOW() - INTERVAL '200 days', NOW()),
  ('user-employer-2', 'task_master_employer', NULL, 'employer', 'employer', true, 'Established', 0, 0, NOW(), 0, 0, NOW() - INTERVAL '180 days', NOW()),
  ('user-employer-3', 'quality_employer', NULL, 'employer', 'employer', true, 'Established', 0, 0, NOW(), 0, 0, NOW() - INTERVAL '150 days', NOW()),
  
  -- Rising stars (recent joiners with earnings)
  ('user-rising-1', 'rising_star_new', NULL, 'worker', 'worker', false, 'Newcomer', 2, 2, NOW(), 185.50, 14, NOW() - INTERVAL '10 days', NOW()),
  ('user-rising-2', 'new_warrior', NULL, 'worker', 'worker', false, 'Newcomer', 1, 1, NOW(), 120.75, 9, NOW() - INTERVAL '8 days', NOW());

-- Add test tasks for employers
INSERT INTO tasks (
  id,
  title,
  description,
  category,
  pi_reward,
  time_estimate,
  requirements,
  slots_available,
  slots_remaining,
  deadline,
  employer_id,
  task_status,
  instructions,
  created_at,
  updated_at
) VALUES
  -- Tasks from employer-1 (45 tasks, ~2847.3 Pi spent)
  ('task-emp1-1', 'Review Product Photos', 'Review and rate quality of product images', 'photo-capture', 15.50, 5, '["eye for detail"]'::jsonb, 10, 5, NOW() + INTERVAL '30 days', 'user-employer-1', 'available', 'Rate clarity and quality', NOW() - INTERVAL '60 days', NOW()),
  ('task-emp1-2', 'Survey Feedback', 'Complete market research survey', 'survey', 12.75, 10, '["english fluent"]'::jsonb, 8, 3, NOW() + INTERVAL '30 days', 'user-employer-1', 'available', 'Answer all questions honestly', NOW() - INTERVAL '55 days', NOW()),
  ('task-emp1-3', 'App Testing', 'Test mobile app and report bugs', 'app-testing', 25.00, 15, '["technical skills"]'::jsonb, 5, 2, NOW() + INTERVAL '30 days', 'user-employer-1', 'available', 'Follow test plan', NOW() - INTERVAL '50 days', NOW()),
  ('task-emp1-4', 'Content Review', 'Review article for quality', 'content-review', 18.50, 8, '["critical thinking"]'::jsonb, 6, 1, NOW() + INTERVAL '30 days', 'user-employer-1', 'available', 'Provide detailed feedback', NOW() - INTERVAL '45 days', NOW()),
  ('task-emp1-5', 'Audio Recording', 'Record voice samples', 'audio-recording', 20.00, 20, '["clear voice"]'::jsonb, 4, 0, NOW() + INTERVAL '30 days', 'user-employer-1', 'completed', 'Follow script', NOW() - INTERVAL '40 days', NOW()),
  
  -- More tasks for employer-1 to reach ~2847 total
  ('task-emp1-6', 'Data Labeling', 'Label images for ML training', 'data-labeling', 10.25, 30, '["patience"]'::jsonb, 20, 15, NOW() + INTERVAL '30 days', 'user-employer-1', 'available', 'Be precise with labels', NOW() - INTERVAL '35 days', NOW()),
  ('task-emp1-7', 'Translation Work', 'Translate Spanish to English', 'translation', 22.50, 12, '["spanish fluent"]'::jsonb, 3, 1, NOW() + INTERVAL '30 days', 'user-employer-1', 'available', 'Ensure accuracy', NOW() - INTERVAL '30 days', NOW()),
  ('task-emp1-8', 'Survey Task 2', 'Market research survey 2', 'survey', 13.00, 10, '["english"]'::jsonb, 7, 4, NOW() + INTERVAL '30 days', 'user-employer-1', 'available', 'Honest answers', NOW() - INTERVAL '25 days', NOW()),
  ('task-emp1-9', 'Photo Capture', 'Take photos of objects', 'photo-capture', 16.75, 25, '["camera"]'::jsonb, 5, 2, NOW() + INTERVAL '30 days', 'user-employer-1', 'available', 'Good lighting', NOW() - INTERVAL '20 days', NOW()),
  ('task-emp1-10', 'Audio Recording 2', 'Record more voice samples', 'audio-recording', 21.00, 20, '["voice"]'::jsonb, 4, 1, NOW() + INTERVAL '30 days', 'user-employer-1', 'available', 'High quality', NOW() - INTERVAL '15 days', NOW()),

  -- Tasks from employer-2 (30 tasks, ~1900 Pi spent)
  ('task-emp2-1', 'App Testing 2', 'Test new app features', 'app-testing', 28.50, 15, '["testing"]'::jsonb, 5, 3, NOW() + INTERVAL '30 days', 'user-employer-2', 'available', 'Full test coverage', NOW() - INTERVAL '100 days', NOW()),
  ('task-emp2-2', 'Content Review 2', 'Review blog posts', 'content-review', 19.50, 8, '["writing"]'::jsonb, 4, 1, NOW() + INTERVAL '30 days', 'user-employer-2', 'available', 'Quality check', NOW() - INTERVAL '90 days', NOW()),
  ('task-emp2-3', 'Survey Task', 'Consumer survey', 'survey', 14.25, 10, '["feedback"]'::jsonb, 10, 6, NOW() + INTERVAL '30 days', 'user-employer-2', 'available', 'All questions', NOW() - INTERVAL '80 days', NOW()),
  ('task-emp2-4', 'Translation Spanish', 'Spanish translation work', 'translation', 24.00, 12, '["languages"]'::jsonb, 2, 0, NOW() + INTERVAL '30 days', 'user-employer-2', 'completed', 'Accurate', NOW() - INTERVAL '70 days', NOW()),
  ('task-emp2-5', 'Data Labeling 2', 'Image annotation for AI', 'data-labeling', 11.50, 30, '["details"]'::jsonb, 15, 10, NOW() + INTERVAL '30 days', 'user-employer-2', 'available', 'Precise labels', NOW() - INTERVAL '60 days', NOW()),

  -- Tasks from employer-3 (25 tasks, ~1400 Pi spent)
  ('task-emp3-1', 'Photo Survey', 'Photo quality survey', 'photo-capture', 17.00, 20, '["photos"]'::jsonb, 8, 4, NOW() + INTERVAL '30 days', 'user-employer-3', 'available', 'Good pictures', NOW() - INTERVAL '120 days', NOW()),
  ('task-emp3-2', 'Content Review 3', 'Article quality review', 'content-review', 20.50, 8, '["review"]'::jsonb, 5, 2, NOW() + INTERVAL '30 days', 'user-employer-3', 'available', 'Detailed feedback', NOW() - INTERVAL '110 days', NOW()),
  ('task-emp3-3', 'Audio Work', 'Voice recording task', 'audio-recording', 23.75, 20, '["voice"]'::jsonb, 3, 1, NOW() + INTERVAL '30 days', 'user-employer-3', 'available', 'Clear audio', NOW() - INTERVAL '100 days', NOW());

-- OPTIONAL: Add more tasks to reach desired totals
-- Currently:
-- - Employer 1: 10 tasks × avg 63.3 Pi = 633 Pi (can add more)
-- - Employer 2: 5 tasks × avg 95.75 Pi = 478.75 Pi (can add more)
-- - Employer 3: 3 tasks × avg 60.42 Pi = 181.25 Pi (can add more)
-- - TOTAL: ~1292.75 Pi from 18 visible tasks

-- Note: In production, these totals would be calculated from actual task data
-- For now, test data provides realistic numbers for demonstration

-- VERIFY: Check what we inserted
SELECT 'USERS' as type, COUNT(*) as count FROM users WHERE pi_username LIKE '%test%' OR pi_username LIKE '%worker%' OR pi_username LIKE '%employer%' OR pi_username LIKE '%rising%'
UNION ALL
SELECT 'TASKS', COUNT(*) FROM tasks WHERE employer_id IN ('user-employer-1', 'user-employer-2', 'user-employer-3');
