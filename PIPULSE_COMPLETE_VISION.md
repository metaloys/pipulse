# 🎯 PiPulse Complete Vision & Requirements

**Last Updated:** February 23, 2026  
**Status:** Ready for Hybrid Rebuild Implementation  
**Target Launch:** Week 6 to Mainnet  

---

## 📋 WHAT IS PIPULSE?

PiPulse is a **single shared marketplace** where any Pi Network user who authenticates becomes part of the same ecosystem.

**Core Concept:**
- Every user starts as a **worker** by default
- Any user can **switch to employer mode** at any time
- Most users will use **both roles** as needed
- One marketplace, one community, shared earnings opportunity

---

## 🔐 PRIVACY MODEL

### Public to Everyone:
- ✅ All active task listings
- ✅ Leaderboard top earners (username + amount)
- ✅ Platform-wide stats (total Pi paid, tasks completed, etc.)

### Private to Individual Only:
- ✅ Their own earnings history
- ✅ Their own submission history and proof
- ✅ Their own rejection feedback
- ✅ Their own notifications  
- ✅ Transaction details between parties only

**RLS Rules:** All tables must enforce privacy via Row Level Security (RLS)

---

## 🎬 COMPLETE USER FLOWS

### FLOW 1: NEW USER FIRST TIME

**Journey:**
```
1. Opens PiPulse in Pi Browser
2. Pi SDK authenticates automatically
3. Lands on worker dashboard by default
4. Sees available tasks from all employers  
5. Can switch to employer mode anytime
```

**Technical Implementation:**
- Use Pi SDK iframe detection (already working)
- Redirect to default worker dashboard
- Show mode switcher in header
- Allow instant toggle to employer dashboard

---

### FLOW 2: WORKER ACCEPTING & COMPLETING TASK

**Step by Step:**

```
1. Worker browses task feed with category filters
   └─ Filter pills: All, App Testing, Survey, etc.
   
2. Taps task card to see full details
   └─ Shows: Title, Reward, Time Est, Category, Company
   └─ Shows: Full instructions, requirements, deadline
   
3. Taps "Accept Task" button
   └─ Slot is locked for this worker for 2 HOURS
   └─ Task remains in feed but worker can't accept again
   
4. Full instructions shown in slide-up panel
   └─ Can submit text, photo, or audio proof
   
5. Worker completes work and submits proof
   └─ agreed_reward stored AT MOMENT OF ACCEPTANCE
   └─ Payment will use this stored amount, not current price
   
6. Employer notified immediately via notification
   └─ Bell shows red badge with count
   
7. Worker sees submission in "My Work" tab
   └─ Status: "Submitted"
   └─ Can view submitted proof
   └─ Cannot edit after submission
```

**Technical Requirements:**

**Slot Locking Mechanism:**
```
- When worker accepts: Create slot_lock record
- Lock expires after 2 hours
- If worker submits before expiry: converts to submission
- If lock expires: slot released back to available
- No other worker can accept same slot while locked
```

**agreed_reward Storage:**
```
- At moment of acceptance, read task.pi_reward
- Store in task_submissions.agreed_reward
- Lock this value - never change it
- Payment always uses agreed_reward, never current price
- Protects worker from price reductions after acceptance
```

---

### FLOW 3: EMPLOYER REVIEWING SUBMISSION

**Three Options Only - No Exceptions:**

#### OPTION A: Approve and Pay

```
1. Employer taps "Approve & Pay" button
2. Confirmation dialog shows:
   - Worker name
   - Task title
   - Pi amount (from agreed_reward)
   - "Confirm Payment" button
3. Payment initiates automatically via Pi SDK
4. Worker gets notification: "Payment received for [Task]"
5. Worker earnings update immediately in dashboard
6. Task slot marked as filled
7. Submission status: "approved"
```

#### OPTION B: Request Revision

```
1. Employer taps "Request Revision" button
2. Required: Write minimum 50 CHARACTERS explaining
   - Exactly what needs to be fixed
   - What's wrong with current submission
   - What acceptable result looks like
3. Validation: Must be ≥ 50 chars (enforced client + server)
4. Worker gets notification with FULL INSTRUCTIONS
   - Worker can read complete feedback
   - Worker can fix and resubmit once only
5. Submission status: "revision_requested"
6. Task slot stays locked for original worker
   - No other worker can take it
   - Original worker has priority to fix
7. Worker resubmits:
   - Submission status: "revision_resubmitted"
   - revision_number incremented
8. Employer reviews again with same three options
```

#### OPTION C: Reject

```
1. Employer taps "Reject" button
2. Required: Write minimum 50 CHARACTERS explaining
   - Why work was rejected
   - What was wrong
   - What would have been acceptable
3. Validation: Must be ≥ 50 chars (enforced client + server)
4. Rejection saved to database with timestamp
5. Worker gets IMMEDIATE notification with FULL REASON
   - Reason is visible to worker
   - Reason is permanent record
6. Submission status: "rejected"
7. Worker sees rejection in "My Work" tab
   - Rejection reason visible permanently
   - Proof still visible for comparison
8. Worker has option to "Dispute" if they believe
   rejection was unfair (see Dispute Flow)
9. Task slot returned to available
   - Employer can post slot again
   - Another worker can accept
```

