# 🔑 VERCEL ENVIRONMENT VARIABLES SETUP

## ✅ You Need These Variables

PiPulse requires **2 environment variables** to connect to Supabase (your database).

---

## 📋 Environment Variables Needed

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

These are "NEXT_PUBLIC" which means they're safe to expose in the browser (they only have read/write access via RLS).

---

## 🔍 Where to Get Your Values

### **Step 1: Open Supabase**
Go to: https://app.supabase.com
- Select your project
- Click "Settings" (bottom left)
- Click "API" (left sidebar)

### **Step 2: Copy Your Values**

You'll see:

```
Project URL (copy this)
→ NEXT_PUBLIC_SUPABASE_URL

Anon public API key (copy this)
→ NEXT_PUBLIC_SUPABASE_ANON_KEY
```

**Example values:**
```
NEXT_PUBLIC_SUPABASE_URL=https://jwkysjidtkzriodgiydj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3a3lzamlkdGt6cmlvZGdpeWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTczMTgsImV4cCI6MjA4NzI3MzMxOH0.VN0tvRujFHDoZhBYSBOGdofKyJh1teLw0jZ0JtC-7Vs
```

---

## 🚀 Add to Vercel (2 Methods)

### **Method 1: During Initial Deploy (Easiest)**

When you deploy to Vercel and see this screen:

```
Configure Project
┌─────────────────────────────────────────┐
│ Environment Variables                   │
│ ┌─────────────────────────────────────┐ │
│ │ NAME          │ VALUE               │ │
│ ├─────────────────────────────────────┤ │
│ │ (click here)  │ (paste value)       │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Do This:**

1. **First Row:**
   - NAME: `NEXT_PUBLIC_SUPABASE_URL`
   - VALUE: (paste your Supabase URL)

2. **Click "+ Add" button**

3. **Second Row:**
   - NAME: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - VALUE: (paste your Supabase Anon Key)

4. **Click "Deploy"**

✅ Done! Variables are set during deployment.

---

### **Method 2: After Deploy (If You Forgot)**

If you already deployed without variables:

1. **Go to Vercel Dashboard:**
   - https://vercel.com/dashboard

2. **Click Your Project:**
   - Select "pipulse"

3. **Go to Settings:**
   - Click "Settings" tab (top)

4. **Go to Environment Variables:**
   - Click "Environment Variables" (left sidebar)

5. **Add Variables:**
   - Click "Add New"
   - NAME: `NEXT_PUBLIC_SUPABASE_URL`
   - VALUE: (paste from Supabase)
   - Select: "Production" checkbox
   - Click "Save"

6. **Add Second Variable:**
   - Click "Add New" again
   - NAME: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - VALUE: (paste from Supabase)
   - Select: "Production" checkbox
   - Click "Save"

7. **Redeploy:**
   - Go to "Deployments" tab
   - Click "Redeploy" on latest deployment
   - Wait for build to complete

✅ Done! App now has database connection.

---

## ✨ Complete Deployment Flow With Variables

```
1. Go to Vercel
   └─ https://vercel.com/new

2. Import Repository
   └─ Select: metaloys/pipulse
   └─ Click: Import

3. Configure Project
   ├─ Framework: Next.js ✅ (auto-detected)
   ├─ Root Directory: ./ (default)
   └─ Environment Variables: (ADD HERE!)
       ├─ NEXT_PUBLIC_SUPABASE_URL = [your Supabase URL]
       └─ NEXT_PUBLIC_SUPABASE_ANON_KEY = [your anon key]

4. Click "Deploy"
   └─ Wait 2-3 minutes

5. Get Your Live URL
   └─ Example: https://pipulse-abc123.vercel.app

6. Run SQL in Supabase
   └─ Create disputes table

7. Test on Pi Browser
   └─ Open your Vercel URL
   └─ Should connect to database ✅
```

---

## ✅ Verify Variables Are Set

After deploying, verify your variables are working:

1. **Go to your Vercel URL**
   - Example: https://pipulse-abc123.vercel.app

2. **Check Browser Console:**
   - Press F12 (Developer Tools)
   - Go to "Console" tab
   - You should **NOT** see errors like:
     ```
     Cannot read properties of undefined (reading 'from')
     ```

3. **Try to Login:**
   - Create an account
   - If it works → Variables are correct! ✅
   - If error → Check Vercel environment settings

---

## 🔒 Security Note

⚠️ **These are PUBLIC keys** (NEXT_PUBLIC prefix)
- Safe to expose in browser (this is intentional)
- Protected by Supabase RLS (Row Level Security)
- Users can only access their own data

---

## 📊 Your Supabase Credentials (Reference)

From your `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://jwkysjidtkzriodgiydj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3a3lzamlkdGt6cmlvZGdpeWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTczMTgsImV4cCI6MjA4NzI3MzMxOH0.VN0tvRujFHDoZhBYSBOGdofKyJh1teLw0jZ0JtC-7Vs
```

✅ Use these exact values in Vercel!

---

## 🛠️ Troubleshooting

### **"Database connection failed"**
- Check variables are set in Vercel
- Go to Settings → Environment Variables
- Verify names match exactly (case-sensitive!)
- Verify values are complete (no missing characters)

### **"RLS policy denied access"**
- This is normal! Users can only access their own data
- Try creating an account and logging in
- If still failing → Check Supabase RLS policies

### **"Variables not showing in app"**
- Did you redeploy after adding variables?
- Go to Deployments → Click "Redeploy"
- Wait for build to complete
- Then reload browser

### **"Can't authenticate"**
- Variables set correctly?
- Is Supabase project running?
- Check Supabase status: https://status.supabase.com

---

## 🎯 Success Criteria

Your environment variables are set correctly when:

- ✅ App loads on Vercel without console errors
- ✅ Can create an account
- ✅ Can see admin button in header
- ✅ Can access `/admin` (shows login form)
- ✅ Admin login works with password
- ✅ Dashboard shows real data from Supabase

---

## 📋 Checklist Before Deploying

- [ ] Copied `NEXT_PUBLIC_SUPABASE_URL` from Supabase
- [ ] Copied `NEXT_PUBLIC_SUPABASE_ANON_KEY` from Supabase
- [ ] Going to Vercel deployment screen
- [ ] Will add both variables during "Configure Project" step
- [ ] Will click "Deploy" after adding variables
- [ ] Will create disputes table SQL after deploy
- [ ] Will test on Pi Browser after all setup

---

## 🚀 Ready to Deploy!

1. **Gather Your Variables** (from Supabase)
2. **Deploy to Vercel** (add variables during setup)
3. **Create Disputes Table** (run SQL)
4. **Test on Pi Browser** (open your live URL)

**That's it! Your app is live with database connection! 🎉**

---

## 📞 Quick Reference

| Variable | Value | Where to Get |
|----------|-------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Anon Key | Supabase → Settings → API → Anon Key |

---

**Now you're ready to deploy with the proper environment variables! 🚀**
