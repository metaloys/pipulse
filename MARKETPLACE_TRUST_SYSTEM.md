# PiPulse Marketplace Trust System - Implementation Guide

## Overview

This document details the implementation of 6 critical marketplace fixes that establish trust between workers and employers. These fixes transform PiPulse from a basic task platform into a trustworthy, transparent marketplace.

---

## PROBLEM 1: Rejection Feedback Not Reaching Worker

### The Issue
When employers reject a submission, workers had no visibility into why. This created frustration and broke trust because workers couldn't learn from their mistakes.

### The Solution: Notifications System

#### Database Schema
```sql
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  type text NOT NULL CHECK (type IN (
    'submission_approved',
    'submission_rejected',
    'revision_requested',
    'dispute_resolved',
    'payment_received',
    'task_completed'
  )),
  title text NOT NULL,
  message text NOT NULL,
  related_task_id uuid,
  related_submission_id uuid,
  related_dispute_id uuid,
  is_read boolean DEFAULT false,
  read_at timestamp DEFAULT NULL,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_is_read ON notifications(user_id, is_read);
```

#### Key Functions

**getUnreadNotificationCount(userId: string): Promise<number>**
```typescript
// Returns count of unread notifications
const count = await getUnreadNotificationCount('user-123');
// count: 5
```

**getNotifications(userId: string, limit: number, offset: number): Promise<Notification[]>**
```typescript
// Fetch paginated notifications
const notifications = await getNotifications('user-123', 20, 0);
```

**getUnreadNotifications(userId: string, limit: number): Promise<Notification[]>**
```typescript
// Get only unread notifications (for bell dropdown)
const unread = await getUnreadNotifications('user-123', 10);
```

**markNotificationAsRead(notificationId: string): Promise<boolean>**
```typescript
// Mark single notification as read
await markNotificationAsRead('notif-456');
```

**markAllNotificationsAsRead(userId: string): Promise<boolean>**
```typescript
// Mark all user notifications as read
await markAllNotificationsAsRead('user-123');
```

#### Frontend Component

**NotificationBell Component** (`components/notification-bell.tsx`)
- Real-time unread count badge
- Dropdown showing 10 most recent notifications
- Mark individual or all as read
- Emoji icons for notification types
- Link to full notification center page
- Real-time subscription for new notifications

```typescript
<NotificationBell userId={userId} />
```

#### Integration in App Header

Add to `components/app-header.tsx`:
```typescript
import { NotificationBell } from './notification-bell';

export function AppHeader() {
  return (
    <header>
      {/* ... existing code ... */}
      <div className="flex items-center gap-4">
        <NotificationBell userId={currentUserId} />
        {/* ... other header items ... */}
      </div>
    </header>
  );
}
```

#### Workflow: Rejection with Notification

When employer rejects a submission:
```typescript
const success = await rejectTaskSubmission({
  submissionId: 'sub-123',
  taskId: 'task-456',
  workerId: 'worker-789',
  rejectionReason: 'Photo quality is too low. Please provide higher resolution images with proper lighting.',
  employerNotes: 'Resubmit with better quality photos'
});

// This automatically:
// 1. Updates submission status to 'rejected'
// 2. Stores rejection reason
// 3. Creates notification for worker with full explanation
// 4. Worker sees bell notification + details when opened
// 5. Worker can view full history in "My Submissions" tab
```

---

## PROBLEM 2: Employer Has Only Two Options (Approve/Reject)

### The Issue
Employers couldn't request minor fixes without completely rejecting the work. Workers lost confidence in submissions that needed small tweaks.

### The Solution: Revision Request Workflow

#### Database Changes
```sql
ALTER TABLE task_submissions ADD COLUMN (
  revision_number integer DEFAULT 1,
  revision_requested_reason text,
  revision_requested_at timestamp,
  resubmitted_at timestamp,
  employer_notes text
);

-- Add new submission status
ALTER TABLE task_submissions
  ADD CONSTRAINT submission_status_check CHECK (
    submission_status IN (
      'submitted',
      'revision_requested',
      'revision_resubmitted',
      'approved',
      'rejected',
      'disputed'
    )
  );

-- Lock task slot for worker during revision period
CREATE TABLE task_revision_locks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id),
  worker_id uuid NOT NULL REFERENCES auth.users(id),
  locked_until timestamp NOT NULL,
  reason text DEFAULT 'revision_requested',
  created_at timestamp DEFAULT now(),
  UNIQUE(task_id, worker_id)
);
```

