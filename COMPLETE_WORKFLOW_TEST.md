# 🎯 Complete Task Workflow Testing Guide

**Status:** ✅ All implementation complete and build verified

---

## 📋 What's Now Implemented

### ✅ Role-Based Task Filtering
- **Worker View:** Only sees tasks created by OTHER users (not their own)
- **Employer View:** Only sees tasks they created
- **Filtering Logic:** Applied automatically when loading tasks

### ✅ Task Submission Workflow
1. Worker accepts task → submission modal opens
2. Worker enters proof of work (text/photo/file)
3. Submission saved to `task_submissions` table
4. Task `slots_remaining` automatically decremented
5. Both stored to Supabase

### ✅ Submission Tracking
- Submissions have status: `pending` (awaiting employer review)
- Employer can approve/reject submissions
- Worker can see submission status

---

## 🧪 Complete Test Scenario (15 minutes)

### Phase 1: Create Tasks as Employer (5 min)

**Step 1: Authenticate**
```
1. Open http://localhost:3000
2. Click "Authenticate with Pi"
3. Complete Pi Browser auth
4. Wait for "✅ Pi Network authentication successful"
```

**Step 2: Switch to Employer Mode**
```
1. Click "Switch to Employer" button (app header)
2. Expected: Dashboard changes to employer view
3. Check console: 🔄 Switching role...
4. Check console: ✅ User role updated to employer
```

**Step 3: Create First Task**
```
1. Click "Create New Task" button
2. Fill form:
   - Title: "Take photo of Heineken sign"
   - Description: "Find a Heineken bar near you and take a clear photo of the sign"
   - Category: "Photo Capture"
   - Reward: 10 (π coins)
   - Slots: 3 (slots for 3 workers)
   - Deadline: Tomorrow at 6 PM
   - Instructions: "Photo must show bar name clearly visible"

3. Click "Submit"
4. Check console:
   ✅ Task created successfully
5. Verify task appears in Supabase tasks table
```

**Step 4: Create Second Task**
```
1. Click "Create New Task" again
2. Fill form:
   - Title: "Write review of local restaurant"
   - Description: "Visit a restaurant and write honest review"
   - Category: "Writing"
   - Reward: 8 (π coins)
   - Slots: 2
   - Deadline: Tomorrow at 9 PM
   - Instructions: "Review should be 200+ words, honest feedback"

3. Click "Submit"
4. Verify second task created in Supabase
```

**Step 5: Verify Tasks Created**
- Go to Supabase dashboard
- Check **tasks** table
- Should see 2 new rows with:
  - Your `employer_id` 
  - `slots_remaining = slots_available` (3 and 2)
  - `task_status = "available"`

---

### Phase 2: Switch to Worker & Accept Tasks (5 min)

**Step 1: Switch to Worker Mode**
```
1. Click "Switch to Worker" button (app header)
2. Expected: Dashboard changes to task list
3. Check console:
   📋 Filtered tasks: X total, Y available for worker (excluded Z own tasks)
```

**Critical Check:** Your two created tasks should NOT appear in the list! ✅

**Step 2: View Available Tasks**
```
1. You should see task list
2. Should include:
   - The 2 tasks you created are HIDDEN ✅
   - Any other employer tasks are visible
   - Task cards show: title, category, reward, deadline, slots

3. If no other tasks visible, create another user and have them create tasks first
```

**Step 3: Accept First Task**
```
1. Click "Accept Task" on any available task
2. TaskSubmissionModal opens showing:
   - Task title
   - Task description
   - Reward amount
   - Deadline
   - Instructions

3. Enter proof text in textarea:
   "Photo attached at: [link/path]. Clear Heineken sign visible."

4. Click "Submit"
5. Check console:
   ✅ Task submitted successfully
```

**Step 4: Verify Submission Created**
- Go to Supabase dashboard
- Check **task_submissions** table
- New row should exist with:
  - `task_id`: ID of the task
  - `worker_id`: Your user ID
  - `proof_content`: What you entered
  - `submission_status`: "pending"

**Step 5: Verify Slots Decremented**
- Check **tasks** table
- Find the task you accepted
- `slots_remaining` should be decreased by 1
  - Was: 3 → Now: 2 ✅

**Step 6: Accept Second Task (Optional)**
```
1. Click "Accept Task" on another available task
2. Enter different proof
3. Click Submit
4. Verify in Supabase:
   - New row in task_submissions
   - That task's slots_remaining decreased
```

---

### Phase 3: Verify Employer View (3 min)

**Step 1: Switch Back to Employer**
```
1. Click "Switch to Employer" button
2. Dashboard should show:
   - Your 2 created tasks
   - NOT the tasks other users created
```

**Step 2: View Your Task Details**
```
1. In EmployerDashboard, you should see your tasks
2. Click on a task to see:
   - Submissions from workers
   - Worker usernames
   - Proof content they submitted
   - Status: "Pending Review"
```

