# 🧪 Pi Network Sandbox Testing Guide

## 🌐 Testing Your App in Pi Sandbox

You can now test your app in the Pi Network sandbox environment using any browser without needing an actual Pi Browser or phone!

**Sandbox URL:** https://sandbox.minepi.com/mobile-app-ui/app/pulsepi-301bee4712c4615e

---

## ✅ What You Can Test

### **In the Sandbox:**
- ✅ Pi authentication flow
- ✅ User login functionality
- ✅ App interface and design
- ✅ Basic navigation
- ✅ Task creation (limited)
- ✅ Form submissions

### **Limitations (Sandbox Only):**
- ❌ Real Pi coin transfers (uses test tokens)
- ❌ Real blockchain transactions
- ❌ Actual payment processing
- ❌ Real user data (uses test data)
- ❌ Commission tracking with real coins

---

## 🚀 How to Access the Sandbox

### **Step 1: Open the Sandbox URL**
```
https://sandbox.minepi.com/mobile-app-ui/app/pulsepi-301bee4712c4615e
```

**OR**

Go to: https://sandbox.minepi.com
1. Search for: "PiPulse" or "Pulse"
2. Click your app
3. Click "Open App"

### **Step 2: Use Sandbox Credentials**
When you see the login screen:

**Option A: Test with Sandbox Account**
- The sandbox provides test accounts
- You can create a test Pi account
- Use test credentials to authenticate

**Option B: Skip Authentication (If Available)**
- Some apps allow "Demo Mode"
- Useful for testing UI without login
- Check if your app shows demo option

### **Step 3: Test Your App Features**
- ✅ Create a test task
- ✅ Test task submissions
- ✅ Navigate between pages
- ✅ Test admin dashboard (password: pipulse_admin_2024)
- ✅ Check console for any errors (F12)

---

## 🔧 Sandbox Configuration

### **Current Configuration:**
```typescript
PI_NETWORK_CONFIG {
  SDK_URL: "https://sdk.minepi.com/pi-sdk.js"
  SANDBOX: false  ← Currently set to PRODUCTION
}

BACKEND_CONFIG {
  BASE_URL: "https://api.minepi.com"  ← Official Pi Network API
}
```

### **For Full Sandbox Testing (Optional):**
You can change `SANDBOX: false` to `SANDBOX: true` to use Pi's testnet sandbox APIs:

**File to Change:** `lib/system-config.ts`

```typescript
// For sandbox testing:
export const PI_NETWORK_CONFIG = {
  SDK_URL: "https://sdk.minepi.com/pi-sdk.js",
  SANDBOX: true,  // ← Change to true for testnet
} as const;

// For sandbox backend:
export const BACKEND_CONFIG = {
  BASE_URL: "https://api.testnet.minepi.com",  // ← Testnet API
  BLOCKCHAIN_BASE_URL: "https://api.testnet.minepi.com",
} as const;
```

---

## 🧪 What to Test in Sandbox

### **1. Authentication Flow**
- [ ] Tap "Sign in with Pi"
- [ ] See Pi auth dialog
- [ ] Complete sandbox auth
- [ ] Verify app loads with test user
- [ ] Check console for auth success message

### **2. Dashboard & Stats**
- [ ] See task statistics
- [ ] Check user balance display
- [ ] Verify leaderboard loads
- [ ] Check commission display

### **3. Create a Task**
- [ ] Click "Create Task"
- [ ] Fill in task details:
  - Title: "Test Task"
  - Description: "Testing in sandbox"
  - Reward: 1π
  - Category: Testing
  - Slots: 2
- [ ] Click "Post Task"
- [ ] Verify task appears in list

### **4. Accept a Task**
- [ ] Click on any task
- [ ] Click "Accept Task"
- [ ] Verify task shows as accepted
- [ ] Check tasks are updated

### **5. Submit Work**
- [ ] Click "Submit Work"
- [ ] Add submission (text/image/file)
- [ ] Click "Submit"
- [ ] Verify submission appears in pending

### **6. Admin Dashboard**
- [ ] Go to: /admin
- [ ] Enter password: `pipulse_admin_2024`
- [ ] Verify dashboard loads
- [ ] Check statistics
- [ ] Test ban user feature

### **7. Browser Console (F12)**
- [ ] Press F12 to open dev tools
- [ ] Go to Console tab
- [ ] Look for any error messages
- [ ] Check for success messages:
  ```
  ✅ Pi Network SDK loaded
  ✅ Pi user verified: [test-username]
  ```

---

## 🐛 Testing for Bugs

While in the sandbox, check for:

### **Critical:**
- [ ] App loads without errors
- [ ] Authentication completes
- [ ] Data loads and displays
- [ ] Buttons are clickable

### **Important:**
- [ ] Forms submit properly
- [ ] Navigation works smoothly
- [ ] Images load correctly
- [ ] Mobile responsive design

### **Nice to Have:**
- [ ] Animations are smooth
- [ ] Colors display correctly
- [ ] Fonts render properly
- [ ] Layout looks clean

---

## 📊 Browser DevTools Checklist

### **Open DevTools (F12)**

1. **Console Tab:**
   - Look for red error messages
   - Check for warnings
   - Verify success messages