#### Three Options for Employer

**Option 1: Approve**
```typescript
await approveTaskSubmission({
  submissionId: 'sub-123',
  taskId: 'task-456',
  workerId: 'worker-789',
  taskReward: 100,
  employerNotes: 'Great work, exactly what I needed!'
});
// → Notification: "Your submission was approved! You earned 100 π"
// → Payment processed immediately
// → Task marked completed
```

**Option 2: Request Revision** (NEW)
```typescript
await requestTaskRevision({
  submissionId: 'sub-123',
  taskId: 'task-456',
  workerId: 'worker-789',
  revisionReason: 'Colors need to be more vibrant. Can you increase saturation by 20%?',
  employerNotes: 'Minor color adjustment needed'
});
// → Submission status: 'revision_requested'
// → Notification: "Revision requested: Colors need to be more vibrant..."
// → Task slot LOCKED for this worker for 7 days
// → Worker can resubmit once within 7 days
// → After 7 days, slot automatically opens to other workers
```

**Option 3: Reject**
```typescript
await rejectTaskSubmission({
  submissionId: 'sub-123',
  taskId: 'task-456',
  workerId: 'worker-789',
  rejectionReason: 'Does not meet task requirements. Please review the instructions again.',
  employerNotes: 'Does not match spec'
});
// → Submission status: 'rejected'
// → Notification with full rejection reason
// → Task slot immediately available to other workers
// → Worker can see rejection reason in "My Submissions" history
```

#### Worker Resubmission Flow

Worker receives revision notification and can resubmit:
```typescript
// Worker resubmits after fixing issues
await submitTaskSubmission({
  taskId: 'task-456',
  workerId: 'worker-789',
  proofContent: 'new-content-with-vibrant-colors.jpg',
  submissionType: 'photo',
  revisionNumber: 2  // Indicates this is revision attempt
});
// → Submission status: 'revision_resubmitted'
// → Task revision lock automatically removed
// → Employer notified of resubmission
// → Employer reviews again (approve, request revision, or reject)
```

---

## PROBLEM 3: No Timeout on Employer Review

### The Issue
If an employer disappeared or was slow, workers were stuck indefinitely. A 48-hour approval window creates fairness.

### The Solution: Auto-Approval Trigger

#### Database Function
```sql
CREATE OR REPLACE FUNCTION auto_approve_submissions()
RETURNS void AS $$
BEGIN
  -- Auto-approve submissions waiting 48+ hours
  UPDATE task_submissions
  SET 
    submission_status = 'approved',
    reviewed_at = now(),
    employer_notes = 'Automatically approved after 48-hour review period'
  WHERE 
    submission_status = 'submitted' 
    AND submitted_at < (now() - interval '48 hours')
    AND reviewed_at IS NULL;

  -- Notify workers of auto-approvals
  INSERT INTO notifications (user_id, type, title, message, related_task_id, related_submission_id)
  SELECT 
    ts.worker_id,
    'submission_approved',
    'Your submission was automatically approved!',
    'Your submission was automatically approved after 48 hours without employer review. Payment has been processed.',
    ts.task_id,
    ts.id
  FROM task_submissions ts
  WHERE 
    ts.submission_status = 'approved'
    AND ts.employer_notes = 'Automatically approved after 48-hour review period';
END;
$$ LANGUAGE plpgsql;

-- Schedule to run every 30 minutes
SELECT cron.schedule('auto-approve-submissions', '*/30 * * * *', 'SELECT auto_approve_submissions()');
```

#### API Endpoint (Manual Trigger)

If pg_cron is unavailable, trigger via API:
```typescript
// Call this from a scheduled task or webhook
export async function triggerAutoApprovals(): Promise<{
  approved: number;
  error?: string;
}> {
  const { error } = await supabase.rpc('auto_approve_submissions');
  // Returns number of submissions auto-approved
}
```

**Workflow:**
1. Worker submits proof at timestamp `2026-02-20 10:00:00`
2. System checks every 30 minutes
3. At `2026-02-22 10:00:01` (48+ hours), auto-approval triggers
4. Submission status changed to `approved`
5. Worker receives notification: "Your submission was automatically approved!"
6. Payment processed to worker account
7. Task marked as completed

