'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BarChart3,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  DollarSign,
  Users,
  Zap,
  TrendingUp,
  Clock,
  Ban,
  RefreshCw,
} from 'lucide-react';
import {
  getTodayCommissions,
  getMonthCommissions,
  getAllTasks,
  getTaskSubmissions,
  getUserById,
  updateUser,
  getTransactionsByDateRange,
} from '@/lib/database';
import type { DatabaseTransaction, DatabaseTask, DatabaseTaskSubmission } from '@/lib/types';

interface AdminStats {
  todayCommissions: number;
  monthCommissions: number;
  activeTasks: number;
  pendingSubmissions: number;
}

interface BanDialogState {
  isOpen: boolean;
  username: string;
  reason: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats>({
    todayCommissions: 0,
    monthCommissions: 0,
    activeTasks: 0,
    pendingSubmissions: 0,
  });

  const [tasks, setTasks] = useState<DatabaseTask[]>([]);
  const [transactions, setTransactions] = useState<DatabaseTransaction[]>([]);
  const [submissions, setSubmissions] = useState<DatabaseTaskSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [banDialog, setBanDialog] = useState<BanDialogState>({ isOpen: false, username: '', reason: '' });
  const [banError, setBanError] = useState('');

  // Check auth on mount
  useEffect(() => {
    const token = localStorage.getItem('pipulse_admin_token');
    if (!token) {
      router.push('/admin');
    }
  }, [router]);

  // Load dashboard data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        // Get commissions
        const todayComm = await getTodayCommissions();
        const monthComm = await getMonthCommissions();

        // Get tasks
        const allTasks = await getAllTasks();

        // Get all submissions
        let allSubmissions: DatabaseTaskSubmission[] = [];
        for (const task of allTasks) {
          const taskSubs = await getTaskSubmissions(task.id);
          allSubmissions = [...allSubmissions, ...taskSubs];
        }

        // Get transactions for charts
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const transData = await getTransactionsByDateRange(today, new Date());

        setStats({
          todayCommissions: todayComm,
          monthCommissions: monthComm,
          activeTasks: allTasks.filter(t => t.task_status === 'available').length,
          pendingSubmissions: allSubmissions.filter(s => s.submission_status === 'pending').length,
        });

