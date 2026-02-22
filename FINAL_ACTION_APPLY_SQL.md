# ⚡ FINAL ACTION: Apply RLS SQL & Test (5 minutes)

**All code fixes are done and pushed. Now just 2 steps:**

---

## Step 1: Apply RLS SQL in Supabase (2 min)

**Go to:** https://app.supabase.com → Your Project → SQL Editor

**Paste this SQL:**

```sql
ALTER TABLE task_submissions DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read" ON task_submissions;
DROP POLICY IF EXISTS "Allow public insert" ON task_submissions;
DROP POLICY IF EXISTS "Allow public update" ON task_submissions;
DROP POLICY IF EXISTS "Allow public delete" ON task_submissions;
DROP POLICY IF EXISTS "task_submissions_insert_policy" ON task_submissions;
DROP POLICY IF EXISTS "task_submissions_select_policy" ON task_submissions;
DROP POLICY IF EXISTS "task_submissions_update_policy" ON task_submissions;
DROP POLICY IF EXISTS "task_submissions_delete_policy" ON task_submissions;
DROP POLICY IF EXISTS "Allow all reads on task_submissions" ON task_submissions;
DROP POLICY IF EXISTS "Allow all inserts on task_submissions" ON task_submissions;
DROP POLICY IF EXISTS "Allow all updates on task_submissions" ON task_submissions;
DROP POLICY IF EXISTS "Allow all deletes on task_submissions" ON task_submissions;
DROP POLICY IF EXISTS "Allow insert submissions" ON task_submissions;
DROP POLICY IF EXISTS "Allow read submissions" ON task_submissions;
DROP POLICY IF EXISTS "Allow update submissions" ON task_submissions;
ALTER TABLE task_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "task_submissions_select" ON task_submissions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "task_submissions_insert" ON task_submissions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "task_submissions_update" ON task_submissions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "task_submissions_delete" ON task_submissions FOR DELETE TO anon, authenticated USING (true);
```

**Click Run** → ✅ "Success. No rows returned"

---

## Step 2: Test in Browser (3 min)

**Clear cache:**
```
F12 → Application tab → Clear site data → Refresh
```

**Test:**
```
Tab 1 (Main):     Create task
Tab 2 (Incognito): Accept task → Submit proof

Expected: ✅ No 401 error, submission appears in Employer's Pending Review
```

---

## ✅ Success = All Working

| Feature | Status |
|---------|--------|
| User creation (no 409) | ✅ Code fixed |
| Role switching (no 406) | ✅ Code fixed |
| Task submission (no 401) | ⏳ SQL needs applying |

---

## 📋 Latest Code Status

**Commit:** d76de26  
**Files Changed:**
- `lib/database.ts` - Rewrote `createOrUpdateUserOnAuth()` + added `switchUserRole()`
- `app/page.tsx` - Updated to use `switchUserRole()`
- `fix-task-submissions-rls.sql` - Complete RLS policy refresh

**Build:** ✅ 14.0s, zero errors

---

**Go apply the SQL now!** Then test. That's it! 🚀

