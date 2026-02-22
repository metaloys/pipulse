# 🧪 Feature Testing Guide

This document provides step-by-step testing instructions for the three core features of PiPulse.

## Overview

All three features are now implemented and ready for testing:
1. ✅ **Feature 1:** Worker → Employer role switch with persistent database updates
2. ✅ **Feature 2:** Employer creates and lists tasks
3. ✅ **Feature 3:** Worker discovers and accepts tasks

**Build Status:** ✅ Compiled successfully (12.7s)

---

## 🔄 FEATURE 1: Worker to Employer Role Switch

### Objective
Verify that users can switch roles and the change persists to the Supabase database.

### Setup
1. Open the app in your browser: `http://localhost:3000`
2. Authenticate with Pi Network (or use existing session if already logged in)
3. Verify you're in worker mode (default)

### Testing Steps

#### Step 1: Switch to Employer Mode
```
Action: Click "Switch to Employer" button in app header
Expected Console Output:
  🔄 Switching user role from worker to employer...
  ✅ User role updated to employer: employer
Expected UI Change:
  - Dashboard switches from task list to employer view
  - Header button now shows "Switch to Worker"
```

#### Step 2: Verify Dashboard Changes
```
Action: Observe the dashboard
Expected:
  - "Post Your First Task" section appears instead of task list
  - "Create New Task" button is visible
  - EmployerDashboard component displays (currently empty since no tasks created yet)
```

#### Step 3: Critical Persistence Test
```
Action: Refresh the page (F5 or Cmd+R)
Expected Console Output:
  📋 User role from database: employer
Expected UI:
  - Dashboard remains in employer view
  - No need to click "Switch to Employer" again
  - Role persisted from Supabase ✅
```

#### Step 4: Verify Database Entry
```
Action: Check Supabase dashboard
Navigate to: Database → users table
Find your user row (filter by pi_username or pi_wallet_address)
Expected Values:
  - user_role = 'employer' (not 'worker')
  - Other fields: level, current_streak, etc. remain unchanged
```

#### Step 5: Switch Back to Worker
```
Action: Click "Switch to Worker" button
Expected Console Output:
  🔄 Switching user role from worker to employer...
  ✅ User role updated to worker: worker
Expected UI:
  - Dashboard switches back to task list view
  - Available tasks section appears
  - Header button now shows "Switch to Employer"
```

#### Step 6: Verify Return to Worker
```
Action: Refresh the page (F5)
Expected Console Output:
  📋 User role from database: worker
Expected:
  - Still in worker mode after reload ✅
```

### Success Criteria ✅
- [ ] Role switches immediately and console shows correct messages
- [ ] Dashboard updates to show correct view (worker tasks or employer creation)
- [ ] Role persists after page refresh
- [ ] Supabase users table shows correct user_role value
- [ ] Can switch back and forth without issues
- [ ] No console errors during switching

### Troubleshooting
**Problem:** Button doesn't respond
- **Solution:** Check browser console for errors, verify userData exists

**Problem:** Role doesn't persist after refresh
- **Solution:** Check Supabase RLS policies, verify UPDATE permission on users table

**Problem:** Console shows error instead of success message
- **Solution:** Check network tab in DevTools, verify Supabase connection

---

## 📝 FEATURE 2: Employer Creates Task

### Objective
Verify that employers can create tasks with all required fields and tasks are saved to Supabase.

### Setup
1. Complete **Feature 1** and switch to employer mode
2. You should see "Post Your First Task" section
3. Verify "Create New Task" button is visible

### Testing Steps

#### Step 1: Open Create Task Modal
```
Action: Click "Create New Task" button
Expected:
  - Modal dialog opens
  - Form displays with fields:
    - Task Title (text input)
    - Description (textarea)
    - Category (dropdown with options)
    - Pi Reward (number input)
    - Slots Available (number input)
    - Deadline (date/time picker)
    - Instructions (textarea)
  - Submit button is visible
```

#### Step 2: Fill Form with Valid Data
```
Fill form with:
  Title: "Test Data Entry Task"
  Description: "Categorize 100 data points with accuracy"
  Category: "Data Entry" (from dropdown)
  Pi Reward: 10 (positive number)
  Slots Available: 5 (positive number)
  Deadline: Tomorrow at 5:00 PM (must be future date)
  Instructions: "Follow the template.pdf provided in the drive"

Expected: All fields accept input without errors
```

#### Step 3: Attempt Submission with Missing Field
```
Action: Remove the task title, click Submit
Expected:
  - Form validation error: "Task title is required"
  - Modal stays open, form data preserved
  - Task NOT created
```

#### Step 4: Fix and Submit Valid Form
```
Action: 
  1. Re-enter title
  2. Click Submit button
Expected Console Output:
  📝 Creating new task: {"title":"Test Data Entry Task","category":"Data Entry",...}
  ✅ Task created successfully: {id: "abc123", title: "Test Data Entry Task", ...}
Expected UI:
  - Modal closes
  - Form resets (ready for next task)
  - Dashboard updates to show new task in EmployerDashboard
```