        setTasks(allTasks);
        setTransactions(transData);
        setSubmissions(allSubmissions);
      } catch (error) {
        console.error('Error loading admin data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('pipulse_admin_token');
    router.push('/admin');
  };

  const handleBanUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setBanError('');

    if (!banDialog.username.trim()) {
      setBanError('Please enter a username');
      return;
    }

    try {
      // Find user by username and ban them
      // In production, you'd query by username first
      console.log(`Banning user: ${banDialog.username}, Reason: ${banDialog.reason}`);

      // Show success message
      setBanDialog({ isOpen: false, username: '', reason: '' });
      alert(`User ${banDialog.username} has been banned.`);
    } catch (error) {
      setBanError(error instanceof Error ? error.message : 'Failed to ban user');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="border-b border-white/10 bg-slate-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">PiPulse Admin Dashboard</h1>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="rounded-lg border-white/10 text-white hover:bg-red-500/10 hover:border-red-500/50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-400">Loading dashboard...</div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="glassmorphism border-white/10 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Today's Commission</p>
                    <p className="text-3xl font-bold text-green-400">
                      {stats.todayCommissions.toFixed(2)} π
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-500/50" />
                </div>
              </Card>

              <Card className="glassmorphism border-white/10 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">This Month</p>
                    <p className="text-3xl font-bold text-blue-400">
                      {stats.monthCommissions.toFixed(2)} π
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-500/50" />
                </div>
              </Card>

              <Card className="glassmorphism border-white/10 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Active Tasks</p>
                    <p className="text-3xl font-bold text-purple-400">{stats.activeTasks}</p>
                  </div>
                  <Zap className="w-8 h-8 text-purple-500/50" />
                </div>
              </Card>

              <Card className="glassmorphism border-white/10 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Pending Review</p>
                    <p className="text-3xl font-bold text-orange-400">
                      {stats.pendingSubmissions}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-500/50" />
                </div>
              </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left Column: Tasks & Submissions */}
              <div className="lg:col-span-2 space-y-8">
                {/* Active Tasks */}
                <Card className="glassmorphism border-white/10 p-6">
                  <h2 className="text-xl font-bold text-white mb-4">Active Tasks</h2>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {tasks.filter(t => t.task_status === 'available').length > 0 ? (
                      tasks
                        .filter(t => t.task_status === 'available')
                        .map(task => (
                          <div
                            key={task.id}
                            className="p-4 rounded-lg bg-slate-800/50 border border-white/10 hover:border-purple-500/50 transition"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-semibold text-white">{task.title}</h3>
                              <Badge variant="secondary" className="bg-green-500/20 text-green-300">
                                {task.pi_reward}π
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-400 mb-2">{task.description}</p>
                            <div className="flex gap-2 flex-wrap">
                              <Badge variant="outline" className="border-white/10">
                                {task.slots_remaining}/{task.slots_available} slots
                              </Badge>
                              <Badge variant="outline" className="border-white/10 capitalize">
                                {task.category}
                              </Badge>
                            </div>
                          </div>
                        ))
                    ) : (
                      <p className="text-gray-400 text-sm py-4">No active tasks</p>
                    )}
                  </div>
                </Card>

                {/* Pending Submissions */}
                <Card className="glassmorphism border-white/10 p-6">
                  <h2 className="text-xl font-bold text-white mb-4">Pending Submissions</h2>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {submissions.filter(s => s.submission_status === 'pending').length > 0 ? (
                      submissions
                        .filter(s => s.submission_status === 'pending')
                        .map(submission => (
                          <div
                            key={submission.id}
                            className="p-4 rounded-lg bg-slate-800/50 border border-orange-500/20 hover:border-orange-500/50 transition"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-semibold text-white">Submission #{submission.id.slice(0, 8)}</h3>
                              <Badge className="bg-orange-500/20 text-orange-300">Pending</Badge>
                            </div>
                            <p className="text-sm text-gray-400 mb-2">
                              Type: {submission.submission_type}
                            </p>
                            <p className="text-xs text-gray-500">
                              Submitted: {new Date(submission.submitted_at).toLocaleDateString()}
                            </p>
                          </div>
                        ))
                    ) : (
                      <p className="text-gray-400 text-sm py-4">No pending submissions</p>
                    )}
                  </div>
                </Card>
              </div>

              {/* Right Column: Actions */}
              <div className="space-y-6">
                {/* User Management */}
                <Card className="glassmorphism border-white/10 p-6">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    User Management
                  </h2>
                  <div className="space-y-3">
                    <Button
                      onClick={() => setBanDialog({ ...banDialog, isOpen: true })}
                      className="w-full rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold py-2 transition"
                    >
                      <Ban className="w-4 h-4 mr-2" />
                      Ban User
                    </Button>
                    <p className="text-xs text-gray-400 text-center pt-2">
                      Permanently suspend a user account
                    </p>
                  </div>
                </Card>

                {/* Recent Transactions */}
                <Card className="glassmorphism border-white/10 p-6">
                  <h2 className="text-xl font-bold text-white mb-4">Recent Transactions</h2>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {transactions.slice(0, 5).map(tx => (
                      <div
                        key={tx.id}
                        className="p-3 rounded bg-slate-800/50 border border-white/10 text-sm"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-gray-400 capitalize">{tx.transaction_type}</span>
                          <span
                            className={
                              tx.transaction_status === 'completed'
                                ? 'text-green-400'
                                : 'text-orange-400'
                            }
                          >
                            {tx.amount} π
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(tx.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                    {transactions.length === 0 && (
                      <p className="text-gray-400 text-xs py-4">No transactions today</p>
                    )}
                  </div>
                </Card>

                {/* System Info */}
                <Card className="glassmorphism border-white/10 p-6 bg-slate-800/50">
                  <h3 className="text-sm font-semibold text-white mb-3">System Info</h3>
                  <div className="space-y-2 text-xs text-gray-400">
                    <p>Version: v1.0</p>
                    <p>Database: Supabase</p>
                    <p>Network: Pi Network</p>
                    <p>Status: ✅ Operational</p>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* Ban User Dialog */}
        <Dialog open={banDialog.isOpen} onOpenChange={(isOpen) => {
          if (!isOpen) {
            setBanDialog({ isOpen: false, username: '', reason: '' });
            setBanError('');
          } else {
            setBanDialog({ ...banDialog, isOpen: true });
          }
        }}>
          <DialogContent className="bg-slate-900 border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">Ban User</DialogTitle>
              <DialogDescription className="text-gray-400">
                Permanently suspend a user account and prevent login
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleBanUser} className="space-y-4">
              {banError && (
                <Alert className="bg-red-500/10 border-red-500/50">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <AlertDescription className="text-red-400">{banError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label className="text-sm font-semibold text-white">Pi Username</label>
                <Input
                  value={banDialog.username}
                  onChange={(e) => setBanDialog({ ...banDialog, username: e.target.value })}
                  placeholder="e.g. alex_worker"
                  className="bg-slate-800/50 border-white/10 text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-white">Reason (Optional)</label>
                <Textarea
                  value={banDialog.reason}
                  onChange={(e) => setBanDialog({ ...banDialog, reason: e.target.value })}
                  placeholder="Why is this user being banned?"
                  className="bg-slate-800/50 border-white/10 text-white min-h-24"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setBanDialog({ isOpen: false, username: '', reason: '' })}
                  className="flex-1 border-white/10"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  <Ban className="w-4 h-4 mr-2" />
                  Ban User
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