2. **Network Tab:**
   - Watch API calls
   - Check response status (should be 200)
   - Look for failed requests (red)

3. **Application Tab:**
   - Check localStorage
   - Verify session is stored
   - Check cookies

4. **Mobile View:**
   - Click device toggle (Ctrl+Shift+M)
   - Test on iPhone size
   - Test on Android size

---

## 🔗 Useful Sandbox Links

### **Sandbox Environment:**
- **Main Sandbox:** https://sandbox.minepi.com
- **Your App Sandbox:** https://sandbox.minepi.com/mobile-app-ui/app/pulsepi-301bee4712c4615e
- **Pi SDK Sandbox Docs:** https://sdk.minepi.com/docs

### **Developer Resources:**
- **Developer Portal:** https://developers.minepi.com
- **Pi Documentation:** https://minepi.com/docs
- **API Reference:** https://api.minepi.com

---

## 💡 Sandbox Testing Tips

### **Do's:**
- ✅ Test frequently during development
- ✅ Use test accounts for testing
- ✅ Clear browser cache between tests
- ✅ Check console for error messages
- ✅ Test on mobile view
- ✅ Document any bugs you find

### **Don'ts:**
- ❌ Don't expect real Pi coins
- ❌ Don't commit any test data
- ❌ Don't use real credentials
- ❌ Don't skip error messages
- ❌ Don't ignore console warnings

---

## 🐛 Common Issues & Solutions

### **"SDK not loaded" Error**
**Solution:**
1. Wait 5 seconds for SDK to load
2. Refresh the page
3. Check internet connection
4. Check browser console for errors

### **"Not authenticated" Message**
**Solution:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Log out and log back in
3. Try a different browser
4. Check if Pi auth dialog appears

### **Data Not Loading**
**Solution:**
1. Check Network tab in DevTools
2. Verify API URL is correct
3. Check if response status is 200
4. Look for any error messages in Console

### **App Looks Wrong**
**Solution:**
1. Toggle mobile view (Ctrl+Shift+M)
2. Check responsive breakpoints
3. Zoom in/out to test scaling
4. Clear CSS cache (hard refresh)

---

## 📸 Taking Screenshots for Testing

### **Document Your Tests:**
1. Screenshot of successful login
2. Screenshot of task creation
3. Screenshot of task submission
4. Screenshot of admin dashboard
5. Screenshot of console (no errors)
6. Screenshot of mobile view

Save these for your records!

---

## ✅ Testing Checklist

- [ ] Sandbox URL loads
- [ ] Authentication works
- [ ] Dashboard displays
- [ ] Tasks load correctly
- [ ] Can create a task
- [ ] Can accept a task
- [ ] Can submit work
- [ ] Admin dashboard works
- [ ] No console errors
- [ ] Mobile view responsive
- [ ] All buttons clickable
- [ ] Forms submit properly

---

## 📝 Expected Results

### **Successful Sandbox Test Looks Like:**

```
✅ Page loads quickly
✅ No red errors in console
✅ Can log in with test credentials
✅ Dashboard shows user info
✅ Can create tasks without errors
✅ Can accept and submit work
✅ Admin dashboard password works
✅ Mobile view looks good
✅ All navigation works smoothly
✅ Responsive design adapts to screen size
```

### **If You See Issues:**

```
❌ Red errors in console
❌ API returns 401/403/500
❌ Buttons don't respond
❌ Data doesn't load
❌ Forms won't submit
❌ Layout breaks on mobile
```

**Document the error message and check the solution section above!**

---

## 🚀 Next Steps After Sandbox Testing

### **If Sandbox Testing is Successful:**
1. ✅ Proceed with setting PiNet subdomain
2. ✅ Add environment variables to Vercel
3. ✅ Test on real Pi Browser (phone)
4. ✅ Launch to real users

### **If You Find Bugs:**
1. ❌ Document the issue
2. ❌ Check console for error messages
3. ❌ Try to reproduce the bug
4. ❌ Fix the bug in code
5. ❌ Test again in sandbox
6. ❌ Repeat until all issues resolved

---

## 🎯 Quick Start

1. **Open Sandbox:**
   ```
   https://sandbox.minepi.com/mobile-app-ui/app/pulsepi-301bee4712c4615e
   ```

2. **Open DevTools (F12):**
   - Watch console for errors
   - Check network requests

3. **Test Each Feature:**
   - Login → Dashboard → Create Task → Accept → Submit

4. **Check Results:**
   - No console errors ✅
   - All features work ✅
   - Mobile view responsive ✅

5. **Document Findings:**
   - What worked well
   - What had issues
   - What needs fixing

---

## 📞 Support

### **If Something Doesn't Work:**
1. Check browser console (F12)
2. Look for error message
3. Try the solution in "Common Issues" above
4. Take a screenshot of the error
5. Document the issue for fixing

---

## 🎉 Ready to Test!

Your app is ready for sandbox testing! 

**Go test it here:**
👉 https://sandbox.minepi.com/mobile-app-ui/app/pulsepi-301bee4712c4615e

**Open DevTools (F12) while testing to catch any issues!** 🔧

