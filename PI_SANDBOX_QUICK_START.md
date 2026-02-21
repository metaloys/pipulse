# 🧪 Pi Sandbox Testing - QUICK START

## 🌐 Your Sandbox URL

```
https://sandbox.minepi.com/mobile-app-ui/app/pulsepi-301bee4712c4615e
```

**Click the link above to test your app in any browser!** ✅

---

## ⚡ Quick Testing Steps (5 Minutes)

### **Step 1: Open Sandbox** (30 seconds)
```
https://sandbox.minepi.com/mobile-app-ui/app/pulsepi-301bee4712c4615e
```

### **Step 2: Open DevTools** (10 seconds)
```
Press: F12 (or Ctrl+Shift+I)
Go to: Console tab
Watch for errors: Should be NONE ✅
```

### **Step 3: Test Authentication** (1 minute)
- [ ] Click "Sign in with Pi"
- [ ] Complete sandbox auth
- [ ] See dashboard load
- [ ] Console shows: `✅ Pi user verified`

### **Step 4: Test Features** (2 minutes)
- [ ] Create a task
- [ ] Accept the task
- [ ] Submit work
- [ ] Check admin dashboard (/admin, password: pipulse_admin_2024)

### **Step 5: Check Results** (1 minute)
- [ ] No red errors in console ✅
- [ ] All buttons work ✅
- [ ] Mobile view looks good ✅
- [ ] Data loads correctly ✅

---

## 📋 Testing Checklist

| Feature | Test | Status |
|---------|------|--------|
| Load Page | Opens without errors | ⏳ |
| Authentication | Login works | ⏳ |
| Dashboard | Data displays | ⏳ |
| Create Task | Task posts | ⏳ |
| Accept Task | Can accept | ⏳ |
| Submit Work | Submission works | ⏳ |
| Admin Panel | Password works | ⏳ |
| Console | No errors | ⏳ |
| Mobile View | Responsive | ⏳ |

---

## 🔧 Browser Console Commands (Optional)

Check these in console (F12 → Console tab):

### **Check Pi SDK:**
```javascript
console.log(window.Pi)  // Should show Pi SDK object
```

### **Check Auth Token:**
```javascript
console.log(localStorage.getItem('pipulse_auth_token'))
```

### **Check User:**
```javascript
console.log(localStorage.getItem('pipulse_user'))
```

---

## 🐛 If You See Errors

| Error | Solution |
|-------|----------|
| "SDK not loaded" | Wait 5 sec, refresh page |
| "Not authenticated" | Clear cache, log in again |
| "API 401" | Check environment variables |
| "Cannot read property" | Check console for full error |
| "Network error" | Check internet connection |

---

## 📸 What to Look For

### **✅ Good Signs:**
```
✅ Page loads in <2 seconds
✅ Console shows zero red errors
✅ Can log in successfully
✅ Dashboard displays user data
✅ Buttons respond immediately
✅ Forms submit without errors
✅ Mobile view is responsive
```

### **❌ Bad Signs:**
```
❌ Page loads slowly (>5 seconds)
❌ Red errors in console
❌ Cannot log in
❌ Data won't display
❌ Buttons don't respond
❌ Forms error on submit
❌ Layout breaks on mobile
```

---

## 🎯 Testing Path

```
1. Open Sandbox URL (F12)
         ↓
2. Check console (0 errors) ✅
         ↓
3. Sign in with Pi
         ↓
4. Create test task
         ↓
5. Accept the task
         ↓
6. Submit work
         ↓
7. Test admin (/admin)
         ↓
8. Document findings
         ↓
9. All good? → Proceed to PiNet setup ✅
```

---

## 🚀 You're Ready!

**Just click this link to test:**

👉 **https://sandbox.minepi.com/mobile-app-ui/app/pulsepi-301bee4712c4615e**

**Open F12 while testing** to catch any issues!

---

## 📚 Need More Details?

See: **PI_SANDBOX_TESTING_GUIDE.md** (full comprehensive guide)

This quick reference covers:
- Sandbox URL
- Quick testing steps  
- Feature checklist
- Common errors
- What to look for

---

**Test your app now!** 🧪