#### IF EMPLOYER DOESN'T REVIEW IN 48 HOURS

```
1. Background job runs at 48 hour mark
2. Check all submissions in "submitted" status
3. For submissions older than 48 hours:
   - Auto-approve submission
   - Auto-initiate payment to worker
   - Use agreed_reward amount
   - Set reviewed_at timestamp
   - Mark as auto_approved
4. Notify both parties:
   - Worker: "Payment released (auto-approved after 48h)"
   - Employer: "Submission auto-approved (didn't review in 48h)"
5. Payment appears in transaction history for both
```

**Background Job Implementation:**
```typescript
// This runs every 60 minutes
async function autoApproveOverdueSubmissions() {
  const overdueSubmissions = await prisma.submission.findMany({
    where: {
      status: 'SUBMITTED',
      submittedAt: {
        lt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      },
      auto_approved: false,
    },
    include: { task: true, worker: true },
  });
  
  for (const submission of overdueSubmissions) {
    await paymentService.approveAndPay({
      submissionId: submission.id,
      amount: submission.agreed_reward,
      reason: 'auto_approved_48h',
    });
    
    await notificationService.send({
      userId: submission.worker_id,
      title: 'Payment Received',
      body: `Your submission was auto-approved after 48 hours.`,
    });
  }
}
```

---

### FLOW 4: WORKER DISPUTE FLOW

**When to Dispute:**
Worker can dispute if they believe rejection was unfair

**Step by Step:**

```
1. Worker taps "Dispute" button on rejected submission
2. Required: Write minimum 100 CHARACTERS explaining:
   - Why they believe rejection was unfair
   - What they believe they did correctly
   - Any additional context
3. Validation: Must be ≥ 100 chars (enforced client + server)
4. Must optionally provide additional evidence:
   - Screenshot, photo, or document
   - URL to external proof
5. Dispute created in database with:
   - submission_id
   - worker_id  
   - dispute_reason
   - evidence_url
   - created_at
   - status: "pending"
6. Admin sees dispute in admin dashboard
   - "Pending Disputes" section
   - Shows worker statement, rejection reason, proof
7. Admin reviews:
   - Original submission proof
   - Worker's dispute statement
   - Employer's rejection reason
8. Admin makes final ruling:
   
   IF RULE FOR WORKER:
   - Payment released to worker (agreed_reward amount)
   - Submission status: "approved"
   - Dispute status: "resolved"
   - Admin ruling logged
   
   IF RULE FOR EMPLOYER:
   - No payment to worker
   - Submission remains rejected
   - Dispute status: "resolved"
   - Admin ruling logged
   
9. Both parties notified:
   - Worker: "Dispute ruling: [Favorable/Not favorable]"
   - Employer: "Dispute resolved: [ruling]"
10. Decision is permanent and logged in audit
```

---

### FLOW 5: EMPLOYER POSTING TASK

**Multi-Step Form with Validation:**

#### Step 1: Basic Info
```
Title:
  - Required
  - Min 10 chars, Max 100 chars
  - Guidance: "What is the task?"
  
Category:
  - Radio buttons: App Testing, Survey, Translation,
                   Audio Recording, Photo Capture,
                   Content Review, Data Labeling
  - Required
  
Short Description:
  - Required
  - 50-500 chars
  - Guidance: "Brief summary of what needs to be done"
```

#### Step 2: Requirements
```
Detailed Instructions:
  - Required
  - Min 100 chars
  - Rich text editor
  - Guidance: "Tell worker exactly what to do and what you expect"
  
Proof Type Required:
  - Select one: Text, Photo, Audio, File
  - Guidance: "How should worker submit their proof?"
  
Time Estimate (minutes):
  - Required
  - 1-480 (up to 8 hours)
  - Guidance: "How long should this task take?"
```

#### Step 3: Payment Settings
```
Pi Reward Per Worker:
  - Required
  - Min 0.1π, Max 1000π
  - Guidance: "How much will you pay each worker?"
  - Shows: "Total to be escrowed: [slots × reward]"
  
Number of Slots:
  - Required
  - Min 1, Max 100
  - Guidance: "How many workers do you need?"
  
Deadline:
  - Required
  - Must be future date/time
  - Min 1 hour from now, Max 30 days
  - Guidance: "When do you need this completed?"
```

