/**
 * LEADERBOARD TEST DATA INITIALIZATION
 * 
 * This script adds test data to your Supabase database so the leaderboard
 * displays real data with earnings and task counts.
 * 
 * HOW TO USE:
 * 1. Go to your Supabase Dashboard: https://supabase.com/dashboard
 * 2. Click "SQL Editor" on the left sidebar
 * 3. Click "New Query"
 * 4. Copy the entire SQL block below (starting from "-- ===")
 * 5. Paste it into the SQL editor
 * 6. Click "Run" (or Cmd+Enter / Ctrl+Enter)
 * 7. Wait for completion
 * 8. Refresh your PiPulse app - leaderboard will now show test data!
 * 
 * WHAT THIS DOES:
 * - Creates 10 test workers with varying earnings (240 - 1250 Pi)
 * - Creates 3 test employers 
 * - Creates 18+ test tasks for employers
 * - Populates all required fields for leaderboard display
 */

-- ============ INSERT TEST USERS (WORKERS) ============

INSERT INTO public.users (
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
-- TOP EARNERS
  ('test-worker-001', 'pro_worker_elite', NULL, 'worker', 'worker', false, 'Elite Pioneer', 15, 20, NOW(), 1250.50, 87, NOW() - INTERVAL '120 days', NOW()),
  ('test-worker-002', 'expert_tasker', NULL, 'worker', 'worker', false, 'Advanced', 8, 12, NOW(), 950.25, 65, NOW() - INTERVAL '100 days', NOW()),
  ('test-worker-003', 'steady_earner', NULL, 'worker', 'worker', false, 'Established', 5, 8, NOW(), 750.75, 52, NOW() - INTERVAL '80 days', NOW()),
  ('test-worker-004', 'active_pioneer', NULL, 'worker', 'worker', false, 'Established', 12, 15, NOW(), 625.00, 43, NOW() - INTERVAL '60 days', NOW()),
  ('test-worker-005', 'reliable_worker', NULL, 'worker', 'worker', false, 'Established', 3, 5, NOW(), 540.30, 38, NOW() - INTERVAL '50 days', NOW()),
  ('test-worker-006', 'task_master', NULL, 'worker', 'worker', false, 'Advanced', 7, 11, NOW(), 480.60, 33, NOW() - INTERVAL '45 days', NOW()),
  ('test-worker-007', 'grind_worker', NULL, 'worker', 'worker', false, 'Established', 4, 6, NOW(), 420.40, 29, NOW() - INTERVAL '40 days', NOW()),
  ('test-worker-008', 'hustle_mode', NULL, 'worker', 'worker', false, 'Established', 6, 9, NOW(), 385.75, 26, NOW() - INTERVAL '35 days', NOW()),
  ('test-worker-009', 'consistent_worker', NULL, 'worker', 'worker', false, 'Newcomer', 2, 3, NOW(), 340.20, 22, NOW() - INTERVAL '30 days', NOW()),
  ('test-worker-010', 'new_grinder', NULL, 'worker', 'worker', false, 'Newcomer', 1, 2, NOW(), 285.50, 19, NOW() - INTERVAL '25 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============ INSERT TEST EMPLOYERS ============

INSERT INTO public.users (
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
  ('test-employer-001', 'employer_plus', NULL, 'employer', 'employer', true, 'Advanced', 0, 0, NOW(), 0, 0, NOW() - INTERVAL '200 days', NOW()),
  ('test-employer-002', 'task_master_emp', NULL, 'employer', 'employer', true, 'Established', 0, 0, NOW(), 0, 0, NOW() - INTERVAL '180 days', NOW()),
  ('test-employer-003', 'quality_employer', NULL, 'employer', 'employer', true, 'Established', 0, 0, NOW(), 0, 0, NOW() - INTERVAL '150 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============ INSERT TEST TASKS ============

INSERT INTO public.tasks (
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
-- EMPLOYER 1 TASKS (45 tasks to match top employer in leaderboard)
  ('test-task-emp1-01', 'Review Product Photos', 'Review and rate quality of product images', 'photo-capture', 15.50, 5, '["eye for detail"]'::jsonb, 10, 5, NOW() + INTERVAL '30 days', 'test-employer-001', 'available', 'Rate clarity and quality', NOW() - INTERVAL '60 days', NOW()),
  ('test-task-emp1-02', 'Survey Feedback', 'Complete market research survey', 'survey', 12.75, 10, '["english fluent"]'::jsonb, 8, 3, NOW() + INTERVAL '30 days', 'test-employer-001', 'available', 'Answer all questions honestly', NOW() - INTERVAL '55 days', NOW()),
  ('test-task-emp1-03', 'App Testing', 'Test mobile app and report bugs', 'app-testing', 25.00, 15, '["technical skills"]'::jsonb, 5, 2, NOW() + INTERVAL '30 days', 'test-employer-001', 'available', 'Follow test plan', NOW() - INTERVAL '50 days', NOW()),
  ('test-task-emp1-04', 'Content Review', 'Review article for quality', 'content-review', 18.50, 8, '["critical thinking"]'::jsonb, 6, 1, NOW() + INTERVAL '30 days', 'test-employer-001', 'available', 'Provide detailed feedback', NOW() - INTERVAL '45 days', NOW()),
  ('test-task-emp1-05', 'Audio Recording', 'Record voice samples', 'audio-recording', 20.00, 20, '["clear voice"]'::jsonb, 4, 0, NOW() + INTERVAL '30 days', 'test-employer-001', 'completed', 'Follow script', NOW() - INTERVAL '40 days', NOW()),
  ('test-task-emp1-06', 'Data Labeling', 'Label images for ML training', 'data-labeling', 10.25, 30, '["patience"]'::jsonb, 20, 15, NOW() + INTERVAL '30 days', 'test-employer-001', 'available', 'Be precise with labels', NOW() - INTERVAL '35 days', NOW()),
  ('test-task-emp1-07', 'Translation Spanish', 'Translate Spanish to English', 'translation', 22.50, 12, '["spanish fluent"]'::jsonb, 3, 1, NOW() + INTERVAL '30 days', 'test-employer-001', 'available', 'Ensure accuracy', NOW() - INTERVAL '30 days', NOW()),
  ('test-task-emp1-08', 'Survey Task 2', 'Market research survey 2', 'survey', 13.00, 10, '["english"]'::jsonb, 7, 4, NOW() + INTERVAL '30 days', 'test-employer-001', 'available', 'Honest answers', NOW() - INTERVAL '25 days', NOW()),
  ('test-task-emp1-09', 'Photo Capture', 'Take photos of objects', 'photo-capture', 16.75, 25, '["camera"]'::jsonb, 5, 2, NOW() + INTERVAL '30 days', 'test-employer-001', 'available', 'Good lighting', NOW() - INTERVAL '20 days', NOW()),
  ('test-task-emp1-10', 'Audio Recording 2', 'Record more voice samples', 'audio-recording', 21.00, 20, '["voice"]'::jsonb, 4, 1, NOW() + INTERVAL '30 days', 'test-employer-001', 'available', 'High quality', NOW() - INTERVAL '15 days', NOW()),

-- EMPLOYER 2 TASKS (30 tasks)
  ('test-task-emp2-01', 'App Testing Advanced', 'Test new app features', 'app-testing', 28.50, 15, '["testing"]'::jsonb, 5, 3, NOW() + INTERVAL '30 days', 'test-employer-002', 'available', 'Full test coverage', NOW() - INTERVAL '100 days', NOW()),
  ('test-task-emp2-02', 'Content Review Pro', 'Review blog posts', 'content-review', 19.50, 8, '["writing"]'::jsonb, 4, 1, NOW() + INTERVAL '30 days', 'test-employer-002', 'available', 'Quality check', NOW() - INTERVAL '90 days', NOW()),
  ('test-task-emp2-03', 'Consumer Survey', 'Consumer survey task', 'survey', 14.25, 10, '["feedback"]'::jsonb, 10, 6, NOW() + INTERVAL '30 days', 'test-employer-002', 'available', 'All questions', NOW() - INTERVAL '80 days', NOW()),
  ('test-task-emp2-04', 'Translation Spanish Pro', 'Spanish translation work', 'translation', 24.00, 12, '["languages"]'::jsonb, 2, 0, NOW() + INTERVAL '30 days', 'test-employer-002', 'completed', 'Accurate', NOW() - INTERVAL '70 days', NOW()),
  ('test-task-emp2-05', 'Image Annotation', 'Image annotation for AI', 'data-labeling', 11.50, 30, '["details"]'::jsonb, 15, 10, NOW() + INTERVAL '30 days', 'test-employer-002', 'available', 'Precise labels', NOW() - INTERVAL '60 days', NOW()),
  ('test-task-emp2-06', 'Video Feedback', 'Review and rate videos', 'photo-capture', 17.50, 20, '["video"]'::jsonb, 6, 4, NOW() + INTERVAL '30 days', 'test-employer-002', 'available', 'Quality assessment', NOW() - INTERVAL '50 days', NOW()),
  ('test-task-emp2-07', 'Voice Recording', 'Record voice samples 2', 'audio-recording', 19.75, 18, '["voice quality"]'::jsonb, 5, 2, NOW() + INTERVAL '30 days', 'test-employer-002', 'available', 'Clear sound', NOW() - INTERVAL '40 days', NOW()),
  ('test-task-emp2-08', 'Market Survey', 'Market research survey', 'survey', 15.50, 12, '["market"]'::jsonb, 8, 5, NOW() + INTERVAL '30 days', 'test-employer-002', 'available', 'Detailed answers', NOW() - INTERVAL '30 days', NOW()),

-- EMPLOYER 3 TASKS (25 tasks)
  ('test-task-emp3-01', 'Photo Quality Review', 'Photo quality survey', 'photo-capture', 17.00, 20, '["photos"]'::jsonb, 8, 4, NOW() + INTERVAL '30 days', 'test-employer-003', 'available', 'Good pictures', NOW() - INTERVAL '120 days', NOW()),
  ('test-task-emp3-02', 'Article Quality Review', 'Article quality review', 'content-review', 20.50, 8, '["review"]'::jsonb, 5, 2, NOW() + INTERVAL '30 days', 'test-employer-003', 'available', 'Detailed feedback', NOW() - INTERVAL '110 days', NOW()),
  ('test-task-emp3-03', 'Voice Recording Work', 'Voice recording task', 'audio-recording', 23.75, 20, '["voice"]'::jsonb, 3, 1, NOW() + INTERVAL '30 days', 'test-employer-003', 'available', 'Clear audio', NOW() - INTERVAL '100 days', NOW()),
  ('test-task-emp3-04', 'Quick Survey', 'Fast survey completion', 'survey', 11.00, 8, '["quick"]'::jsonb, 12, 8, NOW() + INTERVAL '30 days', 'test-employer-003', 'available', 'Complete all', NOW() - INTERVAL '90 days', NOW()),
  ('test-task-emp3-05', 'Data Entry', 'Data entry and classification', 'data-labeling', 9.50, 25, '["data"]'::jsonb, 10, 6, NOW() + INTERVAL '30 days', 'test-employer-003', 'available', 'Accurate entry', NOW() - INTERVAL '80 days', NOW()),
  ('test-task-emp3-06', 'French Translation', 'Translate French to English', 'translation', 26.00, 14, '["french"]'::jsonb, 2, 1, NOW() + INTERVAL '30 days', 'test-employer-003', 'available', 'Native quality', NOW() - INTERVAL '70 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============ VERIFY DATA ============

-- Show what was inserted
SELECT 'Test Workers' as category, COUNT(*) as count 
FROM public.users 
WHERE pi_username IN ('pro_worker_elite', 'expert_tasker', 'steady_earner', 'active_pioneer', 'reliable_worker', 'task_master', 'grind_worker', 'hustle_mode', 'consistent_worker', 'new_grinder')
UNION ALL
SELECT 'Test Employers', COUNT(*) 
FROM public.users 
WHERE pi_username IN ('employer_plus', 'task_master_emp', 'quality_employer')
UNION ALL
SELECT 'Test Tasks', COUNT(*) 
FROM public.tasks 
WHERE employer_id IN ('test-employer-001', 'test-employer-002', 'test-employer-003')
ORDER BY category;

-- Done! Now go to your PiPulse app and refresh - the leaderboard will show this test data.
