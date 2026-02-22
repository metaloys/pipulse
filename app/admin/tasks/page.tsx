'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, Trash2, Star } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  pi_reward: number;
  slots_available: number;
  slots_remaining: number;
  task_status: string;
  deadline: string;
  employer_id: string;
  employer_username?: string;
  created_at: string;
  is_featured: boolean;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Check authentication
  useEffect(() => {
    const stored = sessionStorage.getItem('adminAuthenticated');
    if (stored !== 'true') {
      window.location.href = '/admin';
    }
  }, []);

  // Load tasks
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const response = await fetch('/api/admin/tasks');
        if (!response.ok) throw new Error('Failed to load tasks');

        const data = await response.json();
        setTasks(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, []);

  // Filter tasks
  useEffect(() => {
    let filtered = tasks;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.task_status === statusFilter);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(query) ||
        t.id.toLowerCase().includes(query) ||
        t.employer_username?.toLowerCase().includes(query)
      );
    }

    setFilteredTasks(filtered);
  }, [tasks, searchQuery, statusFilter]);

  const handleToggleFeatured = async (taskId: string, isFeatured: boolean) => {
    setActionLoading(taskId);
    try {
      const response = await fetch('/api/admin/tasks/toggle-featured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, isFeatured: !isFeatured }),
      });

      if (!response.ok) throw new Error('Failed to toggle featured status');

      setTasks(tasks.map(t =>
        t.id === taskId ? { ...t, is_featured: !isFeatured } : t
      ));
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to remove this task?')) return;

    setActionLoading(taskId);
    try {
      const response = await fetch('/api/admin/tasks/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId }),
      });

      if (!response.ok) throw new Error('Failed to remove task');

      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
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
              <h1 className="text-2xl font-bold text-white">Tasks</h1>
              <p className="text-sm text-gray-400">Manage platform tasks</p>
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
                  placeholder="Search by title, ID, or employer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder-gray-400"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 text-white rounded-md focus:outline-none focus:border-purple-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Stats */}
            <div className="flex items-end">
              <Card className="bg-purple-500/20 border-purple-500/50 w-full p-3">
                <p className="text-sm text-gray-300">Total Tasks: <span className="font-bold text-white">{tasks.length}</span></p>
              </Card>
            </div>
          </div>
        </Card>

        {/* Tasks Table */}
        <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <p className="text-gray-400">Loading tasks...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <p className="text-red-400">{error}</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-400">No tasks found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-700/50 border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-gray-300">Title</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-300">Employer</th>
                    <th className="px-6 py-3 text-right font-semibold text-gray-300">Reward</th>
                    <th className="px-6 py-3 text-right font-semibold text-gray-300">Slots</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-300">Status</th>
                    <th className="px-6 py-3 text-center font-semibold text-gray-300">Featured</th>
                    <th className="px-6 py-3 text-center font-semibold text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-slate-700/30 transition">
                      <td className="px-6 py-4">
                        <div className="text-gray-300 font-medium max-w-xs truncate">{task.title}</div>
                        <div className="text-xs text-gray-500 font-mono">{task.id.slice(0, 8)}...</div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {task.employer_username || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-emerald-400 font-semibold">{task.pi_reward} π</span>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-300">
                        <span className="font-mono">{task.slots_remaining}/{task.slots_available}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          task.task_status === 'active'
                            ? 'bg-green-500/20 text-green-400'
                            : task.task_status === 'completed'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {task.task_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {task.is_featured ? (
                          <Star className="w-4 h-4 text-yellow-400 mx-auto fill-yellow-400" />
                        ) : (
                          <Star className="w-4 h-4 text-gray-500 mx-auto" />
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            onClick={() => handleToggleFeatured(task.id, task.is_featured)}
                            disabled={actionLoading === task.id}
                            size="sm"
                            variant="outline"
                            className={`${
                              task.is_featured
                                ? 'border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10'
                                : 'border-gray-500/50 text-gray-400 hover:bg-gray-500/10'
                            }`}
                          >
                            {task.is_featured ? 'Unfeature' : 'Feature'}
                          </Button>
                          <Button
                            onClick={() => handleRemoveTask(task.id)}
                            disabled={actionLoading === task.id}
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            {actionLoading === task.id ? 'Removing...' : <Trash2 className="w-3 h-3" />}
                          </Button>
                        </div>
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
          Showing {filteredTasks.length} of {tasks.length} tasks
        </div>
      </div>
    </div>
  );
}
