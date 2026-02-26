# 🔐 VERCEL ENVIRONMENT VARIABLES - COMPLETE SETUP

**Date:** February 24, 2026  
**Status:** ⏳ REQUIRES YOUR ACTION ON VERCEL DASHBOARD  
**Deployment:** https://pipulse-git-hybrid-rebuild-metaloys-projects.vercel.app

---

## 📋 WHAT YOU NEED TO ADD TO VERCEL

Go to: **https://vercel.com/dashboard** → **pipulse** → **Settings** → **Environment Variables**

Add these **7 variables** for **Development, Preview, and Production** environments:

### **1. NEXT_PUBLIC_SUPABASE_URL** (Public - Safe to expose)
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://jwkysjidtkzriodgiydj.supabase.co
Environments: Development, Preview, Production
```

### **2. NEXT_PUBLIC_SUPABASE_ANON_KEY** (Public - Limited access via RLS)
```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3a3lzamlkdGt6cmlvZGdpeWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTczMTgsImV4cCI6MjA4NzI3MzMxOH0.VN0tvRujFHDoZhBYSBOGdofKyJh1teLw0jZ0JtC-7Vs
Environments: Development, Preview, Production
```

### **3. SUPABASE_URL** (Server-side - NOT public)
```
Name: SUPABASE_URL
Value: https://jwkysjidtkzriodgiydj.supabase.co
Environments: Development, Preview, Production
```

### **4. SUPABASE_SERVICE_ROLE_KEY** (Server-side ADMIN - Keep secret!)
```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3a3lzamlkdGt6cmlvZGdpeWRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTY5NzMxOCwiZXhwIjoyMDg3MjczMzE4fQ.XCPAyqe3zAYy_3e8d1WAeduYIZnRJ4AwfA17o2ZQJzU
Environments: Development, Preview, Production
```

### **5. DATABASE_URL** (Supabase PostgreSQL - Production database)
```
Name: DATABASE_URL
Value: postgresql://postgres:Gisenyi2020@db.jwkysjidtkzriodgiydj.supabase.co:5432/postgres
Environments: Development, Preview, Production
```

### **6. NEXT_PUBLIC_PI_APP_ID** (Public - Pi Network app identifier)
```
Name: NEXT_PUBLIC_PI_APP_ID
Value: micro-task-03d1bf03bdda2981
Environments: Development, Preview, Production
```

### **7. PI_API_KEY** (Secret - Pi Network API key)
```
Name: PI_API_KEY
Value: qidswbctzqxwcwrxzmsk5s8r7isftncgs25ep8bxooos4gpkwrnnrdo1yyyqyasw
Environments: Development, Preview, Production
```

---

## ✅ STEP-BY-STEP INSTRUCTIONS

### 1. Open Vercel Dashboard
- Go to: https://vercel.com/dashboard
- Click on **pipulse** project

### 2. Go to Settings
- Click **Settings** tab (top navigation)
- Left sidebar → **Environment Variables**

### 3. Add Each Variable
For each variable above:
1. Click **Add New** button
2. Copy the **Name** and **Value** from above
3. Check boxes for: ✅ Development ✅ Preview ✅ Production
4. Click **Save**

### 4. Redeploy
- Go to **Deployments** tab
- Find latest deployment from `hybrid-rebuild` branch
- Click **3-dot menu** → **Redeploy**
- Wait for ✅ green checkmark (2-3 minutes)

### 5. Verify Deployment
- Check deployment status: Should say "Ready ✅"
- Click to view build logs
- Look for: No errors in environment variable loading

---

## 🔍 VERIFICATION CHECKLIST

After adding all variables and redeploying:

- [ ] Vercel shows deployment status = **Ready ✅**
- [ ] No build errors in deployment logs
- [ ] Can access app at: https://pipulse-git-hybrid-rebuild-metaloys-projects.vercel.app
- [ ] App loads without 500 errors
- [ ] Can open browser DevTools → Console
- [ ] No errors about missing env variables

---

## 🧪 TEST THE FIX

Once Vercel deployment succeeds, the tRPC createUser should work:

### Expected Success Response:
```
✅ User created/fetched successfully
```

### If Still Seeing 405 Error:
Check Vercel Deployment → Function Logs:
```
POST /api/trpc/auth.createUser
Status: 200 ✅ (should be 200 now, not 405)
```

---

## 🔐 SECURITY NOTES

- ✅ `NEXT_PUBLIC_*` variables are safe (exposed to browser)
- ⚠️ `SUPABASE_SERVICE_ROLE_KEY` is ADMIN key - keep secret!
- ⚠️ `PI_API_KEY` is SECRET - never share publicly
- ✅ `.env.local` is in `.gitignore` (not committed to GitHub)
- ✅ Vercel environment variables are encrypted at rest

---

## 📊 VARIABLE SUMMARY TABLE

| Name | Type | Scope | Purpose |
|------|------|-------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Browser | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Browser | Supabase read/write with RLS |
| `SUPABASE_URL` | Private | Server | Supabase admin connection |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Server | Supabase admin operations |
| `DATABASE_URL` | Secret | Server | Prisma database connection (PostgreSQL) |
| `NEXT_PUBLIC_PI_APP_ID` | Public | Browser | Pi Network app identifier |
| `PI_API_KEY` | Secret | Server | Pi Network API authentication |

---

## 🚀 WHAT HAPPENS NEXT

### With Correct Environment Variables:

1. ✅ Vercel deployment reads PostgreSQL DATABASE_URL
2. ✅ Prisma connects to Supabase PostgreSQL (not local SQLite)
3. ✅ tRPC /api/trpc routes work with database
4. ✅ createUser mutation creates users in database
5. ✅ Pi Network authentication works end-to-end

### Timeline:
- Add env vars: **5 minutes**
- Vercel redeploy: **2-3 minutes**
- Test: **1 minute**
- **Total:** ~10 minutes

---

## 📞 QUICK COPY-PASTE VALUES

```
NEXT_PUBLIC_SUPABASE_URL=https://jwkysjidtkzriodgiydj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3a3lzamlkdGt6cmlvZGdpeWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTczMTgsImV4cCI6MjA4NzI3MzMxOH0.VN0tvRujFHDoZhBYSBOGdofKyJh1teLw0jZ0JtC-7Vs
SUPABASE_URL=https://jwkysjidtkzriodgiydj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3a3lzamlkdGt6cmlvZGdpeWRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTY5NzMxOCwiZXhwIjoyMDg3MjczMzE4fQ.XCPAyqe3zAYy_3e8d1WAeduYIZnRJ4AwfA17o2ZQJzU
DATABASE_URL=postgresql://postgres:Gisenyi2020@db.jwkysjidtkzriodgiydj.supabase.co:5432/postgres
NEXT_PUBLIC_PI_APP_ID=micro-task-03d1bf03bdda2981
PI_API_KEY=qidswbctzqxwcwrxzmsk5s8r7isftncgs25ep8bxooos4gpkwrnnrdo1yyyqyasw
```

---

## ✨ NEXT ACTION

1. ✅ Copy values from "QUICK COPY-PASTE VALUES" section above
2. ⏳ Go to Vercel dashboard and add all 7 variables
3. ⏳ Redeploy
4. ✅ Test that createUser works (should see ✅ success)

**Status:** Awaiting your action on Vercel dashboard

---

**Created:** February 24, 2026  
**Last Updated:** February 24, 2026  
**Version:** 1.0 - Complete setup guide
