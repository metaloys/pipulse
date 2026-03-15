# Rejection & Revision Workflow Test Guide

## What We Just Deployed ✅

Two new workflows have been added to the submission review system:

### 1. **Reject Submission** 
- Endpoint: `POST /api/submissions/reject`
- UI: Red "Reject" button in submission review modal
- Function: Employer rejects work with mandatory reason (10-500 chars)
- Effect: Task slot is restored to available pool (if no other workers have pending submissions)

### 2. **Request Revision**
- Endpoint: `POST /api/submissions/request-revision`  
- UI: Orange "📝 Request Revision" button in submission review modal
- Function: Employer requests changes with mandatory reason (10-500 chars)
- Effect: Task stays in SUBMITTED status, worker can resubmit

---

## Step-by-Step Testing

### **Phase 1: Setup Test Users & Task**

#### Step 1.1: Create Employer User
1. Visit the app at `http://localhost:3000`
2. Click "Login with Pi"
3. Complete Pi Network authentication (sandbox mode)
4. You'll get a Pi user ID (piUid) and username
5. The system auto-creates a database user with role='worker'
6. **Switch to Employer Mode**: Click the role switch button in the header
   - Your role changes to 'employer'
   - Now you can create tasks

**Expected Result**: Header shows "Employer Mode" 

---

#### Step 1.2: Create Test Task
1. Stay in Employer Dashboard
2. Click "Post Your First Task" or the "+" button
3. Fill in task details:
   - **Title**: "Test App Review"
   - **Description**: "Test the new rejection and revision features"
   - **Category**: "app-testing"
   - **Reward**: "1.5 π" (or any amount)
   - **Available Slots**: "2"
   - **Estimated Duration**: "30 minutes"
4. Click "Create Task"

**Expected Result**: Task appears in "My Tasks" tab with status AVAILABLE and 2 slots remaining

---

### **Phase 2: Worker Submits Task**

#### Step 2.1: Switch to Worker Role
1. Click the role switch button again
2. Confirm you're now in "Worker Mode"
3. Navigate to "Available Tasks" section

**Expected Result**: Your test task appears in the available tasks list showing 2 slots

---

#### Step 2.2: Submit Task Proof
1. Click on your test task card
2. "Task Submission Modal" opens
3. Fill in proof:
   - **Submission Type**: Select "TEXT"
   - **Proof Content**: 
     ```
     Test submission #1
     This is a text proof for testing the rejection workflow.
     App works great, no issues found.
     ```
4. Click "Submit"

