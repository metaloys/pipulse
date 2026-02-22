# 🧪 Multi-User Testing Guide - Employer & Worker Testing

**Goal:** Test the complete task workflow with 2 different users (employer + worker)

---

## 📱 Setup: Creating Multiple Test Accounts

You have **3 options** depending on your setup:

### Option 1: Two Browser Tabs (Simplest)
```
Main Tab:   http://localhost:3000 (logged in as User A - Employer)
Incognito Tab: http://localhost:3000 (logged in as User B - Worker)
```
✅ **Best for:** Single device testing  
⚠️ **Note:** Use incognito/private browsing to avoid session conflicts

### Option 2: Two Devices
```
Device 1 (Desktop): http://localhost:3000 (Employer Account)
Device 2 (Phone/Tablet): http://<YOUR_IP>:3000 (Worker Account)
Example: http://192.168.1.66:3000
```
✅ **Best for:** Testing real mobile experience  
✅ **Most realistic testing**

### Option 3: Two Browser Profiles
```
Firefox Profile 1: Employer
Firefox Profile 2: Worker
Chrome Profile 1: Employer
Chrome Profile 2: Worker
```
✅ **Best for:** Persistent separate sessions

---

## 🎯 Complete Workflow Test (30 minutes)

### Phase 1: Setup (3 minutes)

#### On Browser/Device 1 (EMPLOYER):
```
1. Go to http://localhost:3000
2. Click "Authenticate with Pi"
3. Complete Pi Network authentication
4. You are now logged in as EMPLOYER
5. Verify your role shows as "Employer" in settings
```

#### On Browser/Device 2 (WORKER):
```
1. Open incognito tab or different browser
2. Go to http://localhost:3000
3. Click "Authenticate with Pi"
4. Use DIFFERENT Pi account/username
5. Complete authentication
6. Verify your role shows as "Worker" in settings
```

✅ **Success Criteria:**
- User 1: Dashboard shows "Employer" mode
- User 2: Dashboard shows "Worker" mode
- No auth conflicts (each session independent)

---

### Phase 2: Employer Creates Task (5 minutes)

#### On Employer Device:
```
1. Navigate to Dashboard (you should be in Employer mode)
2. Click "My Tasks" tab
3. Click "Create New Task" button
4. Fill in form:
   Title: "Review 10 product photos"
   Description: "Select best quality photos from batch A"
   Category: "review"
   Reward: 15 π
   Slots: 2 (allow 2 workers)
   Deadline: 3 days from now
   Instructions: "Check for: clarity, lighting, composition. Rate 1-5"
5. Click "Submit Task"

Expected:
✅ Task appears in "My Tasks" list
✅ Console shows: "✅ Task created successfully"
✅ Task shows countdown timer (e.g., "3d 5h 22m")
✅ Slots badge shows: "2/2 slots"
```

#### Verify in Database:
```sql
-- Check Supabase: tasks table
SELECT id, title, employer_id, slots_available, slots_remaining, task_status
FROM tasks
WHERE title LIKE '%product photos%'
LIMIT 1;

Expected: employer_id matches your user ID, slots_remaining = 2
```

---

### Phase 3: Worker Discovers & Accepts Task (5 minutes)

#### On Worker Device:
```
1. Make sure you're in "Worker" mode (check settings)
2. You should see "Available Tasks" section
3. Look for task "Review 10 product photos"
4. Task should appear in list with:
   ✅ Title: "Review 10 product photos"
   ✅ Reward: 15 π
   ✅ Slots: 2/2
   ✅ Countdown timer showing time remaining
   ✅ Category badge: "review"
5. Click "Accept Task" button on the task card
6. Modal opens for task submission

Expected:
✅ Task moves to "Accepted Tasks" section
✅ Console shows: "✅ Task submitted successfully"
✅ Slots decrement on employer side
```

#### Verify in Database:
```sql
-- Check: task_submissions table
SELECT id, task_id, worker_id, submission_status, submitted_at
FROM task_submissions
WHERE worker_id = '[WORKER_ID]'
ORDER BY submitted_at DESC
LIMIT 1;

Expected: submission_status = 'pending'
```

---

### Phase 4: Worker Submits Proof (5 minutes)

