# 🏗️ Prisma Schema Architecture - Visual Overview

## Database Entity Relationship Diagram (Simplified)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PIPULSE MARKETPLACE V2                          │
│                      (Hybrid Rebuild - Week 1)                          │
└─────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────┐
                              │     USER     │
                              │ (Pi Network) │
                              └──────────────┘
                                    │
                      ┌─────────────┼─────────────┐
                      │             │             │
                      ▼             ▼             ▼
                  ┌────────┐   ┌──────────┐   ┌──────────┐
                  │ TASKS  │   │SUBMISSIONS│  │DISPUTES  │
                  │(create)│   │(submit)   │  │(appeal)  │
                  └────────┘   └──────────┘   └──────────┘
                      │             │
                      ▼             ▼
            ┌──────────────────────────────────┐
            │      TRANSACTIONS                │
            │   (π payments tracked)           │
            │   (with commission split)        │
            └──────────────────────────────────┘
                      │
                      ▼
        ┌──────────────────────────────┐
        │   FAILED_COMPLETIONS         │
        │   (retry queue if failed)    │
        └──────────────────────────────┘

                    SUPPORTING TABLES
            ┌────────────────────────────────┐
            │ TaskVersion (audit trail)      │
            │ SlotLock (prevent conflicts)   │
            │ Notification (events)          │
            │ AuditLog (admin tracking)      │
            │ PlatformSettings (config)      │
            │ Streak (gamification)          │
            └────────────────────────────────┘
```

---

## User Role Flows

### WORKER FLOW
```
Pi User Auth → Create User (WORKER role)
    ↓
Browse Tasks (filtered by category)
    ↓
Accept Task (creates SlotLock for 2 hours)
    ↓
Submit Proof (creates Submission with agreedReward locked)
    ↓
Await Review (status: SUBMITTED)
    ↓
[48h Auto-Approval] OR [Employer Reviews]
    ├→ APPROVED → Create Transaction (payment) → Notify Worker
    ├→ REJECTED → Create Notification → Can dispute
    └→ REVISION_REQUESTED → Resubmit → Repeat review
```

### EMPLOYER FLOW
```
Pi User Auth → Create User (WORKER role)
    ↓
Switch to Employer (update userRole to EMPLOYER)
    ↓
Create Task (posting job)
    ↓
View Submissions (workers who submitted)
    ↓
Review Submission (see proof)
    ↓
[Approve] → Trigger Payment → Worker gets π
[Reject] → Notify Worker (can appeal)
[Request Revision] → Worker resubmits
```

### ADMIN FLOW
```
Pi User Auth (if piUsername in admin list)
    ↓
Dashboard → Analytics, Users, Tasks, Submissions, Disputes
    ↓
[Ban User] → Create AuditLog
[Approve Submission] → Create AuditLog, trigger payment
[Resolve Dispute] → Create AuditLog, decide who gets paid
[Force Approve] → Create AuditLog, override workflow
[Change Commission Rate] → Update PlatformSettings, Create AuditLog
```

---

## Data Models Explained

### 1️⃣ USER MODEL (Authentication & Identity)
```prisma
User {
  id: String (cuid - unique ID)
  piUsername: String (unique - Pi Network username)
  piWallet: String? (unique - Pi Network wallet)
  
  userRole: "WORKER" | "EMPLOYER" | "ADMIN"  [changeable - role switching]
  
  level: "NEWCOMER" | "ESTABLISHED" | "ADVANCED" | "ELITE_PIONEER"
  totalTasksCompleted: Int
  totalEarnings: Decimal(15,8)  [precise π amounts]
  
  status: "ACTIVE" | "BANNED" | "SUSPENDED"
  
  Timestamps: createdAt, updatedAt, deletedAt
}

✓ Why Decimal(15,8)? Supports up to $99,999,999.99999999 with 8 decimal precision
✓ Why deletedAt? Soft delete - never lose user data
✓ Why level? Gamification - shows user experience
✓ Why status? Moderation - can ban/suspend users
```

### 2️⃣ TASK MODEL (Job Postings)
```prisma
Task {
  id: String
  title, description, instructions: String
  
  category: "APP_TESTING" | "SURVEY" | ...  [enum - no invalid values]
  proofType: "TEXT" | "PHOTO" | "AUDIO" | "FILE"
  
  piReward: Decimal(15,8)  [what worker gets]
  timeEstimate: Int  [minutes]
  deadline: DateTime
  
  slotsAvailable: Int  [how many workers can do it]
  slotsRemaining: Int  [updates as workers accept]
  
  taskStatus: "AVAILABLE" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
  
  employerId: String (references User)
  
  isFeatured: Boolean
  deletedAt: DateTime?  [soft delete]
  
  Relationships:
    - employer (User who posted)
    - submissions (all Submission records for this task)
    - versions (edit history)
    - slots (SlotLock records)
}

