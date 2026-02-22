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
-- TOP EARNERS (with valid UUIDs and wallet addresses)
  ('550e8400-e29b-41d4-a716-446655440001'::uuid, 'pro_worker_elite', 'GDCH25LS7XCYWHMDQGJUZXWZ5XYNUAPKRJ754YJUPWPGXPQSDJUPQXFWYA', 'worker', 'worker', false, 'Elite Pioneer', 15, 20, NOW(), 1250.50, 87, NOW() - INTERVAL '120 days', NOW()),
  ('550e8400-e29b-41d4-a716-446655440002'::uuid, 'expert_tasker', 'GDCH25LS7XCYWHMDQGJUZXWZ5XYNUAPKRJ754YJUPWPGXPQSDJUPQXFWZB', 'worker', 'worker', false, 'Advanced', 8, 12, NOW(), 950.25, 65, NOW() - INTERVAL '100 days', NOW()),
  ('550e8400-e29b-41d4-a716-446655440003'::uuid, 'steady_earner', 'GDCH25LS7XCYWHMDQGJUZXWZ5XYNUAPKRJ754YJUPWPGXPQSDJUPQXFWZC', 'worker', 'worker', false, 'Established', 5, 8, NOW(), 750.75, 52, NOW() - INTERVAL '80 days', NOW()),
  ('550e8400-e29b-41d4-a716-446655440004'::uuid, 'active_pioneer', 'GDCH25LS7XCYWHMDQGJUZXWZ5XYNUAPKRJ754YJUPWPGXPQSDJUPQXFWZD', 'worker', 'worker', false, 'Established', 12, 15, NOW(), 625.00, 43, NOW() - INTERVAL '60 days', NOW()),
  ('550e8400-e29b-41d4-a716-446655440005'::uuid, 'reliable_worker', 'GDCH25LS7XCYWHMDQGJUZXWZ5XYNUAPKRJ754YJUPWPGXPQSDJUPQXFWZE', 'worker', 'worker', false, 'Established', 3, 5, NOW(), 540.30, 38, NOW() - INTERVAL '50 days', NOW()),
  ('550e8400-e29b-41d4-a716-446655440006'::uuid, 'task_master', 'GDCH25LS7XCYWHMDQGJUZXWZ5XYNUAPKRJ754YJUPWPGXPQSDJUPQXFWZF', 'worker', 'worker', false, 'Advanced', 7, 11, NOW(), 480.60, 33, NOW() - INTERVAL '45 days', NOW()),
  ('550e8400-e29b-41d4-a716-446655440007'::uuid, 'grind_worker', 'GDCH25LS7XCYWHMDQGJUZXWZ5XYNUAPKRJ754YJUPWPGXPQSDJUPQXFWZG', 'worker', 'worker', false, 'Established', 4, 6, NOW(), 420.40, 29, NOW() - INTERVAL '40 days', NOW()),
  ('550e8400-e29b-41d4-a716-446655440008'::uuid, 'hustle_mode', 'GDCH25LS7XCYWHMDQGJUZXWZ5XYNUAPKRJ754YJUPWPGXPQSDJUPQXFWZH', 'worker', 'worker', false, 'Established', 6, 9, NOW(), 385.75, 26, NOW() - INTERVAL '35 days', NOW()),
  ('550e8400-e29b-41d4-a716-446655440009'::uuid, 'consistent_worker', 'GDCH25LS7XCYWHMDQGJUZXWZ5XYNUAPKRJ754YJUPWPGXPQSDJUPQXFWZI', 'worker', 'worker', false, 'Newcomer', 2, 3, NOW(), 340.20, 22, NOW() - INTERVAL '30 days', NOW()),
  ('550e8400-e29b-41d4-a716-446655440010'::uuid, 'new_grinder', 'GDCH25LS7XCYWHMDQGJUZXWZ5XYNUAPKRJ754YJUPWPGXPQSDJUPQXFWZJ', 'worker', 'worker', false, 'Newcomer', 1, 2, NOW(), 285.50, 19, NOW() - INTERVAL '25 days', NOW())
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
  ('550e8400-e29b-41d4-a716-446655550001'::uuid, 'employer_plus', 'GDCH25LS7XCYWHMDQGJUZXWZ5XYNUAPKRJ754YJUPWPGXPQSDJUPQXFWEA', 'employer', 'employer', true, 'Advanced', 0, 0, NOW(), 0, 0, NOW() - INTERVAL '200 days', NOW()),
  ('550e8400-e29b-41d4-a716-446655550002'::uuid, 'task_master_emp', 'GDCH25LS7XCYWHMDQGJUZXWZ5XYNUAPKRJ754YJUPWPGXPQSDJUPQXFWEB', 'employer', 'employer', true, 'Established', 0, 0, NOW(), 0, 0, NOW() - INTERVAL '180 days', NOW()),
  ('550e8400-e29b-41d4-a716-446655550003'::uuid, 'quality_employer', 'GDCH25LS7XCYWHMDQGJUZXWZ5XYNUAPKRJ754YJUPWPGXPQSDJUPQXFWEC', 'employer', 'employer', true, 'Established', 0, 0, NOW(), 0, 0, NOW() - INTERVAL '150 days', NOW())
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
-- EMPLOYER 1 TASKS (10 tasks)
  ('550e8400-e29b-41d4-a716-446655770001'::uuid, 'Review Product Photos', 'Review and rate quality of product images', 'photo-capture', 15.50, 5, '["eye for detail"]'::jsonb, 10, 5, NOW() + INTERVAL '30 days', '550e8400-e29b-41d4-a716-446655550001', 'available', 'Rate clarity and quality', NOW() - INTERVAL '60 days', NOW()),
  ('550e8400-e29b-41d4-a716-446655770002'::uuid, 'Survey Feedback', 'Complete market research survey', 'survey', 12.75, 10, '["english fluent"]'::jsonb, 8, 3, NOW() + INTERVAL '30 days', '550e8400-e29b-41d4-a716-446655550001', 'available', 'Answer all questions honestly', NOW() - INTERVAL '55 days', NOW()),
  ('550e8400-e29b-41d4-a716-446655770003'::uuid, 'App Testing', 'Test mobile app and report bugs', 'app-testing', 25.00, 15, '["technical skills"]'::jsonb, 5, 2, NOW() + INTERVAL '30 days', '550e8400-e29b-41d4-a716-446655550001', 'available', 'Follow test plan', NOW() - INTERVAL '50 days', NOW()),
  ('550e8400-e29b-41d4-a716-446655770004'::uuid, 'Content Review', 'Review article for quality', 'content-review', 18.50, 8, '["critical thinking"]'::jsonb, 6, 1, NOW() + INTERVAL '30 days', '550e8400-e29b-41d4-a716-446655550001', 'available', 'Provide detailed feedback', NOW() - INTERVAL '45 days', NOW()),
  ('550e8400-e29b-41d4-a716-446655770005'::uuid, 'Audio Recording', 'Record voice samples', 'audio-recording', 20.00, 20, '["clear voice"]'::jsonb, 4, 0, NOW() + INTERVAL '30 days', '550e8400-e29b-41d4-a716-446655550001', 'completed', 'Follow script', NOW() - INTERVAL '40 days', NOW()),
  ('550e8400-e29b-41d4-a716-446655770006'::uuid, 'Data Labeling', 'Label images for ML training', 'data-labeling', 10.25, 30, '["patience"]'::jsonb, 20, 15, NOW() + INTERVAL '30 days', '550e8400-e29b-41d4-a716-446655550001', 'available', 'Be precise with labels', NOW() - INTERVAL '35 days', NOW()),
  ('550e8400-e29b-41d4-a716-446655770007'::uuid, 'Translation Spanish', 'Translate Spanish to English', 'translation', 22.50, 12, '["spanish fluent"]'::jsonb, 3, 1, NOW() + INTERVAL '30 days', '550e8400-e29b-41d4-a716-446655550001', 'available', 'Ensure accuracy', NOW() - INTERVAL '30 days', NOW()),
  ('550e8400-e29b-41d4-a716-446655770008'::uuid, 'Survey Task 2', 'Market research survey 2', 'survey', 13.00, 10, '["english"]'::jsonb, 7, 4, NOW() + INTERVAL '30 days', '550e8400-e29b-41d4-a716-446655550001', 'available', 'Honest answers', NOW() - INTERVAL '25 days', NOW()),
  ('550e8400-e29b-41d4-a716-446655770009'::uuid, 'Photo Capture', 'Take photos of objects', 'photo-capture', 16.75, 25, '["camera"]'::jsonb, 5, 2, NOW() + INTERVAL '30 days', '550e8400-e29b-41d4-a716-446655550001', 'available', 'Good lighting', NOW() - INTERVAL '20 days', NOW()),
  ('550e8400-e29b-41d4-a716-446655770010'::uuid, 'Audio Recording 2', 'Record more voice samples', 'audio-recording', 21.00, 20, '["voice"]'::jsonb, 4, 1, NOW() + INTERVAL '30 days', '550e8400-e29b-41d4-a716-446655550001', 'available', 'High quality', NOW() - INTERVAL '15 days', NOW()),

