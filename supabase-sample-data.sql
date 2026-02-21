-- Insert Sample Data for Testing

-- 1. Create sample users
INSERT INTO users (pi_username, pi_wallet_address, user_role, level, current_streak, longest_streak, total_earnings, total_tasks_completed)
VALUES
  ('alex_worker', 'wallet_alex_123', 'worker', 'Elite Pioneer', 5, 12, 450.50, 87),
  ('sam_pioneer', 'wallet_sam_456', 'worker', 'Advanced', 3, 8, 320.25, 64),
  ('jordan_pro', 'wallet_jordan_789', 'worker', 'Established', 2, 5, 180.75, 35),
  ('casey_new', 'wallet_casey_000', 'worker', 'Newcomer', 1, 1, 25.50, 4),
  ('tech_corp', 'wallet_tech_corp', 'employer', 'Elite Pioneer', 0, 0, 0, 0),
  ('data_labs', 'wallet_data_labs', 'employer', 'Advanced', 0, 0, 0, 0)
ON CONFLICT DO NOTHING;

-- 2. Create sample tasks
INSERT INTO tasks (
  title, description, category, pi_reward, time_estimate, 
  requirements, slots_available, slots_remaining, deadline, 
  employer_id, task_status, instructions
)
VALUES
  (
    'Test Mobile App Navigation',
    'Test a new mobile app and report any navigation issues',
    'app-testing',
    3.5,
    15,
    ARRAY['Android or iOS device', 'Stable internet connection'],
    50,
    25,
    NOW() + INTERVAL '3 days',
    (SELECT id FROM users WHERE pi_username = 'tech_corp'),
    'available',
    'Download the app, test all navigation flows, and submit screenshots of any bugs.'
  ),
  (
    'Complete Consumer Survey',
    'Answer questions about your shopping habits',
    'survey',
    2.0,
    10,
    ARRAY['Age 18+', 'Regular online shopper'],
    100,
    67,
    NOW() + INTERVAL '2 days',
    (SELECT id FROM users WHERE pi_username = 'data_labs'),
    'available',
    'Complete the survey honestly. All answers are anonymous.'
  ),
  (
    'Translate Product Descriptions',
    'Translate 20 product descriptions from English to Spanish',
    'translation',
    8.0,
    45,
    ARRAY['Fluent in English and Spanish', 'Translation experience'],
    10,
    3,
    NOW() + INTERVAL '5 days',
    (SELECT id FROM users WHERE pi_username = 'tech_corp'),
    'available',
    'Translate accurately maintaining the marketing tone. Submit in provided format.'
  ),
  (
    'Record Voice Samples',
    'Record 50 sentences in your native language',
    'audio-recording',
    5.5,
    30,
    ARRAY['Quiet environment', 'Clear microphone'],
    200,
    145,
    NOW() + INTERVAL '7 days',
    (SELECT id FROM users WHERE pi_username = 'data_labs'),
    'available',
    'Read each sentence clearly in a quiet room. Follow the pronunciation guide.'
  ),
  (
    'Capture Store Photos',
    'Take photos of product displays at your local supermarket',
    'photo-capture',
    4.0,
    20,
    ARRAY['Smartphone with camera', 'Access to supermarket'],
    30,
    12,
    NOW() + INTERVAL '1 day',
    (SELECT id FROM users WHERE pi_username = 'tech_corp'),
    'available',
    'Take clear photos of specified product categories. Ensure good lighting.'
  ),
  (
    'Review Content for Accuracy',
    'Review and flag inappropriate or inaccurate content',
    'content-review',
    3.0,
    25,
    ARRAY['Attention to detail', 'English language proficiency'],
    40,
    18,
    NOW() + INTERVAL '4 days',
    (SELECT id FROM users WHERE pi_username = 'data_labs'),
    'available',
    'Mark problematic content with specific reasons. Be constructive in feedback.'
  ),
  (
    'Label Training Data',
    'Label images for machine learning training dataset',
    'data-labeling',
    6.5,
    35,
    ARRAY['Basic understanding of image classification'],
    75,
    42,
    NOW() + INTERVAL '6 days',
    (SELECT id FROM users WHERE pi_username = 'tech_corp'),
    'available',
    'Follow the labeling guidelines carefully. Accuracy is critical for ML models.'
  );

-- 3. Create sample streaks
INSERT INTO streaks (user_id, current_streak, longest_streak, last_active_date, streak_bonus_earned)
SELECT id, current_streak, longest_streak, last_active_date, true
FROM users
WHERE user_role = 'worker'
ON CONFLICT DO NOTHING;

-- 4. Create sample transactions
INSERT INTO transactions (
  sender_id, receiver_id, amount, pipulse_fee, task_id, 
  transaction_type, transaction_status, timestamp
)
VALUES
  (
    (SELECT id FROM users WHERE pi_username = 'tech_corp'),
    (SELECT id FROM users WHERE pi_username = 'alex_worker'),
    3.5,
    0.525,
    (SELECT id FROM tasks WHERE title = 'Test Mobile App Navigation' LIMIT 1),
    'payment',
    'completed',
    NOW() - INTERVAL '2 days'
  ),
  (
    (SELECT id FROM users WHERE pi_username = 'data_labs'),
    (SELECT id FROM users WHERE pi_username = 'sam_pioneer'),
    2.0,
    0.30,
    (SELECT id FROM tasks WHERE title = 'Complete Consumer Survey' LIMIT 1),
    'payment',
    'completed',
    NOW() - INTERVAL '1 day'
  ),
  (
    (SELECT id FROM users WHERE pi_username = 'tech_corp'),
    (SELECT id FROM users WHERE pi_username = 'jordan_pro'),
    4.0,
    0.60,
    (SELECT id FROM tasks WHERE title = 'Capture Store Photos' LIMIT 1),
    'payment',
    'completed',
    NOW() - INTERVAL '5 hours'
  );

-- Verify the data was inserted
SELECT 'Users created' as status, COUNT(*) FROM users
UNION ALL
SELECT 'Tasks created' as status, COUNT(*) FROM tasks
UNION ALL
SELECT 'Streaks created' as status, COUNT(*) FROM streaks
UNION ALL
SELECT 'Transactions created' as status, COUNT(*) FROM transactions;
