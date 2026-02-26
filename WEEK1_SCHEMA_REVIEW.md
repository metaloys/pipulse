# 🎯 Week 1 - Prisma Schema Review

**Status:** ✅ Complete - Awaiting Your Approval  
**Date:** February 23, 2026  
**Deliverable:** `prisma/schema.prisma` - Ready for migration  

---

## 📋 What's Complete

### ✅ All Development Setup Done
- Branch created: `hybrid-rebuild` 
- Prisma installed: `@prisma/client` + `prisma` CLI
- Prisma initialized: `npx prisma init`
- Schema file created: `prisma/schema.prisma` (650+ lines)

### ✅ Complete Schema Design
15 database models with proper relationships, enums, indexes, and constraints:

**Core Models (4):**
- `User` - Pi Network authenticated users with role switching
- `Task` - Job postings from employers  
- `Submission` - Worker work submissions
- `Transaction` - Payment records and money flow

**Supporting Models (11):**
- `TaskVersion` - Audit trail of task edits
- `SlotLock` - Prevent double-acceptance of tasks
- `FailedCompletion` - Payment recovery system
- `Dispute` - Unfair rejection appeals
- `Notification` - User alerts and messages
- `AuditLog` - Admin action tracking
- `PlatformSettings` - System configuration
- `Streak` - Gamification system

---

## 📊 Schema Details by Category

### 1. USER MANAGEMENT

```prisma
model User {
  - piUsername (unique) - Pi Network username
  - piWallet (unique) - Pi Network wallet address
  - userRole - WORKER | EMPLOYER | ADMIN
  - level - NEWCOMER | ESTABLISHED | ADVANCED | ELITE_PIONEER
  - currentStreak, longestStreak - for gamification
  - totalEarnings - Decimal(15,8) - precise Pi amounts
  - totalTasksCompleted - for level calculation
  - status - ACTIVE | BANNED | SUSPENDED (soft moderation)
  - deletedAt - soft delete support
  - timestamps: createdAt, updatedAt
  
  Relationships:
  - tasks (employer created)
  - submissions (worker created)
  - sentTransactions, receivedTransactions (payments)
  - disputes, auditLogs (activity tracking)
  - streak (1-to-1)
  
  Indexes: userRole, status, piUsername
}
```

**Key Features:**
- ✅ Enum-based roles (not TEXT with CHECK)
- ✅ Decimal(15,8) for precise π amounts
- ✅ Soft deletes (deletedAt field)
- ✅ Status-based moderation (ban/suspend)

---

### 2. TASK MANAGEMENT

```prisma
model Task {
  - title, description, instructions - Full task details
  - category - APP_TESTING | SURVEY | TRANSLATION | etc.
  - proofType - TEXT | PHOTO | AUDIO | FILE
  - piReward - Decimal(15,8) - task payment
  - timeEstimate - minutes required
  - deadline - task expiry
  - slotsAvailable, slotsRemaining - inventory
  - taskStatus - AVAILABLE | IN_PROGRESS | COMPLETED | CANCELLED
  - employerId - foreign key to User
  - isFeatured, featuredUntil - promotion
  - deletedAt - soft delete
  - timestamps: createdAt, updatedAt
  
  Relationships:
  - employer (many-to-one with User)
  - submissions (one-to-many)
  - versions (one-to-many, audit trail)
  - slots (one-to-many, slot locks)
  - transactions, disputes
  
  Indexes: employerId, taskStatus, category, deadline, deletedAt
}

model TaskVersion {
  - tracks all changes to task
  - stores: title, description, instructions, piReward, slotsAvailable, deadline
  - changedBy: user ID who made change
  - createdAt: timestamp of change
}
```

**Key Features:**
- ✅ Enum-based statuses and categories (not strings)
- ✅ TaskVersion for complete edit history
- ✅ Soft deletes for recovery
- ✅ Indexes on frequently queried fields

---

### 3. SUBMISSION & WORKFLOW

```prisma
model Submission {
  - taskId, workerId - foreign keys
  - proofContent - Text field for proof (text, audio transcript, etc.)
  - submissionType - ProofType enum
  - status - SUBMITTED | REVISION_REQUESTED | REVISION_RESUBMITTED | APPROVED | REJECTED | DISPUTED
  - agreedReward - Decimal(15,8) - LOCKED PRICE at acceptance (immutable)
  - rejectionReason - why employer rejected
  - revisionNumber - how many revision cycles
  - revisionReason, revisionRequestedAt - iteration details
  - adminNotes - internal notes
  - submittedAt, reviewedAt - timestamps
  - autoApproved - Boolean (48-hour auto-approval flag)
  - deletedAt - soft delete
  - timestamps: createdAt, updatedAt
  
  Relationships:
  - task, worker (foreign keys)
  - dispute (1-to-1, optional)
  - transaction (1-to-1, optional)
  
  Unique Constraints:
  - (taskId, workerId) - one submission per worker per task
  
  Indexes: taskId, workerId, status, deletedAt
}

model SlotLock {
  - taskId, workerId - composite unique
  - lockedAt - when lock created
  - expiresAt - locked_at + 2 hours
  
  Purpose: Prevent double-acceptance during acceptance window
  
  Indexes: (taskId, workerId), expiresAt
}
```

