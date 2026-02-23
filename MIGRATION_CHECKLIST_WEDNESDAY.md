# 🔄 WEDNESDAY MIGRATION CHECKLIST

**Date:** Wednesday, February 25, 2026  
**Time:** Morning  
**Branch:** `hybrid-rebuild`  
**Task:** Run Prisma schema migration  

---

## ✅ Pre-Migration Checklist

Before running migration, verify:

- [x] Schema fully designed (15 models)
- [x] User modifications applied:
  - [x] acceptedAt field added to Submission
  - [x] maxRevisionAttempts changed to 1
  - [x] piWallet confirmed nullable
- [x] All files committed to hybrid-rebuild branch
- [x] Documentation complete
- [x] User approval obtained

---

## 🚀 Migration Command (Copy & Paste Ready)

```bash
cd c:\Users\PK-LUX\Desktop\pipulse
npx prisma migrate dev --name init_schema
```

**Note:** Run this command in terminal at 9 AM Wednesday morning

---

## 📋 What Happens During Migration

### Step 1: Analyze Schema
- Reads `prisma/schema.prisma`
- Compares with database state
- Generates SQL migration

### Step 2: Create Migration File
- Creates: `prisma/migrations/[timestamp]_init_schema/migration.sql`
- Contains all CREATE TABLE statements
- Includes all ENUMs, indexes, constraints

### Step 3: Apply to Database
- Connects to PostgreSQL
- Runs migration.sql against database
- Creates 15 tables:
  - User, Task, Submission, Transaction
  - SlotLock, TaskVersion, FailedCompletion, Dispute
  - Notification, AuditLog, PlatformSettings, Streak
  - Plus 9 ENUMs

### Step 4: Generate Prisma Client
- Runs: `npx prisma generate`
- Creates type-safe Client in `node_modules/.prisma/client`
- Updates TypeScript definitions
- Ready for queries

### Step 5: Success Message
```
✔ Your database has been successfully migrated, and Prisma Client has been updated.
```

---

## 📊 Migration Output

**You should see:**
```
Prisma schema loaded from prisma/schema.schema.prisma
Datasource "db": PostgreSQL database "pipulse" at "localhost:5432"

✔ Enter a name for the new migration: init_schema

✔ Your database has been successfully migrated!

✔ Generated Prisma Client (X.X.X) to ./node_modules/@prisma/client in XXXms

Start using Prisma Client in your application here:
  import { PrismaClient } from '@prisma/client'
  const prisma = new PrismaClient()
```

---

## ✅ Post-Migration Verification

After migration completes, verify:

1. **Migration File Created:**
   ```bash
   ls prisma/migrations/
   ```
   Should show: `[timestamp]_init_schema/` folder

2. **Migration SQL Exists:**
   ```bash
   cat prisma/migrations/[timestamp]_init_schema/migration.sql
   ```
   Should show 300+ lines of CREATE TABLE statements

3. **Prisma Client Generated:**
   ```bash
   ls node_modules/.prisma/client/
   ```
   Should show: `index.d.ts` and other generated files

4. **Database Tables Created:**
   ```bash
   npx prisma db execute --stdin
   SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
   ```
   Should show: user, task, submission, transaction, etc.

---

## 📝 Commit Migration to Git

After successful migration:

```bash
# Add migration file to git
git add prisma/migrations/

# Commit
git commit -m "chore: Initial database schema migration

- Migrated 15 models from Prisma schema
- Created all tables, indexes, foreign keys
- Registered 9 ENUMs
- Generated Prisma Client types"

# Push to origin
git push origin hybrid-rebuild
```

---

## 🔧 If Migration Fails

**Common Issues:**

### Issue 1: DATABASE_URL not set
```
Error: Environment variable not found: DATABASE_URL
```
**Fix:** Verify `.env` or `.env.local` has DATABASE_URL set

### Issue 2: Cannot connect to database
```
Error: Can't connect to the database
```
**Fix:** Verify PostgreSQL is running and connection string is correct

### Issue 3: Migration conflicts
```
Error: Migration '...' was rolled back
```
**Fix:** Check database state, may need manual cleanup

**Support:** Share error message and I'll help debug

---

## 📋 Remaining Tasks (Wednesday - Friday)

After migration succeeds:

1. **Install Additional Libraries:**
   ```bash
   npm install zod @trpc/server @trpc/react-query --legacy-peer-deps
   npm install -D @testing-library/react vitest --legacy-peer-deps
   ```

2. **Verify Prisma Client Works:**
   ```typescript
   // Create test file: lib/db.test.ts
   import { PrismaClient } from '@prisma/client'
   
   const prisma = new PrismaClient()
   
   async function test() {
     const users = await prisma.user.findMany()
     console.log(`Total users: ${users.length}`)
   }
   ```

3. **Set Up Build System:**
   - Verify TypeScript compilation
   - Test Next.js build
   - Verify no type errors

4. **Friday Finalization:**
   - All dependencies installed
   - Build system verified
   - Ready for Week 2 auth system

---

## 🎯 Success Criteria

Migration is successful when:

- ✅ Command completes without errors
- ✅ Migration file created in `prisma/migrations/`
- ✅ All 15 tables visible in PostgreSQL
- ✅ Prisma Client generated with types
- ✅ No TypeScript compilation errors
- ✅ Can query database with Prisma
- ✅ Migration committed to git

---

## 📞 Troubleshooting

If anything goes wrong, check:

1. **DATABASE_URL** is set correctly in `.env.local`
2. **PostgreSQL** is running and accessible
3. **Prisma schema** is valid (no syntax errors)
4. **Git** branch is `hybrid-rebuild`
5. **Node version** is 18+ (check: `node --version`)
6. **npm version** is 8+ (check: `npm --version`)

---

## 🚀 Ready?

**When:** Wednesday, February 25, 2026 - Morning  
**Command:** `npx prisma migrate dev --name init_schema`  
**Expected Time:** 2-5 minutes  
**Next Phase:** Week 2 Auth System (starts Monday)  

**Let's go! 🎉**

