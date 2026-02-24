# 🔐 Vercel Environment Variables Setup

**Date:** February 24, 2026  
**App ID:** micro-task-03d1bf03bdda2981  
**Status:** 🔴 NEEDS SETUP

---

## 📋 Environment Variables to Add to Vercel

These are the environment variables needed for the **hybrid-rebuild** branch on Vercel:

| Variable Name | Value | Type | Required |
|---------------|-------|------|----------|
| `NEXT_PUBLIC_PI_APP_ID` | `micro-task-03d1bf03bdda2981` | Public | ✅ YES |
| `PI_API_KEY` | `qidswbctzqxwcwrxzmsk5s8r7isftncgs25ep8bxooos4gpkwrnnrdo1yyyqyasw` | Secret | ✅ YES |
| `DATABASE_URL` | `file:./dev.db` | Private | ✅ YES |
| `ADMIN_PASSWORD` | `pipulse_admin_2024` | Secret | ✅ YES |

---

## ✅ Step-by-Step Setup

### 1. Go to Vercel Dashboard
- Open https://vercel.com/dashboard
- Click on **pipulse** project
- Go to **Settings** tab

### 2. Navigate to Environment Variables
- Left sidebar → **Environment**
- Or click "Settings" → scroll down to "Environment Variables"

### 3. Add Each Variable

#### Add `NEXT_PUBLIC_PI_APP_ID` (Public)
1. Click **"Add New"** button
2. **Name:** `NEXT_PUBLIC_PI_APP_ID`
3. **Value:** `micro-task-03d1bf03bdda2981`
4. **Environment:** Development, Preview, Production (select all 3)
5. Click **"Save"**

#### Add `PI_API_KEY` (Secret)
1. Click **"Add New"** button
2. **Name:** `PI_API_KEY`
3. **Value:** `qidswbctzqxwcwrxzmsk5s8r7isftncgs25ep8bxooos4gpkwrnnrdo1yyyqyasw`
4. **Environment:** Development, Preview, Production (select all 3)
5. Click **"Save"**

#### Add `DATABASE_URL` (Private)
1. Click **"Add New"** button
2. **Name:** `DATABASE_URL`
3. **Value:** `file:./dev.db`
4. **Environment:** Development, Preview, Production (select all 3)
5. Click **"Save"**

#### Add `ADMIN_PASSWORD` (Secret)
1. Click **"Add New"** button
2. **Name:** `ADMIN_PASSWORD`
3. **Value:** `pipulse_admin_2024`
4. **Environment:** Development, Preview, Production (select all 3)
5. Click **"Save"**

### 4. Redeploy to Apply Changes
- Go to **Deployments** tab
- Find the latest deployment (should be from hybrid-rebuild)
- Click the **3-dot menu** → **"Redeploy"**
- Wait for deployment to complete (should be green ✅)

---

## 🔍 Verification

### After Redeployment
1. **Check Deployment Status**
   - Go to Deployments tab
   - Latest should show ✅ "Ready"
   - Click to see build logs

2. **Test the App**
   - Open deployment URL in Pi Browser
   - Verify it loads without 500 errors
   - Check browser console for Pi Network initialization logs
   - Try authentication flow

3. **Verify Environment Variables Loaded**
   - Open Vercel deployment
   - Open browser DevTools → Console
   - Look for logs showing Pi App ID being used
   - Example: `📝 Pi SDK Initializing with App ID: micro-task-03d1bf03bdda2981`

### If Build Fails Again
Check the **Deployment** page → **View Build Logs**:
- Look for errors mentioning `PI_API_KEY` not found
- If still seeing lock file errors, we may need to trigger rebuild again
- Contact support if environment variables not loading

---

## 🚀 What This Enables

Once environment variables are set:

✅ **Local Development:** `npm run dev` uses `.env.local`  
✅ **Vercel Staging:** Preview deployments use Preview env vars  
✅ **Vercel Production:** Live deployment uses Production env vars  
✅ **Pi Network Auth:** App can initialize Pi SDK with correct App ID  
✅ **API Calls:** Backend can call Pi Network API with API Key  

---

## 🔐 Security Notes

⚠️ **IMPORTANT:**
- `NEXT_PUBLIC_PI_APP_ID` is safe to expose (it's the public app identifier)
- `PI_API_KEY` is SECRET - never commit to GitHub
- `ADMIN_PASSWORD` is SECRET - only admins know this
- `.env.local` is already in `.gitignore` (won't be committed)

---

## 📝 Deployment Timeline

**Expected Flow:**
1. ✅ Environment variables added to Vercel
2. ⏳ Click Redeploy on latest deployment
3. ⏳ Build runs with environment variables (2-3 min)
4. ✅ Deployment completes (green checkmark)
5. ✅ App accessible at Vercel URL with Pi Network enabled

---

## ❓ Troubleshooting

### Issue: "Pi SDK not initialized"
**Solution:** Verify `NEXT_PUBLIC_PI_APP_ID` is set in Preview/Production environments

### Issue: "API Key not found"
**Solution:** Verify `PI_API_KEY` is set in environment variables

### Issue: Still getting 500 errors
**Solution:** Check deployment logs → look for environment variable errors → redeploy again

### Issue: Build still fails
**Solution:** 
1. Check build logs for specific error
2. If lock file error persists, run `pnpm install` locally and re-push
3. Trigger rebuild on Vercel

---

## 📞 Quick Reference

**Vercel Dashboard:** https://vercel.com/dashboard  
**Pipulse Project:** Look for "pipulse" in projects  
**Settings URL:** https://vercel.com/metaloys/pipulse/settings/environment-variables  

**Local Testing:**
```bash
cd c:\Users\PK-LUX\Desktop\pipulse
npm run dev
# Uses values from .env.local
# Should initialize Pi SDK with new App ID
```

---

## ✨ Final Status

| Item | Status |
|------|--------|
| `.env.local` updated | ✅ DONE |
| Vercel env vars | 🔴 NEEDS ACTION |
| Redeployment | ⏳ PENDING |
| Testing | ⏳ PENDING |

**Next:** Follow steps 1-4 above, then test!

---

**Created:** February 24, 2026  
**Last Updated:** February 24, 2026  
**Status:** Ready for Vercel setup
