-- Fix: Add DEFAULT to id columns by dropping and recreating tables

BEGIN;

-- Disable foreign key constraints temporarily
SET session_replication_role = replica;

-- Drop all tables in public schema
DROP TABLE IF EXISTS "AuditLog" CASCADE;
DROP TABLE IF EXISTS "FailedCompletion" CASCADE;
DROP TABLE IF EXISTS "PlatformSettings" CASCADE;
DROP TABLE IF EXISTS "Streak" CASCADE;
DROP TABLE IF EXISTS "Notification" CASCADE;
DROP TABLE IF EXISTS "Dispute" CASCADE;
DROP TABLE IF EXISTS "Transaction" CASCADE;
DROP TABLE IF EXISTS "Submission" CASCADE;
DROP TABLE IF EXISTS "SlotLock" CASCADE;
DROP TABLE IF EXISTS "TaskVersion" CASCADE;
DROP TABLE IF EXISTS "Task" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TABLE IF EXISTS task_submissions CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Re-enable foreign key constraints
SET session_replication_role = default;

COMMIT;

-- Now run the updated SUPABASE_MIGRATION.sql with DEFAULT gen_random_uuid()::text
