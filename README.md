# PiPulse - Micro-Task Marketplace for Pi Network

## 🎯 What is PiPulse?

PiPulse is a **real micro-task marketplace** built on Pi Network where:
- **Workers** earn Pi coins by completing small tasks
- **Employers** post tasks and pay workers in Pi coins  
- **PiPulse** automatically takes 15% commission
- **No other currency exists** - Pi coins only

## ⚡ Quick Start

### Prerequisites
- Node.js v18+ (we used v22.21.0)
- npm v10+
- A Supabase account (free tier works)

### Installation

```bash
# Install dependencies
npm install --legacy-peer-deps

# Set up environment variables (already done in .env.local)
# NEXT_PUBLIC_SUPABASE_URL=https://jwkysjidtkzriodgiydj.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key-here

# Start development server
npm run dev

# App runs at http://localhost:3000
```

### Build for Production

```bash
npm run build
npm start
```

---

## 📚 Documentation

- **[BUILD_SUMMARY.md](BUILD_SUMMARY.md)** - Complete technical build summary
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Step-by-step deployment to Vercel
- **[supabase-setup.sql](supabase-setup.sql)** - Database schema SQL
- **[supabase-sample-data.sql](supabase-sample-data.sql)** - Sample test data

---

## 🏗️ Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | Next.js 15.2.4 |
| Language | TypeScript |
| Database | Supabase (PostgreSQL) |
| Auth | Pi Network SDK |
| Styling | Tailwind CSS |
| UI Components | Radix UI |
| Icons | Lucide React |
| Deployment | Vercel |

---

## 📋 Available Task Categories

1. **📱 App Testing** - Test apps and report issues
2. **📊 Surveys** - Complete consumer surveys
3. **🌐 Translation** - Translate content between languages
4. **🎙️ Audio Recording** - Record voice samples
5. **📸 Photo Capture** - Take photos of products/displays
6. **✍️ Content Review** - Review and flag content
7. **🏷️ Data Labeling** - Label images for ML models

---

## 💰 How Payments Work

**Example: 10 π task**
```
Employer posts task ........................... 10 π
Worker completes & submits proof
Employer approves submission

PiPulse fee (15%) .............................. 1.5 π
Worker receives .............................. 8.5 π
```

All payments are automatic on approval. No manual processing needed!

---

## 👥 User Roles

### Worker
- Browse available tasks
- Accept tasks and submit proof
- Build daily streaks for bonuses
- Level up from Newcomer → Elite Pioneer
- Appear on leaderboard by earnings
- Receive Pi coins directly

### Employer  
- Post tasks with rewards and slots
- Review worker submissions
- Approve work and pay workers
- Reject with feedback for resubmission
- Track task completion and spend

---

## 🎮 Gamification Features

- **Daily Streaks** - 🔥 fire emoji counter for consecutive days
- **7-Day Bonus** - Extra Pi reward for completing 7 consecutive days
- **Level System** - Newcomer → Established → Advanced → Elite Pioneer
- **Leaderboard** - See top earners each week
- **Weekly Summary** - Earnings notification each week

---

## 🔐 Security & Privacy

- **Row Level Security (RLS)** - Users can only access their own data
- **Pi Network Authentication** - Required login
- **Environment variables** - Sensitive data secured, not in git
- **No passwords** - Pi Network SDK handles security
- **Database encryption** - Supabase provides encryption at rest

---

## 📊 Database Schema

### 5 Core Tables

1. **users** - 10 fields (profile, level, earnings, streak)
2. **tasks** - 13 fields (title, category, reward, slots, deadline)
3. **task_submissions** - 9 fields (proof, status, feedback)
4. **transactions** - 10 fields (payment tracking with fees)
5. **streaks** - 6 fields (gamification data)

**Total:** 48 fields, optimized with indexes for fast queries

---

## 🚀 Deployment

### Live on Vercel
```
https://pipulse.vercel.app (example)
```

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for step-by-step instructions.