#### Step 4: Review and Confirm
```
Summary displays:
  - Title
  - Category icon + name
  - Description
  - Instructions (preview)
  - Proof type required
  - Time estimate
  - Slots: [number]
  - Reward per worker: [amount]π
  - Total escrowed: [slots × reward]π
  - Deadline: [date/time]
  
Actions:
  - "Edit" button (go back)
  - "Confirm and Post" button (final)
  
Confirmation dialog:
  - "You are about to post this task"
  - "Total escrow: [amount]π will be held"
  - "Accept" / "Cancel" buttons
  
After confirmation:
  - Charge to employer account (or escrow from wallet)
  - Create task record in database
  - Set task_status = "available"
  - Set slots_remaining = slots_available
  - Redirect to task detail view
  - Show success message: "Task posted!"
```

---

### FLOW 6: EMPLOYER EDITING TASK

**Edit Trigger:**
Employer taps edit icon on task in "My Tasks"

**What Can Be Edited:**
- Title ✅
- Description ✅
- Instructions ✅
- Proof type required ✅
- Time estimate ✅
- **Price (with protection logic)** ✅
- **Slots available (with recalculation)** ✅
- Deadline ✅

**Auto-Status Re-Evaluation:**

After any edit, system checks:
```
IF slots_remaining > 0 AND deadline > now:
  → task_status = "available"  (visible to workers)
ELSE:
  → task_status = "completed"  (hidden from workers)
```

**When Employer Increases Slot Count:**

```
Old Scenario:
  slots_available: 5
  slots_remaining: 0  (all filled)
  task_status: "completed" (hidden)

Employer edits:
  slots_available: 10

New Scenario Calculation:
  difference = 10 - 5 = 5
  slots_remaining = 0 + 5 = 5
  task_status = "available" (back in feed!)
  
Workers see task in feed again immediately
```

**Price Protection Logic:**

```
Old Scenario:
  pi_reward: 10π
  3 workers accepted at 10π each
  agreed_reward stored for each: 10π

Employer edits:
  pi_reward: 5π  (reduced price!)

Outcome:
  Future workers accept at 5π (new price)
  Old 3 workers still paid 10π (agreed_reward protected)
  
When paying:
  - Look up submission.agreed_reward
  - Pay that amount, not current task.pi_reward
  - Workers protected from price cuts after accepting
```

**Validation After Edit:**
```
- Title still 10-100 chars? ✅
- Description still 50-500 chars? ✅  
- Instructions still ≥100 chars? ✅
- Deadline still in future? ✅
- If slots reduced: new_slots ≥ filled_slots? ✅
```

---

## ✨ COMPLETE FEATURE LIST

### WORKER FEATURES (14 total)

**W1: Task Feed with Category Filter**
- Display all available tasks (task_status = "available")
- Exclude user's own tasks
- Filter pills: All, App Testing, Survey, Translation, Audio Recording, Photo Capture, Content Review, Data Labeling
- Each pill shows count
- Tasks sorted by newest first
- Infinite scroll or pagination

**W2: Task Cards with Colored Left Stripe**
- Category color-coded left border
- Shows: Category icon, Title, Employer, Reward (π), Time Est, Slots Remaining/Total
- Shows: Updated badge if edited in last 24h
- Shows: Progress bar for slot fill rate
- Tap to see details

**W3: Task Detail View with Full Instructions**
- Full task title and description
- Complete instructions text
- Category, time estimate, reward
- Proof type required (Text/Photo/Audio/File)
- Deadline countdown
- "Accept Task" button if not yet accepted
- Accept button disabled if already accepted

**W4: Accept Task and Lock Slot for 2 Hours**
- Tapping "Accept" creates slot lock
- Lock visible in "In Progress" section of My Work
- 2-hour countdown timer shown
- If submit before timer expires → converts to submission
- If timer expires → slot released automatically
- Only one accept per worker per task
- Prevents double-accepting same task

**W5: Submit Proof (Text, Photo, or Audio)**
- Form matches proof type required by task
- Text: Rich text editor with min/max chars
- Photo: Camera or upload, crop before submit
- Audio: Record or upload, preview before submit
- Validation: Must provide content in correct format
- Submit button shows: "Submit Work for [amount]π"
- After submit: Show success, redirect to My Work

**W6: My Work Tab - Complete History**

Sub-tabs:
- **In Progress** (accepted, working)
  - Shows task name, time locked, time remaining
  - "Submit Proof" button
  
- **Submitted** (waiting for employer review)
  - Shows task name, submission date
  - Proof preview (text, photo, audio)
  - Status: "Waiting for Employer Review"
  
- **Revision Requested** (needs fixing)
  - Shows task name, revision count
  - Original rejection reason visible
  - "Resubmit" button
  - Proof preview editable/replaceable
  
- **Approved** (paid)
  - Shows task name, amount paid
  - Payment date
  - Mark: "✓ Paid"
  
- **Rejected** (with feedback visible)
  - Shows task name, rejection date
  - Rejection reason visible permanently
  - Original proof for reference
  - "Dispute" button to appeal
  
- **Disputed** (with outcome)
  - Shows task name, dispute date
  - Ruling: "Favorable" or "Not Favorable"
  - Dispute resolution notes

