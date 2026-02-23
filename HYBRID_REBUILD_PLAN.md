# 🔧 Hybrid Rebuild Implementation Plan

**Start Date:** Monday (Week 1)  
**Target Launch:** Week 6 to Mainnet  
**Approach:** 70% Rebuild, 30% Reuse  
**Success Target:** 80% probability of Mainnet-ready code

---

## 📋 Executive Summary

This plan outlines a 6-week hybrid rebuild of the PiPulse codebase that:
- ✅ Keeps all working UI components (saves 1-2 weeks)
- ✅ Rebuilds fragile payment, database, and API layers
- ✅ Adds comprehensive testing and security
- ✅ Produces Mainnet-ready code
- ✅ Maintains 70% code reuse

---

## Week 1: Foundation & Setup

### Goal: Establish new architecture foundation

### Daily Breakdown

#### Day 1-2: Environment & Dependencies
- [ ] Create new branch: `hybrid-rebuild`
- [ ] Add dependencies:
  ```bash
  npm install @prisma/client
  npm install @trpc/server @trpc/client
  npm install zod
  npm install bull redis
  npm install @nestjs/common (optional, for admin context)
  npm install jest @testing-library/react
  ```
- [ ] Create `.env.local` with Prisma config
- [ ] Initialize Prisma: `npx prisma init`

#### Day 3-4: Database Redesign
- [ ] Create Prisma schema (`prisma/schema.prisma`)
  - Users table with email + 2FA fields
  - Tasks with version history
  - Submissions with proper status enum
  - Transactions with blockchain proof
  - Audit logs table
  - Notifications table with delivery tracking
  - Disputes with evidence tracking

- [ ] Example Prisma schema structure:
  ```prisma
  // prisma/schema.prisma
  
  model User {
    id          String   @id @default(cuid())
    piUsername  String   @unique
    piWallet    String?  @unique // nullable now
    role        UserRole
    // ... other fields
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt
  }
  
  enum UserRole {
    WORKER
    EMPLOYER
    ADMIN
  }
  
  model Task {
    id            String  @id @default(cuid())
    title         String
    status        TaskStatus
    versions      TaskVersion[]
    submissions   Submission[]
    // ... other fields
    createdAt     DateTime @default(now())
    updatedAt     DateTime @updatedAt
  }
  
  enum TaskStatus {
    AVAILABLE
    IN_PROGRESS
    COMPLETED
    CANCELLED
  }
  
  model TaskVersion {
    id          String  @id @default(cuid())
    taskId      String
    task        Task    @relation(fields: [taskId], references: [id])
    title       String?
    reward      Decimal?
    slotsAvail  Int?
    changedBy   String  // userId
    changedAt   DateTime @default(now())
  }
  
  model AuditLog {
    id        String   @id @default(cuid())
    action    String   // "APPROVE_SUBMISSION", "BAN_USER", etc.
    userId    String
    targetId  String?  // submission_id, user_id, etc
    details   Json
    ipAddress String?
    createdAt DateTime @default(now())
  }
  ```

- [ ] Run migrations: `npx prisma migrate dev --name init`

#### Day 5: tRPC Router Setup
- [ ] Create `server/api/trpc.ts`:
  ```typescript
  // server/api/trpc.ts
  import { initTRPC } from '@trpc/server';
  import { ZodError } from 'zod';
  import { prisma } from '@/lib/prisma';
  
  const t = initTRPC.context<typeof createTRPCContext>().create({
    errorFormatter({ shape, error }) {
      return {
        ...shape,
        data: {
          ...shape.data,
          zodError: error.cause instanceof ZodError 
            ? error.cause.flatten() 
            : null,
        },
      };
    },
  });
  
  export const router = t.router;
  export const publicProcedure = t.procedure;
  ```

- [ ] Create `server/api/root.ts` with routers
- [ ] Create `app/api/trpc/[trpc]/route.ts` endpoint

