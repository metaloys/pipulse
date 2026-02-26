# 🔧 SUPABASE PRISMA CONNECTION - PROPER SETUP

**Status:** ✅ Ready to implement Supabase best practices  
**Date:** February 25, 2026  
**Approach:** Use Supabase pooled connection with custom Prisma user

---

## 📋 WHAT SUPABASE RECOMMENDS

Supabase has official Prisma integration documentation. Key points:

1. **Create a custom Prisma user** (not use postgres user)
2. **Use Supavisor pooled connection** (not direct connection)
3. **Grant proper permissions** to the prisma user

---

## 🔄 STEPS TO IMPLEMENT

### Step 1: Create Prisma User in Supabase

Go to **Supabase Dashboard** → **SQL Editor** and run:

```sql
-- Create custom user
create user "prisma" with password 'custom_password' bypassrls createdb;
-- extend prisma's privileges to postgres (necessary to view changes in Dashboard)
grant "prisma" to "postgres";
-- Grant it necessary permissions over the relevant schemas (public)
grant usage on schema public to prisma;
grant create on schema public to prisma;
grant all on all tables in schema public to prisma;
grant all on all routines in schema public to prisma;
grant all on all sequences in schema public to prisma;
alter default privileges for role postgres in schema public grant all on tables to prisma;
alter default privileges for role postgres in schema public grant all on routines to prisma;
alter default privileges for role postgres in schema public grant all on sequences to prisma;
```

**Replace `'custom_password'` with a secure password.** (Remember it - you'll need it for DATABASE_URL)

### Step 2: Get Supavisor Pooled Connection String

In Supabase Dashboard:
1. Click **Connect** button
2. Look for **Supavisor Session pooler** connection string
3. It will be in format:
   ```
   postgres://[DB-USER].[PROJECT-REF]:[PRISMA-PASSWORD]@[DB-REGION].pooler.supabase.com:5432/postgres
   ```

### Step 3: Update .env.local

Replace the DATABASE_URL with the pooled connection:

```bash
# Format:
postgres://prisma.[PROJECT-REF]:[PRISMA-PASSWORD]@[DB-REGION].pooler.supabase.com:5432/postgres

# Example (you'll use your actual values):
postgres://prisma.jwkysjidtkzriodgiydj:your_prisma_password@ap-southeast-1.pooler.supabase.com:5432/postgres
```

### Step 4: Run Migration

Once .env.local is updated with the pooled connection:

```bash
npx prisma migrate dev --name init_schema
```

---

## 🎯 WHY THIS APPROACH IS BETTER

| Aspect | Direct Connection | Pooled Connection |
|--------|-------------------|-------------------|
| **User** | `postgres` (admin) | `prisma` (limited) | 
| **Port** | 5432 | 5432 |
| **Connection Pool** | None (direct) | ✅ Managed by Supavisor |
| **For Migrations** | Works | ✅ Recommended |
| **For Serverless** | ❌ Not suitable | ✅ Perfect |
| **Security** | Wide permissions | Limited to schema |
| **Monitoring** | Hard to track | Easy with Dashboard |

---

## 📊 CONNECTION STRING FORMAT

**Supavisor Pooled (for migrations):**
```
postgres://prisma.[PROJECT-REF]:[PASSWORD]@[REGION].pooler.supabase.com:5432/postgres
                ↑        ↑             ↑                    ↑
              User   ProjectRef      Password            Region
```

**Your project reference:** `jwkysjidtkzriodgiydj`

**Example with actual values:**
```
postgres://prisma.jwkysjidtkzriodgiydj:MySecurePassword@ap-southeast-1.pooler.supabase.com:5432/postgres
```

---

## ✅ YOUR ACTION ITEMS

### Immediate (5 minutes):

1. **Create Prisma user in Supabase**
   - Go to SQL Editor
   - Run the SQL commands above
   - Choose a secure password for the prisma user
   - Remember this password!

2. **Get Supavisor connection string**
   - Dashboard → Connect
   - Copy the Supavisor Session pooler string
   - Format: `postgres://prisma.PROJECT_REF:PASSWORD@REGION.pooler.supabase.com:5432/postgres`

3. **Update .env.local**
   - Provide me the complete Supavisor connection string
   - I'll update .env.local

4. **I'll execute migration**
   - Run: `npx prisma migrate dev --name init_schema`
   - Create 15 PostgreSQL tables
   - Verify build
   - Commit to git

---

## 📝 DETAILED STEPS

### Getting Your Supavisor URL

1. Open Supabase Dashboard
2. Select your project
3. Click **"Connect"** button (top right)
4. Choose language/framework: **Prisma**
5. Under connection string options, select **"Supavisor"** (pooled)
6. It will show something like:

   ```
   postgres://postgres.jwkysjidtkzriodgiydj:[PASSWORD]@ap-southeast-1.pooler.supabase.com:5432/postgres
   ```

7. **Change `postgres` to `prisma`** and use your new prisma password:

   ```
   postgres://prisma.jwkysjidtkzriodgiydj:[YOUR_PRISMA_PASSWORD]@ap-southeast-1.pooler.supabase.com:5432/postgres
   ```

---

## 🔐 SECURITY NOTES

- ✅ Prisma user has limited permissions (schema-specific)
- ✅ Not using admin postgres user
- ✅ .env.local stays local (not committed)
- ✅ Can monitor Prisma's queries in Supabase Dashboard
- ✅ Better for serverless/scaling deployments

---

## 🚀 ONCE DONE

Once you provide the Supavisor connection string:

```bash
$ npx prisma migrate dev --name init_schema
✅ 15 PostgreSQL tables created
✅ Prisma Client generated
✅ npm run build verification
✅ Git commit
✅ Ready for Monday Week 2
```

---

**Next Action:** Create Prisma user in Supabase → Get Supavisor URL → Provide connection string