**Key Features:**
- ✅ `agreedReward` locks price at acceptance (price protection)
- ✅ SlotLock prevents concurrent acceptance
- ✅ Revision cycle tracking
- ✅ Auto-approval flag for 48-hour auto-approve job
- ✅ Unique constraint prevents duplicate submissions

---

### 4. PAYMENT & TRANSACTIONS

```prisma
model Transaction {
  - senderId, receiverId - nullable (allows null for system payments)
  - sender, receiver - User relationships
  - amount - Decimal(15,8) - payment amount
  - pipulseFee - Decimal(15,8) - commission taken
  - taskId, submissionId - links to task/work
  - type - PAYMENT | REFUND | FEE | BONUS
  - status - PENDING | COMPLETED | FAILED
  - piBlockchainTxId - Pi Network transaction ID
  - failedAt - timestamp if payment failed
  - timestamp, timestamps - full audit trail
  
  Unique Constraint:
  - submissionId is unique (1 transaction per submission)
  
  Indexes: senderId, receiverId, taskId, submissionId, status, type
}

model FailedCompletion {
  - submissionId, workerId - links to work
  - amount - Decimal(15,8) - amount failed to send
  - error - error message
  - attempts - retry count
  - nextRetry - when to retry
  - resolvedAt, resolution - manual resolution
  
  Purpose: Track and recover failed payments
  
  Indexes: submissionId, nextRetry
}
```

**Key Features:**
- ✅ Decimal(15,8) for precise amounts
- ✅ Separate pipulseFee tracking (commission)
- ✅ FailedCompletion table for recovery
- ✅ Status tracking for payment lifecycle
- ✅ Retry scheduling for failed payments

---

### 5. DISPUTES & APPEALS

```prisma
model Dispute {
  - submissionId - unique (1 dispute per submission)
  - taskId, workerId - dispute details
  - reason - worker's dispute statement
  - evidence - supporting evidence/links
  - status - PENDING | RESOLVED
  - ruling - IN_FAVOR_OF_WORKER | IN_FAVOR_OF_EMPLOYER
  - adminNotes - resolution notes
  - resolvedAt - when resolved
  - timestamps: createdAt, updatedAt
  
  Relationships:
  - submission, task, worker (foreign keys)
  
  Indexes: status, taskId, workerId
}
```

**Key Features:**
- ✅ Unique submissionId (one appeal per submission)
- ✅ Clear ruling enum (not strings)
- ✅ Full audit trail

---

### 6. NOTIFICATIONS & SYSTEM

```prisma
model Notification {
  - userId - who receives
  - title, body - message content
  - actionUrl - link if applicable
  - type - SUBMISSION_SUBMITTED | SUBMISSION_REJECTED | REVISION_REQUESTED | etc.
  - read - delivery status
  - deletedAt - soft delete
  - createdAt - timestamp
  
  Purpose: Event-driven notifications
  
  Indexes: userId, read, createdAt
}

model AuditLog {
  - action - "BAN_USER", "APPROVE_SUBMISSION", "RESOLVE_DISPUTE", etc.
  - userId - who did the action
  - targetId - what was acted upon
  - targetType - "user", "submission", "dispute"
  - details - Json additional context
  - ipAddress - for security
  - createdAt - timestamp
  
  Purpose: Track all admin actions
  
  Indexes: userId, action, targetId, createdAt
}

model PlatformSettings {
  - commissionRate - Decimal(5,2) - 0-100% (default 15%)
  - maintenanceMode - Boolean
  - maxTaskDeadlineDays - configuration
  - slotLockMinutes - acceptance window (default 120 = 2 hours)
  - autoApprovalHours - auto-approve window (default 48)
  - maxRevisionAttempts - limit on revisions
  - timestamps: createdAt, updatedAt
  
  Purpose: Central configuration
}

model Streak {
  - userId - unique (1 streak per user)
  - currentStreak, longestStreak - counters
  - lastActiveDate - when last active
  - streakBonusEarned - flag
  - timestamps: createdAt, updatedAt
}
```

**Key Features:**
- ✅ Notification type enum (not strings)
- ✅ AuditLog with JSON details
- ✅ PlatformSettings for admin control
- ✅ Streak table for gamification

---

## 🔍 Schema Design Highlights

### ✅ Type Safety
- Uses **Prisma enums** not TEXT with CHECK constraints
- Examples: `UserRole`, `TaskStatus`, `SubmissionStatus`, `TransactionType`, `DisputeRuling`
- Prevents invalid values at database level

