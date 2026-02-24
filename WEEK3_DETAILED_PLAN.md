# 🚀 WEEK 3 IMPLEMENTATION PLAN - Detailed Breakdown

**Date:** February 24, 2026  
**Status:** Ready to Execute  
**Prerequisite:** Week 2 Auth System Complete ✅

---

## 📋 WEEK 3 OVERVIEW

Week 3 introduces the payment system and completes the core transaction flow. This includes:
1. Switching database to PostgreSQL (Supabase)
2. Rebuilding payment completion route with Prisma
3. Implementing task submission tracking with price locking
4. Building employer submission review workflow
5. Creating notification system

All endpoints will use tRPC for type-safety, following the pattern established in Week 2.

---

## 🔧 TASK 6: Switch Database to PostgreSQL

### Prerequisite
- Week 2 auth system working and tested
- User can log in and user data exists in SQLite

### Steps

#### Step 1: Get Supabase Session Pooler Connection String
```
1. Go to: https://app.supabase.com/project/{project}/settings/database
2. Find "Connection string" dropdown
3. Select: "Session pooler" (NOT "Direct connection")
4. Copy the entire string
```

**Format:** `postgresql://postgres.{project}:{password}@{host}:5432/{database}`

#### Step 2: Update Environment Variables
```bash
# .env.local

# REMOVE this:
# DATABASE_URL="file:./dev.db"

# ADD this:
DATABASE_URL="postgresql://postgres.xxxxx:password@host.supabase.co:5432/postgres"
```

#### Step 3: Update Prisma Configuration
```prisma
// prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

#### Step 4: Restore @db.Decimal Annotations
```prisma
// Search and replace:
// FROM: totalEarnings Decimal @default(0)
// TO: totalEarnings Decimal @default(0) @db.Decimal(15,8)

// Affected fields:
model User {
  totalEarnings       Decimal         @default(0) @db.Decimal(15,8)
}

model Task {
  piReward           Decimal         @db.Decimal(15,8)
}

model Submission {
  agreedReward       Decimal         @db.Decimal(15,8)
}

model Transaction {
  amount             Decimal         @db.Decimal(15,8)
  pipulseFee         Decimal         @db.Decimal(5,2)
}
```

#### Step 5: Run Migration
```bash
npx prisma migrate deploy
# This applies all pending migrations to PostgreSQL
```

#### Step 6: Seed Data (Optional)
```bash
# If you have a seed script:
npx prisma db seed
```

#### Step 7: Verify Connection
```bash
# Open Prisma Studio to verify connection
npx prisma studio

# Should show all 15 tables with data
```

#### Step 8: Build and Test
```bash
npm run build
# Should pass with all routes
```

---

## 💳 TASK 7: Rebuild Payment Completion Route

### File to Modify
`app/api/payments/complete/route.ts`

### Purpose
Handle Pi Network payment callback when employer approves a submission.

### Flow
```
Employer clicks "Approve" on submission
    ↓
Calls Pi Payment API (server-side)
    ↓
Pi Network charges employer's wallet
    ↓
Pi sends callback to /api/payments/complete
    ↓
