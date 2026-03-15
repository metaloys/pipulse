-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "piUsername" TEXT NOT NULL,
    "piWallet" TEXT,
    "userRole" TEXT NOT NULL DEFAULT 'WORKER',
    "level" TEXT NOT NULL DEFAULT 'NEWCOMER',
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActiveDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalEarnings" DECIMAL NOT NULL DEFAULT 0,
    "totalTasksCompleted" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    "deletedAt" TIMESTAMP
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "views" INTEGER NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "featuredUntil" TIMESTAMP,
    "deletedAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    CONSTRAINT "Task_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TaskVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "instructions" TEXT,
    "piReward" DECIMAL,
    "slotsAvailable" INTEGER,
    "deadline" TIMESTAMP,
    "changedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TaskVersion_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SlotLock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "lockedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP NOT NULL,
    CONSTRAINT "SlotLock_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "updatedAt" TIMESTAMP NOT NULL,
    CONSTRAINT "Submission_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Submission_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senderId" TEXT,
    "receiverId" TEXT,
    "amount" DECIMAL NOT NULL,
    "pipulseFee" DECIMAL NOT NULL,
    "taskId" TEXT,
    "submissionId" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "piBlockchainTxId" TEXT,
    "failedAt" TIMESTAMP,
    "timestamp" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    CONSTRAINT "Transaction_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transaction_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transaction_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transaction_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FailedCompletion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "submissionId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "error" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "nextRetry" TIMESTAMP,
    "resolvedAt" TIMESTAMP,
    "resolution" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL
);

-- CreateTable
CREATE TABLE "Dispute" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "submissionId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "evidence" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "ruling" TEXT,
    "adminNotes" TEXT,
    "resolvedAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    CONSTRAINT "Dispute_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Dispute_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Dispute_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "actionUrl" TEXT,
    "type" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "userId" TEXT,
    "targetId" TEXT,
    "targetType" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlatformSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "commissionRate" DECIMAL NOT NULL DEFAULT 15,
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "maxTaskDeadlineDays" INTEGER NOT NULL DEFAULT 30,
    "minTaskTitle" INTEGER NOT NULL DEFAULT 10,
    "maxTaskTitle" INTEGER NOT NULL DEFAULT 100,
    "slotLockMinutes" INTEGER NOT NULL DEFAULT 120,
    "autoApprovalHours" INTEGER NOT NULL DEFAULT 48,
    "maxRevisionAttempts" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL
);

-- CreateTable
CREATE TABLE "Streak" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActiveDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "streakBonusEarned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    CONSTRAINT "Streak_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_piUsername_key" ON "User"("piUsername");

-- CreateIndex
CREATE UNIQUE INDEX "User_piWallet_key" ON "User"("piWallet");

-- CreateIndex
CREATE INDEX "User_userRole_idx" ON "User"("userRole");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "User_piUsername_idx" ON "User"("piUsername");

-- CreateIndex
CREATE INDEX "Task_employerId_idx" ON "Task"("employerId");

-- CreateIndex
CREATE INDEX "Task_taskStatus_idx" ON "Task"("taskStatus");

-- CreateIndex
CREATE INDEX "Task_category_idx" ON "Task"("category");

-- CreateIndex
CREATE INDEX "Task_deadline_idx" ON "Task"("deadline");

-- CreateIndex
CREATE INDEX "Task_deletedAt_idx" ON "Task"("deletedAt");

-- CreateIndex
CREATE INDEX "TaskVersion_taskId_idx" ON "TaskVersion"("taskId");

-- CreateIndex
CREATE INDEX "TaskVersion_createdAt_idx" ON "TaskVersion"("createdAt");

-- CreateIndex
CREATE INDEX "SlotLock_taskId_workerId_idx" ON "SlotLock"("taskId", "workerId");

-- CreateIndex
CREATE INDEX "SlotLock_expiresAt_idx" ON "SlotLock"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "SlotLock_taskId_workerId_key" ON "SlotLock"("taskId", "workerId");

-- CreateIndex
CREATE INDEX "Submission_taskId_idx" ON "Submission"("taskId");

-- CreateIndex
CREATE INDEX "Submission_workerId_idx" ON "Submission"("workerId");

-- CreateIndex
CREATE INDEX "Submission_status_idx" ON "Submission"("status");

-- CreateIndex
CREATE INDEX "Submission_deletedAt_idx" ON "Submission"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_taskId_workerId_key" ON "Submission"("taskId", "workerId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_submissionId_key" ON "Transaction"("submissionId");

-- CreateIndex
CREATE INDEX "Transaction_senderId_idx" ON "Transaction"("senderId");

-- CreateIndex
CREATE INDEX "Transaction_receiverId_idx" ON "Transaction"("receiverId");

-- CreateIndex
CREATE INDEX "Transaction_taskId_idx" ON "Transaction"("taskId");

-- CreateIndex
CREATE INDEX "Transaction_submissionId_idx" ON "Transaction"("submissionId");

-- CreateIndex
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");

-- CreateIndex
CREATE INDEX "Transaction_type_idx" ON "Transaction"("type");

-- CreateIndex
CREATE INDEX "FailedCompletion_submissionId_idx" ON "FailedCompletion"("submissionId");

-- CreateIndex
CREATE INDEX "FailedCompletion_nextRetry_idx" ON "FailedCompletion"("nextRetry");

-- CreateIndex
CREATE UNIQUE INDEX "Dispute_submissionId_key" ON "Dispute"("submissionId");

-- CreateIndex
CREATE INDEX "Dispute_status_idx" ON "Dispute"("status");

-- CreateIndex
CREATE INDEX "Dispute_taskId_idx" ON "Dispute"("taskId");

-- CreateIndex
CREATE INDEX "Dispute_workerId_idx" ON "Dispute"("workerId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_read_idx" ON "Notification"("read");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_targetId_idx" ON "AuditLog"("targetId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Streak_userId_key" ON "Streak"("userId");

-- CreateIndex
CREATE INDEX "Streak_userId_idx" ON "Streak"("userId");
