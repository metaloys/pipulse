-- Prisma Migration: Nuke and rebuild - Complete schema reset
-- Drop all tables and indexes forcefully

BEGIN;

-- Disable foreign key constraints temporarily
SET session_replication_role = replica;

-- Drop ALL tables in public schema ruthlessly
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

-- CreateTable User
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "piUid" TEXT NOT NULL UNIQUE,
    "piUsername" TEXT NOT NULL UNIQUE,
    "piWallet" TEXT UNIQUE,
    "userRole" TEXT NOT NULL DEFAULT 'WORKER',
    "level" TEXT NOT NULL DEFAULT 'NEWCOMER',
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActiveDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalEarnings" DECIMAL NOT NULL DEFAULT 0,
    "totalTasksCompleted" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP
);

-- CreateTable Task
CREATE TABLE "Task" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "proofType" TEXT NOT NULL,
    "piReward" DECIMAL NOT NULL,
    "timeEstimate" INTEGER NOT NULL,
    "deadline" TIMESTAMP NOT NULL,
    "slotsAvailable" INTEGER NOT NULL,
    "slotsRemaining" INTEGER NOT NULL,
    "taskStatus" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "employerId" TEXT NOT NULL,
    "parentTaskId" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "featuredUntil" TIMESTAMP,
    "deletedAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Task_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Task_parentTaskId_fkey" FOREIGN KEY ("parentTaskId") REFERENCES "Task" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable Submission
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "taskId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "proofContent" TEXT NOT NULL,
    "submissionType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "agreedReward" DECIMAL NOT NULL,
    "rejectionReason" TEXT,
    "revisionNumber" INTEGER NOT NULL DEFAULT 0,
    "revisionReason" TEXT,
    "revisionRequestedAt" TIMESTAMP,
    "resubmittedAt" TIMESTAMP,
    "adminNotes" TEXT,
    "acceptedAt" TIMESTAMP,
    "submittedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP,
    "autoApproved" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Submission_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Submission_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable Transaction
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "senderId" TEXT,
    "receiverId" TEXT,
    "amount" DECIMAL NOT NULL,
    "pipulseFee" DECIMAL NOT NULL,
    "taskId" TEXT,
    "submissionId" TEXT UNIQUE,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "piBlockchainTxId" TEXT,
    "failedAt" TIMESTAMP,
    "timestamp" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transaction_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transaction_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transaction_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transaction_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable Dispute
CREATE TABLE "Dispute" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "submissionId" TEXT NOT NULL UNIQUE,
    "taskId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "evidence" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "ruling" TEXT,
    "adminNotes" TEXT,
    "resolvedAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Dispute_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Dispute_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Dispute_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable Notification
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "actionUrl" TEXT,
    "type" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable Streak
CREATE TABLE "Streak" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL UNIQUE,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActiveDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "streakBonusEarned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Streak_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex (with IF NOT EXISTS to handle orphaned indexes)
CREATE UNIQUE INDEX IF NOT EXISTS "User_piUid_key" ON "User"("piUid");
CREATE UNIQUE INDEX IF NOT EXISTS "User_piUsername_key" ON "User"("piUsername");
CREATE UNIQUE INDEX IF NOT EXISTS "User_piWallet_key" ON "User"("piWallet");
CREATE INDEX IF NOT EXISTS "User_userRole_idx" ON "User"("userRole");
CREATE INDEX IF NOT EXISTS "User_status_idx" ON "User"("status");
CREATE INDEX IF NOT EXISTS "User_piUsername_idx" ON "User"("piUsername");

CREATE INDEX IF NOT EXISTS "Task_employerId_idx" ON "Task"("employerId");
CREATE INDEX IF NOT EXISTS "Task_taskStatus_idx" ON "Task"("taskStatus");
CREATE INDEX IF NOT EXISTS "Task_category_idx" ON "Task"("category");
CREATE INDEX IF NOT EXISTS "Task_deadline_idx" ON "Task"("deadline");
CREATE INDEX IF NOT EXISTS "Task_deletedAt_idx" ON "Task"("deletedAt");

CREATE INDEX IF NOT EXISTS "Submission_taskId_idx" ON "Submission"("taskId");
CREATE INDEX IF NOT EXISTS "Submission_workerId_idx" ON "Submission"("workerId");
CREATE INDEX IF NOT EXISTS "Submission_status_idx" ON "Submission"("status");
CREATE INDEX IF NOT EXISTS "Submission_deletedAt_idx" ON "Submission"("deletedAt");
CREATE UNIQUE INDEX IF NOT EXISTS "Submission_taskId_workerId_key" ON "Submission"("taskId", "workerId");

CREATE INDEX IF NOT EXISTS "Transaction_senderId_idx" ON "Transaction"("senderId");
CREATE INDEX IF NOT EXISTS "Transaction_receiverId_idx" ON "Transaction"("receiverId");
CREATE INDEX IF NOT EXISTS "Transaction_taskId_idx" ON "Transaction"("taskId");
CREATE INDEX IF NOT EXISTS "Transaction_submissionId_idx" ON "Transaction"("submissionId");
CREATE INDEX IF NOT EXISTS "Transaction_status_idx" ON "Transaction"("status");
CREATE INDEX IF NOT EXISTS "Transaction_type_idx" ON "Transaction"("type");

CREATE UNIQUE INDEX IF NOT EXISTS "Dispute_submissionId_key" ON "Dispute"("submissionId");
CREATE INDEX IF NOT EXISTS "Dispute_status_idx" ON "Dispute"("status");
CREATE INDEX IF NOT EXISTS "Dispute_taskId_idx" ON "Dispute"("taskId");
CREATE INDEX IF NOT EXISTS "Dispute_workerId_idx" ON "Dispute"("workerId");

CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS "Notification_read_idx" ON "Notification"("read");
CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx" ON "Notification"("createdAt");

CREATE UNIQUE INDEX IF NOT EXISTS "Streak_userId_key" ON "Streak"("userId");
CREATE INDEX IF NOT EXISTS "Streak_userId_idx" ON "Streak"("userId");

-- DISABLE RLS (allows anon key queries)
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Task" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Submission" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Transaction" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Dispute" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Streak" DISABLE ROW LEVEL SECURITY;

-- GRANT SCHEMA USAGE (allows anon role to access tables)
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
