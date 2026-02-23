'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/admin-sidebar';
import { AdminStatsBar } from '@/components/admin-stats-bar';
import { Card } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Lock, Input } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input as InputComponent } from '@/components/ui/input';

interface DashboardStats {
  totalCommission: number;
  dailyCommission: number;
  totalTransactions: number;
  totalVolume: number;
}

interface ChartData {
  date: string;
  commission: number;
  volume: number;
  transactions: number;
}

interface TopUser {
  username: string;
  amount: number;
  level: string;
}

interface Activity {
  id: string;
  message: string;
  timestamp: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const isAuth = sessionStorage.getItem('adminAuthenticated');
    if (isAuth === 'true') {
      setIsAuthenticated(true);
    }
    setCheckingAuth(false);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        setError('Invalid password');
        setPassword('');
        setIsLoading(false);
        return;
      }

      sessionStorage.setItem('adminAuthenticated', 'true');
      setIsAuthenticated(true);
      setPassword('');
    } catch (err) {
      setError('Failed to verify password');
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800/80 border-purple-500/30 backdrop-blur-xl">
          <div className="p-8">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-purple-500/20 rounded-lg">
                <Lock className="w-8 h-8 text-purple-400" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-center text-white mb-2">Admin Dashboard</h1>
            <p className="text-center text-gray-400 mb-6">Enter your password to continue</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <InputComponent
                type="password"
                placeholder="Admin password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                disabled={isLoading}
                className="bg-slate-700/50 border-slate-600 text-white placeholder-gray-400"
                autoFocus
              />

              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading || !password}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isLoading ? 'Verifying...' : 'Login'}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <AdminSidebar />
      <div className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Dashboard Overview</h1>
          <p className="text-gray-400">Welcome to PiPulse admin panel</p>
        </div>

        {/* Stats Bar */}
        <DashboardContent />
      </div>
    </div>
  );
}

function OverviewSection() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [topEarners, setTopEarners] = useState<TopUser[]>([]);
  const [topEmployers, setTopEmployers] = useState<TopUser[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats
      const statsRes = await fetch('/api/admin/stats');
      if (!statsRes.ok) throw new Error('Failed to fetch stats');
      const statsData = await statsRes.json();
      setStats(statsData);

      // Generate sample chart data (30 days)
      const data = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        data.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          commission: Math.random() * 500 + 100,
          volume: Math.random() * 5000 + 1000,
          transactions: Math.floor(Math.random() * 100) + 10,
        });
      }
      setChartData(data);

      // Sample top earners and employers
      setTopEarners([
        { username: 'expert_user', amount: 2500.50, level: 'Expert' },
        { username: 'rising_star', amount: 1800.25, level: 'Rising' },
        { username: 'worker_pro', amount: 1500.75, level: 'Expert' },
        { username: 'new_hustler', amount: 950.00, level: 'Newcomer' },
        { username: 'elite_member', amount: 3200.99, level: 'Elite' },
      ]);

      setTopEmployers([
        { username: 'employer_main', amount: 5000.00, level: 'Elite' },
        { username: 'biz_owner', amount: 3500.50, level: 'Expert' },
        { username: 'task_poster', amount: 2800.25, level: 'Rising' },
        { username: 'company_ai', amount: 2100.75, level: 'Expert' },
        { username: 'startup_lab', amount: 1600.00, level: 'Rising' },
      ]);

      // Sample activities
      setActivities([
        { id: '1', message: 'judith250 completed task "Design Website"', timestamp: new Date().toISOString() },
        { id: '2', message: 'aloysmet posted new task "Write Blog Post"', timestamp: new Date(Date.now() - 3600000).toISOString() },
        { id: '3', message: 'worker_pro earned 250π from "API Integration"', timestamp: new Date(Date.now() - 7200000).toISOString() },
        { id: '4', message: 'dispute opened on task "Logo Design"', timestamp: new Date(Date.now() - 10800000).toISOString() },
        { id: '5', message: 'payment completed: 1000π transferred', timestamp: new Date(Date.now() - 14400000).toISOString() },
        { id: '6', message: 'new user registered: alex_developer', timestamp: new Date(Date.now() - 18000000).toISOString() },
        { id: '7', message: 'task expired: "Social Media Graphics"', timestamp: new Date(Date.now() - 21600000).toISOString() },
        { id: '8', message: 'submission rejected: quality issues', timestamp: new Date(Date.now() - 25200000).toISOString() },
        { id: '9', message: 'streak reset for: inactive_user', timestamp: new Date(Date.now() - 28800000).toISOString() },
        { id: '10', message: 'user banned: violator_account', timestamp: new Date(Date.now() - 32400000).toISOString() },
      ]);

    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AdminStatsBar stats={stats || undefined} loading={loading} />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Commission Trend */}
        <Card className="bg-slate-800/50 border-slate-700 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Commission Trend (30 days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#404854" />
              <XAxis dataKey="date" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
              <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="commission"
                stroke="#a855f7"
                strokeWidth={2}
                dot={false}
                name="Daily Commission (π)"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Transaction Volume */}
        <Card className="bg-slate-800/50 border-slate-700 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Transaction Volume (30 days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#404854" />
              <XAxis dataKey="date" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
              <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
              <Bar dataKey="transactions" fill="#3b82f6" name="Transactions" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Top Earners */}
        <Card className="bg-slate-800/50 border-slate-700 p-6">
          <h3 className="text-lg font-bold text-white mb-4">Top Earners Today</h3>
          <div className="space-y-3">
            {topEarners.map((user, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                <div className="flex-1">
                  <p className="text-white font-medium">{user.username}</p>
                  <p className="text-xs text-gray-400">{user.level}</p>
                </div>
                <p className="text-purple-400 font-semibold">{Number(user.amount || 0).toFixed(2)} π</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Employers */}
        <Card className="bg-slate-800/50 border-slate-700 p-6">
          <h3 className="text-lg font-bold text-white mb-4">Top Employers Today</h3>
          <div className="space-y-3">
            {topEmployers.map((user, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                <div className="flex-1">
                  <p className="text-white font-medium">{user.username}</p>
                  <p className="text-xs text-gray-400">{user.level}</p>
                </div>
                <p className="text-orange-400 font-semibold">{Number(user.amount || 0).toFixed(2)} π</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-slate-800/50 border-slate-700 p-6">
          <h3 className="text-lg font-bold text-white mb-4">Recent Activity</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activities.map((activity) => (
              <div key={activity.id} className="pb-3 border-b border-slate-700 last:border-0">
                <p className="text-sm text-gray-300">{activity.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(activity.timestamp).toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

function DashboardContent() {
  return <OverviewSection />;
}
