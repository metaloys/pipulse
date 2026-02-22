# Leaderboard Implementation Guide

## Overview

The PiPulse leaderboard displays real data from the Supabase database across three distinct tabs, showcasing top performers and highlighting the current user's position.

## Architecture

### 1. Database Layer (`lib/database.ts`)

#### `getTopEarners(limit: number = 10)`
Fetches top 10 workers by total earnings.

```typescript
const earners = await getTopEarners(10);
// Returns: TopEarner[] with rank, id, username, level, earnings, tasks_completed
```

**Query:**
```sql
SELECT id, pi_username, level, total_earnings, total_tasks_completed
FROM users
ORDER BY total_earnings DESC
LIMIT 10
```

#### `getTopEmployers(limit: number = 10)`
Fetches top 10 employers by total Pi spent on tasks.

```typescript
const employers = await getTopEmployers(10);
// Returns: TopEmployer[] with rank, id, username, level, tasks_posted, total_pi_spent
```

**Logic:**
1. Fetches all users
2. Aggregates tasks by employer (counts posts, sums Pi spent)
3. Filters to only employers with posted tasks
4. Sorts by total_pi_spent DESC
5. Returns top 10 with calculated rank

#### `getRisingStars(limit: number = 10)`
Fetches workers who joined in the last 30 days with earnings > 0.

```typescript
const stars = await getRisingStars(10);
// Returns: RisingStar[] with rank, id, username, level, earnings, tasks_completed, days_as_member
```

**Query:**
```sql
SELECT id, pi_username, level, total_earnings, total_tasks_completed, created_at
FROM users
WHERE created_at > NOW() - INTERVAL '30 days'
AND total_earnings > 0
ORDER BY total_earnings DESC
LIMIT 10
```

#### `getUserLeaderboardPosition(userId: string, type: 'earners' | 'employers' = 'earners')`
Calculates a user's rank in the leaderboard if they're not in top 10.

```typescript
const position = await getUserLeaderboardPosition(userId, 'earners');
// Returns: { rank: number, earnings: number } | null
```

### 2. API Layer (`app/api/leaderboard/route.ts`)

**Endpoint:** `GET /api/leaderboard`

**Query Parameters:**
- `userId` (optional): User ID to fetch their position
- `type` (optional): 'earners' | 'employers' (for user position lookup)

**Response:** `LeaderboardData`

```typescript
interface LeaderboardData {
  lastUpdated: string;          // ISO timestamp
  topEarners: TopEarner[];      // Top 10 earners
  topEmployers: TopEmployer[];  // Top 10 employers
  risingStars: RisingStar[];    // Top 10 rising stars
  userPosition?: {              // User's position if not in top 10
    rank: number;
    earnings: number;
  } | null;
}
```

**Example Request:**
```bash
GET /api/leaderboard?userId=user-123&type=earners
```

**Example Response:**
```json
{
  "lastUpdated": "2026-02-22T15:30:45.123Z",
  "topEarners": [
    {
      "rank": 1,
      "id": "user-1",
      "pi_username": "worker_pro",
      "level": "Elite Pioneer",
      "total_earnings": 1250.5,
      "total_tasks_completed": 87
    }
    // ... 9 more
  ],
  "topEmployers": [
    {
      "rank": 1,
      "id": "emp-1",
      "pi_username": "employer_plus",
      "level": "Advanced",
      "tasks_posted": 45,
      "total_pi_spent": 2847.3
    }
    // ... 9 more
  ],
  "risingStars": [
    {
      "rank": 1,
      "id": "user-new-1",
      "pi_username": "new_star",
      "level": "Established",
      "total_earnings": 234.5,
      "total_tasks_completed": 12,
      "created_at": "2026-02-10T08:22:15Z",
      "days_as_member": 12
    }
    // ... 9 more
  ],
  "userPosition": null
}
```

### 3. Frontend Component (`components/leaderboard.tsx`)

#### Features

**Three Tabs:**
1. **Top Earners** - Workers with highest total earnings
2. **Top Employers** - Employers who spent the most Pi on tasks
3. **Rising Stars** - Newest workers (joined last 30 days) with earnings

**Styling:**
- **Rank 1:** Gold gradient background (👑)
- **Rank 2:** Silver gradient background (🥈)
- **Rank 3:** Bronze gradient background (🥉)
- **Ranks 4-10:** Standard glassmorphism styling
- **Current User (if ranked):** Purple border highlight

**User Positioning:**
- If logged-in user appears in top 10: Highlighted with purple border
- If logged-in user NOT in top 10: Shows position at bottom
  - Format: "Your position: #47 — 12.5π earned"
  - Separated from list by divider

**Controls:**
- **Refresh Button:** Manual data refresh with loading spinner
- **Last Updated:** Displays when data was last fetched (HH:MM:SS format)
- **Loading State:** Shows spinner while fetching

**Empty State:**
```
[Trophy Icon]
No pioneers on the leaderboard yet.
Complete tasks to be the first!
```

#### Implementation

