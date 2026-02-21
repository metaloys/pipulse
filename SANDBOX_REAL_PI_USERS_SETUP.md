# 🔐 Real Pi Network User Authentication in Sandbox

## ⚠️ CRITICAL ISSUE FOUND

Your app is currently configured with `SANDBOX: false`, which means:

```
SANDBOX: false → Using PRODUCTION Pi Network API
```

This causes a problem in the sandbox environment:
- ❌ Sandbox provides test Pi credentials
- ❌ But your app expects PRODUCTION credentials
- ❌ Authentication will fail or show errors

---

## ✅ SOLUTION: Enable Sandbox Mode

### **What Needs to Change:**

**File:** `lib/system-config.ts`

**Current Configuration (BROKEN for sandbox):**
```typescript
export const PI_NETWORK_CONFIG = {
  SDK_URL: "https://sdk.minepi.com/pi-sdk.js",
  SANDBOX: false,  // ← This is the problem
} as const;

export const BACKEND_CONFIG = {
  BASE_URL: "https://api.minepi.com",  // ← Production API
  BLOCKCHAIN_BASE_URL: "https://api.mainnet.minepi.com",
} as const;
```

**Fixed Configuration (for sandbox testing):**
```typescript
export const PI_NETWORK_CONFIG = {
  SDK_URL: "https://sdk.minepi.com/pi-sdk.js",
  SANDBOX: true,  // ← Change to true for sandbox
} as const;

export const BACKEND_CONFIG = {
  BASE_URL: "https://api.testnet.minepi.com",  // ← Testnet API
  BLOCKCHAIN_BASE_URL: "https://api.testnet.minepi.com",  // ← Testnet blockchain
} as const;
```

---

## 🔄 How Sandbox vs Production Works

### **SANDBOX MODE (Testing):**
```
Your App (Sandbox)
    ↓
Pi SDK (Sandbox version)
    ↓
Pi Sandbox Environment
    ↓
Test Pi Credentials
    ↓
Test Pi API (api.testnet.minepi.com)
    ↓
✅ Test payments with fake Pi coins
✅ Test user authentication with test accounts
✅ No real transactions
```

### **PRODUCTION MODE (Real Users):**
```
Your App (Vercel/Real)
    ↓
Pi SDK (Production version)
    ↓
Real Pi Browser
    ↓
Real Pi Network User
    ↓
Real Pi API (api.minepi.com)
    ↓
✅ Real Pi coins
✅ Real user authentication
✅ Real transactions
```

---

## 📋 Configuration Checklist

### **For Sandbox Testing (NOW):**
```
lib/system-config.ts:

export const PI_NETWORK_CONFIG = {
  SDK_URL: "https://sdk.minepi.com/pi-sdk.js",
  SANDBOX: true,  ← CHANGE TO TRUE
} as const;

export const BACKEND_CONFIG = {
  BASE_URL: "https://api.testnet.minepi.com",  ← USE TESTNET
  BLOCKCHAIN_BASE_URL: "https://api.testnet.minepi.com",  ← USE TESTNET
} as const;
```

### **For Production (Later, on Vercel):**
```
lib/system-config.ts:

export const PI_NETWORK_CONFIG = {
  SDK_URL: "https://sdk.minepi.com/pi-sdk.js",
  SANDBOX: false,  ← False for production
} as const;

export const BACKEND_CONFIG = {
  BASE_URL: "https://api.minepi.com",  ← Production API
  BLOCKCHAIN_BASE_URL: "https://api.mainnet.minepi.com",  ← Mainnet
} as const;
```

---

## 🛠️ Steps to Fix

### **Step 1: Update system-config.ts**

**Change this:**
```typescript
export const PI_NETWORK_CONFIG = {
  SDK_URL: "https://sdk.minepi.com/pi-sdk.js",
  SANDBOX: false,  // ← CHANGE THIS
} as const;

export const BACKEND_CONFIG = {
  BASE_URL: "https://api.minepi.com",  // ← CHANGE THIS
  BLOCKCHAIN_BASE_URL: "https://api.mainnet.minepi.com",  // ← CHANGE THIS
} as const;
```

