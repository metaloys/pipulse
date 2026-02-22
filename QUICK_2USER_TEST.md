# 🎯 Quick Start: Test 2-User Workflow (10 minutes)

## Setup (2 min)

**Browser Tab 1 (Employer):**
```
1. http://localhost:3000
2. Auth with Pi (Account A)
3. Confirm mode = "Employer"
```

**Browser Tab 2 (Worker) - Use Incognito:**
```
1. http://localhost:3000 (in incognito/private window)
2. Auth with Pi (Account B - different account)
3. Confirm mode = "Worker"
```

---

## Test Flow (8 minutes)

| Step | Employer (Tab 1) | Worker (Tab 2) | Expected Result |
|------|------------------|----------------|-----------------|
| 1 | Create task "Review Photos"<br/>Reward: 15π, Slots: 2<br/>Deadline: 3 days | — | ✅ Task appears in employer list with countdown timer |
| 2 | Switch to "Submissions" tab | Refresh page<br/>Look for available tasks | ✅ Worker sees task "Review Photos" with timer |
| 3 | — | Click "Accept Task" button | ✅ Slots decrease: 2→1 on employer side |
| 4 | — | Submit proof:<br/>"I reviewed all photos<br/>Quality: 5/5" | ✅ Appears in employer "Pending Review" |
| 5 | Click submission card<br/>Click "Approve" | — | ✅ Moves to "Approved" section<br/>✅ Payment: 15π × 0.85 = 12.75π recorded |
| 6 | Edit task reward 15π → 25π<br/>Save | — | ✅ Task card updates to 25π immediately |
| 7 | Create another task "Categorize Items"<br/>Slots: 1 | Accept & submit proof | ✅ Two tasks in employer submissions |

---

## What to Look For

### ✅ Confirms it works:
- Employer sees countdown on task cards (e.g., "2d 14h 33m")
- Worker sees different tasks than employer creates
- Worker can accept and submit
- Employer can approve and see payment recorded
- Edit updates task immediately

### ⚠️ If something's missing:
- No countdown timer → refresh page
- Worker can't see tasks → check both in Worker mode
- Submission doesn't appear → check Submissions tab, refresh
- Payment record not showing → check Supabase transactions table

---

## Database Quick Check

```sql
-- Verify task created and slots decremented
SELECT title, slots_available, slots_remaining 
FROM tasks 
WHERE title LIKE '%Review Photos%';

-- Verify submission created
SELECT submission_status, worker_id 
FROM task_submissions 
WHERE task_id = '[TASK_ID]';

-- Verify payment recorded
SELECT amount, pipulse_fee 
FROM transactions 
WHERE task_id = '[TASK_ID]';
```

---

## Done? 

If all steps work:
✅ Complete workflow validated  
✅ Employer CRUD functional  
✅ Worker task acceptance working  
✅ Payment system recording correctly  

**Next:** Implement Worker CRUD (edit/delete submissions)