-- EMPLOYER 2 TASKS (8 tasks)
  ('550e8400-e29b-41d4-a716-446655770011'::uuid, 'App Testing Advanced', 'Test new app features', 'app-testing', 28.50, 15, '["testing"]'::jsonb, 5, 3, NOW() + INTERVAL '30 days', '550e8400-e29b-41d4-a716-446655550002', 'available', 'Full test coverage', NOW() - INTERVAL '100 days', NOW()),
  ('550e8400-e29b-41d4-a716-446655770012'::uuid, 'Content Review Pro', 'Review blog posts', 'content-review', 19.50, 8, '["writing"]'::jsonb, 4, 1, NOW() + INTERVAL '30 days', '550e8400-e29b-41d4-a716-446655550002', 'available', 'Quality check', NOW() - INTERVAL '90 days', NOW()),
  ('550e8400-e29b-41d4-a716-446655770013'::uuid, 'Consumer Survey', 'Consumer survey task', 'survey', 14.25, 10, '["feedback"]'::jsonb, 10, 6, NOW() + INTERVAL '30 days', '550e8400-e29b-41d4-a716-446655550002', 'available', 'All questions', NOW() - INTERVAL '80 days', NOW()),
  ('550e8400-e29b-41d4-a716-446655770014'::uuid, 'Translation Spanish Pro', 'Spanish translation work', 'translation', 24.00, 12, '["languages"]'::jsonb, 2, 0, NOW() + INTERVAL '30 days', '550e8400-e29b-41d4-a716-446655550002', 'completed', 'Accurate', NOW() - INTERVAL '70 days', NOW()),
  ('550e8400-e29b-41d4-a716-446655770015'::uuid, 'Image Annotation', 'Image annotation for AI', 'data-labeling', 11.50, 30, '["details"]'::jsonb, 15, 10, NOW() + INTERVAL '30 days', '550e8400-e29b-41d4-a716-446655550002', 'available', 'Precise labels', NOW() - INTERVAL '60 days', NOW()),
  ('550e8400-e29b-41d4-a716-446655770016'::uuid, 'Video Feedback', 'Review and rate videos', 'photo-capture', 17.50, 20, '["video"]'::jsonb, 6, 4, NOW() + INTERVAL '30 days', '550e8400-e29b-41d4-a716-446655550002', 'available', 'Quality assessment', NOW() - INTERVAL '50 days', NOW()),
  ('550e8400-e29b-41d4-a716-446655770017'::uuid, 'Voice Recording', 'Record voice samples 2', 'audio-recording', 19.75, 18, '["voice quality"]'::jsonb, 5, 2, NOW() + INTERVAL '30 days', '550e8400-e29b-41d4-a716-446655550002', 'available', 'Clear sound', NOW() - INTERVAL '40 days', NOW()),
  ('550e8400-e29b-41d4-a716-446655770018'::uuid, 'Market Survey', 'Market research survey', 'survey', 15.50, 12, '["market"]'::jsonb, 8, 5, NOW() + INTERVAL '30 days', '550e8400-e29b-41d4-a716-446655550002', 'available', 'Detailed answers', NOW() - INTERVAL '30 days', NOW()),