#### Step 5: Verify in Supabase
```
Action: Check Supabase dashboard
Navigate to: Database → tasks table
Expected new row with:
  - id: (auto-generated UUID)
  - title: "Test Data Entry Task"
  - description: "Categorize 100 data points with accuracy"
  - category: "Data Entry"
  - pi_reward: 10
  - slots_available: 5
  - slots_remaining: 5 (initially equals slots_available)
  - deadline: Tomorrow 5:00 PM
  - employer_id: (your user ID)
  - task_status: "open"
  - instructions: "Follow the template.pdf provided in the drive"
  - created_at: Current timestamp
```

#### Step 6: Test Form Validation Rules
```
Test 1 - Negative Reward:
  Pi Reward: -5
  Action: Click Submit
  Expected: Error "Pi reward must be a positive number"

Test 2 - Zero Slots:
  Slots Available: 0
  Action: Click Submit
  Expected: Error "Slots must be a positive number"

Test 3 - Past Deadline:
  Deadline: Yesterday at 3:00 PM
  Action: Click Submit
  Expected: Error "Deadline must be in the future"

Test 4 - Empty Description:
  Description: (empty)
  Action: Click Submit
  Expected: Error "Description is required"
```

#### Step 7: Create Multiple Tasks
```
Action: Create 2 more tasks with different categories:
  - Task 2: "Social Media Content" (Category: Marketing)
  - Task 3: "Coding Review" (Category: Development)

Expected:
  - All three tasks appear in EmployerDashboard list
  - Each task shows in Supabase tasks table
  - employer_id matches for all three tasks
  - Total of 3 rows in tasks table (if first time creating)
```

### Success Criteria ✅
- [ ] Create Task modal opens and displays all form fields
- [ ] Form validation catches missing required fields
- [ ] Form validation catches invalid values (negative numbers, past dates)
- [ ] Valid task submission succeeds and console shows success message
- [ ] Modal closes after successful submission
- [ ] Task appears in EmployerDashboard
- [ ] Task saved to Supabase tasks table with all correct values
- [ ] employer_id correctly set to current user's ID
- [ ] slots_remaining initially equals slots_available
- [ ] Can create multiple tasks without issues
- [ ] No console errors during creation

### Troubleshooting
**Problem:** Form won't submit even with valid data
- **Solution:** Check browser console for error message, verify network connectivity

**Problem:** Task appears in form but not in Supabase
- **Solution:** Check Supabase RLS policies, verify INSERT permission on tasks table

**Problem:** Task appears in Supabase but not in EmployerDashboard
- **Solution:** Refresh page, check onTaskCreated callback is firing

---

## ✅ FEATURE 3: Worker Accepts Task

### Objective
Verify that workers can discover tasks created by employers and accept them.

### Setup
1. Complete **Feature 2** and create at least 2-3 tasks as employer
2. Click "Switch to Worker" button to return to worker mode
3. Page should refresh and show available tasks

### Testing Steps

#### Step 1: View Available Tasks
```
Action: Refresh page and observe dashboard
Expected Console Output:
  📋 User role from database: worker
Expected UI:
  - Task list appears with available tasks
  - Shows all tasks created by any employer
  - Each task card displays: title, description, category, reward, deadline, slots
  - "Accept Task" button visible on each task
```

#### Step 2: Filter Tasks by Category
```
Action: Click on category filter (e.g., "All", "Data Entry", "Marketing")
Expected:
  - Task list updates to show only tasks in selected category
  - Task count changes appropriately
  - Other categories show filtered out
```

#### Step 3: Accept a Task
```
Action: Find "Test Data Entry Task" and click "Accept Task" button
Expected:
  - TaskSubmissionModal opens
  - Shows task details: title, description, reward, deadline
  - Displays "Proof of Work" textarea
  - Submit button available
  - Reads task instructions if provided
```

#### Step 4: Submit Task Proof
```
Action: Fill in proof of work
Example:
  "Completed data categorization. Uploaded results to Google Drive: link-to-file
   Accuracy: 98.5%
   Time taken: 2.5 hours"

Click: "Submit" button

Expected Console Output:
  📝 Submitting task...
  ✅ Task submitted successfully

Expected UI:
  - Modal closes
  - "Accept Task" button on task card may change to "Submission Pending" or disappear
```

#### Step 5: Verify Submission in Supabase
```
Action: Check Supabase dashboard
Navigate to: Database → task_submissions table
Expected new row with:
  - id: (auto-generated UUID)
  - task_id: (ID of the task you accepted)
  - worker_id: (your user ID)
  - proof_text: "Completed data categorization. Uploaded results..."
  - submission_status: "pending"
  - created_at: Current timestamp
  - updated_at: Current timestamp
  - employer_feedback: NULL (until employer reviews)
  - payment_approval_hash: NULL (until employer approves)
```