**W7: Notification Bell with Unread Count**
- Bell icon in header
- Red badge with number if unread
- Icon highlights when new notification
- Tap to open notification center

**W8: Notification Center**
- List of all notifications
- Types: Submission rejected, Revision requested, Payment received, Dispute resolved, Task updated
- Tap notification to view details
- Mark as read / Mark all as read
- Delete notification
- Search notifications
- Filter by type

**W9: Dispute Button on Rejected Submissions**
- Only appears on rejected submissions
- Opens dispute modal with:
  - Original submission proof
  - Rejection reason from employer
  - Text area for dispute statement (≥100 chars required)
  - Optional evidence upload
  - "Submit Dispute" button
- After submit: Show "Dispute submitted, awaiting admin review"

**W10: Earnings Dashboard - Today/Week/Total**
```
Display three cards:
Today: $X.XXπ
Week: $X.XXπ  
Total: $X.XXπ

Below: Transaction list with recent activity
```

**W11: Current Streak with Fire Emoji**
```
🔥 Streak: 7 days
Next bonus at 10 days

Streak increments when:
- Completes any task (submitted)
- Every day they're active
Resets if: No activity for 24 hours
```

**W12: Progress to Next Level Bar**
```
Current: Established (650 completed)
Next: Advanced (1000 completed)

Progress bar: [===========     ] 65%

Levels:
0-100: Newcomer
101-500: Established
501-1000: Advanced
1001+: Elite Pioneer
```

**W13: Leaderboard - Three Tabs**

Tab 1: **Top Earners**
- Shows top 10 users by total_earnings
- Rank, username, total π earned
- Highlight current user if in top 10
- If not in top 10: show "You are ranked #247"

Tab 2: **Top Employers**
- Shows top 10 users by money spent on tasks
- Rank, username, total π spent
- Highlight current user if in top 10

Tab 3: **Rising Stars**
- Shows top 10 by tasks completed this month
- Rank, username, tasks completed this month
- Highlight current user if in top 10

**W14: Current User Position if Not in Top 10**
```
If user not in leaderboard top 10:
Show: "You are ranked #247 by earnings"
Show: "You are ranked #15 by tasks completed"
Link: "View full leaderboard"
```

---

### EMPLOYER FEATURES (11 total)

**E1: Post Task Multi-Step Form**
- 4-step form with validation (see Flow 5 above)
- Save draft capability
- Progress indicator showing current step
- Back/Next navigation
- Auto-validate before next step

**E2: My Tasks List with Slot Progress**
- Shows all tasks created by this user
- Display: Title, Category, Slots (X filled/Y total), Status
- Progress bar for slot fill (green fill as tasks completed)
- Shows: Created date, Deadline, Total escrow amount
- Sorted by newest first
- Actions: View Details, Edit, Pause, Delete (if no submissions)

**E3: Edit Task with Auto Status Re-Evaluation**
- All fields editable (with validations)
- After save: Auto-check status
  - If slots_remaining > 0 AND deadline > now → available
  - Else → completed
- If task goes from completed → available:
  - Show: "Task is back in worker feed"
  - Notify workers subscribed to this category
- If price changed: Show warning
  - "New workers accept at new price"
  - "Existing workers paid their agreed price"

**E4: Increase Slots Brings Task Back to Feed**
- When slots_available increased:
  - Calculate: new - old = difference
  - Add difference to slots_remaining
  - If task was completed, becomes available
  - Task immediately visible to workers

**E5: Submissions Inbox Grouped by Status**
- **Waiting Review:** Submissions in "submitted" status
  - Shows worker name, submission date
  - Proof preview
  - Actions: Approve & Pay, Request Revision, Reject
  
- **Revision Requested:** Submissions awaiting worker response
  - Shows worker name, revision request date
  - Your revision reason visible
  - Status: "Worker must resubmit"
  
- **Resubmitted:** Workers re-submitted after revision
  - Shows worker name, resubmission date
  - New proof preview
  - Actions: Same as Waiting Review
  
- **Approved:** Submissions paid
  - Shows worker name, approval date, amount paid
  - Mark: "✓ Approved & Paid"
  
- **Rejected:** Submissions denied
  - Shows worker name, rejection date
  - Your rejection reason visible
  - Shows disputes if opened

**E6: Approve Submission and Trigger Payment**
- Tap "Approve & Pay" button
- Confirm dialog shows:
  - Worker name
  - Amount (from agreed_reward)
  - Confirmation
- On confirm: Pi payment initiated automatically
- Payment uses agreed_reward from submission
- Worker notified immediately
- Submission marked as approved
- Task slot marked as filled

**E7: Request Revision with Mandatory Reason**
- Tap "Request Revision" button
- Modal with:
  - Text area for reason (≥50 chars required)
  - Validation: Shows char count
  - "Submit" button (disabled if <50 chars)
- On submit:
  - Submission status: "revision_requested"
  - Worker notified with full instructions
  - Slot stays locked for original worker
  - Task remains available (shows as revision requested)

