# Week 3 Current State: Accept Task Button & Slot Reservation

## ✅ CURRENT IMPLEMENTATION

### 1. Accept Task Button - EXISTS & WORKING ✅

**Location:** [components/task-card.tsx](components/task-card.tsx#L106-L111)

```tsx
<Button
  onClick={() => onAccept?.(task)}
  className="rounded-full bg-primary hover:bg-primary/90 text-sm px-6"
  size="sm"
>
  Accept Task
</Button>
```

**Visual:** Bright primary button at bottom right of each task card

---

## 🔄 WHAT HAPPENS WHEN CLICKED

### Step 1: Button Click Handler
- **Location:** [app/page.tsx](app/page.tsx#L185)
- **Function:** `handleAcceptTask(task)`
- **Action:** Opens `TaskSubmissionModal` with selected task

```typescript
const handleAcceptTask = (task: DatabaseTask | Task) => {
  if ('pi_reward' in task) {
    setSelectedTask(task as DatabaseTask);
  }
  setIsSubmissionModalOpen(true);
};
```

---

### Step 2: TaskSubmissionModal Opens
- **Location:** [components/task-submission-modal.tsx](components/task-submission-modal.tsx)
- **Shows:**
  - Task title & description
  - Time estimate, slots remaining, deadline
  - Full instructions
  - Textarea for proof of work
  - Submission type selector (text/photo/audio/file)

---

### Step 3: Worker Enters Proof & Submits
- **Handler:** `handleSubmitTask()` in [app/page.tsx](app/page.tsx#L190)
- **Actions Performed:**

```typescript
// 1. Create submission record in database
const submission = await submitTask({
  task_id: taskId,
  worker_id: workerId,
  proof_content: proof,
  submission_type: submissionType,
  submission_status: 'submitted',
  agreed_reward: currentTask.pi_reward, // Price protection
  // ... other fields
});

// 2. Decrement slots_remaining
const newSlotsRemaining = Math.max(0, currentTask.slots_remaining - 1);
await updateTask(taskId, {
  slots_remaining: newSlotsRemaining,
});

// 3. Refresh task list with updated slots
const updatedTasks = await getAllTasks();
setTasks(availableTasks);
```

---

## 📊 DATABASE CHANGES MADE

| Action | Database Table | Change |
|--------|---|---|
| Create Submission | `Submission` | ✅ New row inserted with worker_id, task_id, proof_content, status='submitted' |
| Reserve Slot | `Task` | ✅ slotsRemaining decremented by 1 |
| Store Price | `Submission` | ✅ agreed_reward stored (price protection for escrow payment) |

---

## ⚠️ ISSUES & GAPS FOR WEEK 3

### Issue 1: Category Enum Mismatch
- **Problem:** Database stores categories as uppercase (`SURVEY`, `APP_TESTING`)
- **Code expects:** lowercase (`'survey'`, `'app_testing'`)
- **Impact:** Task filtering may not work correctly

**Database enum values found:**
```
TaskCategory: SURVEY, APP_TESTING, TRANSLATION, AUDIO_RECORDING, PHOTO_CAPTURE, CONTENT_REVIEW, DATA_LABELING
TaskStatus: available, in_progress, completed, cancelled
UserRole: worker, employer, ADMIN
ProofType: TEXT, PHOTO, AUDIO, FILE
```

---

### Issue 2: NO Pi PAYMENT FLOW YET ❌
Currently, when worker accepts a task and submits proof:
- ✅ Submission saved
- ✅ Slots decremented
- ❌ **NO payment initiated** (this is a Week 3 goal)

**Required for Week 3:**
- [ ] After submission accepted, create Pi payment escrow
- [ ] Call Pi payment API with agreed_reward amount
- [ ] Store payment metadata linking submission to payment

---

### Issue 3: NO EMPLOYER TASK POSTING UI ❌
Currently:
- Tasks are only in database (seeded or created programmatically)
- No UI for employers to create tasks
- No task posting form

**Components needed for Week 3:**
- [ ] Employer task creation form
- [ ] Integration with Pi payment escrow when posting
- [ ] Task dashboard for employer

---

## 🎯 WEEK 3 NEXT STEPS

### Priority 1: Fix Enum Mismatch (10 min)
- Update database enum values to match code expectations
- OR update code to use database case conventions
- Test filtering works correctly

### Priority 2: Add Pi Payment Flow (30 min)
When `handleSubmitTask` completes:
1. Create escrow payment entry with `agreed_reward` amount
2. Trigger Pi payment transaction
3. Store payment status in Submission record
4. Show payment confirmation to worker

### Priority 3: Create Employer Task Posting UI (60 min)
1. Build task creation form component
2. Integrate with escrow payment on task creation
3. Show employer task dashboard
4. Display payment status for each task

---

## 📁 Key Files for Week 3

| File | Purpose | Status |
|------|---------|--------|
| [components/task-card.tsx](components/task-card.tsx) | Accept button UI | ✅ Ready |
| [components/task-submission-modal.tsx](components/task-submission-modal.tsx) | Proof submission | ✅ Ready |
| [app/page.tsx](app/page.tsx) | Main app logic | ⚠️ Needs payment logic |
| [lib/database.ts](lib/database.ts) | Database functions | ⚠️ Needs Pi payment integration |
| [components/create-task-modal.tsx](components/create-task-modal.tsx) | Task creation | ⚠️ Exists but needs escrow integration |
| [lib/pi-payment-escrow.ts](lib/pi-payment-escrow.ts) | Pi escrow functions | ⚠️ Exists, needs integration |

---

## 🧪 CURRENT WORKING FLOW

```
1. Worker sees 3 seeded tasks ✅
   ↓
2. Worker clicks "Accept Task" ✅
   ↓
3. TaskSubmissionModal opens ✅
   ↓
4. Worker enters proof ✅
   ↓
5. Worker clicks Submit ✅
   ↓
6. Submission saved ✅
7. Slots decremented ✅
   ↓
8. ❌ NO PAYMENT YET (Week 3 goal)
```

---

**Ready to proceed with Week 3 implementation!**