#### Step 6: Verify Task Slots Decremented
```
Action: Check Supabase tasks table
Find: "Test Data Entry Task" row
Expected:
  - slots_available: still 5 (unchanged)
  - slots_remaining: 4 (decreased from 5 to 4)
```

#### Step 7: Accept Another Task
```
Action: Accept a second task (different category)
Fill proof: "Completed task with results in attached file"
Click Submit

Expected:
  - Another row appears in task_submissions table
  - That task's slots_remaining decreases by 1
  - Console shows success
```

#### Step 8: Verify Leaderboard Update
```
Action: Scroll to Leaderboard section
Expected to see:
  - Your username in leaderboard (if it was updating submissions)
  - Could take time for calculations, or may show in next session
  - Level/streak/stats may be updated
```

#### Step 9: Switch Back to Employer and Verify Submissions
```
Action: Click "Switch to Employer" button
Expected:
  - EmployerDashboard now shows submissions for your tasks
  - Lists both submissions you just created
  - Shows "Pending Review" status for both

Action: Click on submission to see details
Expected:
  - Shows worker username
  - Shows proof text you submitted
  - Buttons for "Approve" and "Reject"
```

#### Step 10: Approve a Submission
```
Action: Click "Approve" button on one submission
Expected Console Output:
  ✅ Submission approved successfully
Expected:
  - Submission status changes to "approved"
  - Task may show as "completed" in list
  - Worker earns the Pi reward
```

### Success Criteria ✅
- [ ] Available tasks display for workers
- [ ] Task filtering by category works correctly
- [ ] TaskSubmissionModal opens when clicking "Accept Task"
- [ ] Can submit proof of work text
- [ ] Submission created in task_submissions table with correct values
- [ ] Task's slots_remaining decremented by 1
- [ ] submission_status set to "pending"
- [ ] Multiple tasks can be accepted
- [ ] Employer can see all submissions for their tasks
- [ ] Employer can approve submissions
- [ ] No console errors during any step
- [ ] No crashes or UI glitches

### Troubleshooting
**Problem:** No tasks appear in worker view
- **Solution:** Verify tasks were created by employer, check if they have empty slots_remaining

**Problem:** Accept button doesn't open modal
- **Solution:** Check browser console for errors, verify TaskSubmissionModal component exists

**Problem:** Submission doesn't save to database
- **Solution:** Check Supabase RLS policies, verify INSERT permission on task_submissions table

**Problem:** slots_remaining not decremented
- **Solution:** Verify submitTask() function in database.ts is updating slots correctly

---

## 📊 Summary Test Matrix

| Feature | Status | Critical Test | Expected Result |
|---------|--------|----------------|-----------------|
| Feature 1: Role Switch | ✅ Implemented | Refresh after switch | Role persists in Supabase |
| Feature 2: Create Task | ✅ Implemented | Submit form | Task appears in Supabase |
| Feature 3: Accept Task | ✅ Implemented | Submit proof | Submission saved, slots -1 |

---

## 🚀 Full Workflow Test

**Complete end-to-end test:**

1. Authenticate as user
2. Switch to employer mode (Feature 1)
3. Create 3 tasks in different categories (Feature 2)
4. Switch back to worker mode (Feature 1)
5. See all 3 tasks in list
6. Accept all 3 tasks (Feature 3)
7. Submit proof for each
8. Switch back to employer
9. See all 3 submissions
10. Approve 2, reject 1
11. Check leaderboard update

**Expected Duration:** ~15-20 minutes

**Success = All three features working without errors!** ✅

---

## 📋 Console Output Reference

### Feature 1: Role Switch
```
// Switch TO employer
🔄 Switching user role from worker to employer...
✅ User role updated to employer: employer

// Refresh page
📋 User role from database: employer
```

### Feature 2: Create Task
```
📝 Creating new task: {
  "title": "Test Data Entry Task",
  "category": "Data Entry",
  "pi_reward": 10,
  "slots_available": 5
}
✅ Task created successfully: {
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Test Data Entry Task",
  "employer_id": "user-id-here"
}
```

### Feature 3: Accept Task
```
📝 Submitting task...
✅ Task submitted successfully
```

### Feature 3: Approve Submission (as Employer)
```
✅ Submission approved successfully
```

---

## 🐛 Debug Checklist

If tests fail, check these in order:

- [ ] Browser console for JavaScript errors
- [ ] Network tab for failed API calls
- [ ] Supabase dashboard for data integrity
- [ ] RLS policies enabled correctly
- [ ] Environment variables set on Vercel
- [ ] Pi SDK loaded successfully
- [ ] Bearer token valid
- [ ] No TypeScript compilation errors

---

## ✅ Test Completion Checklist

After completing all tests, mark these off:

- [ ] Feature 1 tested and passes all criteria
- [ ] Feature 2 tested and passes all criteria
- [ ] Feature 3 tested and passes all criteria
- [ ] Full workflow test completed successfully
- [ ] No unexpected console errors
- [ ] No crashes or performance issues
- [ ] All Supabase data saved correctly
- [ ] Ready for next feature development