**Step 3: Approve/Reject Submission**
```
1. Click "Approve" button on a submission
2. Expected: Submission status changes to "approved"
3. Worker earns the reward (8.5 π if 15% commission)

OR

1. Click "Reject" button with reason
2. Expected: Status changes to "rejected"
3. Slots_remaining increases back
4. Worker can resubmit or appeal
```

---

## 📊 Expected Console Output

### When Switching to Worker
```
🔄 Switching user role from employer to worker...
✅ User role updated to worker: worker
[after page loads in worker mode]
📋 Filtered tasks: 5 total, 3 available for worker (excluded 2 own tasks)
```

### When Accepting Task
```
📝 Submitting task proof for task: abc-123-def
✅ Task submitted successfully with ID: xyz-789
📉 Task slots updated: 3 → 2
```

### When Switching Back to Employer
```
🔄 Switching user role from worker to employer...
✅ User role updated to employer: employer
```

---

## ✅ Success Checklist

### Task Creation
- [ ] Can create task with all fields
- [ ] Form validation works
- [ ] Task appears in Supabase
- [ ] Task shows in employer dashboard
- [ ] Task status is "available"

### Worker Task View
- [ ] Own tasks are HIDDEN when in worker mode
- [ ] Other employer tasks are visible
- [ ] Task filtering message shows in console
- [ ] Task details display correctly

### Task Acceptance
- [ ] Accept button opens submission modal
- [ ] Modal shows correct task details
- [ ] Proof textarea accepts input
- [ ] Submit button works
- [ ] Console shows success message

### Submission Verification
- [ ] Submission row created in Supabase
- [ ] Submission has correct task_id
- [ ] Submission has correct worker_id
- [ ] Submission has proof_content
- [ ] Submission status is "pending"

### Slots Management
- [ ] Original task slots_remaining decreased
- [ ] Correct amount decreased (by 1)
- [ ] Task still available if slots > 0
- [ ] Task disappears if slots = 0

### Employer Submission View
- [ ] Employer sees submissions on their tasks
- [ ] Can approve submissions
- [ ] Can reject submissions
- [ ] Approved shows correct status

### Role Filtering
- [ ] Worker sees only other employer tasks
- [ ] Employer sees only own tasks
- [ ] Filtering persists across page reload
- [ ] No console errors

---

## 🔍 Database Verification

### Users Table
```
✅ Check your row:
   - user_role = "worker" or "employer"
   - pi_username = your username
   - last_active_date updated
```

### Tasks Table
```
✅ Check created tasks:
   - employer_id = your user ID
   - task_status = "available"
   - slots_remaining ≤ slots_available
   - created_at = recent timestamp
```

### Task_Submissions Table
```
✅ Check submissions:
   - task_id = correct task
   - worker_id = correct worker
   - proof_content = what you entered
   - submission_status = "pending" or "approved"
   - submitted_at = recent timestamp
```

---

## 🛠️ Troubleshooting

### Problem: Own tasks visible in worker mode
**Solution:**
- Page not refreshed after role switch
- Check browser console for filtering message
- Try F5 refresh
- Check that loadData function is called

### Problem: Slots not decremented
**Solution:**
- Check updateTask was called (console should show "📉 Task slots updated")
- Verify task table in Supabase manually
- Check for database errors in console

### Problem: Submission not saved
**Solution:**
- Check task_submissions table in Supabase
- Verify database permissions (RLS already fixed)
- Check console for submitTask error message
- Try submitting again

### Problem: Role switch doesn't persist
**Solution:**
- Check users table - role should be updated
- Refresh page after role switch
- Check console for success message

### Problem: Employer can't see submissions
**Solution:**
- Make sure you switched BACK to employer mode
- Submissions should be in task_submissions table
- Check that submission.task_id matches your task.id
- Verify EmployerDashboard component logic

---

## 📱 Multi-User Testing (Advanced)

If you have 2+ devices/browsers:

### Setup
1. **Device 1 (Employer):** Create 3 tasks
2. **Device 2 (Worker):** Accept 2 tasks from Device 1
3. **Device 1:** See submissions, approve 1, reject 1
4. **Device 2:** See approval/rejection status

---

## 🎯 Final Verification

After completing all steps:

1. ✅ Employer can create multiple tasks
2. ✅ Worker can see tasks (but not own)
3. ✅ Worker can accept tasks
4. ✅ Worker can submit proof
5. ✅ Slots decrement correctly
6. ✅ Employer can approve/reject
7. ✅ Role filtering works both ways
8. ✅ Data persists in Supabase
9. ✅ No console errors
10. ✅ Full workflow works end-to-end

**If all ✅:** Implementation is complete and working! 🎉

---

## 📝 Notes

- Slots are automatically managed (decrease on submission)
- Can't submit to same task twice (optional: add check)
- Worker can submit to multiple tasks
- Employer can approve/reject multiple submissions
- Payment calculated after approval (15% commission)

---

**Ready to test!** Follow the three phases above. 🚀