**Expected Result**: 
- Task slots decrease from 2 → 1
- Submission appears in pending review section (you'll see this when you switch back to employer)

---

#### Step 2.3 (Optional): Submit Second Task
1. Accept the same task again (you'll see 1 slot remaining)
2. Different proof:
   ```
   Test submission #2
   Another proof to test the revision request feature.
   Should work fine.
   ```
3. Click "Submit"

**Expected Result**: Task now has 0 slots remaining (full capacity)

---

### **Phase 3: Rejection Workflow Test**

#### Step 3.1: Switch Back to Employer
1. Click role switch button
2. Go to "Submissions" tab
3. You should see 1 or 2 submissions in "Pending Review"

**Expected Result**: 
- Pending submissions card shows worker username
- Shows submitted date
- Displays task title and 1.5π reward

---

#### Step 3.2: Open Submission for Review
1. Click on the submission card
2. "Review Submission" modal opens
3. You'll see:
   - Task details and reward
   - Worker name and submission history
   - The proof content submitted
   - All three action buttons at the bottom: **Request Revision** | **Reject** | **Approve & Pay**

**Expected Result**: Modal displays complete review interface with three buttons

---

#### Step 3.3: Reject the Submission
1. Click the red **Reject** button
2. A form appears asking "Reason for Rejection"
3. Type a rejection reason (must be at least 10 characters):
   ```
   The proof lacks sufficient detail about the testing process. Please provide more comprehensive feedback with screenshots demonstrating the app's functionality.
   ```
4. Click **Confirm Rejection**

**Expected Result**:
- Modal closes
- Submission moves to "Rejected" section
- A red badge shows "Rejected"
- Rejection reason is displayed (truncated with "...")
- **IMPORTANT**: Task slot count should increase back to 1 (if this was the only submission for this worker)

---

#### Step 3.4: Verify Slot Restoration
1. Go to "My Tasks" tab
2. Find your test task
3. Check the slot count

**Expected Result**: Slots should show 1 (restored from the rejected submission)

---

### **Phase 4: Revision Request Workflow Test**

#### Step 4.1: Submit New Task (if using Phase 3.3's rejected submission)
1. Switch to Worker mode
2. Resubmit the same task:
   ```
   Resubmission with more detail
   I tested the app thoroughly and found no critical bugs.
   App loads in <2 seconds, UI is responsive, no crashes detected.
   ```
3. Click "Submit"

**Expected Result**: New submission appears in pending review

---

#### Step 4.2: Switch to Employer & Open Submission
1. Switch to Employer mode
2. Go to Submissions tab
3. Click on the latest pending submission

**Expected Result**: Modal opens with three action buttons visible

---

#### Step 4.3: Request Revision
1. Click the orange **📝 Request Revision** button
2. A form appears asking "Why do you need a revision?"
3. Type a revision request (minimum 10 characters):
   ```
   Please provide more details about your testing methodology and include specific test cases you ran.
   ```
4. Click **Request Revision**

**Expected Result**:
- Modal closes
- Return to Submissions tab
- Submission moves to... **NOTICE**: We need to check the database to see if REVISION_REQUESTED status is being tracked

---

#### Step 4.4: Worker Checks Revision Request (Future Feature)
*This requires a "My Work" tab for workers - currently not built*

Once implemented, worker will see:
- Their submission status changed to "REVISION_REQUESTED"
- The revision reason provided by employer
- Option to resubmit with improvements

---

### **Phase 5: Approval Workflow (Baseline)**

#### Step 5.1: Get Back to Approved State
1. Make sure you have a fresh pending submission
2. Switch to Employer mode
3. Open the submission modal
4. Click green **Approve & Pay** button

**Expected Result**:
- Modal closes
- Submission moves to "Approved" section
- Shows green badge "Approved"
- Approval date is displayed

---

## Testing Checklist

### ✅ Endpoint Tests

- [ ] **Reject Endpoint**
  - [ ] Returns 200 on success
  - [ ] Updates submission.status to REJECTED
  - [ ] Stores rejection reason in submission.rejectionReason
  - [ ] Task slot increases if no other pending submissions
  - [ ] Returns 400 if reason < 10 chars
  - [ ] Returns 403 if worker ID mismatch
  - [ ] Returns 404 if submission not found

- [ ] **Request Revision Endpoint**
  - [ ] Returns 200 on success
  - [ ] Updates submission.status to REVISION_REQUESTED
  - [ ] Stores revision reason in submission.revisionReason
  - [ ] Task stays in current state (not returned to available)
  - [ ] Returns 400 if reason < 10 chars
  - [ ] Returns 403 if worker ID mismatch
  - [ ] Returns 404 if submission not found

### ✅ UI Tests

- [ ] **Submission Modal**
  - [ ] Shows three buttons for SUBMITTED submissions: Request Revision | Reject | Approve
  - [ ] Reject button shows form when clicked
  - [ ] Request Revision button shows form when clicked
  - [ ] Forms have character minimum validation
  - [ ] Cancel buttons close forms without action

- [ ] **Employer Dashboard**
  - [ ] Rejected submissions appear in "Rejected" section
  - [ ] Rejection reason displayed with red background
  - [ ] Can click rejected submissions to view details
  - [ ] Original task remains updated (slots restored)

### ✅ Data Integrity Tests

- [ ] **Database State After Rejection**
  - [ ] Submission has status='REJECTED'
  - [ ] Submission.rejectionReason contains reason
  - [ ] Task.slotsRemaining increased (if applicable)
  - [ ] Timestamp fields updated (reviewedAt, updatedAt)

- [ ] **Database State After Revision Request**
  - [ ] Submission has status='REVISION_REQUESTED'
  - [ ] Submission.revisionReason contains reason
  - [ ] Task.slotsRemaining unchanged
  - [ ] Timestamp fields updated (revisionRequestedAt, updatedAt)

---

## Known Limitations (To Be Built)

1. **Worker "My Work" Tab** - Workers currently can't see rejection/revision reasons
2. **Revision Resubmission** - Workers can't resubmit revised work yet
3. **Notifications** - No email/push notifications on rejection/revision request
4. **Dispute System** - Workers can't dispute rejections

---

## Quick Test Commands

### Check Submission Status in Database
```sql
SELECT id, status, rejectionReason, revisionReason, workerId, taskId 
FROM submissions 
WHERE id = '{submission_id}' 
LIMIT 1;
```

### Check Task Slots Restored
```sql
SELECT id, title, slots_remaining, slots_available 
FROM tasks 
WHERE id = '{task_id}' 
LIMIT 1;
```

### View All Submissions for Employer
```sql
SELECT s.id, s.status, s.rejectionReason, s.revisionReason, u.piUsername 
FROM submissions s
JOIN users u ON s.workerId = u.id
JOIN tasks t ON s.taskId = t.id
WHERE t.employerId = '{employer_id}'
ORDER BY s.createdAt DESC;
```

---

## Success Criteria ✅

Test is **PASSED** when:

1. ✅ Can reject with reason → submission status changes to REJECTED
2. ✅ Can request revision with reason → submission status changes to REVISION_REQUESTED  
3. ✅ Rejection reason appears in rejected submission view
4. ✅ Rejected submission moves to "Rejected" section in dashboard
5. ✅ Task slot is restored after rejection (if only submission)
6. ✅ Can still approve submissions (baseline feature still works)
7. ✅ No database errors in console
8. ✅ All API endpoints return correct status codes

---

## Notes for Debugging

### Common Issues

**Issue**: Button doesn't show revision form
- **Solution**: Check browser console for errors
- **Debug**: Click button, watch for state changes in React DevTools

**Issue**: Task slots don't restore
- **Solution**: Check if there are other pending submissions from different workers
- **Debug**: Query database to verify other submissions exist with status='SUBMITTED'

**Issue**: API returns 403 error
- **Solution**: Check that workerId in request matches submission.workerId
- **Debug**: Log the submission data in console before API call

**Issue**: Build fails after changes
- **Solution**: Run `pnpm run build` to verify TypeScript
- **Debug**: Check for missing imports or type mismatches

---

## Next Steps After Testing

Once this workflow is verified:

1. Build "My Work" tab for workers to see rejections/revisions
2. Implement resubmission flow for revised work
3. Add notification system (email alerts on rejection/revision)
4. Build dispute system for workers to challenge rejections
5. Create admin dashboard to monitor rejection rates