#### Day 6-7: Zod Schema Validation
- [ ] Create `lib/validators/user.ts`:
  ```typescript
  import { z } from 'zod';
  
  export const createUserSchema = z.object({
    piUsername: z.string().min(1),
    piWallet: z.string().nullable(),
    role: z.enum(['WORKER', 'EMPLOYER']),
  });
  
  export type CreateUserInput = z.infer<typeof createUserSchema>;
  ```

- [ ] Create validators for all schemas (tasks, submissions, payments, etc.)
- [ ] Add runtime validation to all API procedures

### Deliverables End of Week 1
- ✅ Prisma schema defined
- ✅ Database migrations ready
- ✅ tRPC router structure
- ✅ Zod validators for core models
- ✅ Type-safe API foundation
- ✅ Build: `npm run build` succeeds

---

## Week 2: Authentication & User Management

### Goal: Rebuild auth system with proper session handling

### Daily Breakdown

#### Day 1-2: Session Management
- [ ] Install session library: `npm install next-auth` (or similar)
- [ ] Create session provider wrapper
- [ ] Implement JWT token generation/validation
- [ ] Add token refresh logic

#### Day 3-4: Auth Procedures
- [ ] Create tRPC procedures:
  ```typescript
  // server/api/routers/auth.ts
  
  export const authRouter = router({
    getPiAuthUrl: publicProcedure
      .query(async () => {
        // Return Pi SDK init URL
      }),
    
    verifyPiAuth: publicProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ input }) => {
        // Verify with Pi Network API
        // Create or update user in DB
        // Return session token
      }),
    
    getCurrentUser: protectedProcedure
      .query(async ({ ctx }) => {
        return await prisma.user.findUnique({
          where: { id: ctx.userId },
        });
      }),
  });
  ```

#### Day 5-6: Migrate Auth Context
- [ ] Update `contexts/pi-auth-context.tsx` to use new session
- [ ] Remove old auth logic
- [ ] Add logout functionality
- [ ] Add session persistence

#### Day 7: Testing
- [ ] Write auth integration tests
- [ ] Test session creation
- [ ] Test session validation
- [ ] Test logout

### Deliverables End of Week 2
- ✅ Session management working
- ✅ Auth procedures typed and validated
- ✅ Old auth context refactored
- ✅ Logout working
- ✅ Auth tests passing
- ✅ Build: `npm run build` succeeds

---

## Week 3: Payment System Rewrite

### Goal: Complete rewrite with proper error handling

### Daily Breakdown

#### Day 1-2: Payment Schema & Validators
- [ ] Create payment data models in Prisma:
  ```prisma
  model Payment {
    id              String   @id @default(cuid())
    paymentId       String   @unique // Pi API ID
    taskId          String
    workerId        String
    employerId      String
    amount          Decimal
    status          PaymentStatus
    blockchainTxId  String?
    errorReason     String?
    attempts        Int      @default(0)
    nextRetry       DateTime?
    createdAt       DateTime @default(now())
    updatedAt       DateTime @updatedAt
  }
  
  enum PaymentStatus {
    PENDING
    APPROVED
    COMPLETED
    FAILED
    RETRYING
  }
  ```

- [ ] Create Zod validators for payment input/output

#### Day 3-4: Payment Service
- [ ] Create `server/services/paymentService.ts`:
  ```typescript
  export class PaymentService {
    async initiatePayment(params: {
      taskId: string;
      workerId: string;
      amount: number;
      agreedReward: number;
    }) {
      // Validate amounts match
      // Call Pi API
      // Create payment record
      // Return payment ID
    }
    
    async approvePayment(paymentId: string) {
      // Call Pi API approve endpoint
      // Update payment status
      // Create audit log
    }
    
    async completePayment(paymentId: string, txId: string) {
      // Verify blockchain transaction
      // Update submission status
      // Update user earnings
      // Create transaction record
      // Create audit log
    }
    
    async handlePaymentFailure(paymentId: string, error: Error) {
      // Create audit log
      // Send notification to employer
      // Mark for retry
      // Refund if needed
    }
    
    async retryFailedPayments() {
      // Find payments marked for retry
      // Attempt completion again
      // Log results
    }
  }
  ```