**To this:**
```typescript
export const PI_NETWORK_CONFIG = {
  SDK_URL: "https://sdk.minepi.com/pi-sdk.js",
  SANDBOX: true,  // ← CHANGED
} as const;

export const BACKEND_CONFIG = {
  BASE_URL: "https://api.testnet.minepi.com",  // ← CHANGED
  BLOCKCHAIN_BASE_URL: "https://api.testnet.minepi.com",  // ← CHANGED
} as const;
```

### **Step 2: Rebuild Your App**
```bash
npm run build
```

Should complete without errors ✅

### **Step 3: Test in Sandbox**
```
https://sandbox.minepi.com/mobile-app-ui/app/pulsepi-301bee4712c4615e
```

Now you should be able to:
- ✅ See Pi authentication dialog
- ✅ Use sandbox test credentials
- ✅ Get real Pi user data (from sandbox)
- ✅ Test all features with test accounts

### **Step 4: Commit Changes**
```bash
git add lib/system-config.ts
git commit -m "chore: Enable sandbox mode for testing with real Pi test users"
git push
```

---

## 🔐 Environment Variables Setup

You also need to add these to work with the official API:

### **For Vercel (Later):**
```
NEXT_PUBLIC_PI_APP_ID = your-app-id-from-developer-portal
PI_API_KEY = your-api-key-from-developer-portal
```

### **For Local Development:**
Create `.env.local`:
```
NEXT_PUBLIC_PI_APP_ID=your-app-id
PI_API_KEY=your-api-key
```

---

## 📊 API Endpoints Comparison

### **Testnet (Sandbox):**
```
Base URL: https://api.testnet.minepi.com
User Auth: GET /v2/me
Payments: /v2/payments/[paymentId]
Blockchain: https://api.testnet.minepi.com
Purpose: Testing with test accounts
```

### **Mainnet (Production):**
```
Base URL: https://api.minepi.com
User Auth: GET /v2/me
Payments: /v2/payments/[paymentId]
Blockchain: https://api.mainnet.minepi.com
Purpose: Real users, real Pi coins
```

---

## ✅ What Real Pi Sandbox Users Get

Once you enable sandbox mode and use testnet API:

### **You Can Test:**
- ✅ Real Pi user authentication
- ✅ Real Pi user data (username, uid, etc.)
- ✅ Real Pi user profiles
- ✅ Real Pi user balance (test Pi)
- ✅ User creation on Supabase
- ✅ Commission tracking
- ✅ Task assignment to real (test) users

### **All Using Test Accounts:**
```
Test User Credentials:
- Username: Pi Network test account
- Password: Provided in sandbox
- Pi Balance: Fake test Pi (not real)
- Blockchain: Testnet (not real blockchain)
```

---

## 🔍 Check Your Current Configuration

### **Current Configuration (WRONG for sandbox):**
```
lib/system-config.ts:

PI_NETWORK_CONFIG.SANDBOX: false ← Production
BACKEND_CONFIG.BASE_URL: "https://api.minepi.com" ← Production API

Result: Sandbox test credentials won't work! ❌
```

### **What It Should Be (RIGHT for sandbox):**
```
lib/system-config.ts:

PI_NETWORK_CONFIG.SANDBOX: true ← Sandbox
BACKEND_CONFIG.BASE_URL: "https://api.testnet.minepi.com" ← Testnet API

Result: Sandbox test credentials will work! ✅
```

---

## 🚀 Implementation Steps

1. **Open:** `lib/system-config.ts`

2. **Find Line 1-10:**
   ```typescript
   export const PI_NETWORK_CONFIG = {
     SDK_URL: "https://sdk.minepi.com/pi-sdk.js",
     SANDBOX: false,  ← Change this
   } as const;
   ```

