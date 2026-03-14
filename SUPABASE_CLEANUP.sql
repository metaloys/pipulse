-- Clean up orphaned indexes and objects
-- Run this FIRST before the migration

-- Drop orphaned indexes directly
DROP INDEX IF EXISTS "User_piUid_key";
DROP INDEX IF EXISTS "User_piUsername_key";
DROP INDEX IF EXISTS "User_piWallet_key";
DROP INDEX IF EXISTS "User_userRole_idx";
DROP INDEX IF EXISTS "User_status_idx";
DROP INDEX IF EXISTS "User_piUsername_idx";
DROP INDEX IF EXISTS "Task_employerId_idx";
DROP INDEX IF EXISTS "Task_taskStatus_idx";
DROP INDEX IF EXISTS "Task_category_idx";
DROP INDEX IF EXISTS "Task_deadline_idx";
DROP INDEX IF EXISTS "Task_deletedAt_idx";
DROP INDEX IF EXISTS "Submission_taskId_idx";
DROP INDEX IF EXISTS "Submission_workerId_idx";
DROP INDEX IF EXISTS "Submission_status_idx";
DROP INDEX IF EXISTS "Submission_deletedAt_idx";
DROP INDEX IF EXISTS "Submission_taskId_workerId_key";
DROP INDEX IF EXISTS "Transaction_senderId_idx";
DROP INDEX IF EXISTS "Transaction_receiverId_idx";
DROP INDEX IF EXISTS "Transaction_taskId_idx";
DROP INDEX IF EXISTS "Transaction_submissionId_idx";
DROP INDEX IF EXISTS "Transaction_status_idx";
DROP INDEX IF EXISTS "Transaction_type_idx";
DROP INDEX IF EXISTS "Dispute_submissionId_key";
DROP INDEX IF EXISTS "Dispute_status_idx";
DROP INDEX IF EXISTS "Dispute_taskId_idx";
DROP INDEX IF EXISTS "Dispute_workerId_idx";
DROP INDEX IF EXISTS "Notification_userId_idx";
DROP INDEX IF EXISTS "Notification_read_idx";
DROP INDEX IF EXISTS "Notification_createdAt_idx";
DROP INDEX IF EXISTS "Streak_userId_key";
DROP INDEX IF EXISTS "Streak_userId_idx";

-- Drop all tables
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
