# PROBLEM 2: Clean Sample Data - Complete Solution

## ✅ PROBLEM 1 Status: COMPLETE

Your wallet configuration is set:
- **Wallet Address:** `GAFGTGK5VKSVETFUAEYGTVXENSAENKF2KGGTMHEKSOO3RE2322HMADL6`
- **Username:** `aloysmet`
- **Build Status:** ✅ Successful
- **Payment System:** Ready to test

---

## 🧹 PROBLEM 2: Remove All Sample/Test Data

You have fake test data in Supabase from development. Before deployment to Vercel, ALL of it must be deleted:

- ❌ Fake users (alex_worker, sam_pioneer, etc.)
- ❌ Fake tasks (all 7 test tasks)
- ❌ Fake submissions (worker proof submissions)
- ❌ Fake transactions (payment records)
- ❌ Fake streaks (gamification data)

**BUT:** Keep the table structure, indexes, and RLS policies intact.

---

## 🔐 Supabase SQL Editor Access

1. Go to: **https://supabase.com** → Log in
2. Select your project: **PiPulse (jwkysjidtkzriodgiydj)**
3. Left sidebar → **SQL Editor**
4. Click **New query**
5. Copy/paste each SQL command below, one at a time
6. Click **Run** button (or press Ctrl+Enter)

---

## 🗑️ SQL Commands to Delete All Test Data

### **Step 1: Delete All Transactions (These reference tasks/users)**

```sql
DELETE FROM transactions;
```

**Expected Result:** `affected rows: 3` (or however many you inserted)

---

### **Step 2: Delete All Task Submissions**

```sql
DELETE FROM task_submissions;
```

**Expected Result:** `affected rows: X` (all submissions deleted)

---

### **Step 3: Delete All Streaks**

```sql
DELETE FROM streaks;
```

**Expected Result:** `affected rows: X` (all streak records deleted)

---

### **Step 4: Delete All Tasks**

```sql
DELETE FROM tasks;
```

**Expected Result:** `affected rows: 7` (assuming you had 7 test tasks)

---

### **Step 5: Delete All Users**

```sql
DELETE FROM users;
```

**Expected Result:** `affected rows: 6` (assuming you had 6 test users)

---

## ✅ Verify All Data is Deleted

Run these verification queries to confirm:

### **Check Table Counts**

```sql
SELECT 
  (SELECT COUNT(*) FROM users) as user_count,
  (SELECT COUNT(*) FROM tasks) as task_count,
  (SELECT COUNT(*) FROM task_submissions) as submission_count,
  (SELECT COUNT(*) FROM transactions) as transaction_count,
  (SELECT COUNT(*) FROM streaks) as streak_count;
```

**Expected Output:**
```
user_count | task_count | submission_count | transaction_count | streak_count
    0      |     0      |        0         |         0         |      0
```

All should be **0**.

---

## 🔒 Verify RLS Policies Still Exist

Run this to confirm security policies weren't accidentally deleted:

```sql
SELECT schemaname, tablename, policyname FROM pg_policies 
WHERE tablename IN ('users', 'tasks', 'task_submissions', 'transactions', 'streaks') 
ORDER BY tablename;
```

**Expected:** You should see 16 policies listed (our RLS rules for each table).

---

## 🎯 Verify Indexes Still Exist

Run this to confirm indexes weren't deleted:

```sql
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('users', 'tasks', 'task_submissions', 'transactions', 'streaks')
ORDER BY tablename;
```

**Expected:** You should see 11 indexes listed (our performance optimization indexes).

---

## ⚙️ Optional: Reset Auto-Increment IDs (Recommended)

After deleting all data, reset the sequence counters so new data starts from ID 1:

```sql
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE tasks_id_seq RESTART WITH 1;
ALTER SEQUENCE task_submissions_id_seq RESTART WITH 1;
ALTER SEQUENCE transactions_id_seq RESTART WITH 1;
ALTER SEQUENCE streaks_id_seq RESTART WITH 1;
```

This ensures the first new user/task gets ID `1` instead of ID `7`.

---

## 🚀 What Happens Next

### **BEFORE Deployment:**
- Fresh database with zero records ✅
- All tables ready for real data ✅
- RLS policies protecting user privacy ✅
- Indexes optimized for queries ✅

### **AFTER Deployment to Vercel:**
- Real users create accounts
- Real employers post tasks
- Real workers submit proofs
- Real Pi payments processed
- Data accumulates in clean database

---

## 🔄 Complete Deletion Workflow

