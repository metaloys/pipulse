'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/admin-sidebar';
import { AdminStatsBar } from '@/components/admin-stats-bar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Ban, Unlock, RefreshCw } from 'lucide-react';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'worker' | 'employer' | 'both';
  level: 'newcomer' | 'rising' | 'expert' | 'elite';
  total_earnings: number;
  tasks_completed: number;
  current_streak: number;
  join_date: string;
  last_active: string;
  is_banned: boolean;
}

interface Stats {
  totalCommission: number;
  dailyCommission: number;
  totalTransactions: number;
  totalVolume: number;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

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

      // Fetch users
      const usersRes = await fetch('/api/admin/users');
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData || []);
      }

      setError('');
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = [...users];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(user => user.username.toLowerCase().includes(query));
    }

    // Role filter
    if (roleFilter !== 'all') {
      result = result.filter(user => user.role === roleFilter);
    }

    // Level filter
    if (levelFilter !== 'all') {
      result = result.filter(user => user.level === levelFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(user => 
        statusFilter === 'banned' ? user.is_banned : !user.is_banned
      );
    }

    // Sort by earnings descending
    result.sort((a, b) => b.total_earnings - a.total_earnings);

    setFilteredUsers(result);
  }, [users, searchQuery, roleFilter, levelFilter, statusFilter]);

  const banUser = async (userId: string) => {
    try {
      await fetch(`/api/admin/users/update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isBanned: true }),
      });
      fetchData();
    } catch (err) {
      console.error('Error banning user:', err);
    }
  };

  const unbanUser = async (userId: string) => {
    try {
      await fetch(`/api/admin/users/update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isBanned: false }),
      });
      fetchData();
    } catch (err) {
      console.error('Error unbanning user:', err);
    }
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'elite': return 'bg-purple-500/20 text-purple-400';
      case 'expert': return 'bg-blue-500/20 text-blue-400';
      case 'rising': return 'bg-orange-500/20 text-orange-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <AdminSidebar />
      <div className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Users</h1>
          <p className="text-gray-400">Manage platform users and permissions</p>
        </div>

        {/* Stats Bar */}
        <AdminStatsBar stats={stats || undefined} loading={loading} />

        {/* Filters Card */}
        <Card className="bg-slate-800/50 border-slate-700 mb-6 p-6">
          <h3 className="text-lg font-bold text-white mb-4">Filters & Search</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder-gray-400"
                />
              </div>
            </div>

            {/* Role Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 text-white rounded-md focus:outline-none focus:border-purple-500"
              >
                <option value="all">All Roles</option>
                <option value="worker">Worker</option>
                <option value="employer">Employer</option>
                <option value="both">Both</option>
              </select>
            </div>

            {/* Level Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Level</label>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 text-white rounded-md focus:outline-none focus:border-purple-500"
              >
                <option value="all">All Levels</option>
                <option value="newcomer">Newcomer</option>
                <option value="rising">Rising</option>
                <option value="expert">Expert</option>
                <option value="elite">Elite</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 text-white rounded-md focus:outline-none focus:border-purple-500"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="banned">Banned</option>
              </select>
            </div>

            {/* Refresh Button */}
            <div className="flex items-end">
              <Button
                onClick={fetchData}
                variant="outline"
                className="w-full bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Clear Filters */}
          <div className="mt-4 flex justify-end">
            <Button
              onClick={() => {
                setSearchQuery('');
                setRoleFilter('all');
                setLevelFilter('all');
                setStatusFilter('all');
              }}
              variant="outline"
              className="border-gray-500/50 text-gray-400 hover:bg-gray-500/10"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-slate-800/50 border-slate-700 p-4">
            <p className="text-gray-400 text-sm">Total Users</p>
            <p className="text-3xl font-bold text-white mt-2">{users.length}</p>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700 p-4">
            <p className="text-gray-400 text-sm">Active Users</p>
            <p className="text-3xl font-bold text-white mt-2">{users.filter(u => !u.is_banned).length}</p>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700 p-4">
            <p className="text-gray-400 text-sm">Banned Users</p>
            <p className="text-3xl font-bold text-red-400 mt-2">{users.filter(u => u.is_banned).length}</p>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700 p-4">
            <p className="text-gray-400 text-sm">Filtered Results</p>
            <p className="text-3xl font-bold text-purple-400 mt-2">{filteredUsers.length}</p>
          </Card>
        </div>

        {/* Users Table */}
        <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <p className="text-gray-400">Loading users...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <p className="text-red-400">{error}</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-400">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-700/50 border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-gray-300">Avatar</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-300">Username</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-300">Role</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-300">Level</th>
                    <th className="px-6 py-3 text-right font-semibold text-gray-300">Earnings</th>
                    <th className="px-6 py-3 text-right font-semibold text-gray-300">Tasks</th>
                    <th className="px-6 py-3 text-right font-semibold text-gray-300">Streak</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-300">Joined</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-300">Status</th>
                    <th className="px-6 py-3 text-center font-semibold text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-700/30 transition">
                      <td className="px-6 py-4">
                        <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm">
                          {user.username[0].toUpperCase()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowProfile(true);
                          }}
                          className="text-white font-medium hover:text-purple-400 cursor-pointer"
                        >
                          {user.username}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{user.role}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getLevelBadgeColor(user.level)}`}>
                          {user.level}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-white font-semibold">{Number(user.total_earnings || 0).toFixed(2)} π</td>
                      <td className="px-6 py-4 text-right text-gray-300">{user.tasks_completed}</td>
                      <td className="px-6 py-4 text-right text-orange-400 font-semibold">
                        {user.current_streak > 0 ? `🔥 ${user.current_streak}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-xs">
                        {new Date(user.join_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          user.is_banned
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-green-500/20 text-green-400'
                        }`}>
                          {user.is_banned ? 'Banned' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {user.is_banned ? (
                          <Button
                            onClick={() => unbanUser(user.id)}
                            size="sm"
                            variant="outline"
                            className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                          >
                            <Unlock className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            onClick={() => banUser(user.id)}
                            size="sm"
                            variant="outline"
                            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                          >
                            <Ban className="w-4 h-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* User Profile Panel */}
        {showProfile && selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="bg-slate-800 border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-white mb-6">{selectedUser.username}</h2>

                <div className="space-y-4">
                  {/* Profile Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Role</p>
                      <p className="text-white font-semibold capitalize">{selectedUser.role}</p>
                    </div>
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Level</p>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold inline-block ${getLevelBadgeColor(selectedUser.level)}`}>
                        {selectedUser.level}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Total Earnings</p>
                      <p className="text-2xl font-bold text-white">{Number(selectedUser.total_earnings || 0).toFixed(2)} π</p>
                    </div>
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Tasks Completed</p>
                      <p className="text-2xl font-bold text-white">{selectedUser.tasks_completed}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Current Streak</p>
                      <p className="text-2xl font-bold text-orange-400">
                        {selectedUser.current_streak > 0 ? `🔥 ${selectedUser.current_streak}` : 'No streak'}
                      </p>
                    </div>
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Account Status</p>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold inline-block ${
                        selectedUser.is_banned
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-green-500/20 text-green-400'
                      }`}>
                        {selectedUser.is_banned ? 'Banned' : 'Active'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-700/30 p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">Joined</p>
                    <p className="text-white">{new Date(selectedUser.join_date).toLocaleString()}</p>
                  </div>

                  <div className="bg-slate-700/30 p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">Last Active</p>
                    <p className="text-white">{new Date(selectedUser.last_active).toLocaleString()}</p>
                  </div>

                  <div className="bg-slate-700/30 p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">Email</p>
                    <p className="text-white font-mono text-sm">{selectedUser.email}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 space-y-2">
                  {selectedUser.is_banned ? (
                    <Button
                      onClick={() => {
                        unbanUser(selectedUser.id);
                        setShowProfile(false);
                      }}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Unlock className="w-4 h-4 mr-2" />
                      Unban User
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        banUser(selectedUser.id);
                        setShowProfile(false);
                      }}
                      className="w-full bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Ban className="w-4 h-4 mr-2" />
                      Ban User
                    </Button>
                  )}
                  <Button
                    onClick={() => setShowProfile(false)}
                    className="w-full bg-slate-700 hover:bg-slate-600 text-white"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