#### On Worker Device (in submission modal):
```
1. Modal is open for task submission
2. Enter proof of completion:
   Type: "text"
   Content: "I reviewed 10 photos:
   - 7 photos rated 5/5 (excellent)
   - 3 photos rated 4/5 (good)
   - All have good lighting and clarity"
3. OR upload a screenshot/photo as proof
4. Click "Submit Proof" button

Expected:
✅ Submission created
✅ Status changes to "Pending Review"
✅ You see message: "Submission sent successfully"
✅ Cannot resubmit (button disabled or hidden)
```

#### Check on Employer Device:
```
1. Go to "Submissions" tab
2. Look for "Pending Review" section
3. You should see:
   ✅ Task name: "Review 10 product photos"
   ✅ Worker username
   ✅ Submission timestamp
   ✅ Status badge: "Pending"
   ✅ Reward amount: 15 π
```

---

### Phase 5: Employer Reviews & Approves (5 minutes)

#### On Employer Device:
```
1. In Submissions tab → Pending Review section
2. Click on the submission card
3. Review modal opens showing:
   ✅ Worker name
   ✅ Task title
   ✅ Full submission proof text/image
   ✅ Submission date/time
4. Click "Approve" button

Expected:
✅ Submission moves to "Approved" section
✅ Status changes to green "Approved" badge
✅ Console shows: "✅ Submission approved"
✅ Worker receives payment notification (if implemented)
```

#### Verify in Database:
```sql
-- Check submission status changed
SELECT submission_status, reviewed_at
FROM task_submissions
WHERE id = '[SUBMISSION_ID]';

Expected: submission_status = 'approved'

-- Check transaction created (payment record)
SELECT sender_id, receiver_id, amount, pipulse_fee
FROM transactions
WHERE task_id = '[TASK_ID]'
ORDER BY timestamp DESC
LIMIT 1;

Expected: receiver_id = worker_id, amount = 12.75 π (15 * 0.85)
```

---

### Phase 6: Test Rejection Flow (3 minutes)

#### Create Another Task (Employer):
```
1. Create task: "Categorize 20 items"
2. Set reward: 10 π
3. Set slots: 1
4. Submit
```

#### Accept & Submit (Worker):
```
1. Find the new task
2. Accept task
3. Submit proof: "I categorized the items but only did 15"
```

#### Reject Submission (Employer):
```
1. Go to Pending Review
2. Click on submission
3. Click "Reject" button
4. Enter reason: "Only 15 items, needed 20. Please redo."
5. Confirm rejection

Expected:
✅ Submission moves to "Rejected" section
✅ Status badge turns red "Rejected"
✅ Rejection reason visible
✅ No payment sent to worker
```

---

## 🎬 Advanced Scenarios

### Scenario A: Worker Resubmits After Rejection
```
1. Worker sees rejection reason
2. Worker accepts same task again (or manually resubmits)
3. Resubmits with better proof
4. Employer approves second submission
5. Worker paid successfully

✅ Tests: Worker can try again, multiple submissions per task allowed
```

### Scenario B: Multiple Workers on One Task
```
Employer creates task with slots = 3

Worker 1: Accepts → Submits → Approved ✅
Worker 2: Accepts → Submits → Approved ✅
Worker 3: Accepts → Submits → (Pending or Rejected)

✅ Tests: Slots management, multiple workers on same task
```

### Scenario C: Deadline Countdown Live
```
1. Create task with deadline: 1 hour from now
2. Watch countdown timer on employer device (should show "1h Xm")
3. Wait 30 seconds
4. Refresh page
5. Countdown should have decremented (e.g., "1h Xm-30s")
6. Create task with deadline: 5 minutes from now
7. Watch timer count down to expiry

✅ Tests: Countdown accuracy, color changes (green → orange → red)
```

### Scenario D: Edit & Delete Tasks
```
Employer Device - Edit:
1. Create task with reward = 5 π
2. Click edit button
3. Change reward to 20 π
4. Save changes
5. Verify change on task card

Worker Device - See Update:
1. Refresh page (or check in real-time)
2. Task now shows 20 π reward
3. Accept task and submit proof
4. Employer approves and pays 20 π (minus 15% fee = 17 π)

Employer Device - Delete:
1. Create task with no slots accepted
2. Click delete button
3. Confirm deletion
4. Task disappears from list

✅ Tests: CRUD operations work across users
```

