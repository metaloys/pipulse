# 🎯 Employer CRUD Operations Testing Guide

**Status:** ✅ Fully implemented and build verified  
**Build Time:** 13.3s (zero errors)  
**Test Duration:** ~20 minutes  

---

## 📋 What's Implemented

### CREATE ✅ (Already had)
- CreateTaskModal with full validation
- Form fields: title, description, category, reward, slots, deadline, instructions
- Saves to Supabase tasks table

### READ ✅ (New in TaskManagement)
- Task list displays all employer's tasks
- Shows: title, description, category, reward, remaining/available slots, status
- Color-coded badges
- Quick view modal with full task details

### UPDATE ✅ (New in TaskManagement)
- Edit button on each task card
- Modal with all editable fields
- Form validation (positive numbers, future deadline)
- Updates Supabase in real-time

### DELETE ✅ (New in TaskManagement)
- Delete button with confirmation
- Prevents deletion of tasks with submissions
- Shows warning if task has active work
- Deletes from Supabase

---

## 🧪 Complete CRUD Test (20 minutes)

### Setup
```bash
npm run dev
# Open http://localhost:3000
# Authenticate with Pi
# Switch to employer mode
```

---

## Phase 1: CREATE (3 minutes)

### Test 1.1: Create First Task
```
1. Click "Create New Task" button
2. Fill form:
   Title: "Classify 100 product images"
   Description: "Categorize product images into food/non-food"
   Category: "data-entry"
   Reward: 15 π
   Slots: 5
   Deadline: 3 days from now
   Instructions: "Use the provided template"
3. Click Submit

Expected:
  ✅ Console: "✅ Task created successfully"
  ✅ Task appears in dashboard
  ✅ Supabase: New row in tasks table
```

### Test 1.2: Create Second Task
```
1. Click "Create New Task" again
2. Fill form:
   Title: "Write product reviews"
   Description: "Write honest reviews of 5 products"
   Category: "writing"
   Reward: 20 π
   Slots: 3
   Deadline: Tomorrow
   Instructions: "500+ words per review"
3. Click Submit

Expected:
  ✅ Two tasks now in "My Tasks" section
  ✅ Both appear in Supabase tasks table
  ✅ Correct employer_id for both
```

---

## Phase 2: READ (5 minutes)

### Test 2.1: View Task List
```
1. Dashboard should show "My Tasks" section
2. Both created tasks visible
3. For each task, see:
   ✅ Title and description
   ✅ Category badge
   ✅ Reward (15 π, 20 π)
   ✅ Slots badge (5/5 and 3/3)
   ✅ Status badge ("available")
```

### Test 2.2: Quick View Modal
```
1. Click eye icon (👁️) on first task
2. Modal opens showing:
   ✅ Full title
   ✅ Full description
   ✅ Category: "data-entry"
   ✅ Reward: 15 π
   ✅ Available Slots: 5
   ✅ Remaining Slots: 5
   ✅ Status: "available"
   ✅ Deadline date
   ✅ Full instructions
3. Click "Close"
```

### Test 2.3: Submit View for Both Tasks
```
1. Click eye icon on second task
2. Verify all details display correctly
3. Check deadline shows correctly formatted date
4. Close modal
```

### Test 2.4: Tab Navigation
```
1. You should see two tabs:
   - "My Tasks" (currently active, showing 2 tasks)
   - "Submissions" (0 submissions initially)
2. Tab styling shows active state
```

---

## Phase 3: UPDATE (6 minutes)

### Test 3.1: Edit Task Details
```
1. Click edit icon (✏️) on "Classify 100 product images" task
2. Modal opens with all fields pre-filled:
   ✅ Title: "Classify 100 product images"
   ✅ Description filled
   ✅ Category: "data-entry"
   ✅ Reward: 15
   ✅ Slots: 5
   ✅ Deadline set
   ✅ Instructions filled
```

### Test 3.2: Update Task Fields
```
1. Change following fields:
   Title: "Classify 200 product images" (increase from 100)
   Reward: 25 π (increase from 15)
   Slots: 8 (increase from 5)
   Instructions: "Add new instruction line"
   
2. Click "Save Changes"

Expected:
  ✅ Modal closes
  ✅ Task list refreshes
  ✅ Updated values visible in task card
  ✅ Console shows success
  ✅ Supabase shows updated values
```

### Test 3.3: Update Category
```
1. Click edit icon on writing task
2. Change Category dropdown from "writing" to "review"
3. Update Description: "Added more detail"
4. Click "Save Changes"

Expected:
  ✅ Category badge changes to "review"
  ✅ Description updated in card
  ✅ Supabase reflects changes
```

### Test 3.4: Update Deadline
```
1. Click edit on any task
2. Change deadline to 1 week from now
3. Save

Expected:
  ✅ Deadline persists
  ✅ No validation errors
  ✅ Updated in Supabase
```

### Test 3.5: Form Validation
```
1. Click edit on a task
2. Try invalid inputs:
   
   a) Change reward to -5
   Click Save → "Task reward must be positive"
   
   b) Change slots to 0
   Click Save → "Slots available must be positive"
   
   c) Change deadline to yesterday
   Click Save → "Deadline must be in the future"
   
   d) Clear title
   Click Save → "Task title is required"

Expected:
  ✅ Error message appears
  ✅ Modal stays open
  ✅ Can fix and retry
```

---

## Phase 4: DELETE (3 minutes)

