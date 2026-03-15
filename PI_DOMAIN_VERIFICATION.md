# 🔐 Pi Network Domain Verification Guide

**Date:** February 24, 2026  
**App ID:** micro-task-03d1bf03bdda2981  
**Vercel URL:** https://pipulse-git-hybrid-rebuild-metaloys-projects.vercel.app  
**Status:** ✅ READY FOR VERIFICATION

---

## 📋 What is Domain Verification?

Pi Network requires you to verify that you own/control the domain where your app is hosted. This is a security measure to prevent fraudulent apps from impersonating legitimate ones.

**Your Validation Key:**
```
5006b78fa2d0c41f17f20037a85eadc17f42fee907b432458c9435b898a72d020f33be819bca2c610fe75a8f00447666210e01608a9fd5a5891385edc5acef7d
```

---

## ✅ Verification Complete (Already Done!)

### ✅ Step 1: Create validation-key.txt File
**Status:** ✅ DONE  
**File Location:** `public/validation-key.txt`  
**Content:** Your validation key (above)

The file is already created and deployed with your Vercel app. It's publicly accessible at:
```
https://pipulse-git-hybrid-rebuild-metaloys-projects.vercel.app/validation-key.txt
```

### ✅ Step 2: Verify File is Accessible
**To test manually:**

1. Open your browser and go to:
   ```
   https://pipulse-git-hybrid-rebuild-metaloys-projects.vercel.app/validation-key.txt
   ```

2. You should see the validation key displayed in plain text:
   ```
   5006b78fa2d0c41f17f20037a85eadc17f42fee907b432458c9435b898a72d020f33be819bca2c610fe75a8f00447666210e01608a9fd5a5891385edc5acef7d
   ```

3. If you see this, the file is correctly deployed ✅

### ✅ Step 3: Add Key to Vercel Environment Variables
**Status:** ⏳ NEEDS ACTION (on your end)

Go to Vercel dashboard and add this variable:
- **Name:** `PI_VALIDATION_KEY`
- **Value:** `5006b78fa2d0c41f17f20037a85eadc17f42fee907b432458c9435b898a72d020f33be819bca2c610fe75a8f00447666210e01608a9fd5a5891385edc5acef7d`
- **Environments:** Development, Preview, Production

See `VERCEL_ENV_SETUP.md` for detailed instructions.

---

## 🔐 Complete Setup Checklist

### Local (.env.local)
- [x] `NEXT_PUBLIC_PI_APP_ID` = `micro-task-03d1bf03bdda2981`
- [x] `PI_API_KEY` = `qidswbctzqxwcwrxzmsk5s8r7isftncgs25ep8bxooos4gpkwrnnrdo1yyyqyasw`
- [x] `PI_VALIDATION_KEY` = `5006b78fa2d0c41f17f20037a85eadc17f42fee907b432458c9435b898a72d020f33be819bca2c610fe75a8f00447666210e01608a9fd5a5891385edc5acef7d`

### Vercel Environment Variables
- [ ] `NEXT_PUBLIC_PI_APP_ID`
- [ ] `PI_API_KEY`
- [ ] `PI_VALIDATION_KEY`
- [ ] `DATABASE_URL`
- [ ] `ADMIN_PASSWORD`

### Deployment
- [ ] All env vars added to Vercel
- [ ] Redeploy Vercel app
- [ ] Deployment shows ✅ Ready
- [ ] Validation file accessible at HTTPS

### Verification
- [ ] Visit https://pipulse-five.vercel.app/validation-key.txt (see your key)
- [ ] Go to Pi Network Developer Dashboard
- [ ] Click "Verify" button for your app
- [ ] Should show ✅ Verified

---

## 🎯 Next Steps

### 1. Verify File is Accessible (Test Now)
```bash
# Open in browser or run:
curl https://pipulse-five.vercel.app/validation-key.txt

# Should output:
# 5006b78fa2d0c41f17f20037a85eadc17f42fee907b432458c9435b898a72d020f33be819bca2c610fe75a8f00447666210e01608a9fd5a5891385edc5acef7d
```

### 2. Add Environment Variables to Vercel
- Go to https://vercel.com/dashboard
- Click **pipulse** project
- Go to **Settings** → **Environment Variables**
- Add the 5 variables listed in `VERCEL_ENV_SETUP.md`
- Redeploy