**E8: Reject with Mandatory Reason**
- Tap "Reject" button
- Modal with:
  - Text area for reason (≥50 chars required)
  - Validation: Shows char count
  - "Submit" button (disabled if <50 chars)
- On submit:
  - Submission status: "rejected"
  - Rejection reason saved
  - Worker notified with full reason
  - Slot released back to available
  - Worker can dispute

**E9: Task Analytics**
- Dashboard per task showing:
  - Total views (tracked in DB)
  - Total applications (slots taken)
  - Acceptance rate: X% (acceptances/views)
  - Completion rate: X% (approved/acceptances)
  - Money spent: X.XXπ (approved count × reward)
  - Average submission quality (1-5 star from approvals)

**E10: Notification When Worker Submits**
- Notification: "New submission from [worker] for [task]"
- Tap to go to submission review
- Bell badge increments
- Notification in Notification Center

**E11: Notification When Dispute Opened**
- Notification: "[Worker] disputed rejection of [task]"
- Message: "Admin review pending"
- Tap to view dispute details in admin dashboard

---

### ADMIN FEATURES (11 total)

**A1: Overview with 6 Real Metric Cards**
```
Card 1: Total Users
  - Count of unique users

Card 2: Total Tasks
  - Count of total tasks posted

Card 3: Total Π Transferred
  - Sum of all transaction amounts

Card 4: Platform Commission Earned
  - Sum of all pipulse_fee amounts

Card 5: Average Task Completion Rate
  - (approved submissions) / (total submissions) × 100%

Card 6: Pending Disputes
  - Count of disputes with status = "pending"
```

**A2: Transactions Page**
- Table with columns: Date, From, To, Amount, Type, Task, Status
- Search by username or date range
- Filter by transaction type (payment, refund, fee, bonus)
- Filter by status (pending, completed, failed)
- Sort by any column
- Export to CSV button
- Pagination

**A3: Pending Recovery Tab**
- Shows all payments in failed_completions table
- Shows: Worker name, Amount, Task, Error reason, Date failed
- Actions: Retry payment, Manual approve, Delete
- Each action creates audit log entry

**A4: Users Page with Search/Filter/Ban**
- Table: Username, Role, Level, Total Earnings, Tasks Completed, Status
- Search by username
- Filter by role (worker, employer, admin)
- Filter by status (active, banned)
- Sort by any column
- Action buttons: Ban (if active), Unban (if banned), View Details
- Each action logs to audit log

**A5: Tasks Page with Remove/Feature**
- Table: Title, Employer, Status, Slots, Posted Date, Actions
- Search by title or employer
- Filter by status (available, completed, cancelled)
- Filter by category
- Remove button: Deletes task and related submissions (with confirmation)
- Feature button: Pins task to top of feed for 7 days
- Each action logs to audit log

**A6: Submissions Page with Override**
- Table: Worker, Task, Status, Date, Actions
- Search by worker or task name
- Filter by status (submitted, approved, rejected, etc.)
- Override button: Force approve/reject with reason
- Each action creates audit log with timestamp

**A7: Disputes Page with Full Case View**
- Table: Worker, Employer, Task, Status, Date
- Click row to open full dispute details:
  - Worker statement
  - Rejection reason from employer
  - Worker dispute reason
  - Evidence (if provided)
- Ruling buttons: Favor Worker, Favor Employer
- Notes field: Add resolution notes
- When ruled: Create audit log, notify both parties

**A8: Analytics Page with Real Charts**
- Line chart: Users over time (cumulative)
- Line chart: Tasks posted over time
- Line chart: Π transferred over time
- Bar chart: Tasks by category
- Pie chart: Submission statuses
- Gauge: Platform health (% completed vs rejected)
- All use real data from database

**A9: Settings with Commission Rate**
- Commission rate setting:
  - Display current rate: "15%"
  - Input to change rate: "0-50%"
  - Save button
  - Shows: "This applies to all future payments"
- Setting stored in platform_settings table
- All payment calculations read from this table
- Not hardcoded anywhere

**A10: Audit Log Viewer**
- Table: Date, Action, User, Target, Details
- All admin actions logged:
  - Ban user: action="BAN_USER", targetId=userId
  - Approve submission: action="APPROVE_SUBMISSION", targetId=submissionId
  - Resolve dispute: action="RESOLVE_DISPUTE", targetId=disputeId
  - Change settings: action="CHANGE_SETTING", details={old, new}
  - Force approve: action="FORCE_APPROVE_SUBMISSION", targetId, adminNotes
- Search by action, user, date
- Filter by action type
- Export to CSV

**A11: Maintenance Mode Toggle**
- Toggle switch: "Enable Maintenance Mode"
- When enabled:
  - All task feeds show: "Platform is in maintenance"
  - Payment endpoints return 503
  - Workers can see My Work but not accept new tasks
  - All APIs return maintenance message
  - Only admin can access dashboard
