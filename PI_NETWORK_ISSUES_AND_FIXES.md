# 🚨 Pi Network Integration Issues - FIXES

**Date:** February 24, 2026  
**Status:** 🔴 CRITICAL - Origin Mismatch Error  
**Branch:** hybrid-rebuild

---

## 🔴 ISSUES ENCOUNTERED

### Issue 1: Origin Mismatch Error
```
Failed to execute 'postMessage' on 'DOMWindow': 
The target origin provided ('https://sandbox.minepi.com') 
does not match the recipient window's origin 
('https://pipulse-git-hybrid-rebuild-metaloys-projects.vercel.app')
```

**Root Cause:** Pi SDK sandbox expects specific origin(s) to be registered in your Pi App Dashboard

**What This Means:** Pi Network's iframe-based auth dialog can only communicate with registered domains

---

### Issue 2: CSP Warning
```
Loading the script 'https://vercel.live/_next-live/feedback/feedback.js' 
violates the following Content Security Policy directive
```

**Root Cause:** Vercel's live feedback script conflicts with CSP headers  
**Status:** ✅ FIXED - CSP headers already configured in `next.config.mjs`

---

## ✅ FIXES APPLIED

### Fix 1: Added App ID to Pi.init() Call
**File:** `contexts/pi-auth-context.tsx` (Line 364-371)

**Before:**
```typescript
await window.Pi.init({
  version: "2.0",
  sandbox: PI_NETWORK_CONFIG.SANDBOX,
});
```

**After:**
```typescript
const piAppId = process.env.NEXT_PUBLIC_PI_APP_ID;
if (!piAppId) {
  throw new Error("NEXT_PUBLIC_PI_APP_ID environment variable is not set");
}

console.log(`📝 Initializing Pi SDK with App ID: ${piAppId}`);
await window.Pi.init({
  version: "2.0",
  appId: piAppId,  // ← CRITICAL: Now includes App ID
  sandbox: PI_NETWORK_CONFIG.SANDBOX,
});
console.log("✅ Pi SDK initialized successfully with App ID:", piAppId);
```

**Why This Matters:**
- Pi SDK needs to know the `appId` to validate against its database
- Without `appId`, Pi Network doesn't know which app is requesting auth
- Causes origin mismatch because Pi can't find registered domain

---

## 🔧 NEXT STEPS (CRITICAL)

### Step 1: Register Your Vercel URL with Pi Network

**Current Vercel URL:** 
```
https://pipulse-git-hybrid-rebuild-metaloys-projects.vercel.app
```

**What You Need to Do:**
1. Go to **Pi Developer Dashboard**: https://developers.minepi.com/
2. Log in with your developer account
3. Find your app: **micro-task-03d1bf03bdda2981**
4. Go to **App Settings** → **Allowed Domains** or **Callback URLs**
5. Add your Vercel URL:
   ```
   https://pipulse-git-hybrid-rebuild-metaloys-projects.vercel.app
   ```
6. **Save Changes**

**Why This Matters:**
- Pi Network maintains a whitelist of allowed domains for security
- Your Vercel URL must be registered before auth will work
- This is what fixes the origin mismatch error

### Step 2: Test Locally First (Recommended)

Before redeploying, verify the fix works locally:

```bash
cd c:\Users\PK-LUX\Desktop\pipulse
npm run dev
```

**Expected Console Logs:**
```
📝 Initializing Pi SDK with App ID: micro-task-03d1bf03bdda2981
✅ Pi SDK initialized successfully with App ID: micro-task-03d1bf03bdda2981
🔑 Requesting authentication with scopes: (2) ['username', 'payments']
```

**What to Check:**
- ✅ No "NEXT_PUBLIC_PI_APP_ID not set" error
- ✅ App ID is logged to console
- ✅ Pi auth dialog appears when you click "Sign in with Pi"

---

## 🚀 DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] Vercel URL registered in Pi Dashboard (REQUIRED)
- [ ] App ID fix committed locally
- [ ] Build passes locally: `npm run build`
- [ ] Console shows App ID initialization

### Deployment
- [ ] Commit and push changes to GitHub
- [ ] Vercel auto-redeploys (check Deployments tab)
- [ ] Wait for ✅ "Ready" status
- [ ] Open deployment URL

### Post-Deployment Testing
- [ ] App loads without 500 errors
- [ ] Console shows App ID initialization
- [ ] Pi auth dialog appears on click
- [ ] No "origin mismatch" errors
- [ ] Authentication flow completes

---

## 📋 VERCEL URL TO REGISTER

**Your App ID:** `micro-task-03d1bf03bdda2981`

**Current Vercel Deployment URL:**
```
https://pipulse-git-hybrid-rebuild-metaloys-projects.vercel.app
```

**Dashboard Link:** https://developers.minepi.com/

**Time to Register:** 5 minutes  
**After Registration:** Changes take effect immediately