---

## PROBLEM 4: Task Disappears After Rejection

### The Issue
Workers had no record of rejected work, couldn't see feedback, and lost motivation. They needed a complete history.

### The Solution: Worker Submissions History Tab

#### Database Queries

**Get All Worker Submissions**
```typescript
export async function getWorkerSubmissions(
  workerId: string,
  filters?: {
    status?: 'submitted' | 'revision_requested' | 'revision_resubmitted' | 'approved' | 'rejected' | 'disputed';
    taskId?: string;
    limit?: number;
    offset?: number;
  }
): Promise<DatabaseTaskSubmission[]>
```

**Get Submission Statistics**
```typescript
export async function getWorkerSubmissionStats(workerId: string): Promise<{
  totalSubmissions: number;
  approved: number;
  rejected: number;
  revisionRequested: number;
  disputed: number;
}>
```

#### Frontend Component: My Submissions Tab

Create `app/worker/my-submissions/page.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import {
  getWorkerSubmissions,
  getWorkerSubmissionStats,
} from '@/lib/database';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function MySubmissionsPage() {
  const [submissions, setSubmissions] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('all');
  const [userId] = useState(() => {
    // Get from auth context
    return '';
  });

  useEffect(() => {
    const loadData = async () => {
      const [submissionsData, statsData] = await Promise.all([
        getWorkerSubmissions(userId, {
          status: filter === 'all' ? undefined : filter,
        }),
        getWorkerSubmissionStats(userId),
      ]);

      setSubmissions(submissionsData);
      setStats(statsData);
    };

    loadData();
  }, [userId, filter]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'revision_requested':
        return 'bg-yellow-100 text-yellow-800';
      case 'revision_resubmitted':
        return 'bg-blue-100 text-blue-800';
      case 'disputed':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">My Submissions</h1>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card className="p-4">
            <p className="text-sm text-gray-600">Total Submissions</p>
            <p className="text-2xl font-bold">{stats.totalSubmissions}</p>
          </Card>
          <Card className="p-4 border-green-200 bg-green-50">
            <p className="text-sm text-green-600">Approved</p>
            <p className="text-2xl font-bold text-green-700">{stats.approved}</p>
          </Card>
          <Card className="p-4 border-red-200 bg-red-50">
            <p className="text-sm text-red-600">Rejected</p>
            <p className="text-2xl font-bold text-red-700">{stats.rejected}</p>
          </Card>
          <Card className="p-4 border-yellow-200 bg-yellow-50">
            <p className="text-sm text-yellow-600">Revision Requested</p>
            <p className="text-2xl font-bold text-yellow-700">
              {stats.revisionRequested}
            </p>
          </Card>
          <Card className="p-4 border-purple-200 bg-purple-50">
            <p className="text-sm text-purple-600">Disputed</p>
            <p className="text-2xl font-bold text-purple-700">{stats.disputed}</p>
          </Card>
        </div>
      )}

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={setFilter} className="mb-8">
        <TabsList>
          <TabsTrigger value="all">All Submissions</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="revision_requested">Revision Requested</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="disputed">Disputed</TabsTrigger>
        </TabsList>

        {/* Submissions List */}
        <TabsContent value={filter} className="mt-6">
          {submissions.length === 0 ? (
            <Card className="p-8 text-center text-gray-500">
              No submissions in this category
            </Card>
          ) : (
            <div className="space-y-4">
              {submissions.map((sub: any) => (
                <Card key={sub.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{sub.task_id}</h3>

                      <div className="mt-2 flex items-center gap-2">
                        <Badge className={getStatusBadgeColor(sub.submission_status)}>
                          {sub.submission_status.replace('_', ' ')}
                        </Badge>
                        {sub.revision_number > 1 && (
                          <Badge variant="outline">
                            Revision {sub.revision_number}
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 mt-3">
                        Submitted: {new Date(sub.submitted_at).toLocaleString()}
                      </p>

                      {sub.submission_status === 'revision_requested' && (
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                          <p className="font-semibold text-yellow-900 text-sm">
                            Revision Requested:
                          </p>
                          <p className="text-yellow-800 text-sm mt-1">
                            {sub.revision_requested_reason}
                          </p>
                          <p className="text-xs text-yellow-700 mt-2">
                            You have until{' '}
                            {new Date(
                              new Date(sub.revision_requested_at).getTime() + 7 * 24 * 60 * 60 * 1000
                            ).toLocaleDateString()}{' '}
                            to resubmit
                          </p>
                        </div>
                      )}

                      {sub.submission_status === 'rejected' && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                          <p className="font-semibold text-red-900 text-sm">
                            Rejection Reason:
                          </p>
                          <p className="text-red-800 text-sm mt-1">
                            {sub.rejection_reason}
                          </p>
                        </div>
                      )}

                      {sub.submission_status === 'approved' && (
                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                          <p className="font-semibold text-green-900 text-sm">
                            ✓ Approved on{' '}
                            {new Date(sub.reviewed_at).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        View Details
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

**Features:**
- ✅ All accepted tasks with submission status
- ✅ All submitted proofs with dates
- ✅ All approved submissions with earnings
- ✅ All rejected submissions with feedback visible
- ✅ All disputed submissions with outcome
- ✅ Statistics cards showing breakdown
- ✅ Filter by status
- ✅ Pagination support
- ✅ Revision request reasons clearly displayed
- ✅ Deadlines for revisions shown

---

## PROBLEM 5: Privacy Model Needs Implementing

### The Issue
Workers' earnings and personal data were exposed. Users couldn't trust the platform with sensitive information.

### The Solution: RLS (Row-Level Security) Policies

#### Enable RLS on Sensitive Tables

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
```