✓ Why slotsRemaining? Track available spots - decrement on acceptance
✓ Why taskStatus enum? Prevents invalid states
✓ Why versions? Complete edit history for audits
```

### 3️⃣ SLOT LOCK MODEL (Prevent Double-Acceptance)
```prisma
SlotLock {
  id: String
  
  taskId: String (references Task)
  workerId: String (references User)
  
  lockedAt: DateTime (when worker clicked "Accept")
  expiresAt: DateTime (lockedAt + 2 hours)
}

RULES:
- When worker accepts task → create SlotLock
- No other worker can accept same task while SlotLock exists
- When worker submits → delete SlotLock (converts to Submission)
- When 2h expires → auto-delete SlotLock (cron job)
- Unique constraint: only 1 lock per (taskId, workerId)

✓ Why? Prevents: Worker1 accepts 10:00am, Worker2 also accepts 10:01am (both same task)
✓ 2-hour window? User has 2 hours to complete work before slot released to others
```

### 4️⃣ SUBMISSION MODEL (Work Completed)
```prisma
Submission {
  id: String
  
  taskId: String (which task)
  workerId: String (who did it)
  
  proofContent: String (text, audio transcript, file URL)
  submissionType: ProofType (what type of proof)
  
  status: "SUBMITTED" | "REVISION_REQUESTED" | "REVISION_RESUBMITTED" 
          | "APPROVED" | "REJECTED" | "DISPUTED"
  
  agreedReward: Decimal(15,8)  ⭐ LOCKED at acceptance (IMMUTABLE)
  
  rejectionReason: String?
  revisionNumber: Int (how many times revised)
  revisionReason: String?
  revisionRequestedAt: DateTime?
  
  submittedAt: DateTime
  reviewedAt: DateTime?
  autoApproved: Boolean (was it auto-approved after 48h?)
  
  adminNotes: String? (internal notes)
}

Unique: (taskId, workerId) - one submission per worker per task

✓ Why agreedReward? Locks price at acceptance - worker protected from price cuts
✓ Why revisionNumber? Track iteration cycles - limit to 3 attempts
✓ Why autoApproved flag? Track which payments were auto-processed
✓ Why softDelete? (deletedAt field) Recover if needed
```

### 5️⃣ TRANSACTION MODEL (Payment Tracking)
```prisma
Transaction {
  id: String
  
  senderId: String?  (employer or system - nullable)
  receiverId: String?  (worker - nullable)
  
  amount: Decimal(15,8)  (what was paid)
  pipulseFee: Decimal(15,8)  (commission taken)
  
  taskId: String?  (which task)
  submissionId: String (UNIQUE - one transaction per submission)
  
  type: "PAYMENT" | "REFUND" | "FEE" | "BONUS"
  status: "PENDING" | "COMPLETED" | "FAILED"
  
  piBlockchainTxId: String?  (Pi Network blockchain TX ID)
  failedAt: DateTime?
  
  timestamp: DateTime  (when attempted)
}

✓ Why separate pipulseFee? Shows commission breakdown - transparency
✓ Why failedAt? Track when payment failed - for debugging
✓ Why piBlockchainTxId? Verify payment went through
✓ Why UNIQUE on submissionId? No duplicate payments for same work
```

### 6️⃣ FAILED COMPLETION MODEL (Payment Recovery)
```prisma
FailedCompletion {
  id: String
  
  submissionId: String  (which submission failed)
  workerId: String  (who should get paid)
  amount: Decimal(15,8)  (how much failed)
  
  error: String  (why it failed)
  attempts: Int  (how many times tried)
  nextRetry: DateTime?  (when to try again)
  
  resolvedAt: DateTime?  (when manually resolved)
  resolution: String?  (what was done - "manual_approval", "refund", etc)
}

WORKFLOW:
1. Payment fails → Create FailedCompletion record
2. Schedule retry 1 hour later
3. Retry fails again → Increment attempts
4. After 3 failures → Notify admin
5. Admin can: Retry, Manual Approve, or Refund

✓ Why this table? Never lose track of failed payments
✓ Why retry scheduling? Automatic recovery attempt
✓ Why admin notification? Human oversight on persistent failures
```

### 7️⃣ TASK VERSION MODEL (Audit Trail)
```prisma
TaskVersion {
  id: String
  taskId: String  (which task)
  
  title, description, instructions, piReward: ?String
  slotsAvailable: ?Int
  deadline: ?DateTime
  
  changedBy: String  (user ID who made change)
  createdAt: DateTime  (when changed)
}

TRIGGER:
- Every time employer edits task → create new TaskVersion
- Full history preserved
- Can track: "Price was $5, changed to $10, then back to $5"