```tsx
export function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('earners');
  const { userData } = usePiAuth();
  const userId = userData?.id;

  // Fetches leaderboard data when tab changes or component mounts
  useEffect(() => {
    fetchLeaderboard();
  }, [userId, activeTab]);

  // ... component renders three tabs with real data
}
```

## Types

### `TopEarner`
```typescript
interface TopEarner {
  rank: number;
  id: string;
  pi_username: string;
  level: string;
  total_earnings: number;
  total_tasks_completed: number;
}
```

### `TopEmployer`
```typescript
interface TopEmployer {
  rank: number;
  id: string;
  pi_username: string;
  level: string;
  tasks_posted: number;
  total_pi_spent: number;
}
```

### `RisingStar`
```typescript
interface RisingStar {
  rank: number;
  id: string;
  pi_username: string;
  level: string;
  total_earnings: number;
  total_tasks_completed: number;
  created_at: string;
  days_as_member: number;
}
```

## Privacy Compliance

✅ **GDPR Compliant**
- Only displays `pi_username` (public username)
- Never shows `pi_wallet_address`
- Never shows individual transaction details
- Never shows private submission history

✅ **Role-Based Data Access**
- Leaderboard uses public data only
- RLS policies enforce data privacy (when implemented)
- No sensitive user information exposed

## Performance Considerations

### Caching
- API response includes `Cache-Control: no-cache` header
- Each tab fetch is independent
- Data refreshed on demand (manual button or tab change)

### Query Optimization
- `getTopEarners()`: Direct SQL query with index on `total_earnings`
- `getTopEmployers()`: Aggregates in-memory (manageable for typical task volumes)
- `getRisingStars()`: Direct SQL query with filter on `created_at`

### Recommendations for Production
1. **Add Database Indexes:**
   ```sql
   CREATE INDEX idx_users_total_earnings ON users(total_earnings DESC);
   CREATE INDEX idx_users_created_at ON users(created_at DESC);
   CREATE INDEX idx_tasks_employer_id ON tasks(employer_id);
   ```

2. **Implement Caching Layer:**
   - Cache leaderboard data for 5-10 minutes
   - Invalidate on user earnings/task changes
   - Consider Redis for distributed caching

3. **Pagination (Future):**
   - For employers with many tasks, consider pagination
   - Or cache aggregated results in a materialized view

## Usage

### In Components

```tsx
import { Leaderboard } from '@/components/leaderboard';

export default function DashboardPage() {
  return (
    <div>
      <Leaderboard />
    </div>
  );
}
```

### API Usage (Client-Side)

```typescript
// Fetch all leaderboards
const response = await fetch('/api/leaderboard');
const data: LeaderboardData = await response.json();

// Fetch with user position
const response = await fetch('/api/leaderboard?userId=user-123&type=earners');
const data: LeaderboardData = await response.json();
```

## Testing

### Test Cases

1. **Empty State**
   - Create new database or clear users
   - Verify "No pioneers" message displays

2. **Top 10 Display**
   - Create 15+ test users with varying earnings
   - Verify only top 10 display
   - Check rank numbers are correct

3. **User Highlighting**
   - Log in with user in top 10
   - Verify purple border appears
   - Log in with user not in top 10
   - Verify position appears at bottom

4. **Refresh Button**
   - Click refresh
   - Verify loading spinner appears
   - Verify timestamp updates
   - Verify data remains accurate

5. **Tab Switching**
   - Click each tab
   - Verify data loads correctly
   - Verify different employers display in top employers tab
   - Verify rising stars show recent members

6. **Emoji Styling**
   - Verify rank 1 shows 👑 with gold glow
   - Verify rank 2 shows 🥈 with silver glow
   - Verify rank 3 shows 🥉 with bronze glow
   - Verify ranks 4-10 show numbers

## Troubleshooting

### Leaderboard Shows No Data
1. Check if users table has data with non-zero `total_earnings`
2. Verify Supabase connection is working
3. Check browser console for fetch errors
4. Verify authentication (some queries require auth)

### Wrong Rankings
1. Verify `total_earnings` values in users table
2. Check if `getRisingStars()` filters are correct (30 days, earnings > 0)
3. For employers, verify tasks are correctly associated with users

### User Not Highlighted
1. Verify `userData?.id` is populated from auth
2. Check API response includes `userPosition` field
3. Verify user ID matches ID in leaderboard data

### Refresh Button Not Working
1. Check network tab for API errors
2. Verify `/api/leaderboard` endpoint responds
3. Check Supabase connectivity

## Future Enhancements

1. **Leaderboard Filters**
   - Filter by time period (this week, this month, all time)
   - Filter by category or level
   - Search by username

2. **Rankings Over Time**
   - Historical leaderboard snapshots
   - Charts showing ranking progression
   - Notifications when ranking changes

3. **Achievement Badges**
   - First place 3x
   - Consistent earner
   - Rising star promoted to established

4. **Social Features**
   - Follow top earners
   - View profile from leaderboard
   - Share leaderboard position

5. **Notifications**
   - Alert when user enters top 10
   - Alert when surpassed by another user
   - Weekly ranking summary email