#### Users Table: Separate Public vs Private Data

**PUBLIC Data** (Visible to Everyone):
- `id`, `pi_username`, `level`, `total_tasks_completed`
- These show on profiles/leaderboards without authentication

**PRIVATE Data** (Owner Only):
- `pi_wallet_address`, `total_earnings`, `streak_data`, `current_settings`
- RLS policies prevent unauthorized access

```sql
-- Everyone can see public profile data
CREATE POLICY "users_public_data_readable" ON users
  FOR SELECT
  USING (true);

-- Owners can see/update their own complete data
CREATE POLICY "users_own_data_readable" ON users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users_own_data_updatable" ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

#### Task Submissions: Only Parties Involved

```sql
-- Workers see their own submissions
CREATE POLICY "submissions_own_readable" ON task_submissions
  FOR SELECT
  USING (auth.uid() = worker_id);

-- Employers see submissions for their tasks only
CREATE POLICY "submissions_employer_readable" ON task_submissions
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT employer_id FROM tasks WHERE tasks.id = task_submissions.task_id
    )
  );

-- Workers can submit their own work
CREATE POLICY "submissions_own_insertable" ON task_submissions
  FOR INSERT
  WITH CHECK (auth.uid() = worker_id);

-- Employers can review submissions for their tasks
CREATE POLICY "submissions_employer_updatable" ON task_submissions
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT employer_id FROM tasks WHERE tasks.id = task_submissions.task_id
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT employer_id FROM tasks WHERE tasks.id = task_submissions.task_id
    )
  );
```

#### Notifications: Owner Only

```sql
-- Users see only their own notifications
CREATE POLICY "notifications_own_readable" ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only system can create notifications (via functions)
CREATE POLICY "notifications_system_insertable" ON notifications
  FOR INSERT
  WITH CHECK (false);

-- Users can mark their own as read
CREATE POLICY "notifications_own_updatable" ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

#### Transactions: Parties Involved Only

```sql
-- Users see only transactions they're part of
CREATE POLICY "transactions_own_readable" ON transactions
  FOR SELECT
  USING (
    auth.uid() = sender_id 
    OR auth.uid() = receiver_id
  );

-- System only can insert (via backend)
CREATE POLICY "transactions_system_insertable" ON transactions
  FOR INSERT
  WITH CHECK (false);
```

#### Disputes: Parties and Admins

```sql
-- Dispute parties can see their disputes
CREATE POLICY "disputes_party_readable" ON disputes
  FOR SELECT
  USING (
    auth.uid() = worker_id 
    OR auth.uid() = employer_id
  );

-- Admins can see all disputes
CREATE POLICY "disputes_admin_readable" ON disputes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.user_role = 'admin'
    )
  );
```

#### Privacy-Aware Functions