- Useful for: Data migrations, backups, hotfixes

---

### SYSTEM FEATURES (11 total)

**S1: Notification System Event-Driven**
- Events emitted:
  - "submission.submitted" → Notify employer
  - "submission.rejected" → Notify worker with reason
  - "submission.revision_requested" → Notify worker with instructions
  - "submission.approved" → Notify worker, initiate payment
  - "payment.completed" → Notify both parties
  - "dispute.created" → Notify admin
  - "dispute.resolved" → Notify both parties
- All notifications stored in DB
- Delivery status tracked
- Bell icon shows unread count

**S2: Auto-Approval Background Job**
- Runs every 60 minutes
- Finds submissions with status="submitted" AND submittedAt < 48h ago
- For each: Approve, pay worker agreed_reward, notify both parties
- Logs each auto-approval in audit log with reason="48h_auto_approve"

**S3: Slot Locking When Worker Accepts**
- Create slot_lock record with:
  - task_id, worker_id
  - locked_at timestamp
  - expires_at = locked_at + 2 hours
- When slot_lock active:
  - Worker sees task in "In Progress"
  - Other workers can't accept same task
  - Can see countdown timer
- When submission created: Delete slot_lock record
- When 2 hours expire: Delete slot_lock record (cron job)

**S4: Slot Re-Evaluation When Employer Edits**
- When task is updated:
  - Check current slots_available vs previous
  - If changed: Calculate difference
  - Add difference to slots_remaining
  - Then auto-evaluate task_status:
    - If slots_remaining > 0 AND deadline > now → "available"
    - Else → "completed"

**S5: agreed_reward Stored at Acceptance**
- When worker accepts task:
  - Read task.pi_reward value
  - Store in new submission record as agreed_reward
  - Lock this value - never change
- When payment processes:
  - Read from submission.agreed_reward
  - Use this amount, ignore current task.pi_reward
  - Protects worker from price reductions

**S6: Payment Error Recovery System**
- Create failed_completions table to track failures
- When payment fails to complete:
  - Log to failed_completions with error reason
  - Schedule retry for 1 hour later
  - Notify employer: "Payment failed, will retry"
  - After 3 failed retries: Notify admin
- Admin can: Retry, Manual approve, or Refund
- All actions logged to audit_log

