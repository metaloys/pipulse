# Vercel Environment Variables Setup

## Required Environment Variables for Vercel

To fix the 500 errors on Vercel, you need to add the following environment variables to your Vercel project:

### Steps to Add Variables:

1. Go to your Vercel Dashboard: https://vercel.com/dashboard
2. Select your project: **pipulse**
3. Click **Settings** tab
4. Click **Environment Variables** in the left sidebar
5. Add each variable below:

### Required Variables:

```
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
PI_API_KEY=your_pi_api_key_here
ADMIN_PASSWORD=your_admin_password_here
```

### Where to Find These Values:

1. **SUPABASE_URL** and **NEXT_PUBLIC_SUPABASE_URL**:
   - Go to Supabase Dashboard
   - Select your project
   - Click **Settings** → **API**
   - Copy the "Project URL"

2. **SUPABASE_SERVICE_ROLE_KEY**:
   - Same location as above
   - Under "Project API keys"
   - Copy the "service_role" key (secret key)
   - ⚠️ Keep this private! Never share it.

3. **NEXT_PUBLIC_SUPABASE_ANON_KEY**:
   - Same location
   - Copy the "anon" public key

4. **PI_API_KEY**:
   - From your Pi Network Developer Account
   - Or from your local `.env.local` file

5. **ADMIN_PASSWORD**:
   - Create a strong password for admin access
   - Use the same value from your `.env.local`

### After Adding Variables:

1. **Redeploy your project**:
   - Go to **Deployments** tab
   - Click the three dots on the latest deployment
   - Select **Redeploy**

2. **Or push new code**:
   ```bash
   git push origin main
   ```
   This will automatically trigger a new deployment with the new environment variables.

### Verify It's Working:

After redeployment, check:
- Open your Vercel app URL
- Open **Dev Tools** (F12) → **Console** tab
- Go to Admin Dashboard
- You should see data loading without 500 errors

### Common Issues:

- **Still getting 500 errors**: Verify all variables are set correctly (copy-paste from Supabase)
- **Variables not updating**: Wait 2-3 minutes after adding them before redeploying
- **Can't find service role key**: Make sure you're in the **API** settings, not just the main settings

---

**Next Steps After This:**

Once Vercel shows real data, you can proceed with UI redesigns and additional features!