#### Day 5-6: Payment API Procedures
- [ ] Create tRPC procedures for payment:
  ```typescript
  export const paymentRouter = router({
    initiate: protectedProcedure
      .input(initiatePaymentSchema)
      .mutation(async ({ input, ctx }) => {
        const payment = await paymentService.initiatePayment({
          ...input,
          employerId: ctx.userId,
        });
        await auditLog.create({
          action: 'PAYMENT_INITIATED',
          userId: ctx.userId,
          targetId: payment.id,
        });
        return payment;
      }),
    
    complete: publicProcedure
      .input(completePaymentSchema)
      .mutation(async ({ input }) => {
        // Server-side Pi API verification
        // Complete payment safely
      }),
  });
  ```

#### Day 7: Testing
- [ ] Write payment tests
- [ ] Test error recovery
- [ ] Test retry logic
- [ ] Test blockchain verification

### Deliverables End of Week 3
- ✅ Payment service fully typed
- ✅ Error recovery implemented
- ✅ Blockchain verification working
- ✅ Retry mechanism built
- ✅ Audit logging for all payments
- ✅ Payment tests passing
- ✅ Build: `npm run build` succeeds

---

## Week 4: Submission Workflow & Notifications

### Goal: State machine for submissions, event-driven notifications

### Daily Breakdown

#### Day 1-2: Submission State Machine
- [ ] Design submission state flow:
  ```
  DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED → COMPLETED
                   ↘ REJECTED → (Appeal) → DISPUTED
                   ↘ REVISION_REQUESTED
  ```

- [ ] Create submission service:
  ```typescript
  export class SubmissionService {
    async submitTask(params) {
      // Validate state
      // Create submission
      // Emit event: "submission.created"
      // Decrement task slots
      // Auto-evaluate task status
    }
    
    async approveSubmission(params) {
      // Validate employer
      // Check state
      // Transition to APPROVED
      // Store agreed_reward payment
      // Emit event: "submission.approved"
      // Create payment
    }
    
    async rejectSubmission(params) {
      // Validate feedback provided
      // Transition to REJECTED
      // Emit event: "submission.rejected"
    }
    
    async requestRevision(params) {
      // Transition to REVISION_REQUESTED
      // Emit event: "revision.requested"
    }
  }
  ```

#### Day 3-4: Event System & Notifications
- [ ] Create event emitter:
  ```typescript
  // server/events/emitter.ts
  export const eventEmitter = new EventEmitter();
  
  export async function emitEvent(event: string, data: any) {
    eventEmitter.emit(event, data);
    
    // Also queue to Bull for persistence
    await notificationQueue.add({
      event,
      data,
      timestamp: new Date(),
    });
  }
  ```

- [ ] Create notification jobs:
  ```typescript
  // server/jobs/notifications.ts
  notificationQueue.process(async (job) => {
    const { event, data } = job.data;
    
    switch (event) {
      case 'submission.rejected':
        await sendNotification({
          userId: data.workerId,
          title: 'Submission Rejected',
          body: data.feedbackReason,
          actionUrl: `/submissions/${data.submissionId}`,
        });
        break;
      // ... other events
    }
  });
  ```

#### Day 5-6: Notification Procedures & UI
- [ ] Create notification tRPC procedures
- [ ] Create notification polling endpoint
- [ ] Create UI notification component
- [ ] Add notification bell to header

#### Day 7: Testing
- [ ] Write submission workflow tests
- [ ] Test state transitions
- [ ] Test notification delivery
- [ ] Test event emission

### Deliverables End of Week 4
- ✅ Submission state machine implemented
- ✅ Event-driven architecture working
- ✅ Notification system functional
- ✅ Workers receive rejection feedback
- ✅ Notifications persist in DB
- ✅ Submission tests passing
- ✅ Build: `npm run build` succeeds