3. **Change to:**
   ```typescript
   export const PI_NETWORK_CONFIG = {
     SDK_URL: "https://sdk.minepi.com/pi-sdk.js",
     SANDBOX: true,  ← Changed
   } as const;
   ```

4. **Find Line 6-10:**
   ```typescript
   export const BACKEND_CONFIG = {
     BASE_URL: "https://api.minepi.com",  ← Change this
     BLOCKCHAIN_BASE_URL: "https://api.mainnet.minepi.com",  ← Change this
   } as const;
   ```

5. **Change to:**
   ```typescript
   export const BACKEND_CONFIG = {
     BASE_URL: "https://api.testnet.minepi.com",  ← Changed
     BLOCKCHAIN_BASE_URL: "https://api.testnet.minepi.com",  ← Changed
   } as const;
   ```

6. **Save File**

7. **Build:**
   ```bash
   npm run build
   ```

8. **Test:**
   - Open sandbox URL
   - Press F12
   - Look for: "✅ Pi Network user verified" in console

---

## 📝 Important Notes

### **When Testing in Sandbox:**
- Use testnet API endpoints
- Use sandbox/test Pi credentials
- Test with test accounts only
- No real Pi coins transferred
- All data is temporary/test data

### **When Going to Production (Vercel):**
- Change back to `SANDBOX: false`
- Use production API endpoints (`api.minepi.com`)
- Real Pi users can authenticate
- Real Pi coins can be transferred
- Real data is stored permanently

### **NEVER:**
- ❌ Use production API in sandbox
- ❌ Use sandbox mode in production
- ❌ Mix testnet and mainnet endpoints
- ❌ Commit test API keys to GitHub

---

## 🎯 Success Criteria

After making these changes, test in sandbox:

```
✅ Page loads without SDK errors
✅ See Pi authentication dialog
✅ Can use sandbox test credentials
✅ Get real Pi user data in console
✅ Console shows: "✅ Pi Network user verified: [username]"
✅ User profile loads correctly
✅ No API 401/403 errors
✅ Dashboard displays user info
```

---

## 📊 Configuration Matrix

| Setting | Sandbox Testing | Production |
|---------|-----------------|------------|
| SANDBOX | `true` | `false` |
| BASE_URL | api.testnet.minepi.com | api.minepi.com |
| BLOCKCHAIN_URL | api.testnet.minepi.com | api.mainnet.minepi.com |
| Users | Test accounts | Real users |
| Credentials | Test tokens | Real tokens |
| Pi Coins | Fake (test) | Real |
| Purpose | Testing | Live app |

---

## 🔗 Related Files to Check

- `lib/system-config.ts` ← **FIX THIS**
- `contexts/pi-auth-context.tsx` ← Uses config
- `.env.local` ← Add environment variables
- `.env.example` ← Reference

---

## 🎉 Ready to Test?

### **After Making Changes:**

1. **Build:**
   ```bash
   npm run build
   ```

2. **Test in Sandbox:**
   ```
   https://sandbox.minepi.com/mobile-app-ui/app/pulsepi-301bee4712c4615e
   ```

3. **Open DevTools (F12):**
   - Go to Console tab
   - Look for success message:
   ```
   ✅ Pi Network user verified: [test-username]
   ```

4. **If Works:**
   - ✅ Commit changes
   - ✅ Push to GitHub
   - ✅ Test other features

5. **If Not Working:**
   - Check console errors
   - Verify configuration changes saved
   - Hard refresh (Ctrl+Shift+R)
   - Try again

---

## 📞 Quick Summary

**Problem:** Sandbox can't authenticate because app uses production API

**Solution:** Enable sandbox mode in system-config.ts

**Changes Needed:**
```
1. SANDBOX: false → true
2. BASE_URL: api.minepi.com → api.testnet.minepi.com
3. BLOCKCHAIN_BASE_URL: mainnet → testnet
```

**Result:** Real Pi test users can authenticate in sandbox ✅

---

**Ready to implement?** Let me update your configuration! 🚀