✓ Why? Compliance, debugging, dispute resolution
```

### 8️⃣ DISPUTE MODEL (Appeals System)
```prisma
Dispute {
  id: String
  
  submissionId: String (UNIQUE - one appeal per submission)
  taskId: String  (which task)
  workerId: String  (who's appealing)
  
  reason: String  (why worker thinks rejection was unfair)
  evidence: String?  (supporting links/proof)
  
  status: "PENDING" | "RESOLVED"
  ruling: "IN_FAVOR_OF_WORKER" | "IN_FAVOR_OF_EMPLOYER" | null
  
  adminNotes: String?  (why admin ruled that way)
  resolvedAt: DateTime?
}

OUTCOME:
- IN_FAVOR_OF_WORKER → Process payment for agreed_reward, notify both
- IN_FAVOR_OF_EMPLOYER → Reject stands, notify worker
- NOT_RESOLVED → Admin hasn't decided yet

✓ Why? Fair appeals process - worker can challenge unfair rejection
```

---

## Key Design Patterns

### 🔐 PRICE PROTECTION (agreedReward)
```
1. Worker accepts task @ $10 reward
2. Submission created with agreedReward = $10 (stored)
3. Employer changes task reward to $5
4. Worker gets paid $10 (from agreedReward, not current $5)
5. Worker protected from bait-and-switch

✓ Immutable once set
✓ Locked at acceptance time
✓ Fair to workers
```

### 🔄 SLOT LOCKING (2-hour window)
```
10:00 AM - Worker A accepts task → SlotLock created (expires 12:00 PM)
10:01 AM - Worker B clicks "Accept" → DENIED (slot locked)
11:59 AM - Worker A submits → SlotLock deleted, Submission created
12:00 PM - SlotLock auto-deleted (if not submitted) → slot available again
12:01 PM - Worker B can now accept

✓ Prevents race conditions
✓ Fair acceptance window
✓ Auto-cleanup
```

### 🤖 AUTO-APPROVAL (48-hour workflow)
```
Monday 10:00 AM - Worker submits
Monday 10:00 AM - Notification sent to employer
Tuesday 10:00 AM - (24 hours later) Still pending...
Wednesday 10:00 AM - (48 hours later) AUTO-APPROVE
  ├→ Status changed to APPROVED
  ├→ Transaction created, payment sent
  ├→ Notification to worker
  └→ AuditLog: "auto_approve_48h"

✓ Workers never left hanging
✓ Employer has 48 hours to review
✓ Reduces disputes from slow reviews
```

### 💰 PAYMENT RECOVERY (FailedCompletion)
```
Payment attempt fails → Create FailedCompletion
  ├→ After 1 hour: Retry #1
  ├→ Still fails? Create notification to admin
  ├→ After 2 hours: Retry #2
  ├→ Still fails? Admin intervention needed
  ├→ Admin chooses:
  │  ├→ Retry
  │  ├→ Manual Approve (force payment)
  │  └→ Refund (give up, return π to employer)
  └→ Record resolution in FailedCompletion.resolution

✓ No lost payments
✓ Automatic retries
✓ Admin fallback
```

---

## Performance Indexes

```prisma
User:           [userRole] [status] [piUsername]
Task:           [employerId] [taskStatus] [category] [deadline] [deletedAt]
Submission:     [taskId] [workerId] [status] [deletedAt]
Transaction:    [senderId] [receiverId] [taskId] [submissionId] [status]
SlotLock:       [(taskId, workerId)] [expiresAt]
AuditLog:       [userId] [action] [targetId] [createdAt]
Notification:   [userId] [read] [createdAt]
```

✓ Optimized for common queries:
  - "Get all my tasks" (employerId)
  - "Get available tasks" (taskStatus = AVAILABLE)
  - "Get my submissions" (workerId, taskId)
  - "Get payments sent/received" (senderId, receiverId)
  - "Get audit trail" (userId, action)

---

## Summary

**15 Models:**
- 4 core (User, Task, Submission, Transaction)
- 4 workflow (SlotLock, TaskVersion, Dispute, FailedCompletion)
- 3 system (Notification, AuditLog, PlatformSettings)
- 1 gamification (Streak)
- Plus 9 ENUMs for type safety

**Key Strengths:**
- ✅ Type-safe enums (not strings)
- ✅ Price protection (agreedReward)
- ✅ Slot locking (prevent conflicts)
- ✅ Payment recovery (FailedCompletion)
- ✅ Audit trails (TaskVersion, AuditLog)
- ✅ Soft deletes (never lose data)
- ✅ Performance indexes (fast queries)
- ✅ Decimal precision (exact π amounts)

**Ready to Migrate:** YES ✅

