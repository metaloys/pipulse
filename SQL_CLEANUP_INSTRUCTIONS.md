# 🧹 PROBLEM 2: EASY COPY-PASTE CLEANUP

## Step-by-Step Instructions (Simple)

### 1️⃣ Open Supabase
Go to: **https://supabase.com**

### 2️⃣ Log In
Login with your email

### 3️⃣ Select Your Project
Click on: **pipulse** (or jwkysjidtkzriodgiydj)

### 4️⃣ Open SQL Editor
Left sidebar → Click **SQL Editor**

### 5️⃣ Create New Query
Click **New query** button (top left)

### 6️⃣ Copy & Paste This Entire Block

```sql
DELETE FROM transactions;
DELETE FROM task_submissions;
DELETE FROM streaks;
DELETE FROM tasks;
DELETE FROM users;
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE tasks_id_seq RESTART WITH 1;
ALTER SEQUENCE task_submissions_id_seq RESTART WITH 1;
ALTER SEQUENCE transactions_id_seq RESTART WITH 1;
ALTER SEQUENCE streaks_id_seq RESTART WITH 1;
SELECT 
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM tasks) as tasks,
  (SELECT COUNT(*) FROM task_submissions) as submissions,
  (SELECT COUNT(*) FROM transactions) as transactions,
  (SELECT COUNT(*) FROM streaks) as streaks;
```

### 7️⃣ Click RUN
Button at bottom right or press **Ctrl+Enter**

### 8️⃣ Wait for Results

You should see results like:
```
users | tasks | submissions | transactions | streaks
  0   |   0   |      0      |       0      |    0
```

**All zeros = SUCCESS! ✅**

---

## 📋 What This Does

| Line | Action |
|------|--------|
| 1 | Delete all payment records |
| 2 | Delete all worker submissions |
| 3 | Delete all daily streaks |
| 4 | Delete all tasks |
| 5 | Delete all fake users |
| 6-10 | Reset ID counters (optional but recommended) |
| 11-19 | Show verification results (all should be 0) |

---

## ✅ After It Completes

You'll see one result showing:
```
users=0, tasks=0, submissions=0, transactions=0, streaks=0
```

This means **all test data is deleted** and your database is clean! 🎉

---

## ⚠️ If Something Goes Wrong

### Error: "relation does not exist"
- Wrong project selected
- Check the project name at the top
- Close and reopen SQL Editor

### Error: "permission denied"  
- Not logged in properly
- Log out and log back in
- Try again

### Results show numbers instead of 0
- Refresh the page
- Run the verification query again

---

## 🎯 You're Done!

Once you see all counts = 0, reply:

**"Problem 2 confirmed - all sample data deleted"**

Then I'll start **PROBLEM 3: Admin Dashboard** 🚀

---

## 📄 File to Use

The complete SQL is in: `SQL_CLEANUP_FULL.sql`

Just copy everything from that file and paste into Supabase SQL Editor!
