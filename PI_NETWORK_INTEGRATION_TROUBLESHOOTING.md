# 🔧 Pi Network Integration Troubleshooting

**Date:** February 24, 2026  
**Status:** 🔴 CRITICAL ISSUES IDENTIFIED  
**Root Causes:** CSP Headers + Origin Mismatch

---

## 🚨 Issues You're Experiencing

### Issue 1: CSP Violation - Vercel Feedback Script Blocked
```
Loading the script 'https://vercel.live/_next-live/feedback/feedback.js' 
violates the following Content Security Policy directive
```

**Root Cause:** CSP header too restrictive - doesn't allow Vercel's own tools  
**Severity:** 🔴 CRITICAL - Blocks development feedback tools

### Issue 2: Origin Mismatch - Pi SDK PostMessage Failed
```
The target origin provided ('https://sandbox.minepi.com') 
does not match the recipient window's origin 
('https://pipulse-git-hybrid-rebuild-metaloys-projects.vercel.app')
```

**Root Cause:** Vercel deployment URL not whitelisted with Pi Network  
**Severity:** 🔴 CRITICAL - Blocks authentication completely

---

## 🔍 Understanding the Errors

### Error 1: CSP Header Issue
Your `next.config.mjs` has:
```javascript
'Content-Security-Policy': 
"script-src 'self' 'unsafe-eval' 'unsafe-inline' https://sdk.minepi.com https://api.minepi.com; ..."
```

This blocks:
- ❌ `https://vercel.live/*` (Vercel development tools)
- ❌ Vercel's internal scripts needed for deployment

### Error 2: Origin Mismatch
Pi Browser sandbox expects requests from approved domains. Your deployment:
- **Deployment URL:** `https://pipulse-git-hybrid-rebuild-metaloys-projects.vercel.app`
- **Expected by Pi:** URLs registered in Pi Network Dashboard for App ID `micro-task-03d1bf03bdda2981`

Problem: This specific Vercel URL probably hasn't been registered with Pi Network yet!

---

## ✅ SOLUTIONS

### SOLUTION 1: Fix CSP Headers (Immediate Fix)

Edit `next.config.mjs` to allow Vercel tools and expand allowed origins:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://sdk.minepi.com https://api.minepi.com https://vercel.live; frame-ancestors 'self' https://sandbox.minepi.com https://*.minepi.com https://*.vercel.app",
          },
        ],
      },
    ];
  },
};

export default nextConfig
```

**Changes Made:**
- ✅ Added `https://vercel.live` to `script-src` (allows Vercel tools)
- ✅ Added `https://*.vercel.app` to `frame-ancestors` (allows all Vercel deployments)
- ✅ Added `'self'` to `frame-ancestors` (allows same-origin framing)

---

### SOLUTION 2: Register Vercel URL with Pi Network (Critical)

Your Vercel deployment URL MUST be registered in Pi Network Dashboard for your App ID.

**Steps:**
1. Go to **Pi Network Dashboard** (for `micro-task-03d1bf03bdda2981`)
2. Find **"Allowed Domains"** or **"Whitelist URLs"** section
3. Add your Vercel deployment URL:
   - **Current:** `https://pipulse-git-hybrid-rebuild-metaloys-projects.vercel.app`
   - Or the final production URL (get from Vercel)

4. Also add these backup URLs:
   - `https://pipulse.vercel.app` (if you have custom domain)
   - `http://localhost:3000` (for local testing)
   - Any other Vercel preview URLs

5. **Save and wait 5-10 minutes** for Pi Network to sync changes

**Where to Find This:**
- Log in to Pi Network Developer Dashboard
- Select your app (`micro-task-03d1bf03bdda2981`)
- Settings → Allowed Domains / Whitelist URLs / OAuth URLs
- (Exact name depends on Pi Network dashboard version)

---

### SOLUTION 3: Use Custom Domain (Recommended Long-Term)

Instead of `pipulse-git-hybrid-rebuild-metaloys-projects.vercel.app`, use a custom domain:

**Option A: Connect Custom Domain**
1. Go to Vercel Dashboard → pipulse → Settings → Domains
2. Add custom domain (e.g., `pipulse.vercel.app` or your own domain)
3. Register this domain with Pi Network
4. Benefit: Stable URL, professional appearance

**Option B: Use Vercel Preview URLs**
1. Every pull request gets a unique preview URL
2. Register pattern with Pi Network: `https://pipulse-*.vercel.app`
3. All previews will work without re-registering

---

## 🛠️ Implementation Order

### Immediate (Next 5 minutes)
1. ✅ Fix CSP headers in `next.config.mjs` (SOLUTION 1)
2. ✅ Commit and push to GitHub
3. ✅ Trigger Vercel redeployment

