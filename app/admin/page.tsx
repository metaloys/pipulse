'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Lock, LogOut, TrendingUp, Users, FileText, CheckCircle, DollarSign, Activity } from 'lucide-react';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Check if already authenticated via sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem('adminAuthenticated');
    if (stored === 'true') {
      setIsAuthenticated(true);
    }
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

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuthenticated');
    setIsAuthenticated(false);
    setPassword('');
  };

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
              <div>
                <Input
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
              </div>

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 border-b border-purple-500/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-sm text-gray-400">PiPulse System Management</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Section */}
        <OverviewSection />
      </div>
    </div>
  );
}

function OverviewSection() {
  const [stats, setStats] = useState({
    totalCommission: 0,
    dailyCommission: 0,
    totalUsers: 0,
    totalTasks: 0,
    completedTransactions: 0,
    dailyActiveUsers: 0,
    loading: true,
    error: null as string | null,
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetch('/api/admin/stats');
        if (!response.ok) throw new Error('Failed to load stats');

        const data = await response.json();
        setStats(prev => ({
          ...prev,
          totalCommission: data.totalCommission || 0,
          dailyCommission: data.dailyCommission || 0,
          totalUsers: data.totalUsers || 0,
          totalTasks: data.totalTasks || 0,
          completedTransactions: data.completedTransactions || 0,
          dailyActiveUsers: data.dailyActiveUsers || 0,
          loading: false,
        }));
      } catch (err) {
        setStats(prev => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Unknown error',
          loading: false,
        }));
      }
    };

    loadStats();
  }, []);

  if (stats.loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <Activity className="w-8 h-8 text-purple-400 mx-auto" />
          </div>
          <p className="text-gray-400">Loading statistics...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Commission',
      value: `${stats.totalCommission.toFixed(2)} π`,
      icon: DollarSign,
      bgColor: 'bg-emerald-500/10',
      iconColor: 'text-emerald-400',
      trend: '+12% from last month',
    },
    {
      title: 'Today\'s Commission',
      value: `${stats.dailyCommission.toFixed(2)} π`,
      icon: TrendingUp,
      bgColor: 'bg-blue-500/10',
      iconColor: 'text-blue-400',
      trend: 'Last 24 hours',
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      bgColor: 'bg-purple-500/10',
      iconColor: 'text-purple-400',
      trend: `${stats.totalUsers} registered`,
    },
    {
      title: 'Total Tasks',
      value: stats.totalTasks,
      icon: FileText,
      bgColor: 'bg-orange-500/10',
      iconColor: 'text-orange-400',
      trend: 'Posted on platform',
    },
    {
      title: 'Completed Transactions',
      value: stats.completedTransactions,
      icon: CheckCircle,
      bgColor: 'bg-cyan-500/10',
      iconColor: 'text-cyan-400',
      trend: 'All time',
    },
    {
      title: 'Daily Active Users',
      value: stats.dailyActiveUsers,
      icon: Activity,
      bgColor: 'bg-pink-500/10',
      iconColor: 'text-pink-400',
      trend: 'Last 24 hours',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div>
        <h2 className="text-xl font-bold text-white mb-6">Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Card key={idx} className="bg-slate-800/50 border-slate-700 hover:border-purple-500/50 transition-all duration-300">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-gray-400 text-sm font-medium">{stat.title}</p>
                      <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">{stat.trend}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Charts Section (Placeholder for future graphs) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <div className="p-6">
            <h3 className="text-lg font-bold text-white mb-4">Daily Revenue Trend</h3>
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-400">📊 Chart coming soon...</p>
            </div>
          </div>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <div className="p-6">
            <h3 className="text-lg font-bold text-white mb-4">User Growth</h3>
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-400">📈 Chart coming soon...</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-slate-800/50 border-slate-700">
        <div className="p-6">
          <h3 className="text-lg font-bold text-white mb-4">Quick Navigation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/admin/transactions">
              <Button variant="outline" className="w-full border-purple-500/50 text-purple-400 hover:bg-purple-500/10">
                📊 Transactions
              </Button>
            </Link>
            <Link href="/admin/users">
              <Button variant="outline" className="w-full border-purple-500/50 text-purple-400 hover:bg-purple-500/10">
                👥 Users
              </Button>
            </Link>
            <Link href="/admin/tasks">
              <Button variant="outline" className="w-full border-purple-500/50 text-purple-400 hover:bg-purple-500/10">
                📝 Tasks
              </Button>
            </Link>
            <Link href="/admin/submissions">
              <Button variant="outline" className="w-full border-purple-500/50 text-purple-400 hover:bg-purple-500/10">
                ✅ Submissions
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