---

## Week 5: Admin System & Dispute Resolution

### Goal: Audit logging, admin actions, dispute resolution

### Daily Breakdown

#### Day 1-2: Admin Audit Logging
- [ ] Create audit service:
  ```typescript
  export class AuditService {
    async logAction(params: {
      action: string; // "APPROVE_SUBMISSION", "BAN_USER"
      userId: string;
      targetId?: string;
      details?: object;
      ipAddress?: string;
    }) {
      return await prisma.auditLog.create({
        data: params,
      });
    }
    
    async getActionLog(targetId: string) {
      return await prisma.auditLog.findMany({
        where: { targetId },
        orderBy: { createdAt: 'desc' },
      });
    }
  }
  ```

- [ ] Wrap ALL admin actions with audit logging

#### Day 3-4: Dispute Resolution
- [ ] Create dispute service:
  ```typescript
  export class DisputeService {
    async createDispute(params: {
      submissionId: string;
      workerId: string;
      reason: string;
      evidence: string; // URL or base64
    }) {
      const dispute = await prisma.dispute.create({
        data: {
          ...params,
          status: 'PENDING',
          createdAt: new Date(),
        },
      });
      
      // Schedule auto-resolution after 48 hours
      await disputeQueue.add({
        disputeId: dispute.id,
        resolve: 'in_favor_of_worker', // Default
      }, {
        delay: 48 * 60 * 60 * 1000, // 48 hours
      });
      
      return dispute;
    }
    
    async resolveDispute(params: {
      disputeId: string;
      ruling: 'in_favor_of_worker' | 'in_favor_of_employer';
      adminNotes: string;
    }) {
      const dispute = await prisma.dispute.update({
        where: { id: params.disputeId },
        data: {
          status: 'RESOLVED',
          ruling: params.ruling,
          adminNotes: params.adminNotes,
          resolvedAt: new Date(),
        },
      });
      
      await auditService.logAction({
        action: 'DISPUTE_RESOLVED',
        userId: ctx.userId,
        targetId: dispute.id,
      });
      
      // Execute ruling (refund or approve payment)
      // ... logic here
      
      return dispute;
    }
  }
  ```

#### Day 5-6: Admin Procedures & UI
- [ ] Create admin tRPC procedures
- [ ] Rebuild admin dashboard with new procedures
- [ ] Add audit log viewer
- [ ] Add dispute resolution UI

#### Day 7: Testing
- [ ] Test audit logging
- [ ] Test dispute creation/resolution
- [ ] Test 48-hour auto-resolution
- [ ] Test admin procedures

### Deliverables End of Week 5
- ✅ Audit logging on all admin actions
- ✅ Dispute resolution state machine
- ✅ 48-hour auto-approval working
- ✅ Admin dashboard rebuilt
- ✅ Evidence storage for disputes
- ✅ Admin tests passing
- ✅ Build: `npm run build` succeeds

---

## Week 6: Testing, Optimization & Mainnet Prep

### Goal: Comprehensive testing, performance optimization, Mainnet readiness

### Daily Breakdown

#### Day 1-2: Integration Tests
- [ ] Write comprehensive integration tests:
  ```typescript
  // __tests__/integration/submission-flow.test.ts
  describe('Complete Submission Flow', () => {
    it('should handle complete task submission to payment', async () => {
      // 1. Create user
      // 2. Create task
      // 3. Submit task
      // 4. Approve submission
      // 5. Complete payment
      // 6. Verify earnings updated
      // 7. Verify audit logs created
    });
  });
  ```

- [ ] Test payment error recovery
- [ ] Test notification delivery
- [ ] Test dispute resolution

#### Day 3-4: E2E Tests
- [ ] Write end-to-end tests using Playwright:
  ```typescript
  // e2e/submission.spec.ts
  test('worker can submit task and get paid', async ({ page }) => {
    // 1. Login as worker
    // 2. Accept task
    // 3. Submit proof
    // 4. Verify submission appears in employer dashboard
    // 5. Login as employer
    // 6. Approve submission
    // 7. Verify payment initiated
  });
  ```