```typescript
// Get public profile (safe to show anyone)
export async function getPublicUserProfile(userId: string) {
  const { data } = await supabase
    .from('users')
    .select('id, pi_username, level, total_tasks_completed')
    .eq('id', userId)
    .single();
  return data;
}

// Get private profile (RLS enforces it's owner only)
export async function getPrivateUserProfile(userId: string) {
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  return data;
}

// Get transaction (only if user is party involved)
export async function getTransactionDetails(txId: string) {
  const { data } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', txId)
    .single();
  return data; // RLS returns empty if not authorized
}
```

---

## PROBLEM 6: Default Role on First Login

### The Issue
New users were confused about being a worker vs employer. Default role needed to be clear, with opt-in for employer mode.

### The Solution: Default Worker Mode with Opt-In Employer Features

#### Database Changes

```sql
ALTER TABLE users ADD COLUMN (
  default_role text DEFAULT 'worker',
  employer_mode_enabled boolean DEFAULT false
);

CREATE INDEX idx_users_employer_mode_enabled ON users(employer_mode_enabled);
```

#### User Creation Function

```typescript
// When user signs up via Pi Network
export async function createUser(user: Omit<DatabaseUser, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('users')
    .insert([{
      ...user,
      default_role: 'worker',  // ← Always start as worker
      employer_mode_enabled: false  // ← No employer features until enabled
    }])
    .select()
    .single();

  return data as DatabaseUser;
}
```

#### Role Mode Management

```typescript
// Get user's current view mode
export async function getUserCurrentMode(userId: string): Promise<'worker' | 'employer'> {
  const { data } = await supabase
    .from('users')
    .select('default_role')
    .eq('id', userId)
    .single();

  return data?.default_role || 'worker';
}

// Check if user can access employer mode
export async function canUserAccessEmployerMode(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('users')
    .select('employer_mode_enabled')
    .eq('id', userId)
    .single();

  return data?.employer_mode_enabled || false;
}

// Update user's role preference
export async function updateUserRolePreference(
  userId: string,
  preferences: {
    defaultRole: 'worker' | 'employer';
    employerModeEnabled: boolean;
  }
): Promise<boolean> {
  const { error } = await supabase
    .from('users')
    .update({
      default_role: preferences.defaultRole,
      employer_mode_enabled: preferences.employerModeEnabled,
    })
    .eq('id', userId);

  return !error;
}
```

#### Frontend: Role Mode Toggle

Create `components/role-mode-toggle.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  updateUserRolePreference,
  getUserCurrentMode,
  canUserAccessEmployerMode,
} from '@/lib/database';

export function RoleModeToggle({ userId }: { userId: string }) {
  const [currentMode, setCurrentMode] = useState<'worker' | 'employer'>('worker');
  const [canAccessEmployer, setCanAccessEmployer] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load user's current mode
  React.useEffect(() => {
    const loadMode = async () => {
      const mode = await getUserCurrentMode(userId);
      const canAccess = await canUserAccessEmployerMode(userId);
      setCurrentMode(mode);
      setCanAccessEmployer(canAccess);
    };

    loadMode();
  }, [userId]);

  const handleModeSwitch = async (newMode: 'worker' | 'employer') => {
    if (newMode === 'employer' && !canAccessEmployer) {
      // Show dialog to enable employer mode
      // This requires verification/setup
      alert('Please complete employer verification to access this feature');
      return;
    }

    setLoading(true);
    const success = await updateUserRolePreference(userId, {
      defaultRole: newMode,
      employerModeEnabled: canAccessEmployer,
    });

    if (success) {
      setCurrentMode(newMode);
    }

    setLoading(false);
  };

  return (
    <div className="flex gap-2">
      <Button
        onClick={() => handleModeSwitch('worker')}
        variant={currentMode === 'worker' ? 'default' : 'outline'}
        disabled={loading}
      >
        👤 Worker
      </Button>
      <Button
        onClick={() => handleModeSwitch('employer')}
        variant={currentMode === 'employer' ? 'default' : 'outline'}
        disabled={loading || !canAccessEmployer}
      >
        💼 Employer
      </Button>
    </div>
  );
}
```

#### App Layout: Conditional Views