-- EMPLOYER 3 TASKS (6 tasks)
  ('550e8400-e29b-41d4-a716-446655770019'::uuid, 'Photo Quality Review', 'Photo quality survey', 'photo-capture', 17.00, 20, '["photos"]'::jsonb, 8, 4, NOW() + INTERVAL '30 days', '550e8400-e29b-41d4-a716-446655550003', 'available', 'Good pictures', NOW() - INTERVAL '120 days', NOW()),
  ('550e8400-e29b-41d4-a716-446655770020'::uuid, 'Article Quality Review', 'Article quality review', 'content-review', 20.50, 8, '["review"]'::jsonb, 5, 2, NOW() + INTERVAL '30 days', '550e8400-e29b-41d4-a716-446655550003', 'available', 'Detailed feedback', NOW() - INTERVAL '110 days', NOW()),
  ('550e8400-e29b-41d4-a716-446655770021'::uuid, 'Voice Recording Work', 'Voice recording task', 'audio-recording', 23.75, 20, '["voice"]'::jsonb, 3, 1, NOW() + INTERVAL '30 days', '550e8400-e29b-41d4-a716-446655550003', 'available', 'Clear audio', NOW() - INTERVAL '100 days', NOW()),
  ('550e8400-e29b-41d4-a716-446655770022'::uuid, 'Quick Survey', 'Fast survey completion', 'survey', 11.00, 8, '["quick"]'::jsonb, 12, 8, NOW() + INTERVAL '30 days', '550e8400-e29b-41d4-a716-446655550003', 'available', 'Complete all', NOW() - INTERVAL '90 days', NOW()),
  ('550e8400-e29b-41d4-a716-446655770023'::uuid, 'Data Entry', 'Data entry and classification', 'data-labeling', 9.50, 25, '["data"]'::jsonb, 10, 6, NOW() + INTERVAL '30 days', '550e8400-e29b-41d4-a716-446655550003', 'available', 'Accurate entry', NOW() - INTERVAL '80 days', NOW()),
  ('550e8400-e29b-41d4-a716-446655770024'::uuid, 'French Translation', 'Translate French to English', 'translation', 26.00, 14, '["french"]'::jsonb, 2, 1, NOW() + INTERVAL '30 days', '550e8400-e29b-41d4-a716-446655550003', 'available', 'Native quality', NOW() - INTERVAL '70 days', NOW())
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
WHERE employer_id IN ('550e8400-e29b-41d4-a716-446655550001'::uuid, '550e8400-e29b-41d4-a716-446655550002'::uuid, '550e8400-e29b-41d4-a716-446655550003'::uuid)
ORDER BY category;

-- Done! Now go to your PiPulse app and refresh - the leaderboard will show this test data.