Route processes transaction and updates database
```

### Implementation

**Location:** `app/api/payments/complete/route.ts`

**Handler Structure:**
```typescript
export async function POST(req: Request) {
  // 1. Parse Pi payment callback
  const paymentData = await req.json()
  
  // 2. Validate payment signature (security)
  validatePiSignature(paymentData)
  
  // 3. Query submission by taskId and workerId
  const submission = await prisma.submission.findUnique({
    where: { taskId_workerId: { taskId, workerId } },
    include: { task: true, worker: true }
  })
  
  // 4. Read agreedReward from submission (NEVER use current task piReward)
  const agreedReward = submission.agreedReward
  
  // 5. Calculate fee
  const platformSettings = await prisma.platformSettings.findFirst()
  const commissionRate = platformSettings.commissionRate // e.g., 15
  const fee = agreedReward * (commissionRate / 100)
  const workerReceives = agreedReward - fee
  
  // 6. Create Transaction record
  await prisma.transaction.create({
    data: {
      senderId: submission.task.employerId,
      receiverId: submission.workerId,
      amount: agreedReward,
      pipulseFee: fee,
      type: 'PAYMENT',
      status: 'COMPLETED',
      piBlockchainTxId: paymentData.txid,
    }
  })
  
  // 7. Update submission status
  await prisma.submission.update({
    where: { id: submission.id },
    data: { status: 'APPROVED' }
  })
  
  // 8. Update worker earnings
  await prisma.user.update({
    where: { id: submission.workerId },
    data: {
      totalEarnings: { increment: workerReceives },
      totalTasksCompleted: { increment: 1 }
    }
  })
  
  // 9. Update task slots
  const newSlotsRemaining = submission.task.slotsRemaining - 1
  await prisma.task.update({
    where: { id: submission.taskId },
    data: {
      slotsRemaining: newSlotsRemaining,
      taskStatus: newSlotsRemaining === 0 ? 'COMPLETED' : 'OPEN'
    }
  })
  
  // 10. Delete SlotLock
  await prisma.slotLock.deleteMany({
    where: { workerId: submission.workerId, taskId: submission.taskId }
  })
  
  // 11. Create notification
  await prisma.notification.create({
    data: {
      userId: submission.workerId,
      type: 'PAYMENT_RECEIVED',
      title: 'Payment received',
      body: `You received ${workerReceives.toString()} π for completing [task title]`,
    }
  })
  
  // 12. Return success (ALWAYS return 200 to Pi Network)
  return Response.json({ success: true })
}
```

### Critical Notes
- **ALWAYS return 200** to Pi Network, even on partial failures
- Use `@db.Decimal` fields for Pi amounts (precision: 15,8)
- Lock the agreedReward in Submission record BEFORE payment
- Read commissionRate from PlatformSettings (not hardcoded)
- Create FailedCompletion record if anything fails (for recovery)

---

## 📝 TASK 8: Rebuild Task Submission Route

### File to Modify/Create
`lib/trpc/routers/task.ts` → add `submitProof` endpoint

### Purpose
Worker submits proof of work completion. System locks in the price (agreedReward).

### Implementation

**Input Validation:**
```typescript
submitProof: publicProcedure
  .input(
    z.object({
      taskId: z.string().uuid(),
      workerId: z.string().uuid(),
      proofContent: z.string().min(10).max(10000),
      submissionType: z.enum(['text', 'photo', 'audio', 'file']),
    })
  )
  .mutation(async ({ input }) => {
    // 1. Verify SlotLock exists
    const slotLock = await prisma.slotLock.findUnique({
      where: { workerId_taskId: { workerId: input.workerId, taskId: input.taskId } },
    })
    
    if (!slotLock) {
      throw new Error('Worker must accept task before submitting proof')
    }
    
    // 2. Get current task piReward
    const task = await prisma.task.findUnique({
      where: { id: input.taskId },
    })
    
    // 3. Create Submission with agreedReward LOCKED at submission time
    const submission = await prisma.submission.create({
      data: {
        taskId: input.taskId,
        workerId: input.workerId,
        proofContent: input.proofContent,
        submissionType: input.submissionType,
        status: 'SUBMITTED',
        agreedReward: task.piReward, // LOCK THE PRICE NOW
        acceptedAt: slotLock.lockedAt,
      },
      include: { task: true }
    })
    
    // 4. Create notification for employer
    await prisma.notification.create({
      data: {
        userId: submission.task.employerId,
        type: 'SUBMISSION_RECEIVED',
        title: 'New submission',
        body: `[worker username] submitted proof for [task title]`,
      }
    })
    
    return {
      success: true,
      submission,
    }
  })