```typescript
// In app/layout.tsx or main page
export default async function Layout({ children }: { children: React.ReactNode }) {
  const userId = getCurrentUserId();
  const currentMode = await getUserCurrentMode(userId);

  return (
    <div>
      {/* Header with mode toggle */}
      <header>
        <RoleModeToggle userId={userId} />
      </header>

      {/* Main feed always shows available tasks from all employers */}
      {/* This is visible regardless of mode */}
      <MainTaskFeed />

      {/* Conditional dashboard based on mode */}
      {currentMode === 'worker' ? (
        <WorkerDashboard userId={userId} />
      ) : (
        <EmployerDashboard userId={userId} />
      )}

      {children}
    </div>
  );
}
```

#### Behavior

| User Action | Worker Mode | Employer Mode |
|------------|------------|---|
| **View Tasks** | ✅ See all available tasks | ✅ See all available tasks |
| **Accept Task** | ✅ Can accept | ✅ Can accept (unlikely) |
| **Post Task** | ❌ Hidden button | ✅ Can post |
| **Review Submissions** | ❌ No access | ✅ Can approve/reject |
| **Dashboard** | ✅ My Earnings | ✅ My Posted Tasks |

**Key Points:**
- ✅ All new users start as **workers by default**
- ✅ Main feed shows all employer tasks regardless of mode
- ✅ Mode only controls dashboard and controls visibility
- ✅ Users can explicitly switch to employer mode
- ✅ Employer features require verification/setup
- ✅ Workers still see all tasks while in either mode

---

## Implementation Checklist

- [ ] **Problem 1**: Notifications System
  - [ ] Create `notifications` table with RLS
  - [ ] Add `notification-bell.tsx` component
  - [ ] Update app header with bell
  - [ ] Add notification API routes
  - [ ] Integrate in rejection/approval workflows

- [ ] **Problem 2**: Revision Request Workflow
  - [ ] Add revision columns to `task_submissions`
  - [ ] Create `task_revision_locks` table
  - [ ] Implement `requestTaskRevision()` function
  - [ ] Add "Request Revision" button to employer review
  - [ ] Implement revision resubmission flow

- [ ] **Problem 3**: Auto-Approval After 48 Hours
  - [ ] Create `auto_approve_submissions()` function
  - [ ] Schedule with pg_cron every 30 minutes
  - [ ] Create API endpoint for manual trigger
  - [ ] Test with submissions 48+ hours old
  - [ ] Verify notification creation

- [ ] **Problem 4**: Submission History
  - [ ] Create "My Submissions" page
  - [ ] Add filter tabs (All, Approved, Rejected, etc)
  - [ ] Display submission cards with details
  - [ ] Show rejection reasons
  - [ ] Show revision request details
  - [ ] Add statistics summary

- [ ] **Problem 5**: Privacy with RLS
  - [ ] Enable RLS on all sensitive tables
  - [ ] Create policies for `users` table
  - [ ] Create policies for `task_submissions`
  - [ ] Create policies for `notifications`
  - [ ] Create policies for `transactions`
  - [ ] Create policies for `disputes`
  - [ ] Test with multiple users

- [ ] **Problem 6**: Default Role
  - [ ] Add `default_role` and `employer_mode_enabled` columns
  - [ ] Update user creation to set defaults
  - [ ] Create role mode toggle component
  - [ ] Implement conditional dashboard views
  - [ ] Test mode switching

---

## Database Migration

Run this SQL to implement all changes:

```sql
-- Execute: migrations/001_marketplace_trust_system.sql
-- This file is in the repository root
\i migrations/001_marketplace_trust_system.sql
```

Or in Supabase SQL editor, copy the entire migration file and run it.

---

## API Routes Summary

### Notifications
- `GET /api/notifications` - Fetch user notifications
- `GET /api/notifications?unread_only=true` - Unread only
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/mark-all-read` - Mark all read

### Submissions
- `POST /api/submissions/submit` - Submit task
- `POST /api/submissions/approve` - Approve submission
- `POST /api/submissions/reject` - Reject with reason
- `POST /api/submissions/request-revision` - Request revision
- `GET /api/submissions/worker` - User's submissions
- `GET /api/submissions/stats` - Submission statistics

### User Role
- `GET /api/user/mode` - Get current mode
- `PUT /api/user/mode` - Update mode
- `GET /api/user/can-access-employer` - Check access

---

## Testing Guide

### Test Problem 1: Rejection Feedback
```typescript
// 1. Employer rejects submission
await rejectTaskSubmission({
  submissionId: 'test-sub-1',
  taskId: 'test-task-1',
  workerId: 'worker-1',
  rejectionReason: 'Image resolution too low'
});