### Short-term (Next 10 minutes)
4. ✅ Register Vercel URL with Pi Network Dashboard (SOLUTION 2)
5. ✅ Wait for Pi Network sync (5-10 min)
6. ✅ Test authentication again

### Long-term (Today/Tomorrow)
7. ✅ Set up custom domain (SOLUTION 3)
8. ✅ Update all documentation

---

## 📋 Step-by-Step: Fix & Deploy

### Step 1: Update `next.config.mjs`

Replace the CSP header with the improved version above.

**Quick Replace Command:**
- Find: `'Content-Security-Policy'` section
- Replace with: New expanded CSP (see SOLUTION 1 above)

### Step 2: Commit & Push
```bash
cd c:\Users\PK-LUX\Desktop\pipulse
git add next.config.mjs
git commit -m "🔐 Fix: Expand CSP headers for Vercel & Pi Network integration"
git push origin hybrid-rebuild
```

### Step 3: Vercel Auto-Redeploy
- Should trigger automatically
- Monitor Deployments tab
- Wait for green ✅ "Ready" status

### Step 4: Register with Pi Network
1. Go to Pi Network Developer Dashboard
2. Find your app settings
3. Add this Vercel URL to whitelist:
   ```
   https://pipulse-git-hybrid-rebuild-metaloys-projects.vercel.app
   ```
4. Save and wait 5-10 minutes

### Step 5: Test Again
1. Open Vercel deployment in Pi Browser
2. Console should NOT show:
   - ❌ CSP violation for `vercel.live`
   - ❌ Origin mismatch error
3. Should see:
   - ✅ "✅ Pi SDK initialized successfully"
   - ✅ "🔑 Requesting authentication"
   - ✅ Pi auth dialog appears

---

## 🔑 Key Learnings

| Issue | Why It Happens | Fix |
|-------|----------------|-----|
| CSP blocks Vercel scripts | Security headers too restrictive | Allow `vercel.live` in CSP |
| Origin mismatch | Domain not registered with Pi | Register Vercel URL in Pi Dashboard |
| Auth dialog never appears | SDK can't initialize on unregistered domain | Complete step 4 above |
| Works locally but not on Vercel | Env vars missing | Check `.env.local` vs Vercel settings |

---

## 🧪 Testing Checklist

After implementing all solutions:

- [ ] No CSP violation errors in console
- [ ] No origin mismatch errors in console
- [ ] Pi SDK logs show: "✅ Pi SDK initialized successfully"
- [ ] Pi auth dialog appears when clicking "Sign in with Pi"
- [ ] User can complete authentication
- [ ] User created in database
- [ ] App loads after authentication

---

## 🆘 If Issues Persist

### Still getting CSP error?
1. Hard refresh (Ctrl+Shift+R)
2. Clear browser cache
3. Check Vercel deployment logs
4. Verify CSP header was saved correctly

### Still getting origin mismatch?
1. Verify URL registered with Pi Network
2. Wait 15 minutes for Pi Network to sync
3. Try local testing first: `npm run dev`
4. Check browser console for actual deployment URL being used

### Authentication still fails?
1. Check browser DevTools → Application → Cookies
2. Verify `NEXT_PUBLIC_PI_APP_ID` env var is set in Vercel
3. Check Vercel deployment build logs for errors
4. Test with different browser/incognito mode

---

## 📞 References

**Pi Network Resources:**
- Pi Network Developer Dashboard: https://dashboard.minepi.com (or similar)
- Pi SDK Documentation: https://docs.minepi.com (or similar)
- Contact Pi Support: support@minepi.com

**Vercel Resources:**
- CSP Headers: https://vercel.com/docs/security
- Custom Domains: https://vercel.com/docs/concepts/projects/domains
- Environment Variables: https://vercel.com/docs/environment-variables

**Next.js Resources:**
- Security Headers: https://nextjs.org/docs/app/api-reference/next-config-js/headers
- Environment Variables: https://nextjs.org/docs/basic-features/environment-variables

---

## 🚀 After All Fixes Are Applied

Once CSP is fixed and URL is registered with Pi Network:

✅ App loads without errors  
✅ Pi SDK initializes correctly  
✅ Authentication dialog appears  
✅ Users can sign in via Pi Browser  
✅ User data stored in database  
✅ App ready for Week 2 testing  

**Status Update:** After fixes → Ready to proceed with Week 2 testing!

---

**Created:** February 24, 2026  
**Status:** Solution provided, waiting for implementation  
**Next Step:** Apply SOLUTION 1 (fix CSP headers) immediately
