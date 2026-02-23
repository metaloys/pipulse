-- ═══════════════════════════════════════════════════════════════════════════════
-- CRITICAL DATABASE SCHEMA FIXES
-- Run these SQL statements in Supabase SQL Editor in the exact order shown
-- ═══════════════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────────────────
-- FIX 1: Allow NULL wallet addresses (Pi SDK never provides them)
-- ────────────────────────────────────────────────────────────────────────────────
ALTER TABLE users 
ALTER COLUMN pi_wallet_address DROP NOT NULL;

-- ────────────────────────────────────────────────────────────────────────────────
-- FIX 2: Fix notifications foreign key (reference public.users, not auth.users)
-- ────────────────────────────────────────────────────────────────────────────────
ALTER TABLE notifications 
DROP CONSTRAINT notifications_user_id_fkey;

ALTER TABLE notifications
ADD CONSTRAINT notifications_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.users(id) ON DELETE CASCADE;

-- ────────────────────────────────────────────────────────────────────────────────
-- FIX 3: Create failed_completions recovery table
-- ────────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.failed_completions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id text NOT NULL,
  txid text NOT NULL,
  worker_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  employer_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
  amount numeric(10, 2) NOT NULL,
  fee numeric(10, 2) NOT NULL,
  error_message text NOT NULL,
  recovered boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT NOW(),
  recovered_at timestamp with time zone,
  UNIQUE(payment_id, txid)
);

-- Enable RLS
ALTER TABLE failed_completions ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage recovery entries
CREATE POLICY "Service role can manage recovery" ON failed_completions
  USING (true)
  WITH CHECK (true);

-- ────────────────────────────────────────────────────────────────────────────────
-- FIX 4: Recalculate real user earnings from actual transactions
-- ────────────────────────────────────────────────────────────────────────────────
UPDATE users 
SET 
  total_earnings = COALESCE(
    (SELECT SUM(amount - pipulse_fee) 
     FROM transactions 
     WHERE receiver_id = users.id 
     AND transaction_status = 'completed'
    ), 0
  ),
  total_tasks_completed = COALESCE(
    (SELECT COUNT(*) 
     FROM task_submissions 
     WHERE worker_id = users.id 
     AND submission_status = 'approved'
    ), 0
  ),
  updated_at = NOW()
WHERE user_role = 'worker';

-- ────────────────────────────────────────────────────────────────────────────────
-- FIX 5: Create or update platform_settings table for configuration
-- ────────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  description text,
  updated_at timestamp with time zone DEFAULT NOW(),
  updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL
);

-- Insert default settings
INSERT INTO platform_settings (key, value, description)
VALUES 
  ('commission_rate', '15', 'Platform commission percentage (0-100)'),
  ('min_task_reward', '1.00', 'Minimum task reward in Pi'),
  ('max_task_reward', '1000.00', 'Maximum task reward in Pi'),
  ('daily_earning_limit', 'unlimited', 'Daily earning limit per worker'),
  ('platform_version', '1.0.0', 'Current platform version')
ON CONFLICT (key) DO NOTHING;

-- Enable RLS on platform_settings
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings
CREATE POLICY "Read settings" ON platform_settings
  FOR SELECT USING (true);

-- Only admin can update settings
CREATE POLICY "Update settings" ON platform_settings
  FOR UPDATE USING (false)  -- Disabled for now, enable when admin auth is ready
  WITH CHECK (false);

-- ════════════════════════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES (Run these to confirm fixes)
-- ════════════════════════════════════════════════════════════════════════════════

-- Check 1: Verify pi_wallet_address is now nullable
-- Should show: pi_wallet_address is_nullable = YES
SELECT column_name, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'pi_wallet_address';

-- Check 2: Verify failed_completions table exists
-- Should show: table exists
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'failed_completions'
) as "failed_completions_exists";

-- Check 3: Verify platform_settings table exists
-- Should show: table exists
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'platform_settings'
) as "platform_settings_exists";

-- Check 4: Verify user earnings are recalculated
-- Should show all workers with correct earnings
SELECT 
  id, 
  pi_username, 
  total_earnings,
  total_tasks_completed
FROM users 
WHERE user_role = 'worker'
ORDER BY total_earnings DESC;

-- Check 5: Verify notifications foreign key
-- Should show: notifications_user_id_fkey references public.users
SELECT constraint_name, table_name, column_name
FROM information_schema.key_column_usage
WHERE table_name = 'notifications' AND column_name = 'user_id';

-- ════════════════════════════════════════════════════════════════════════════════
-- DONE!
-- Now proceed with TypeScript code fixes
-- ════════════════════════════════════════════════════════════════════════════════
