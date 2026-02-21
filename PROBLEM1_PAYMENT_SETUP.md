# PROBLEM 1: Two-Step Payment Flow Implementation

## ✅ What We've Implemented

We've created a complete two-step Pi Network payment system:

### **Step 1: Employer Posts Task (Escrow Lock)**
```
Employer pays 10π → PiPulse Owner Wallet
Database records: Transaction status = "locked"
```

### **Step 2: Approval Triggers Payment (Escrow Release)**
```
PiPulse Owner pays Worker: 10π × 0.85 = 8.5π
PiPulse keeps: 10π × 0.15 = 1.5π (commission)
Both payments recorded on blockchain + database
```

---

## 🔧 Configuration Required

### **Step 1: Get Your Pi Network Wallet Details**

1. Open Pi Network app on your mobile
2. Go to **Wallet** → **Account**
3. Copy your **Pi Username** (e.g., "yourname_pi")
4. Copy your **Wallet Address** (long hexadecimal string starting with "0x...")

### **Step 2: Update Configuration in `lib/pi-payment-escrow.ts`**

**OPEN FILE:** `lib/pi-payment-escrow.ts`

Find these two lines at the top (around line 23-24):

```typescript
export const PIPULSE_OWNER_WALLET_ID = 'pipulse_owner'; // THIS IS PLACEHOLDER
export const PIPULSE_OWNER_USERNAME = 'pipulse_owner'; // THIS IS PLACEHOLDER
```

Replace them with YOUR actual values:

```typescript
export const PIPULSE_OWNER_WALLET_ID = '0x1234567890abcdef1234567890abcdef12345678'; // Your wallet address
export const PIPULSE_OWNER_USERNAME = 'your_pi_username'; // Your Pi username (without quotes or spaces)
```

### **Example Configuration:**
```typescript
// ❌ WRONG
export const PIPULSE_OWNER_WALLET_ID = 'my wallet';

// ✅ CORRECT  
export const PIPULSE_OWNER_WALLET_ID = '0x9a5e8f3d1b2a4c6e7f8a9b0c1d2e3f4a5b6c7d8e';
export const PIPULSE_OWNER_USERNAME = 'alex_pioneer';
```

---

## 📋 Files Modified

### **NEW FILE: `lib/pi-payment-escrow.ts`**
- `initiateEscrowPayment()` - Employer posts task, pays to PiPulse owner
- `releasePaymentToWorker()` - On approval, pays worker (85%) and keeps fee (15%)
- `calculateWorkerPayment()` - Utility to calculate split
- `verifyPaymentConfiguration()` - Checks config is valid

### **UPDATED: `components/submission-review-modal.tsx`**
- Imports new payment functions
- `handleApprove()` now calls `releasePaymentToWorker()` before database approval
- Added payment breakdown display showing:
  - Task reward amount
  - 15% PiPulse fee
  - Worker's net payment

### **UPDATED: `lib/database.ts`**
- Added `getTodayCommissions()` - Total Pi collected today
- Added `getMonthCommissions()` - Total Pi collected this month
- Added `getTransactionsByDateRange()` - Query transactions by date
- Added `getPendingTransactions()` - Get unconfirmed payments
- Added `updateTransactionStatus()` - Mark payment completed

---

## 🚀 How It Works in Practice

### **Scenario: Employer Posts 10π Task**

1. Employer fills task form → clicks "Post Task"
2. App calls `initiateEscrowPayment(task_id, 10π)`
3. **Pi SDK opens payment UI** → User approves payment
4. 10π transfers from Employer Wallet → **PiPulse Owner Wallet**
5. Database records: `{ sender: employer, receiver: pipulse_owner, amount: 10π, status: "locked" }`
6. Task appears in app as "Available"

### **Scenario: Worker Gets Approved**

1. Employer views submission → clicks "Approve & Pay"
2. App calculates:
   - Worker gets: 10π × 0.85 = **8.5π**
   - PiPulse keeps: 10π × 0.15 = **1.5π**
3. App calls `releasePaymentToWorker(worker_id, 8.5π)`
4. **Pi SDK opens payment UI** → User (PiPulse owner) approves payment
5. 8.5π transfers from PiPulse Owner Wallet → **Worker Wallet**
6. Database records TWO transactions:
   - Payment: `{ sender: pipulse_owner, receiver: worker, amount: 8.5π, fee: 1.5π }`
   - Commission: `{ sender: pipulse_owner, receiver: pipulse_owner, amount: 1.5π, type: "fee" }`
7. Submission marked as "Approved" ✅
8. Task marked as "Completed"

---

## 🔐 Security Notes

