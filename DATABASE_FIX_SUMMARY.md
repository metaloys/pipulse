# Database Error Fixes Summary

## Issue Fixed

### Error: `new row for relation "users" violates check constraint "users_user_role_check"`

**Root Cause:** The code was sending `user_role: 'user'` but the Supabase constraint only allows `'worker'` or `'employer'`.

**Solution:** Changed the user_role value in `createOrUpdateUserOnAuth()` from `'user'` to `'worker'`.

---

## What Was Changed

### File: lib/database.ts

**Function:** `createOrUpdateUserOnAuth(userId: string, username: string)`

**Before:**
```typescript
const { data, error } = await supabase
  .from('users')
  .insert([{
    id: userId,
    pi_username: username,
    pi_wallet_address: '',
    user_role: 'user',  // ❌ WRONG - violates check constraint
    level: 'Newcomer',
    current_streak: 0,
    longest_streak: 0,
    last_active_date: new Date().toISOString(),
    total_earnings: 0,
    total_tasks_completed: 0,
  }])
```

**After:**
```typescript
const { data, error } = await supabase
  .from('users')
  .insert([{
    id: userId,
    pi_username: username,
    pi_wallet_address: '',
    user_role: 'worker',  // ✅ CORRECT - matches constraint
    level: 'Newcomer',
    current_streak: 0,
    longest_streak: 0,
    last_active_date: new Date().toISOString(),
    total_earnings: 0,
    total_tasks_completed: 0,
  }])
```

---

## Key Points

✅ **user_role constraint:** Only accepts `'worker'` or `'employer'`  
✅ **Default role:** All new users start as `'worker'`  
✅ **Future upgrade:** Users can be promoted to `'employer'` role later  
✅ **TypeScript enforced:** `UserRole` type is defined as `'worker' | 'employer'`  

---

## Commit

**Hash:** `2b40ed1`  
**Message:** Fix: Use correct user_role value 'worker' instead of 'user'

---

## Testing

After this fix, new user creation should work without constraint violations:

1. User authenticates with Pi Network SDK
2. `createOrUpdateUserOnAuth()` is called
3. New user is created in Supabase with:
   - `user_role: 'worker'` ✅
   - `level: 'Newcomer'` ✅
   - All earnings/streak counters set to 0 ✅
4. User can complete tasks and earn Pi Pi
5. User dashboard shows real stats instead of mock data ✅

---

## Build Status

✅ **Compilation:** Successful (12.7s)  
✅ **Pages generated:** All 4 routes compiled  
✅ **Deployed to:** Main branch (Vercel auto-deploys)

---

## Related Columns in users table

These columns are now correctly populated on user creation:

| Column | Type | Value | Notes |
|--------|------|-------|-------|
| `id` | uuid | Pi user ID | Primary key from Pi Network |
| `pi_username` | text | From Pi SDK | User's Pi Network username |
| `pi_wallet_address` | text | '' | Empty initially, can be set later |
| `user_role` | enum | 'worker' | Matches constraint (worker/employer) |
| `level` | enum | 'Newcomer' | Matches constraint (Newcomer/Established/Advanced/Elite Pioneer) |
| `current_streak` | integer | 0 | Increments as user completes daily tasks |
| `longest_streak` | integer | 0 | Tracks personal best |
| `last_active_date` | timestamp | now() | Set to current time |
| `total_earnings` | numeric | 0 | Accumulates as tasks are completed |
| `total_tasks_completed` | integer | 0 | Increments per task |
| `created_at` | timestamp | now() | Auto-set by Supabase |
| `updated_at` | timestamp | now() | Auto-set by Supabase |

---

## Next Steps

The app should now successfully:
1. ✅ Authenticate real Pi users
2. ✅ Auto-create users in Supabase with correct role
3. ✅ Display real stats (zeros for new users)
4. ✅ Allow users to complete tasks and earn Pi

If you encounter any more constraint errors, check Supabase SQL Editor for any other check constraints on the users table.