Here's the safest way to delete everything in order:

### **Option A: One-by-One (Safest)**

Run these 5 commands in Supabase SQL Editor, one at a time:

```sql
-- 1. Delete transactions first (no dependencies)
DELETE FROM transactions;

-- 2. Delete submissions
DELETE FROM task_submissions;

-- 3. Delete streaks
DELETE FROM streaks;

-- 4. Delete tasks
DELETE FROM tasks;

-- 5. Delete users (this is last since tasks reference employer_id)
DELETE FROM users;

-- 6. (Optional) Reset IDs
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE tasks_id_seq RESTART WITH 1;
ALTER SEQUENCE task_submissions_id_seq RESTART WITH 1;
ALTER SEQUENCE transactions_id_seq RESTART WITH 1;
ALTER SEQUENCE streaks_id_seq RESTART WITH 1;

-- 7. Verify all deleted
SELECT 
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM tasks) as tasks,
  (SELECT COUNT(*) FROM task_submissions) as submissions,
  (SELECT COUNT(*) FROM transactions) as transactions,
  (SELECT COUNT(*) FROM streaks) as streaks;
```

### **Option B: All at Once (Faster)**

If you want to delete everything in one command:

```sql
DELETE FROM transactions;
DELETE FROM task_submissions;
DELETE FROM streaks;
DELETE FROM tasks;
DELETE FROM users;

-- Reset IDs
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE tasks_id_seq RESTART WITH 1;
ALTER SEQUENCE task_submissions_id_seq RESTART WITH 1;
ALTER SEQUENCE transactions_id_seq RESTART WITH 1;
ALTER SEQUENCE streaks_id_seq RESTART WITH 1;

-- Verify
SELECT 
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM tasks) as tasks,
  (SELECT COUNT(*) FROM task_submissions) as submissions,
  (SELECT COUNT(*) FROM transactions) as transactions,
  (SELECT COUNT(*) FROM streaks) as streaks;
```

---

## ⚠️ Common Mistakes to Avoid

### ❌ Wrong: Using DROP
```sql
DROP TABLE users;  -- NO! This deletes the table structure
```

### ✅ Correct: Using DELETE
```sql
DELETE FROM users;  -- YES! This only deletes the data
```

---

### ❌ Wrong: Wrong order
```sql
DELETE FROM users;  -- NO! This will fail because tasks reference user
DELETE FROM tasks;
```

### ✅ Correct: Proper order
```sql
DELETE FROM transactions;   -- No dependencies
DELETE FROM task_submissions; -- References tasks and users
DELETE FROM streaks;         -- References users
DELETE FROM tasks;           -- References users
DELETE FROM users;           -- Last (referenced by everything)
```

---

## 📊 Before & After

### **Before Cleanup:**
```
users table:            6 rows (alex, sam, jordan, casey, tech_corp, data_labs)
tasks table:            7 rows (various test tasks)
task_submissions:       3 rows (sample submissions)
transactions:           3 rows (payment records)
streaks table:          4 rows (streak tracking)
```

### **After Cleanup:**
```
users table:            0 rows ✅
tasks table:            0 rows ✅
task_submissions:       0 rows ✅
transactions:           0 rows ✅
streaks table:          0 rows ✅
```

---

## 🎓 Next Steps

Once all sample data is deleted:

1. ✅ Run verification queries to confirm 0 records
2. ✅ Check RLS policies still exist
3. ✅ Check indexes still exist
4. ✅ Commit cleanup to git: `git add -A && git commit -m "Delete sample data from database"`
5. ✅ Then move to **PROBLEM 3: Admin Dashboard**

---

## 🆘 Need to Restore Data?

If you accidentally deleted something important, you can't undo in Supabase.

**BUT:** You have the SQL scripts to recreate:
- `supabase-setup.sql` - Creates all tables fresh
- `supabase-sample-data.sql` - Re-inserts sample data

Just run them again if needed!

---

## ✅ Completion Checklist

- [ ] Logged into Supabase SQL Editor
- [ ] Ran DELETE for transactions
- [ ] Ran DELETE for task_submissions
- [ ] Ran DELETE for streaks
- [ ] Ran DELETE for tasks
- [ ] Ran DELETE for users
- [ ] Ran verification query (all counts = 0)
- [ ] Confirmed RLS policies still exist
- [ ] Confirmed indexes still exist
- [ ] Ready to move to Problem 3

---

**Once completed, reply:** "Problem 2 confirmed - all sample data deleted" and I'll move to Problem 3!