#### Day 5: Performance Optimization
- [ ] Database query optimization
- [ ] Add caching for leaderboard
- [ ] Optimize image loading
- [ ] Minimize bundle size

#### Day 6: Mainnet Preparation Checklist
- [ ] ✅ Security audit completed
- [ ] ✅ All environment variables configured
- [ ] ✅ Monitoring dashboard setup
- [ ] ✅ Backup strategy tested
- [ ] ✅ Rate limiting configured
- [ ] ✅ 2FA for admin enabled
- [ ] ✅ Audit logging working
- [ ] ✅ Error tracking setup (Sentry)
- [ ] ✅ Load testing completed
- [ ] ✅ Incident response playbook created

#### Day 7: Deploy & Verification
- [ ] Final build: `npm run build`
- [ ] Deploy to staging environment
- [ ] Run full test suite
- [ ] Smoke test critical flows
- [ ] Verify monitoring active
- [ ] Ready for Mainnet!

### Deliverables End of Week 6
- ✅ 90%+ test coverage on core functions
- ✅ All critical flows E2E tested
- ✅ Performance optimized
- ✅ Monitoring setup complete
- ✅ Security hardened
- ✅ Mainnet-ready codebase
- ✅ Build: `npm run build` succeeds

---

## 📊 Progress Tracking

Use this table to track progress throughout the 6 weeks:

| Week | Component | Status | Blockers | Notes |
|------|-----------|--------|----------|-------|
| 1 | Prisma ORM | ⏳ In Progress | None | Starting Monday |
| 1 | tRPC Setup | ⏳ In Progress | Prisma | Depends on Week 1 Day 1-2 |
| 1 | Zod Validators | 📋 Pending | Schemas | Depends on Prisma schema |
| 2 | Auth System | 📋 Pending | tRPC | Depends on Week 1 completion |
| 3 | Payment Service | 📋 Pending | Auth | Depends on Week 2 completion |
| 4 | Notifications | 📋 Pending | Redis | Depends on Week 3 + Bull setup |
| 5 | Admin/Disputes | 📋 Pending | Notifications | Depends on Week 4 |
| 6 | Testing/Mainnet | 📋 Pending | All systems | Final week integration |

---

## 🚨 Risk Mitigation

### Key Risks & Responses

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| Database migration fails | Medium | High | Test migrations on copy of prod DB first |
| Payment API down | Low | Critical | Implement fallback to manual approval |
| Performance regression | Medium | Medium | Benchmark each week, optimize as needed |
| tRPC learning curve | Medium | Low | Pre-study tRPC docs, pair programming |
| Redis setup issues | Low | Medium | Use in-memory cache as fallback initially |
| Team blocked waiting | Medium | Medium | Clear dependencies, parallel work where possible |

---

## ✅ Success Criteria

By end of Week 6, you should have:

- ✅ **Code Quality:** 8/10 (up from 4.5/10)
- ✅ **Test Coverage:** 85%+ on critical paths
- ✅ **Type Safety:** 100% type-safe API surface
- ✅ **Security:** All vulnerabilities addressed
- ✅ **Performance:** <2s page load times
- ✅ **Reliability:** 99.5% uptime capacity
- ✅ **Auditability:** All admin actions logged
- ✅ **Mainnet Ready:** Yes

---

## 📞 Weekly Sync Topics

- **Monday:** Sprint planning, blockers review
- **Wednesday:** Mid-week check-in, course corrections
- **Friday:** Sprint retro, next week planning

---

## 🎯 Next Steps

1. **Approve this plan** - Get stakeholder buy-in
2. **Schedule sprint planning** - Monday 10 AM
3. **Prepare environment** - Have dev machine ready
4. **Review Week 1 docs** - Pre-read Prisma/tRPC documentation
5. **Start coding** - Monday morning

---

**Ready to rebuild? Let's go! 🚀**