---

## ✅ Test Checklist

### Employer Features
- [ ] Can create task with all fields
- [ ] Can see all created tasks in "My Tasks"
- [ ] Can edit task details (title, reward, slots, deadline)
- [ ] Can delete task (if no submissions)
- [ ] Cannot delete task if worker submissions exist
- [ ] Can see countdown timer on all tasks
- [ ] Countdown updates every second
- [ ] Can view all submissions in "Submissions" tab
- [ ] Can approve pending submissions
- [ ] Can reject submissions with reason
- [ ] Can see approved/rejected history
- [ ] Payment calculation correct (15% fee deducted)

### Worker Features
- [ ] Can see available tasks (not own tasks)
- [ ] Can see task countdown timer
- [ ] Can accept task
- [ ] Can submit proof (text/file/image)
- [ ] Cannot see own tasks as employer
- [ ] Can see submission status after accept
- [ ] Can see approval/rejection result
- [ ] Can see rejection reason
- [ ] Can resubmit after rejection
- [ ] Receives payment notification on approval

### System Features
- [ ] Tasks properly filtered by role
- [ ] Slots decrement on acceptance
- [ ] Countdown timer accurate
- [ ] Submissions tracked properly
- [ ] Payments calculated correctly (85% worker, 15% PiPulse)
- [ ] Transactions recorded in database
- [ ] No data leaks between users
- [ ] Session isolation working

---

## 🐛 Troubleshooting

### Problem: Worker can't see any tasks
**Solution:**
- Check that worker is in "Worker" mode (not employer)
- Check worker's account is different from employer account
- Worker shouldn't see tasks created by themselves
- Refresh page to reload task list

### Problem: Task doesn't appear on worker side after creation
**Solution:**
- Verify task was created (check employer "My Tasks")
- Task status should be "available" (check Supabase)
- Worker may need to refresh page
- Check browser console for errors

### Problem: Countdown timer not updating
**Solution:**
- Refresh the page to restart the timer useEffect
- Check browser console for JavaScript errors
- Deadline may already be past (timer shows "Expired")
- Check local browser time vs server time

### Problem: Submission doesn't appear in Pending Review
**Solution:**
- Verify submission was created (check database)
- Employer may need to refresh "Submissions" tab
- Check that submission_status = 'pending' in database
- Verify task_id links correctly to employer's task

### Problem: Payment not showing after approval
**Solution:**
- Check transactions table for the payment record
- Verify amount calculated correctly: reward * 0.85
- Check worker's account balance updated (if implemented)
- Check Pi Network API connectivity

---

## 📊 Database Verification Queries

### List all tasks by employer
```sql
SELECT id, title, employer_id, slots_remaining, task_status, deadline
FROM tasks
WHERE employer_id = '[YOUR_EMPLOYER_ID]'
ORDER BY created_at DESC;
```

### List all submissions by worker
```sql
SELECT id, task_id, submission_status, submitted_at, reviewed_at
FROM task_submissions
WHERE worker_id = '[YOUR_WORKER_ID]'
ORDER BY submitted_at DESC;
```

### Check payment transactions
```sql
SELECT sender_id, receiver_id, amount, pipulse_fee, task_id, transaction_status
FROM transactions
WHERE task_id = '[TASK_ID]';
```

### Verify task-submission relationship
```sql
SELECT t.title, ts.submission_status, ts.worker_id, u.pi_username
FROM tasks t
LEFT JOIN task_submissions ts ON t.id = ts.task_id
LEFT JOIN users u ON ts.worker_id = u.id
WHERE t.id = '[TASK_ID]';
```

---

## 🚀 Ready to Test?

1. **Setup Two Accounts:**
   - Open main browser: log in as Employer
   - Open incognito window: log in as Worker

2. **Run Through Phases 1-5** (30 minutes total)

3. **Check Results:**
   - Can employer create and manage tasks? ✅
   - Can worker find and accept tasks? ✅
   - Can submissions be reviewed and paid? ✅
   - Do countdowns work? ✅

4. **Create Documentation:**
   - Screenshot workflow
   - Document any bugs
   - Note what works vs needs fixing

---

**Next Steps After Testing:**
- If everything works: implement Worker CRUD (edit/delete submissions)
- If issues found: fix them and retest
- If blocked: document blocker and next steps