```

### Database Changes
- Create `SlotLock` table if not exists (tracks reserved slots)
- Submission must include `acceptedAt` timestamp (when worker accepted)
- `agreedReward` field must exist (stores locked price)

---

## ⭐ TASK 9: Rebuild Submission Review Routes

### File to Modify/Create
`lib/trpc/routers/submission.ts` → add three endpoints

#### Endpoint 9a: Approve Submission
```typescript
approveSubmission: publicProcedure
  .input(z.object({
    submissionId: z.string().uuid(),
    employerId: z.string().uuid(),
  }))
  .mutation(async ({ input }) => {
    // 1. Verify submission exists and employer owns task
    const submission = await prisma.submission.findUnique({
      where: { id: input.submissionId },
      include: { task: true }
    })
    
    if (submission.task.employerId !== input.employerId) {
      throw new Error('Not authorized to approve this submission')
    }
    
    // 2. Initiate Pi payment using agreed reward from submission
    const paymentResult = await initiatePiPayment({
      amount: submission.agreedReward, // Use locked price
      to: submission.worker.piUid,
      txid: generateTxId(),
    })
    
    return { success: true, paymentTxid: paymentResult.txid }
  })
```

#### Endpoint 9b: Reject Submission
```typescript
rejectSubmission: publicProcedure
  .input(z.object({
    submissionId: z.string().uuid(),
    employerId: z.string().uuid(),
    rejectionReason: z.string().min(50).max(5000),
  }))
  .mutation(async ({ input }) => {
    // 1. Verify authorization
    const submission = await prisma.submission.findUnique({
      where: { id: input.submissionId },
      include: { task: true }
    })
    
    if (submission.task.employerId !== input.employerId) {
      throw new Error('Not authorized')
    }
    
    // 2. Update submission
    await prisma.submission.update({
      where: { id: input.submissionId },
      data: {
        status: 'REJECTED',
        rejectionReason: input.rejectionReason,
      }
    })
    
    // 3. Notify worker
    await prisma.notification.create({
      data: {
        userId: submission.workerId,
        type: 'SUBMISSION_REJECTED',
        title: 'Submission rejected',
        body: input.rejectionReason,
      }
    })
    
    return { success: true }
  })
```

#### Endpoint 9c: Request Revision
```typescript
requestRevision: publicProcedure
  .input(z.object({
    submissionId: z.string().uuid(),
    employerId: z.string().uuid(),
    revisionReason: z.string().min(50).max(5000),
  }))
  .mutation(async ({ input }) => {
    // 1. Verify authorization
    const submission = await prisma.submission.findUnique({
      where: { id: input.submissionId },
      include: { task: true }
    })
    
    if (submission.task.employerId !== input.employerId) {
      throw new Error('Not authorized')
    }
    
    // 2. Check if already had one revision
    if (submission.revisionNumber > 0) {
      throw new Error('Only one revision allowed per submission')
    }
    
    // 3. Update submission
    await prisma.submission.update({
      where: { id: input.submissionId },
      data: {
        status: 'REVISION_REQUESTED',
        revisionNumber: 1,
        revisionReason: input.revisionReason,
      }
    })
    
    // 4. Notify worker
    await prisma.notification.create({
      data: {
        userId: submission.workerId,
        type: 'REVISION_REQUESTED',
        title: 'Revision requested',
        body: input.revisionReason,
      }
    })
    
    return { success: true }
  })
