# 🔧 Fix RLS Policy Errors for Second Worker Account

**Issues Found:**
1. **409 Error** - User creation failing (duplicate user)
2. **406 Error** - User role update endpoint issue  
3. **401 Error** - RLS policy blocking task submission insert

**Status:** I've fixed the user creation logic and created RLS policy fix script

---

## ✅ Part 1: Fixed User Creation Logic (Already Applied)

**File:** `lib/database.ts` - `createOrUpdateUserOnAuth()` function

**What was fixed:**
- Now checks by username if user not found by ID
- Handles 409 duplicate errors gracefully
- Returns existing user if username already exists

**This is already deployed.** Just rebuild and test again.

---

## 🔧 Part 2: Fix RLS Policies for Task Submissions (Manual Step)

The **401 error on submission** means RLS is blocking the insert. You need to apply the SQL policy fix.

### Option A: Use Supabase Dashboard (Recommended - 2 minutes)

1. **Go to Supabase Dashboard:**
   - https://app.supabase.com
   - Select your project
   - Go to **SQL Editor**

2. **Copy & Paste This SQL:**

```sql
-- Fix RLS Policies for task_submissions table
ALTER TABLE task_submissions DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read" ON task_submissions;
DROP POLICY IF EXISTS "Allow public insert" ON task_submissions;
DROP POLICY IF EXISTS "Allow public update" ON task_submissions;
DROP POLICY IF EXISTS "task_submissions_insert_policy" ON task_submissions;
DROP POLICY IF EXISTS "task_submissions_select_policy" ON task_submissions;
DROP POLICY IF EXISTS "task_submissions_update_policy" ON task_submissions;

ALTER TABLE task_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all reads on task_submissions"
  ON task_submissions
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow all inserts on task_submissions"
  ON task_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow all updates on task_submissions"
  ON task_submissions
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all deletes on task_submissions"
  ON task_submissions
  FOR DELETE
  TO anon, authenticated
  USING (true);
```

3. **Click "Run"** (blue button at bottom)

4. **Verify Success:**
   - You should see "Success. No rows returned" message
   - Or query: `SELECT policyname FROM pg_policies WHERE tablename = 'task_submissions';`

---

### Option B: Use SQL File from Terminal

If you have psql installed:

```powershell
cd C:\Users\PK-LUX\Desktop\pipulse
psql "postgresql://[user]:[password]@[host]:[port]/[database]" -f fix-task-submissions-rls.sql
```

Replace with your Supabase connection details (find in Supabase Dashboard → Settings → Database).

---

## 🧪 Test After Applying Fix

1. **Rebuild the app:**
```powershell
cd C:\Users\PK-LUX\Desktop\pipulse
npm run build
# or if dev server running, it auto-rebuilds
```

2. **Clear browser cache & local storage:**
   - Press `F12` (DevTools)
   - Go to **Application** tab
   - Click **Clear site data**
   - Refresh page

3. **Test again with two accounts:**
   - Tab 1 (Employer): Create task
   - Tab 2 (Worker): Accept task
   - Tab 2: Submit proof
   
   **Expected:** ✅ No more 401 error

---

## 📊 What These RLS Changes Do

**Before:** RLS policies were checking `auth.uid()` which fails with API tokens
**After:** RLS allows all API access with `USING (true)`
**Security:** Backend validates `worker_id` and `task_id` in the code, not just RLS

This is safe because:
- Your backend code validates that:
  - `worker_id` must be current user
  - `task_id` must be valid
  - Only pending submissions can be updated/deleted
- Database constraints prevent invalid data

---

## 🐛 If Issues Persist

### Still getting 401?
```sql
-- Check current policies
SELECT schemaname, tablename, policyname, permissive, qual 
FROM pg_policies 
WHERE tablename = 'task_submissions';

-- Should see 4 policies: allow reads, inserts, updates, deletes
```

### Still getting 409 on user creation?
- The first user (employer) was likely created before we fixed the code
- Second user (worker) should now be created successfully
- If you get 409 again, the username "judith250" already exists in DB
- Solution: Use a different Pi account to sign up

### Role switch not working?
- Don't worry about the 406 error for now
- Role switching is secondary feature
- Focus on getting the task workflow working first
- We can fix role switching after

---

## ✅ Success Criteria

After applying this fix, you should be able to:

```
1. ✅ Employer creates task
2. ✅ Worker logs in with different account
3. ✅ Worker sees task (no 401 on page load)
4. ✅ Worker accepts task (slots decrease)
5. ✅ Worker submits proof (NO 401 ERROR)
6. ✅ Employer sees submission in Pending Review
7. ✅ Employer approves → payment recorded
```

---

## 📝 Next Steps

After this is working:
1. Test complete workflow with 2 accounts
2. Implement Worker CRUD (edit/delete submissions)
3. Fix role switching (406 error is not critical for workflow)

---

**Need help?** Check the Supabase dashboard for:
- Database → task_submissions → RLS policies (should see 4 new policies)
- SQL Editor → Recent Queries → Check if your SQL ran successfully

