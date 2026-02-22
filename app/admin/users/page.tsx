'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, Ban, CheckCircle } from 'lucide-react';

interface User {
  id: string;
  pi_username: string;
  pi_wallet_address: string;
  total_earnings: number;
  total_tasks_completed: number;
  role: string;
  status: string;
  created_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Check authentication
  useEffect(() => {
    const stored = sessionStorage.getItem('adminAuthenticated');
    if (stored !== 'true') {
      window.location.href = '/admin';
    }
  }, []);

  // Load users
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await fetch('/api/admin/users');
        if (!response.ok) throw new Error('Failed to load users');

        const data = await response.json();
        setUsers(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  // Filter users
  useEffect(() => {
    let filtered = users;

    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === roleFilter);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(u =>
        u.pi_username.toLowerCase().includes(query) ||
        u.id.toLowerCase().includes(query) ||
        u.pi_wallet_address.toLowerCase().includes(query)
      );
    }

    setFilteredUsers(filtered);
  }, [users, searchQuery, roleFilter]);

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    setActionLoading(userId);
    try {
      const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
      const response = await fetch('/api/admin/users/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update user status');

      // Update local state
      setUsers(users.map(u => 
        u.id === userId ? { ...u, status: newStatus } : u
      ));
    } catch (err) {
      alert('Error updating user status: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setActionLoading(null);
    }
  };

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
              <h1 className="text-2xl font-bold text-white">Users</h1>
              <p className="text-sm text-gray-400">Manage platform users and permissions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <Card className="bg-slate-800/50 border-slate-700 mb-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Search by username, ID, or wallet..."
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
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Stats */}
            <div className="flex items-end">
              <Card className="bg-purple-500/20 border-purple-500/50 w-full p-3">
                <p className="text-sm text-gray-300">Total Users: <span className="font-bold text-white">{users.length}</span></p>
              </Card>
            </div>
          </div>
        </Card>

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
                    <th className="px-6 py-3 text-left font-semibold text-gray-300">Username</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-300">Wallet</th>
                    <th className="px-6 py-3 text-right font-semibold text-gray-300">Earnings</th>
                    <th className="px-6 py-3 text-right font-semibold text-gray-300">Tasks Done</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-300">Role</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-300">Status</th>
                    <th className="px-6 py-3 text-center font-semibold text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-700/30 transition">
                      <td className="px-6 py-4 text-gray-300 font-medium">{user.pi_username}</td>
                      <td className="px-6 py-4 text-gray-400 text-xs font-mono">
                        {user.pi_wallet_address.slice(0, 10)}...
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-emerald-400 font-semibold">{user.total_earnings.toFixed(2)} π</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-white font-semibold">{user.total_tasks_completed}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          user.role === 'admin'
                            ? 'bg-red-500/20 text-red-400'
                            : user.role === 'employer'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-purple-500/20 text-purple-400'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          user.status === 'active'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Button
                          onClick={() => handleToggleStatus(user.id, user.status)}
                          disabled={actionLoading === user.id}
                          size="sm"
                          className={`${
                            user.status === 'active'
                              ? 'bg-red-600 hover:bg-red-700'
                              : 'bg-green-600 hover:bg-green-700'
                          } text-white`}
                        >
                          {actionLoading === user.id ? (
                            'Processing...'
                          ) : user.status === 'active' ? (
                            <>
                              <Ban className="w-3 h-3 mr-1" />
                              Ban
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Activate
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Results Count */}
        <div className="mt-4 text-sm text-gray-400">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      </div>
    </div>
  );
}