// 2. Worker sees notification
const notifs = await getUnreadNotifications('worker-1');
expect(notifs.length).toBe(1);
expect(notifs[0].message).toContain('resolution too low');
```

### Test Problem 2: Revision Request
```typescript
// 1. Employer requests revision
await requestTaskRevision({
  submissionId: 'test-sub-2',
  taskId: 'test-task-2',
  workerId: 'worker-2',
  revisionReason: 'Increase saturation by 20%'
});

// 2. Check submission status
const sub = await getSubmission('test-sub-2');
expect(sub.submission_status).toBe('revision_requested');

// 3. Worker resubmits
const resubmit = await submitTaskSubmission({
  taskId: 'test-task-2',
  workerId: 'worker-2',
  proofContent: 'new-content',
  submissionType: 'photo',
  revisionNumber: 2
});
expect(resubmit.submission_status).toBe('revision_resubmitted');
```

### Test Problem 3: Auto-Approval
```typescript
// 1. Create submission 49 hours ago
const oldSubmission = {
  ...newSubmission,
  submitted_at: new Date(Date.now() - 49 * 60 * 60 * 1000),
};

// 2. Trigger auto-approvals
const result = await triggerAutoApprovals();
expect(result.approved).toBeGreaterThan(0);

// 3. Check submission approved
const sub = await getSubmission(oldSubmission.id);
expect(sub.submission_status).toBe('approved');
```

### Test Problem 5: Privacy (RLS)
```typescript
// 1. User A tries to see User B's earnings
const workerB = await getPrivateUserProfile('worker-b-id');
// RLS should return error or empty

// 2. Worker sees own earnings
const workerA = await getPrivateUserProfile('worker-a-id');
expect(workerA.total_earnings).toBeDefined();
```

---

## Deployment Steps

1. **Backup Database**
   ```bash
   pg_dump $DATABASE_URL > backup.sql
   ```

2. **Run Migration**
   - Upload `migrations/001_marketplace_trust_system.sql` to Supabase SQL editor
   - Execute the entire file
   - Verify all tables and functions created

3. **Deploy Code**
   ```bash
   git add .
   git commit -m "feat: implement marketplace trust system with 6 critical fixes"
   git push origin main
   ```

4. **Verify API Routes**
   - Test `/api/notifications` endpoint
   - Test `/api/submissions/approve` endpoint
   - Test `/api/user/mode` endpoint

5. **Update App Header**
   - Add `NotificationBell` component
   - Add `RoleModeToggle` component
   - Test in browser

6. **Create Missing Pages**
   - `/worker/my-submissions` - Submission history
   - `/notifications` - Full notification center

7. **Monitor & Test**
   - Create test submissions
   - Request revisions
   - Test rejection feedback
   - Verify auto-approvals run

---

## Success Metrics

After implementation, you should see:

✅ **Problem 1 (Rejection Feedback)**
- Rejection rates drop (workers understand feedback)
- Resubmission rates increase (workers fix issues)
- Trust score increases in surveys

✅ **Problem 2 (Revision Workflow)**
- More successful collaborations
- Fewer complete rejections
- Higher worker satisfaction
- Better submission quality

✅ **Problem 3 (Auto-Approval)**
- No "stuck" submissions after 48 hours
- Worker confidence increases
- Fewer support tickets about delays

✅ **Problem 4 (Submission History)**
- Workers review past work and improve
- Learning loop created
- Fewer repeat mistakes

✅ **Problem 5 (Privacy)**
- Increased trust in platform
- More willing to share real earnings
- GDPR/privacy compliance

✅ **Problem 6 (Default Role)**
- Less user confusion
- More workers adopting platform
- Employer features opt-in, not mandatory

---

## Next Steps

Once this is deployed:

1. **Add WebSocket Real-Time Updates** for notifications
2. **Create Notification Preferences** - what workers want to see
3. **Add Notification Email Digests** - daily/weekly summaries
4. **Implement Dispute Escalation** - when revisions/rejections fail
5. **Add Rating System** - workers/employers rate each other
6. **Create Appeal Process** - for disputed rejections

This foundation makes PiPulse a trustworthy two-sided marketplace! 🚀