```

---

## 🔔 TASK 10: Build Notification System

### File to Create
`lib/trpc/routers/notification.ts`

### Endpoints

#### getNotifications
```typescript
getNotifications: publicProcedure
  .input(z.object({
    userId: z.string().uuid(),
  }))
  .query(async ({ input }) => {
    const notifications = await prisma.notification.findMany({
      where: {
        userId: input.userId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    
    const unreadCount = notifications.filter(n => !n.read).length
    
    return {
      notifications,
      unreadCount,
    }
  })
```

#### markRead
```typescript
markRead: publicProcedure
  .input(z.object({
    notificationIds: z.array(z.string().uuid()),
  }))
  .mutation(async ({ input }) => {
    await prisma.notification.updateMany({
      where: { id: { in: input.notificationIds } },
      data: { read: true, readAt: new Date() },
    })
    
    return { success: true }
  })
```

#### deleteNotification
```typescript
deleteNotification: publicProcedure
  .input(z.object({
    notificationId: z.string().uuid(),
  }))
  .mutation(async ({ input }) => {
    await prisma.notification.update({
      where: { id: input.notificationId },
      data: { deletedAt: new Date() }, // Soft delete
    })
    
    return { success: true }
  })
```

---

## 📊 Database Schema Additions Needed

### Ensure These Tables Exist

#### PlatformSettings
```prisma
model PlatformSettings {
  id                  String    @id @default(cuid())
  commissionRate      Int       @default(15) // 15%
  minTaskReward       Decimal   @db.Decimal(5,2)
  maxTaskReward       Decimal   @db.Decimal(10,2)
  updatedAt           DateTime  @updatedAt
}
```

#### SlotLock
```prisma
model SlotLock {
  id                  String    @id @default(cuid())
  taskId              String
  workerId            String
  lockedAt            DateTime  @default(now())
  expiresAt           DateTime  // Auto-unlock after X hours
  
  task                Task      @relation(fields: [taskId], references: [id])
  worker              User      @relation(fields: [workerId], references: [id])
  
  @@unique([taskId, workerId])
}
```

#### FailedCompletion
```prisma
model FailedCompletion {
  id                  String    @id @default(cuid())
  paymentId           String
  txid                String
  workerId            String
  submissionId        String?
  taskId              String?
  amount              Decimal   @db.Decimal(10,2)
  pipulseFee          Decimal   @db.Decimal(5,2)
  errorMessage        String
  metadata            Json?
  recoveryTimestamp   DateTime  @default(now())
  resolvedAt          DateTime?
  resolvedBy          String?
}
```

---

## 🎯 Week 3 Execution Order

1. **Monday-Tuesday:** PostgreSQL migration + verification
2. **Wednesday:** Payment completion route (Task 7)
3. **Thursday:** Submission routes (Tasks 8-9)
4. **Friday:** Notification system (Task 10) + testing

### Build Verification After Each Task
```bash
npm run build
# Must show: ✓ Compiled successfully, 34+ routes
```

### Testing After Each Task
```bash
npm run dev
# Test endpoint manually via Postman/API client
```

---

## 📌 Critical Success Factors

1. **Use @db.Decimal** for Pi amounts (not float)
2. **Lock agreedReward** in submission (immutable)
3. **Always return 200** to Pi Network (even on errors)
4. **Validate employer ownership** before payment
5. **Use tRPC** for all new endpoints (type-safe)
6. **Create FailedCompletion records** for recovery
7. **Soft delete notifications** (deletedAt, not true delete)

---

## 🔍 Testing Checklist for Week 3

### Task 7 (Payment Completion)
- [ ] Payment callback received
- [ ] Transaction record created
- [ ] Worker earnings updated correctly
- [ ] Submission marked APPROVED
- [ ] Task slots decremented
- [ ] Notification sent to worker
- [ ] Return 200 to Pi Network

### Task 8 (Submission)
- [ ] SlotLock verified
- [ ] agreedReward locked at submission time
- [ ] Notification sent to employer
- [ ] Submission status = SUBMITTED

### Task 9 (Review)
- [ ] Approval initiates payment
- [ ] Rejection saves reason + notifies worker
- [ ] Revision checks revisionNumber limit
- [ ] Revision increments counter + notifies

### Task 10 (Notifications)
- [ ] Get notifications returns sorted list
- [ ] Unread count accurate
- [ ] Mark read updates readAt
- [ ] Delete sets deletedAt

---

## 📞 Quick Reference

| Task | File | Endpoints | Status |
|------|------|-----------|--------|
| 6 | .env.local + schema.prisma | N/A | Configuration |
| 7 | app/api/payments/complete/route.ts | POST /api/payments/complete | API route |
| 8 | lib/trpc/routers/task.ts | submitProof | tRPC |
| 9a | lib/trpc/routers/submission.ts | approveSubmission | tRPC |
| 9b | lib/trpc/routers/submission.ts | rejectSubmission | tRPC |
| 9c | lib/trpc/routers/submission.ts | requestRevision | tRPC |
| 10 | lib/trpc/routers/notification.ts | getNotifications, markRead, delete | tRPC |

---

**Ready to start Week 3 when Week 2 testing is complete!**