**S7: Role Switching Worker ↔ Employer**
- Button in header: "Switch to Employer" or "Switch to Worker"
- On click:
  - Update users.user_role = new_role
  - Redirect to appropriate dashboard
  - Clear cached data
  - Maintain session (don't re-auth)
- User can switch unlimited times
- Dashboard switches between worker and employer views

**S8: Streak Tracking Daily Activity**
- Streak increments on:
  - Submitting a task (for workers)
  - Approving a submission (for employers)
- Resets if: No activity for 24 hours
- Daily boundary: Midnight UTC
- Stored in streaks table with:
  - user_id, current_streak, longest_streak
  - last_active_date, streak_bonus_earned
- Longest streak never decreases

**S9: Level Progression**
```
0-100 completed: Newcomer
101-500 completed: Established
501-1000 completed: Advanced
1001+ completed: Elite Pioneer

Display in:
- User profile card
- Leaderboard
- Task card (worker's level)
- Admin user management

Auto-calculated based on total_tasks_completed
```

**S10: Commission Rate from Platform Settings**
- Commission rate stored in platform_settings table
- Payment calculations read this value
- Example: If rate = 15%, for 10π task:
  - Worker gets: 8.5π
  - Platform gets: 1.5π
- Admin can change anytime
- Not hardcoded anywhere
- All transactions record pipulse_fee separately

**S11: Leaderboard Calculated from Real Transactions**
- Top Earners: SELECT sum(amount) FROM transactions WHERE receiver_id = user_id GROUP BY receiver_id ORDER BY sum DESC
- Top Employers: SELECT sum(amount) FROM transactions WHERE sender_id = user_id AND transaction_type = 'payment' GROUP BY sender_id ORDER BY sum DESC
- Rising Stars: SELECT count(*) FROM submissions WHERE worker_id = user_id AND status = 'approved' AND DATE_TRUNC('month', approved_at) = current_month GROUP BY worker_id ORDER BY count DESC
- Cached and refreshed every 1 hour
- Used for W13/W14 display

---

## 🗄️ DATABASE DESIGN WITH PRISMA

### Core Tables Required:

```prisma
// Users - authenticated Pi Network users
model User {
  id              String   @id @default(cuid())
  piUsername      String   @unique
  piWallet        String?  @unique
  userRole        UserRole @default(WORKER)
  level           Level    @default(NEWCOMER)
  currentStreak   Int      @default(0)
  longestStreak   Int      @default(0)
  lastActiveDate  DateTime @default(now())
  totalEarnings   Decimal  @default(0)
  totalTasksCompleted Int  @default(0)
  status          UserStatus @default(ACTIVE)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  tasks           Task[]
  submissions     Submission[]
  sentTransactions Transaction[] @relation("sender")
  receivedTransactions Transaction[] @relation("receiver")
  disputes        Dispute[]
  auditLogs       AuditLog[]
}

enum UserRole {
  WORKER
  EMPLOYER
  ADMIN
}

enum Level {
  NEWCOMER
  ESTABLISHED
  ADVANCED
  ELITE_PIONEER
}

enum UserStatus {
  ACTIVE
  BANNED
  SUSPENDED
}

// Tasks - job postings from employers
model Task {
  id              String   @id @default(cuid())
  title           String
  description     String
  category        TaskCategory
  instructions    String
  proofType       ProofType
  piReward        Decimal
  timeEstimate    Int
  deadline        DateTime
  slotsAvailable  Int
  slotsRemaining  Int
  taskStatus      TaskStatus
  employerId      String
  employer        User     @relation(fields: [employerId], references: [id], onDelete: Cascade)
  views           Int      @default(0)
  isFeatured      Boolean  @default(false)
  featuredUntil   DateTime?
  deletedAt       DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  submissions     Submission[]
  versions        TaskVersion[]
  slots           SlotLock[]
  transactions    Transaction[]
  disputes        Dispute[]
}

enum TaskStatus {
  AVAILABLE
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum TaskCategory {
  APP_TESTING
  SURVEY
  TRANSLATION
  AUDIO_RECORDING
  PHOTO_CAPTURE
  CONTENT_REVIEW
  DATA_LABELING
}

enum ProofType {
  TEXT
  PHOTO
  AUDIO
  FILE
}

// Task Versions - audit trail of edits
model TaskVersion {
  id          String   @id @default(cuid())
  taskId      String
  task        Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  title       String?
  description String?
  instructions String?
  piReward    Decimal?
  slotsAvailable Int?
  deadline    DateTime?
  changedBy   String
  createdAt   DateTime @default(now())
}

// Slot Locks - prevent double-acceptance of same task
model SlotLock {
  id        String   @id @default(cuid())
  taskId    String
  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  workerId  String
  lockedAt  DateTime @default(now())
  expiresAt DateTime
  
  @@index([taskId, workerId])
  @@index([expiresAt])
}

// Submissions - worker work submissions
model Submission {
  id                String   @id @default(cuid())
  taskId            String
  task              Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  workerId          String
  worker            User     @relation(fields: [workerId], references: [id], onDelete: Cascade)
  proofContent      String
  submissionType    ProofType
  status            SubmissionStatus
  agreedReward      Decimal  // Locked price at acceptance time
  rejectionReason   String?
  revisionNumber    Int      @default(0)
  revisionReason    String?
  revisionRequestedAt DateTime?
  resubmittedAt     DateTime?
  adminNotes        String?
  submittedAt       DateTime @default(now())
  reviewedAt        DateTime?
  autoApproved      Boolean  @default(false)
  deletedAt         DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  dispute           Dispute?
  transaction       Transaction?
  
  @@index([taskId])
  @@index([workerId])
  @@index([status])
  @@unique([taskId, workerId]) // One submission per worker per task
}

enum SubmissionStatus {
  SUBMITTED
  REVISION_REQUESTED
  REVISION_RESUBMITTED
  APPROVED
  REJECTED
  DISPUTED
}

// Transactions - payment records
model Transaction {
  id              String   @id @default(cuid())
  senderId        String
  sender          User     @relation("sender", fields: [senderId], references: [id], onDelete: SetNull)
  receiverId      String
  receiver        User     @relation("receiver", fields: [receiverId], references: [id], onDelete: SetNull)
  amount          Decimal
  pipulseFee      Decimal
  taskId          String?
  task            Task     @relation(fields: [taskId], references: [id], onDelete: SetNull)
  submissionId    String?
  submission      Submission @relation(fields: [submissionId], references: [id], onDelete: SetNull)
  type            TransactionType
  status          TransactionStatus
  piBlockchainTxId String?
  failedAt        DateTime?
  timestamp       DateTime @default(now())
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([senderId])
  @@index([receiverId])
  @@index([taskId])
  @@index([submissionId])
}

enum TransactionType {
  PAYMENT
  REFUND
  FEE
  BONUS
}

enum TransactionStatus {
  PENDING
  COMPLETED
  FAILED
}

// Failed Completions - payment recovery
model FailedCompletion {
  id          String   @id @default(cuid())
  submissionId String
  amount      Decimal
  error       String
  attempts    Int      @default(1)
  nextRetry   DateTime?
  resolvedAt  DateTime?
  resolution  String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([submissionId])
  @@index([nextRetry])
}

// Disputes - unfair rejection appeals
model Dispute {
  id            String   @id @default(cuid())
  submissionId  String   @unique
  submission    Submission @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  taskId        String
  task          Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  workerId      String
  worker        User     @relation(fields: [workerId], references: [id], onDelete: Cascade)
  reason        String
  evidence      String?
  status        DisputeStatus
  ruling        DisputeRuling?
  adminNotes    String?
  resolvedAt    DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([status])
  @@index([taskId])
  @@index([workerId])
}

enum DisputeStatus {
  PENDING
  RESOLVED
}

enum DisputeRuling {
  IN_FAVOR_OF_WORKER
  IN_FAVOR_OF_EMPLOYER
}

// Notifications - user alerts
model Notification {
  id              String   @id @default(cuid())
  userId          String
  title           String
  body            String
  actionUrl       String?
  type            NotificationType
  read            Boolean  @default(false)
  deletedAt       DateTime?
  createdAt       DateTime @default(now())
  
  @@index([userId])
  @@index([read])
}

enum NotificationType {
  SUBMISSION_REJECTED
  REVISION_REQUESTED
  PAYMENT_RECEIVED
  DISPUTE_RESOLVED
  TASK_UPDATED
  AUTO_APPROVED
}

// Audit Logs - track all admin actions
model AuditLog {
  id          String   @id @default(cuid())
  action      String   // "BAN_USER", "APPROVE_SUBMISSION", etc.
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: SetNull)
  targetId    String?
  details     Json?
  ipAddress   String?
  createdAt   DateTime @default(now())
  
  @@index([userId])
  @@index([action])
  @@index([targetId])
}

// Platform Settings - admin configuration
model PlatformSettings {
  id              String   @id @default(cuid())
  commissionRate  Decimal  @default(15) // Percentage
  maintenanceMode Boolean  @default(false)
  maxTaskDeadlineDays Int @default(30)
  minTaskTitle    Int      @default(10)
  maxTaskTitle    Int      @default(100)
  slotLockMinutes Int      @default(120) // 2 hours
  autoApprovalHours Int    @default(48)
  updatedAt       DateTime @updatedAt
}

// Streaks - gamification
model Streak {
  id              String   @id @default(cuid())
  userId          String   @unique
  currentStreak   Int      @default(0)
  longestStreak   Int      @default(0)
  lastActiveDate  DateTime @default(now())
  streakBonusEarned Boolean @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### Key Design Decisions:

✅ **Use Prisma ORM** - Type safety, migrations, query builder  
✅ **Use ENUMs not TEXT** - TaskStatus, SubmissionStatus, etc.  
✅ **Soft deletes** - deletedAt field, never hard delete  
✅ **Audit trail** - task_versions for edit history  
✅ **Immutable payments** - agreed_reward locked at acceptance  
✅ **Event sourcing ready** - All actions logged  
✅ **Performance indexes** - On frequently queried fields  
✅ **Referential integrity** - Foreign keys with OnDelete cascade  

---

## 🎨 DESIGN SYSTEM TO REUSE

Keep all existing UI components and visual design:

✅ **Color Scheme:**
- Background: #0A0A1A (dark purple)
- Accent: #6B3FA0 (purple)
- Text: #FFFFFF (white)
- Secondary: #888888 (gray)

✅ **Components to Keep:**
- All 50+ Radix UI components
- TaskCard component structure
- Leaderboard component
- StatsCard component
- Admin sidebar navigation
- AppHeader with mode switcher
- Layout system

✅ **Design:**
- Dark theme
- Glassmorphism card style
- Mobile-first layout (Pi Browser)
- Smooth transitions
- Tailwind CSS utilities

**Rebuild:** Only logic layer (payments, database, API) - NOT visual layer

---

## 📅 TIMELINE: 6 WEEKS

### Week 1: Prisma Schema Design
- **Deliverable:** Complete schema (review before migrations)
- No code changes to app yet
- Focus on data model correctness

### Week 2: Auth System  
- **Deliverable:** Type-safe auth with sessions
- Add agreed_reward storage

### Week 3: Payment Service Rewrite
- **Deliverable:** Robust payment system
- Commission rate from DB
- Failed payment recovery

### Week 4: Notifications & Submissions
- **Deliverable:** Event-driven notifications
- Complete My Work tab
- Slot locking mechanism

### Week 5: Admin System & Disputes  
- **Deliverable:** Full admin capabilities
- Audit logging
- Dispute resolution

### Week 6: Testing & Mainnet Prep
- **Deliverable:** Production-ready code
- Clean test data
- Switch to Mainnet configuration

---

## ✅ WEEK 1 IMMEDIATE NEXT STEPS

### Monday Morning:

1. **Create new branch:** `hybrid-rebuild`
2. **Install Prisma:**
   ```bash
   npm install @prisma/client
   npm install -D prisma
   npx prisma init
   ```
3. **Design complete Prisma schema** (from above)
4. **Share schema with me for review** (before running migrations)
5. **Request approval before Week 1 ends**

### Success Criteria:
- Prisma schema complete and reviewed
- All table relationships correct
- All enums defined
- All validations clear
- Ready to migrate without changes

---

**We are building this right this time. Let's go! 🚀**