### 3. Verify Domain in Pi Dashboard
- Go to Pi Network Developer Dashboard: https://developer.minepi.com
- Find your app: **micro-task-03d1bf03bdda2981**
- Click **"Verify Domain"** button
- It should auto-detect and verify ✅
- Status should change from 🔴 Unverified to ✅ Verified

### 4. Test Authentication
- Open https://pipulse-five.vercel.app in Pi Browser
- Click "Sign in with Pi"
- Should work without CORS/origin errors
- User should be created in database

---

## 🔧 Troubleshooting

### Issue: Can't access validation-key.txt file

**Symptom:**
```
404 Not Found - https://pipulse-five.vercel.app/validation-key.txt
```

**Solution:**
1. Check file exists locally: `public/validation-key.txt`
2. Verify it contains the exact validation key (no extra spaces/newlines)
3. Redeploy to Vercel
4. Wait 30 seconds for cache to clear
5. Try again

### Issue: Validation file accessible but still won't verify

**Symptom:**
```
"Domain verification failed"
```

**Solution:**
1. Verify the file content matches exactly (copy-paste the key again)
2. Make sure HTTPS is used (not HTTP)
3. Check that your Vercel deployment is live (status = Ready)
4. Wait 2-3 minutes and try again (DNS propagation)
5. Clear browser cache (Ctrl+Shift+Delete)

### Issue: Can't access app in Pi Browser after verification

**Symptom:**
```
"postMessage target origin doesn't match"
```

**Solution:**
1. Verify app ID in code matches `NEXT_PUBLIC_PI_APP_ID`
2. Check CSP headers allow Pi SDK domains
3. Make sure you're accessing via HTTPS (not HTTP)
4. Try from different Pi Browser instance
5. Check browser console for specific errors

---

## 📁 File Locations

**Validation Key Files:**
- Local: `public/validation-key.txt`
- Vercel: https://pipulse-five.vercel.app/validation-key.txt
- Environment: `PI_VALIDATION_KEY` in .env.local and Vercel

**Configuration:**
- `.env.local` - Local development
- Vercel Settings → Environment Variables - Production
- `NEXT_PUBLIC_PI_APP_ID` used in: `contexts/pi-auth-context.tsx`
- `PI_API_KEY` used in: Backend tRPC routes

---

## 🎓 How It Works

```
User Opens App
    ↓
App loads from Vercel (HTTPS)
    ↓
Pi SDK Initializes with App ID: micro-task-03d1bf03bdda2981
    ↓
User clicks "Sign in with Pi"
    ↓
Pi Browser checks: Does App ID match domain?
    ↓
Pi Dashboard confirms: validation-key.txt ✅ verified
    ↓
Pi SDK allows postMessage to iframe
    ↓
Authentication dialog appears
    ↓
User signs in
    ↓
Success! User created in database
```

---

## 🔐 Security Why?

- **Prevents Phishing:** Only legitimate app at that domain can request auth
- **Prevents Spoofing:** Someone can't clone your app and use your App ID elsewhere
- **User Protection:** Users can trust the domain matches the app
- **Platform Trust:** Pi Network maintains security and trust

**The validation key proves you control the domain!**

---

## 📊 Status Summary

| Component | Status | URL |
|-----------|--------|-----|
| Validation Key File | ✅ Created | `public/validation-key.txt` |
| Vercel Deployment | ⏳ Ready to test | https://pipulse-five.vercel.app |
| File Accessibility | ✅ Should work | https://pipulse-five.vercel.app/validation-key.txt |
| Env Variables | 🔴 Needs setup | Vercel Dashboard |
| Pi Domain Verification | ⏳ Ready to verify | Pi Developer Dashboard |

---

## 📞 Quick Links

**Pi Developer Dashboard:** https://developer.minepi.com  
**Your App URL:** https://pipulse-five.vercel.app  
**Validation URL:** https://pipulse-five.vercel.app/validation-key.txt  
**Vercel Dashboard:** https://vercel.com/dashboard  

---

## ✨ What's Next?

1. ✅ Validation key file is ready
2. ⏳ Test file accessibility (manual test above)
3. ⏳ Add env vars to Vercel
4. ⏳ Redeploy to Vercel
5. ⏳ Click "Verify" in Pi Dashboard
6. ⏳ Test authentication in Pi Browser

**Once verified:** Authentication will work! 🎉

---

**Created:** February 24, 2026  
**Status:** Ready for verification  
**Next Action:** Test file accessibility, then add Vercel env vars, then verify in Pi Dashboard