### ✅ Immutability Where Needed
- `agreedReward` locked at submission acceptance
- Price can't be changed retroactively
- Protects worker from price reductions

### ✅ Soft Deletes
- `deletedAt` field on: User, Task, Submission, Notification
- Never hard delete - recovery possible
- Where clause can filter out deleted items

### ✅ Audit Trail
- `TaskVersion` tracks all task edits
- `AuditLog` tracks all admin actions
- Full history preserved for compliance

### ✅ Payment Recovery
- `FailedCompletion` table tracks failed payments
- Retry scheduling with `nextRetry`
- Manual resolution by admin

### ✅ Slot Locking
- `SlotLock` prevents double-acceptance
- 2-hour window (configurable in `PlatformSettings`)
- Expires automatically

### ✅ Referential Integrity
- Foreign keys with ON DELETE CASCADE where appropriate
- ON DELETE SET NULL for optional relationships
- Maintains data consistency

### ✅ Performance Indexes
- Indexes on frequently queried fields:
  - User: userRole, status, piUsername
  - Task: employerId, taskStatus, category, deadline
  - Submission: taskId, workerId, status
  - Transaction: senderId, receiverId, status
  - AuditLog: userId, action, targetId

### ✅ Precision Decimal Fields
- All π amounts: `Decimal(15,8)` for 8 decimal precision
- Commission rate: `Decimal(5,2)` for percentage
- Prevents rounding errors

---

## 🔄 Relationship Map

```
User (PI Network identity)
├── tasks (as employer)
├── submissions (as worker)
├── sentTransactions (as payer)
├── receivedTransactions (as receiver)
├── disputes (as claimant)
├── auditLogs (as actor)
└── streak (1-to-1)

Task (job posting)
├── employer (User)
├── submissions (Submission[])
├── versions (TaskVersion[])
├── slots (SlotLock[])
├── transactions (Transaction[])
└── disputes (Dispute[])

Submission (work completed)
├── task (Task)
├── worker (User)
├── dispute (Dispute?)
└── transaction (Transaction?)

Transaction (payment)
├── sender (User?)
├── receiver (User?)
├── task (Task?)
├── submission (Submission?)
└── FailedCompletion tracking

Dispute (appeal)
├── submission (Submission)
├── task (Task)
└── worker (User)
```

---

## 📋 Migration Ready

This schema is **ready to migrate** to your PostgreSQL database:

```bash
# After approval, run:
npx prisma migrate dev --name init_schema

# This will:
# 1. Create migration file in prisma/migrations/
# 2. Apply schema to development database
# 3. Generate Prisma Client types
```

---

## ❓ Questions to Ask Before Approval

Before we proceed with migration, please verify:

1. **Decimal Precision:** Are 8 decimal places enough for π amounts? (max $99,999,999.99999999)

2. **Commission Rate:** Should commission rate support decimals? (e.g., 15.5%) 
   - Current: `Decimal(5,2)` allows 0-999.99%
   - Adjust if needed

3. **Auto-Approval Window:** Is 48 hours correct for auto-approval?
   - Current: `autoApprovalHours = 48` in PlatformSettings
   - Configurable at runtime

4. **Slot Lock Duration:** Is 2 hours the right acceptance window?
   - Current: `slotLockMinutes = 120` in PlatformSettings
   - Configurable at runtime

5. **Max Revisions:** Is 3 the right limit?
   - Current: `maxRevisionAttempts = 3` in PlatformSettings
   - Configurable at runtime

6. **Task Categories:** Are all 7 categories sufficient?
   - APP_TESTING, SURVEY, TRANSLATION, AUDIO_RECORDING, PHOTO_CAPTURE, CONTENT_REVIEW, DATA_LABELING
   - Add or remove?

7. **Proof Types:** Do you need other proof types?
   - TEXT, PHOTO, AUDIO, FILE
   - Any others?

---

## 🚀 Next Steps

### Once You Approve:

1. **Wednesday Morning:**
   ```bash
   npx prisma migrate dev --name init_schema
   ```
   - Creates migration file
   - Applies to database
   - Generates types

2. **Wednesday-Friday:**
   - Install additional libraries (Zod for validation, tRPC, etc.)
   - Begin Week 2 work Monday

3. **Friday End-of-Day:**
   - Commit schema migration
   - Push to GitHub
   - Schema complete for Week 2 auth rewrite

---

## ✅ APPROVAL CHECKLIST

Please confirm:

- [ ] Schema tables look complete (15 models)
- [ ] Relationships make sense
- [ ] Enums cover all cases
- [ ] Soft deletes where expected
- [ ] Audit trails sufficient
- [ ] Payment recovery system adequate
- [ ] Decimal precision acceptable
- [ ] Indexes reasonable
- [ ] Ready to migrate

---

**Once approved, we migrate immediately and begin Week 2! 🚀**