### **Private vs Public Keys**
- `PIPULSE_OWNER_WALLET_ID` is your public wallet address (safe to share)
- Your **private key** is NEVER stored in code (kept in Pi Network app)
- Pi SDK handles all signing internally

### **Never Put These in Code**
- ❌ Private keys
- ❌ Seed phrases  
- ❌ Secret tokens
- ❌ Backend API keys

---

## 🧪 Testing the Payment Flow

### **Before Deployment**
1. Create test user as employer
2. Create test user as worker
3. Have employer post a task
   - Watch for Pi SDK payment prompt
   - Approve the escrow payment
4. Have worker submit proof
5. Have employer approve submission
   - Watch for Pi SDK payment prompt (worker payment)
   - Approve the payment
6. Check Supabase:
   - `transactions` table should have 3 rows:
     - Escrow lock (employer → pipulse)
     - Worker payment (pipulse → worker)
     - Commission tracking (pipulse revenue)

### **On Mainnet (After Testing)**
Same flow, but with real Pi coins moving between real wallets!

---

## 💡 Payment Configuration Verification

Run this test to make sure everything is configured correctly:

**In `app/page.tsx`, add this near the top inside the component:**

```typescript
import { verifyPaymentConfiguration } from '@/lib/pi-payment-escrow';

export default function HomePage() {
  useEffect(() => {
    const config = verifyPaymentConfiguration();
    if (!config.isValid) {
      console.error('❌ Payment configuration errors:');
      config.errors.forEach(err => console.error('  -', err));
    } else {
      console.log('✅ Payment configuration is valid!');
    }
  }, []);
  
  // ... rest of component
}
```

If you see errors in console, you haven't configured the wallet IDs correctly yet.

---

## 🎯 Commission Flow Diagram

```
INITIAL STATE:
├─ Employer Wallet:  1000π
├─ PiPulse Wallet:      0π
└─ Worker Wallet:     100π

STEP 1: Employer Posts 10π Task
├─ Employer Wallet:   990π  (paid 10π to escrow)
├─ PiPulse Wallet:     10π  (holds escrow)
└─ Worker Wallet:     100π

STEP 2: Employer Approves Submission
├─ Employer Wallet:   990π  (no change)
├─ PiPulse Wallet:    1.5π  (keeps 1.5π fee)
└─ Worker Wallet:    108.5π  (received 8.5π payment)

RESULT:
✅ Employer paid 10π total
✅ Worker earned 8.5π
✅ PiPulse keeps 1.5π as revenue
```

---

## ⚠️ Common Issues

### **"Window.pay is not a function"**
- **Cause:** Pi payment system not initialized
- **Fix:** Make sure `initializeGlobalPayment()` is called in auth context
- **Check:** Look for `initializePaymentRewardHandling()` in `pi-auth-context.tsx`

### **"PIPULSE_OWNER_WALLET_ID must be set"**
- **Cause:** You haven't updated the config yet
- **Fix:** Replace 'pipulse_owner' with your actual wallet ID in `pi-payment-escrow.ts`
- **Verify:** Run `verifyPaymentConfiguration()` test

### **Payment Shows in SDK but not in Database**
- **Cause:** Payment succeeded on blockchain but database transaction failed
- **Fix:** Check Supabase connection and RLS policies
- **Prevention:** Error handling logs to browser console

### **Worker Never Receives Payment**
- **Cause:** `releasePaymentToWorker()` not called or failed silently
- **Fix:** Check browser console for errors during approval
- **Debug:** `console.log` statements show payment status

---

## 📊 Admin Dashboard Integration

Once Problem 1 is confirmed working, Problem 3 (Admin Dashboard) will display:

```
TODAY'S COMMISSIONS: 12.75π  (from getTodayCommissions())
THIS MONTH:         145.30π  (from getMonthCommissions())

ACTIVE TRANSACTIONS:
├─ 10π escrow locked (waiting for approval)
├─ 8.5π worker payment completed
├─ 1.5π commission earned
└─ 15π escrow locked (new task)
```

---

## 🎓 Next Steps

After completing this Problem 1 setup:

1. ✅ Update `PIPULSE_OWNER_WALLET_ID` and `PIPULSE_OWNER_USERNAME`
2. ✅ Run `npm run build` to verify no errors
3. ✅ Test payment flow locally (see Testing section)
4. ✅ Confirm both employer and worker receive proper payments
5. ✅ Then move to **PROBLEM 2: Clean Sample Data**

---

## 🆘 Need Help?

Check the console logs:
- Open browser DevTools: **F12** → **Console** tab
- Look for messages prefixed with ✅ (success) or ❌ (error)
- Each payment shows: `💰 Initiating payment...` → `✅ Payment completed`

All payment functions log their status for debugging.
