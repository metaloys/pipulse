# 🔧 PRODUCTION DEBUG GUIDE

## The Real Problem

The 500 errors persist even after Vercel deployments. This means **either**:
1. Environment variables aren't being injected correctly at runtime
2. Supabase service role key has an issue  
3. Supabase RLS policies are blocking the service role key
4. Network connectivity issue with Supabase

## How to Diagnose

### Step 1: Redeploy to pick up new debug endpoint
1. Go to https://vercel.com/dashboard
2. Find "pipulse" project → Deployments tab
3. Click the 3-dot menu on the latest deployment → "Redeploy"
4. Wait for build to complete (2-3 minutes)
5. Once status shows "Ready", proceed to Step 2

### Step 2: Test the debug endpoint
Open this URL in your browser:
```
https://pipulse-five.vercel.app/api/admin/debug
```

You should see a JSON response showing:
- All environment variables and whether they're set ✅/❌
- Whether Supabase client can be created successfully ✅/❌

**Example good response:**
```json
{
  "status": "debug",
  "timestamp": "2026-02-23T...",
  "environmentVariables": {
    "SUPABASE_URL": "✅ SET (40 chars)",
    "SUPABASE_SERVICE_ROLE_KEY": "✅ SET (220 chars)",
    "PI_API_KEY": "✅ SET (50 chars)",
    "ADMIN_PASSWORD": "✅ SET (16 chars)"
  },
  "supabaseClientStatus": "✅ Client created successfully"
}
```

**Example bad response (missing env vars):**
```json
{
  "status": "debug",
  "timestamp": "2026-02-23T...",
  "environmentVariables": {
    "SUPABASE_URL": "❌ MISSING",
    "SUPABASE_SERVICE_ROLE_KEY": "❌ MISSING",
    ...
  },
  "supabaseClientStatus": "❌ Missing credentials"
}
```

### Step 3: Share the debug output
Copy the entire JSON response from `/api/admin/debug` and share it with me. This will tell us:
- ✅ All env vars are set → The problem is in Supabase RLS policies or database  
- ❌ Env vars missing → The problem is in how Vercel is injecting environment variables

### Step 4: Test actual admin endpoint
Once debug endpoint works, try:
```
https://pipulse-five.vercel.app/api/admin/stats
```

This should now either:
- Return stats data (problem was env vars or RLS) ✅
- OR return 500 with detailed error message (problem is deeper) ❌

## If Debug Shows Missing Env Vars
1. Go to Vercel project settings
2. Check Environment Variables section
3. Verify ALL 7 variables are present:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `PI_API_KEY`
   - `ADMIN_PASSWORD`
   - `NEXT_PUBLIC_PI_APP_ID`
4. If any missing, add them back
5. Redeploy and test again

## If Debug Shows Env Vars Present But Stats Endpoint Still 500
This likely means:
1. **Supabase RLS policies blocking the service role key** (unlikely but possible)
2. **Database connectivity issue** from Vercel to Supabase
3. **Supabase tables corrupted or missing** (very unlikely)

→ We'll need to check Supabase logs and RLS settings

## Timeline
- NOW: Redeploy
- +3 min: Build complete
- +3 min: Test debug endpoint
- → Share results with me
