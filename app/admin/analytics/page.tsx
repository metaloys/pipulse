'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/admin-sidebar';
import { AdminStatsBar } from '@/components/admin-stats-bar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TrendingUp, Users, Award, RefreshCw } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AnalyticsPeriod {
  date: string;
  commission: number;
  transactions: number;
  volume: number;
  users_active: number;
  new_tasks: number;
  submissions: number;
}

interface Stats {
  totalCommission: number;
  dailyCommission: number;
  totalTransactions: number;
  totalVolume: number;
}

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Date range
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  useEffect(() => {
    const checkAuth = () => {
      const isAuth = sessionStorage.getItem('adminAuthenticated');
      if (!isAuth) {
        router.push('/admin');
      }
    };
    checkAuth();
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch stats
      const statsRes = await fetch('/api/admin/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Fetch analytics data
      const analyticsRes = await fetch(`/api/admin/analytics?start=${startDate}&end=${endDate}`);
      if (analyticsRes.ok) {
        const data = await analyticsRes.json();
        setAnalyticsData(data || []);
      }

      setError('');
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <AdminSidebar />
      <div className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Analytics</h1>
          <p className="text-gray-400">Platform statistics and trends</p>
        </div>

        {/* Stats Bar */}
        <AdminStatsBar stats={stats || undefined} loading={loading} />

        {/* Date Range Selector */}
        <Card className="bg-slate-800/50 border-slate-700 mb-6 p-6">
          <h3 className="text-lg font-bold text-white mb-4">Date Range</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">From Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">To Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button
                onClick={fetchData}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Load Data
              </Button>
            </div>
          </div>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <p className="text-gray-400">Loading analytics...</p>
          </div>
        ) : error ? (
          <Card className="bg-red-500/20 border-red-500/50 p-6">
            <p className="text-red-400">{error}</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Commission Trend Chart */}
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h3 className="text-lg font-bold text-white mb-6">Commission Trend</h3>
              {analyticsData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px', color: '#fff' }}
                      formatter={(value) => `${(value as number).toFixed(2)} π`}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="commission" stroke="#a855f7" strokeWidth={2} dot={{ fill: '#a855f7' }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400 text-center py-8">No data available</p>
              )}
            </Card>

            {/* Transaction Volume Chart */}
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h3 className="text-lg font-bold text-white mb-6">Transaction Volume</h3>
              {analyticsData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px', color: '#fff' }}
                      formatter={(value) => (value as number).toString()}
                    />
                    <Legend />
                    <Bar dataKey="transactions" fill="#3b82f6" radius={4} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400 text-center py-8">No data available</p>
              )}
            </Card>

            {/* Activity Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-slate-800/50 border-slate-700 p-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-purple-400" />
                  <div>
                    <p className="text-gray-400 text-sm">Avg Daily Commission</p>
                    <p className="text-2xl font-bold text-white mt-1">
                      {analyticsData.length > 0 
                        ? (analyticsData.reduce((sum, d) => sum + d.commission, 0) / analyticsData.length).toFixed(2)
                        : '0.00'} π
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700 p-4">
                <div className="flex items-center gap-3">
                  <Users className="w-6 h-6 text-blue-400" />
                  <div>
                    <p className="text-gray-400 text-sm">Avg Daily Users</p>
                    <p className="text-2xl font-bold text-white mt-1">
                      {analyticsData.length > 0 
                        ? Math.round(analyticsData.reduce((sum, d) => sum + d.users_active, 0) / analyticsData.length)
                        : '0'}
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700 p-4">
                <div className="flex items-center gap-3">
                  <Award className="w-6 h-6 text-yellow-400" />
                  <div>
                    <p className="text-gray-400 text-sm">Total Period Volume</p>
                    <p className="text-2xl font-bold text-white mt-1">
                      {analyticsData.length > 0 
                        ? analyticsData.reduce((sum, d) => sum + d.volume, 0).toFixed(2)
                        : '0.00'} π
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Detailed Table */}
            <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
              <div className="p-6 border-b border-slate-700">
                <h3 className="text-lg font-bold text-white">Daily Breakdown</h3>
              </div>
              {analyticsData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-700/50">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold text-gray-300">Date</th>
                        <th className="px-6 py-3 text-right font-semibold text-gray-300">Commission</th>
                        <th className="px-6 py-3 text-right font-semibold text-gray-300">Transactions</th>
                        <th className="px-6 py-3 text-right font-semibold text-gray-300">Volume (π)</th>
                        <th className="px-6 py-3 text-right font-semibold text-gray-300">Active Users</th>
                        <th className="px-6 py-3 text-right font-semibold text-gray-300">New Tasks</th>
                        <th className="px-6 py-3 text-right font-semibold text-gray-300">Submissions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {analyticsData.map((day) => (
                        <tr key={day.date} className="hover:bg-slate-700/30 transition">
                          <td className="px-6 py-4 text-gray-300">{new Date(day.date).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-right text-emerald-400 font-semibold">{day.commission.toFixed(2)} π</td>
                          <td className="px-6 py-4 text-right text-white">{day.transactions}</td>
                          <td className="px-6 py-4 text-right text-blue-400">{day.volume.toFixed(2)}</td>
                          <td className="px-6 py-4 text-right text-white">{day.users_active}</td>
                          <td className="px-6 py-4 text-right text-white">{day.new_tasks}</td>
                          <td className="px-6 py-4 text-right text-white">{day.submissions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <p className="text-gray-400">No data available for the selected date range</p>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