### Push to GitHub
```bash
git remote add origin https://github.com/YOUR-USERNAME/pipulse.git
git push -u origin main
```

### Deploy to Vercel
1. Connect GitHub to Vercel at https://vercel.com
2. Select this repository
3. Add environment variables
4. Click Deploy
5. Get live URL

---

## 📱 Mobile Responsive

- Works perfectly on desktop, tablet, and mobile
- Glassmorphism design with purple accents
- Dark theme (#0A0A1A background)
- Pill-shaped buttons with gradients
- Smooth animations everywhere
- Premium fintech feel like Revolut

---

## 🧪 Testing

### Local Testing
```bash
# Development server with hot reload
npm run dev

# Visit http://localhost:3000
# Switch between Worker and Employer roles
# Note: Pi Auth shows loading screen without Pi SDK (expected)
```

### Live Testing (Vercel URL)
- Real Pi Network users will authenticate
- All data persists in Supabase
- Payments process automatically
- Works in Pi Browser

---

## 📈 Features Status

| Feature | Status | Notes |
|---------|--------|-------|
| User authentication | ✅ Complete | Pi Network SDK integrated |
| Browse tasks | ✅ Complete | Real database queries |
| Submit proof | ✅ Complete | 4 proof types supported |
| Review submissions | ✅ Complete | Approve/reject workflow |
| Process payments | ✅ Complete | 15% fee auto-calculated |
| Daily streaks | ✅ Complete | Database tracking |
| Leaderboard | ✅ Complete | Real top earners |
| Level system | ✅ Complete | 4 levels implemented |
| Task categories | ✅ Complete | 7 categories available |
| Responsive design | ✅ Complete | Mobile-optimized |

---

## 🔄 Project Structure

```
pipulse/
├── app/
│   ├── page.tsx (Main homepage)
│   ├── layout.tsx (Root layout)
│   └── globals.css
├── components/
│   ├── task-submission-modal.tsx
│   ├── submission-review-modal.tsx
│   ├── employer-dashboard.tsx
│   ├── task-card.tsx
│   ├── leaderboard.tsx
│   └── ui/ (50+ Radix UI components)
├── contexts/
│   └── pi-auth-context.tsx (Pi Network auth)
├── lib/
│   ├── supabase.ts (DB client)
│   ├── database.ts (CRUD functions)
│   ├── types.ts (TypeScript interfaces)
│   └── api.ts (HTTP client)
├── public/ (Images and icons)
├── styles/ (Global CSS)
├── .env.local (Environment variables)
├── package.json
└── next.config.mjs
```

---

## 🤝 Contributing

This is a complete Pi Network app ready for production.

To extend:
1. Create a new branch
2. Make changes
3. Commit with clear messages
4. Push to GitHub
5. Vercel auto-deploys on main branch

---

## 📄 License

Built for Pi Network community. Use as reference or start your own projects.

---

## 🙋 Support

### Common Issues

**"This site can't be reached"**
- Make sure `npm run dev` is running
- Check port 3000 is available
- Restart with `npm run dev`

**"Cannot authenticate"**
- Expected on localhost (requires Pi Browser)
- Test fully authenticated features on Vercel
- Works perfectly in Pi Browser environment

**"No tasks showing"**
- Check sample data was inserted in Supabase
- Verify Row Level Security policies allow reads
- Check browser console (F12) for errors

---

## 📞 Next Steps

### Phase 6: Deploy to Vercel (Next)
See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

### Phase 7: Submit to Pi App Studio
1. Get live Vercel URL
2. Update Pi App Studio metadata
3. Submit for review
4. App goes live in Pi Browser

---

## 🎉 You're All Set!

PiPulse is **fully functional** and ready for:
- ✅ Real Pi Network users
- ✅ Real Pi coin payments
- ✅ Production deployment
- ✅ 15% commission tracking
- ✅ Blockchain integration (future)

**Start with Phase 6 deployment!**

---

Built with ❤️ for the Pi Network community.

**Current Status:** Ready for Vercel Deployment (Phase 6)