---

## 🔍 VERIFICATION STEPS

### 1. Verify App ID is in Environment
Open Vercel Dashboard → pipulse → Settings → Environment Variables
- ✅ `NEXT_PUBLIC_PI_APP_ID` = `micro-task-03d1bf03bdda2981`
- ✅ Set to All environments (Development, Preview, Production)

### 2. Verify Code Change
Check `contexts/pi-auth-context.tsx` line 364-377:
- ✅ `appId: piAppId` is in `Pi.init()` call
- ✅ Error thrown if `NEXT_PUBLIC_PI_APP_ID` is missing
- ✅ App ID logged to console

### 3. Local Test (Before Redeployment)
```bash
npm run dev
# Open http://localhost:3000
# Open DevTools → Console
# Look for: "Initializing Pi SDK with App ID: micro-task-03d1bf03bdda2981"
```

### 4. Vercel Test (After Redeployment)
```
1. Wait for Vercel deployment to complete
2. Open deployment URL in Pi Browser
3. Check console for App ID initialization
4. Click "Sign in with Pi"
5. Verify auth dialog appears
```

---

## 💡 WHY THIS HAPPENED

1. **Pi SDK Design:** Uses iframe-based authentication for security
2. **Origin Security:** Pi Network validates that requests come from registered domains
3. **Our Mistake:** Didn't include `appId` in `Pi.init()` call
4. **The Fix:** Added `appId` parameter so Pi knows which app is requesting auth

**Key Learning:**
- Pi SDK needs `appId` in init AND the domain must be registered
- Without both, origin mismatch occurs
- This is a security feature to prevent unauthorized apps from requesting auth

---

## 🐛 DEBUGGING

If auth still fails after these steps:

### Check Browser Console
```javascript
// Should see:
📝 Initializing Pi SDK with App ID: micro-task-03d1bf03bdda2981
✅ Pi SDK initialized successfully with App ID: micro-task-03d1bf03bdda2981
🔑 Requesting authentication with scopes: (2) ['username', 'payments']

// Should NOT see:
"NEXT_PUBLIC_PI_APP_ID not set"
"target origin provided (...) does not match the recipient window's origin"
```

### Check Network Tab
1. Open DevTools → Network tab
2. Click "Sign in with Pi"
3. Look for requests to:
   - `https://sdk.minepi.com/pi-sdk.js` ✅ Should load
   - `https://sandbox.minepi.com` ✅ Should be allowed
4. If blocked, check CSP headers

### Check Vercel Env Vars
1. Go to Vercel Dashboard
2. Project: pipulse
3. Settings → Environment Variables
4. Verify all 4 are set:
   - ✅ `NEXT_PUBLIC_PI_APP_ID`
   - ✅ `PI_API_KEY`
   - ✅ `DATABASE_URL`
   - ✅ `ADMIN_PASSWORD`

---

## 📞 IF PROBLEM PERSISTS

1. **Verify URL is Registered:**
   - Go to Pi Dashboard
   - Check app settings for allowed domains
   - Confirm your Vercel URL is there
   - Save if needed (sometimes takes 1 min)

2. **Try Different URL:**
   - If deployment URL changes, update in Pi Dashboard
   - Always use exact URL shown in Vercel deployment
   - No trailing slashes

3. **Check App ID:**
   - Confirm `micro-task-03d1bf03bdda2981` is correct
   - Don't confuse with old app IDs
   - Should match exactly

4. **Force Rebuild:**
   - Go to Vercel → Deployments
   - Click 3-dot menu on latest → "Redeploy"
   - Don't rebuild, just redeploy
   - This clears cache and uses latest env vars

---

## ✨ SUMMARY

| Item | Status | Action |
|------|--------|--------|
| Code Fix (appId in init) | ✅ DONE | Committed |
| Local Environment | ✅ DONE | .env.local updated |
| Vercel Environment | ✅ DONE | Env vars set |
| Domain Registration | 🔴 TODO | Register in Pi Dashboard |
| Build & Test | ⏳ PENDING | After domain registration |

---

## 📝 COMMANDS

### Local Test
```bash
cd c:\Users\PK-LUX\Desktop\pipulse
npm run dev
# Test at http://localhost:3000
```

### Commit & Push
```bash
git add contexts/pi-auth-context.tsx
git commit -m "🔑 Critical: Add appId to Pi.init() call - Fixes origin mismatch"
git push origin hybrid-rebuild
```

### Vercel Redeploy
1. Go to https://vercel.com/dashboard
2. Select pipulse project
3. Click Deployments tab
4. Find latest deployment
5. Click 3-dot menu → Redeploy
6. Wait for ✅ Ready

---

**Created:** February 24, 2026  
**Priority:** 🔴 CRITICAL  
**Blocker:** Domain registration needed in Pi Dashboard  
**ETA:** 5 min to register + 2 min for redeployment
