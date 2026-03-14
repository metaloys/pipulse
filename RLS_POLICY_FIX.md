# RLS Policy Fix Guide - February 26, 2026

## Problem
After migrations, Supabase RLS policies are blocking all reads/writes:
- `permission denied for schema public` (even with service role key)
- `401 Unauthorized` on client-side queries

## Root Cause
When we deployed migrations to the live Supabase database, the table security policies became overly restrictive or weren't properly configured.

## Solution Options

### QUICK FIX (Development Only - Not for Production)
**Disable RLS on tables temporarily:**

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Navigate to: **Authentication → Policies**
3. For each table (User, Task, Submission, Transaction, etc.):
   - Click the table
   - Toggle **RLS** OFF (this is the quick fix)
4. Refresh the app - it should work immediately

> ⚠️ **WARNING**: This disables security. Only use for development/testing.

### PROPER FIX (Production Ready - Recommended)
**Configure RLS policies correctly:**

1. Keep RLS ON (more secure)
2. Add these policies to each table:

#### Policy 1: Service Role Bypass
- **Name**: Service role full access
- **Target**: All queries
- **Applies to**: Service role / system users
- **Expression**: `auth.role() = 'service_role'`
- **Permissions**: ALL (SELECT, INSERT, UPDATE, DELETE)

#### Policy 2: User's Own Data  
- **Name**: Users can read/write their own data
- **Target**: SELECT, INSERT, UPDATE
- **Applies to**: Authenticated users
- **Expression**: `auth.uid() = id` (for User table)
- **Expression**: `auth.uid() = workerId` (for Submission table)

#### Policy 3: Public Read for Tasks
- **Name**: Anyone can view available tasks
- **Target**: SELECT
- **Applies to**: Everyone (Authenticated + Anonymous)
- **Expression**: `taskStatus = 'available' AND deletedAt IS NULL`

### CUSTOM SQL FIX (Via Supabase SQL Editor)
If you want to apply policies via SQL, run this:

```sql
-- Disable RLS temporarily (quick fix)
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Task" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Submission" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Transaction" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "TaskVersion" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "SlotLock" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Dispute" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" DISABLE ROW LEVEL SECURITY;

-- For production, enable RLS and add policies:
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access"
ON "User"
AS PERMISSIVE
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Users read all"
ON "User"
AS PERMISSIVE
FOR SELECT
USING (true);

-- Repeat for other tables...
```

## Verification Checklist

After applying the fix:

- [ ] Check `/api/auth/create-user` endpoint - should return 200 on user creation
- [ ] Look at browser console - should see successful Supabase queries
- [ ] No more `401 Unauthorized` or `permission denied` errors
- [ ] Tasks display on home page
- [ ] Login works normally

## Testing the Fix

1. **Test user creation:**
   ```bash
   curl -X POST https://yourapp/api/auth/create-user \
     -H "Content-Type: application/json" \
     -d '{"piUid":"test-123","piUsername":"testuser"}'
   ```
   Expected: 200 with user object

2. **Test task query:**
   Open app and check console for:
   ```
   ✅ Tasks loaded successfully
   📋 Available tasks: 4
   ```

3. **Test repost feature:**
   - Switch to employer role
   - Click Repost button on completed task
   - Should save without errors

## If Issue Persists

Check these:

1. **Verify migrations applied:**
   ```bash
   npx prisma migrate status
   ```
   All migrations should show "Applied"

2. **Verify Prisma Client is up to date:**
   ```bash
   npx prisma generate
   ```

3. **Check environment variables:**
   ```bash
   echo $SUPABASE_URL
   echo $SUPABASE_SERVICE_ROLE_KEY
   ```
   Both should be set correctly

4. **Check Supabase database connectivity:**
   - Visit Supabase dashboard
   - Open SQL Editor
   - Run: `SELECT COUNT(*) FROM "User";`
   - If it works, RLS is the issue

## Next Steps

1. Apply RLS fix using either Quick or Proper method above
2. Rebuild app: `npm run build`
3. Test login flow and task repost feature
4. Report if still having issues with specific API calls

---

**Updated:** February 26, 2026
**Status:** RLS policies pending configuration
**Priority:** CRITICAL - Blocks all data access