### Test 4.1: Delete Without Submissions
```
1. Create a test task (title: "Delete Test"):
   - Reward: 5 π
   - Slots: 2
   - Fill all fields
   - Click Submit

2. New task appears in list

3. Click trash icon (🗑️) on "Delete Test" task

Expected:
  ✅ Delete icon is ENABLED (not grayed out)
  ✅ Confirmation modal opens
  ✅ Shows task title: "Delete Test"
```

### Test 4.2: Confirm Deletion
```
1. In deletion confirmation modal:
   ✅ Shows task being deleted
   ✅ "Delete Task" button is clickable

2. Click "Delete Task" button

Expected:
  ✅ Modal closes
  ✅ Task disappears from list
  ✅ Task count decreases (now 2 instead of 3)
  ✅ Console shows: "🗑️ Task deleted successfully"
  ✅ Supabase: Task row deleted
```

### Test 4.3: Prevent Delete with Submissions
```
1. Have a worker accept one of your tasks first
   (or have 1+ submission for a task)

2. Try to click trash icon on that task

Expected:
  ✅ Trash icon is DISABLED (grayed out)
  ✅ Tooltip shows: "Cannot delete task with submissions"
  ✅ Cannot delete task with active work

3. Click on the disabled trash icon (nothing happens)
```

### Test 4.4: Understand Delete Constraints
```
Task deletion rules:
  ✅ Can delete: Tasks with NO submissions
  ✅ Cannot delete: Tasks with ≥1 submission
  
Why? Protect worker submissions from being orphaned
```

---

## 📊 Database Verification

### After CREATE (Test 1):
```
Supabase tasks table should have:
  Row 1: "Classify 100 product images"
    - employer_id: your ID
    - pi_reward: 15
    - slots_available: 5
    - slots_remaining: 5
    - task_status: "available"
    
  Row 2: "Write product reviews"
    - employer_id: your ID
    - pi_reward: 20
    - slots_available: 3
    - slots_remaining: 3
    - task_status: "available"
```

### After UPDATE (Test 3):
```
Supabase tasks table should show:
  Row 1 (updated):
    - title: "Classify 200 product images" (changed!)
    - pi_reward: 25 (changed!)
    - slots_available: 8 (changed!)
    - updated_at: Recent timestamp
```

### After DELETE (Test 4):
```
Supabase tasks table:
  - "Delete Test" task GONE
  - Total task count: 2
  - Remaining tasks: Classify 200 + Write reviews
```

---

## ✅ Success Checklist

### CREATE
- [ ] Task form opens with all fields
- [ ] Form accepts all input types
- [ ] Submit button works
- [ ] Task appears in list immediately
- [ ] Task saved to Supabase with correct values
- [ ] Multiple tasks can be created

### READ
- [ ] Tasks list shows all employer tasks
- [ ] Each task displays: title, description, category, reward, slots, status
- [ ] Quick view modal shows all details
- [ ] Badges display correctly with colors
- [ ] Tab navigation works between "My Tasks" and "Submissions"

### UPDATE
- [ ] Edit button opens modal with pre-filled fields
- [ ] Can edit each field independently
- [ ] Form validation catches invalid inputs
- [ ] Error messages display clearly
- [ ] Save button updates Supabase
- [ ] UI refreshes to show updated values
- [ ] Can update multiple fields at once

### DELETE
- [ ] Delete button visible on each task
- [ ] Delete opens confirmation dialog
- [ ] Confirmation shows task title
- [ ] Delete removes from UI immediately
- [ ] Delete removes from Supabase
- [ ] Cannot delete tasks with submissions (button disabled)
- [ ] Warning tooltip shown for disabled delete

---

## 🛠️ Troubleshooting

### Problem: Edit modal doesn't open
**Solution:**
- Check browser console for errors
- Verify task data loads properly
- Try refreshing page

### Problem: Update doesn't save
**Solution:**
- Check form validation (all required fields filled?)
- Check Supabase connection
- Check network tab for failed requests

### Problem: Delete button grayed out
**Solution:**
- This is expected if task has submissions
- Hover over button to see tooltip
- Accept a task first, then try again if testing

### Problem: Slots show wrong numbers
**Solution:**
- Refresh page to reload from database
- Check that update actually saved to Supabase
- Verify slots_remaining is being decremented when workers accept

---

## 📱 Advanced Testing

### Multi-User CRUD (if 2+ devices)
```
Device 1 (Employer):
  1. Create task "Review Photos"
  2. Edit reward from 10 to 15 π
  3. Share with Device 2 user

Device 2 (Worker):
  1. See the updated task (15 π)
  2. Accept task
  3. Submit proof

Device 1 (Employer):
  1. Switch to "Submissions" tab
  2. See submission
  3. Edit the task (reward still 15)
  4. Try to delete (button disabled)
  5. Approve submission
  6. Delete now succeeds (submissions completed)
```

---

## 🎯 Success = All CRUD Works

When all phases pass:
- ✅ Create tasks with validation
- ✅ Read task list with details
- ✅ Update all task fields
- ✅ Delete tasks (with constraints)
- ✅ Data persists in Supabase
- ✅ UI stays in sync with database

**RESULT:** Employer has full control over their tasks! 🎉

---

## 📝 Notes

- Slots management is automatic (decrements when worker accepts)
- Task status changes based on submissions
- Delete respects data integrity (can't delete with active work)
- All operations are real-time (no page refresh needed)
- Full form validation on both client and server

---

**Next:** Implement same CRUD pattern for Workers (submissions history, update, cancel)

**Ready to test?** Start with Phase 1 (CREATE) 🚀
