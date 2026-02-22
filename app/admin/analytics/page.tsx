'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, TrendingUp, Users, Award } from 'lucide-react';

interface UserStats {
  username: string;
  total_earnings: number;
  total_tasks_completed: number;
}

interface AnalyticsData {
  topEarners: UserStats[];
  topWorkers: UserStats[];
  dailyStats: Array<{ date: string; transactions: number; revenue: number }>;
  loading: boolean;
  error: string | null;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    topEarners: [],
    topWorkers: [],
    dailyStats: [],
    loading: true,
    error: null,
  });

  // Check authentication
  useEffect(() => {
    const stored = sessionStorage.getItem('adminAuthenticated');
    if (stored !== 'true') {
      window.location.href = '/admin';
    }
  }, []);

  // Load analytics data
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const response = await fetch('/api/admin/analytics');
        if (!response.ok) throw new Error('Failed to load analytics');

        const data = await response.json();
        setAnalytics(prev => ({
          ...prev,
          topEarners: data.topEarners || [],
          topWorkers: data.topWorkers || [],
          dailyStats: data.dailyStats || [],
          loading: false,
        }));
      } catch (err) {
        setAnalytics(prev => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Unknown error',
          loading: false,
        }));
      }
    };

    loadAnalytics();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 border-b border-purple-500/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="outline" className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Analytics</h1>
              <p className="text-sm text-gray-400">Platform statistics and leaderboards</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {analytics.loading ? (
          <div className="flex items-center justify-center h-96">
            <p className="text-gray-400">Loading analytics...</p>
          </div>
        ) : analytics.error ? (
          <div className="p-6 bg-red-500/20 border border-red-500/50 rounded-lg">
            <p className="text-red-400">{analytics.error}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Top Earners */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Award className="w-6 h-6 text-yellow-400" />
                Top Earners
              </h2>
              <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
                {analytics.topEarners.length === 0 ? (
                  <div className="p-12 text-center">
                    <p className="text-gray-400">No earnings data</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-700/50 border-b border-slate-700">
                        <tr>
                          <th className="px-6 py-3 text-left font-semibold text-gray-300">Rank</th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-300">Username</th>
                          <th className="px-6 py-3 text-right font-semibold text-gray-300">Total Earnings</th>
                          <th className="px-6 py-3 text-right font-semibold text-gray-300">Tasks Completed</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700">
                        {analytics.topEarners.map((user, idx) => (
                          <tr key={idx} className="hover:bg-slate-700/30 transition">
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 text-slate-900 font-bold rounded-full">
                                {idx + 1}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-300 font-medium">{user.username}</td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-emerald-400 font-semibold">{user.total_earnings.toFixed(2)} π</span>
                            </td>
                            <td className="px-6 py-4 text-right text-white font-semibold">{user.total_tasks_completed}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>

            {/* Top Workers */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-400" />
                Top Workers (by Tasks Completed)
              </h2>
              <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
                {analytics.topWorkers.length === 0 ? (
                  <div className="p-12 text-center">
                    <p className="text-gray-400">No worker data</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-700/50 border-b border-slate-700">
                        <tr>
                          <th className="px-6 py-3 text-left font-semibold text-gray-300">Rank</th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-300">Username</th>
                          <th className="px-6 py-3 text-right font-semibold text-gray-300">Tasks Completed</th>
                          <th className="px-6 py-3 text-right font-semibold text-gray-300">Total Earnings</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700">
                        {analytics.topWorkers.map((user, idx) => (
                          <tr key={idx} className="hover:bg-slate-700/30 transition">
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-400 to-cyan-400 text-slate-900 font-bold rounded-full">
                                {idx + 1}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-300 font-medium">{user.username}</td>
                            <td className="px-6 py-4 text-right text-white font-semibold">{user.total_tasks_completed}</td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-emerald-400 font-semibold">{user.total_earnings.toFixed(2)} π</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>

            {/* Daily Stats */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-purple-400" />
                Daily Activity (Last 7 Days)
              </h2>
              <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
                {analytics.dailyStats.length === 0 ? (
                  <div className="p-12 text-center">
                    <p className="text-gray-400">No daily activity data</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-700/50 border-b border-slate-700">
                        <tr>
                          <th className="px-6 py-3 text-left font-semibold text-gray-300">Date</th>
                          <th className="px-6 py-3 text-right font-semibold text-gray-300">Transactions</th>
                          <th className="px-6 py-3 text-right font-semibold text-gray-300">Daily Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700">
                        {analytics.dailyStats.map((stat, idx) => (
                          <tr key={idx} className="hover:bg-slate-700/30 transition">
                            <td className="px-6 py-4 text-gray-300">
                              {new Date(stat.date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-right text-white font-semibold">{stat.transactions}</td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-emerald-400 font-semibold">{stat.revenue.toFixed(2)} π</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>

            {/* Chart Placeholder */}
            <Card className="bg-slate-800/50 border-slate-700 p-8">
              <h2 className="text-xl font-bold text-white mb-4">Revenue Trend</h2>
              <div className="h-64 flex items-center justify-center">
                <p className="text-gray-400">📈 Interactive charts coming soon...</p>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
