# PiPulse Deployment Guide

## Phase 6: Deploy to Vercel

This guide walks you through deploying PiPulse to Vercel so it's live on the internet.

### Prerequisites:
- GitHub account (https://github.com)
- Vercel account (https://vercel.com) 
- Your Supabase credentials

---

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository named `pipulse`
3. Do NOT initialize with README (we already have files)
4. Click "Create repository"

---

## Step 2: Push Code to GitHub

In your terminal (in the PiPulse folder), run:

```bash
git remote add origin https://github.com/YOUR-USERNAME/pipulse.git
git branch -M main
git push -u origin main
```

Replace `YOUR-USERNAME` with your actual GitHub username.

**If you get authentication errors:**
- Use GitHub personal access token instead of password
- Or use SSH key authentication

---

## Step 3: Connect GitHub to Vercel

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Click "Import Git Repository"
4. Search for and select `pipulse` repository
5. Click "Import"

---

## Step 4: Configure Environment Variables

Vercel will ask for environment variables. Enter:

**Name:** `NEXT_PUBLIC_SUPABASE_URL`
**Value:** `https://jwkysjidtkzriodgiydj.supabase.co` (your Supabase URL)

**Name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
**Value:** Your Supabase anon public key

Then click "Deploy"

---

## Step 5: Wait for Deployment

Vercel will automatically:
- Install dependencies
- Build the project
- Deploy to live URL

This takes 2-5 minutes. You'll see a "Ready!" message when done.

---

## Step 6: Get Your Live URL

Once deployed, Vercel shows your live URL like:
```
https://pipulse.vercel.app
```

This is your live app! Share this URL with Pi Network developers.

---

## Step 7: Update Pi App Studio

After deployment, you'll have your live Vercel URL to submit to Pi App Studio in Phase 7.

---

## Troubleshooting

**Build fails with missing modules:**
- Make sure all dependencies in package.json are installed locally
- Check for typos in file imports

**Environment variables not working:**
- Verify NEXT_PUBLIC_ prefix is correct
- Restart deployment after adding variables
- Check browser console (F12) for errors

**Database not showing data:**
- Verify Supabase URL and key are correct
- Check Supabase Row Level Security policies
- Ensure sample data was inserted into database

---

## Next: Phase 7

Once Vercel deployment is live and verified working:
- Update app metadata in Pi App Studio
- Set Vercel URL as the app endpoint
- Submit for review by Pi Network team
- Wait for approval and listing

You'll get your live app in the Pi Browser!
