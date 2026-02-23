'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/admin-sidebar';
import { AdminStatsBar } from '@/components/admin-stats-bar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Eye, Trash2, Clock, RefreshCw } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  category: string;
  employer_username: string;
  reward_per_worker: number;
  total_slots: number;
  filled_slots: number;
  deadline: string;
  status: 'active' | 'full' | 'expired' | 'removed';
  created_at: string;
  description: string;
  submission_count: number;
}

interface Stats {
  totalCommission: number;
  dailyCommission: number;
  totalTransactions: number;
  totalVolume: number;
}

const CATEGORIES = ['Design', 'Writing', 'Development', 'Marketing', 'Data Entry', 'Video', 'Audio', 'Other'];

export default function AdminTasksPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
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

      // Fetch tasks
      const tasksRes = await fetch('/api/admin/tasks');
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData || []);
      }

      setError('');
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = [...tasks];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(task =>
        task.title.toLowerCase().includes(query) ||
        task.employer_username.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter(task => task.category === categoryFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(task => task.status === statusFilter);
    }

    // Sort by created date descending
    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setFilteredTasks(result);
  }, [tasks, searchQuery, categoryFilter, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400';
      case 'full': return 'bg-blue-500/20 text-blue-400';
      case 'expired': return 'bg-orange-500/20 text-orange-400';
      case 'removed': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Design': 'bg-purple-500/20 text-purple-400',
      'Writing': 'bg-blue-500/20 text-blue-400',
      'Development': 'bg-green-500/20 text-green-400',
      'Marketing': 'bg-pink-500/20 text-pink-400',
      'Data Entry': 'bg-orange-500/20 text-orange-400',
      'Video': 'bg-red-500/20 text-red-400',
      'Audio': 'bg-indigo-500/20 text-indigo-400',
    };
    return colors[category] || 'bg-gray-500/20 text-gray-400';
  };

  const removeTask = async (taskId: string) => {
    try {
      await fetch(`/api/admin/tasks/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId }),
      });
      fetchData();
    } catch (err) {
      console.error('Error removing task:', err);
    }
  };

  const toggleFeatured = async (taskId: string) => {
    try {
      await fetch(`/api/admin/tasks/toggle-featured`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId }),
      });
      fetchData();
    } catch (err) {
      console.error('Error toggling featured:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <AdminSidebar />
      <div className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Tasks</h1>
          <p className="text-gray-400">Manage all tasks on the platform</p>
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
                  placeholder="Title or employer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder-gray-400"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 text-white rounded-md focus:outline-none focus:border-purple-500"
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
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
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="full">Full</option>
                <option value="expired">Expired</option>
                <option value="removed">Removed</option>
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

            {/* Clear Filters */}
            <div className="flex items-end">
              <Button
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                  setStatusFilter('all');
                }}
                variant="outline"
                className="w-full border-gray-500/50 text-gray-400 hover:bg-gray-500/10"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-slate-800/50 border-slate-700 p-4">
            <p className="text-gray-400 text-sm">Total Tasks</p>
            <p className="text-3xl font-bold text-white mt-2">{tasks.length}</p>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700 p-4">
            <p className="text-gray-400 text-sm">Active Tasks</p>
            <p className="text-3xl font-bold text-green-400 mt-2">{tasks.filter(t => t.status === 'active').length}</p>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700 p-4">
            <p className="text-gray-400 text-sm">Full Tasks</p>
            <p className="text-3xl font-bold text-blue-400 mt-2">{tasks.filter(t => t.status === 'full').length}</p>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700 p-4">
            <p className="text-gray-400 text-sm">Expired/Removed</p>
            <p className="text-3xl font-bold text-orange-400 mt-2">{tasks.filter(t => t.status === 'expired' || t.status === 'removed').length}</p>
          </Card>
        </div>

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
                    <th className="px-6 py-3 text-left font-semibold text-gray-300">Category</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-300">Employer</th>
                    <th className="px-6 py-3 text-right font-semibold text-gray-300">Reward</th>
                    <th className="px-6 py-3 text-center font-semibold text-gray-300">Slots</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-300">Deadline</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-300">Status</th>
                    <th className="px-6 py-3 text-center font-semibold text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-slate-700/30 transition">
                      <td className="px-6 py-4 font-medium text-white truncate max-w-xs">{task.title}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(task.category)}`}>
                          {task.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{task.employer_username}</td>
                      <td className="px-6 py-4 text-right text-white font-semibold">{Number(task.reward_per_worker || 0).toFixed(2)} π</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-24 bg-slate-700 rounded-full h-2">
                            <div 
                              className="bg-purple-600 h-2 rounded-full"
                              style={{ width: `${(task.filled_slots / task.total_slots) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-300">{task.filled_slots}/{task.total_slots}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-xs">
                        {new Date(task.deadline).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center space-x-2">
                        <Button
                          onClick={() => {
                            setSelectedTask(task);
                            setShowDetails(true);
                          }}
                          size="sm"
                          variant="outline"
                          className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => removeTask(task.id)}
                          size="sm"
                          variant="outline"
                          className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Task Detail Modal */}
        {showDetails && selectedTask && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="bg-slate-800 border-slate-700 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-white mb-6">{selectedTask.title}</h2>

                <div className="space-y-4">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Category</p>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold inline-block ${getCategoryColor(selectedTask.category)}`}>
                        {selectedTask.category}
                      </span>
                    </div>
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Status</p>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold inline-block ${getStatusColor(selectedTask.status)}`}>
                        {selectedTask.status}
                      </span>
                    </div>
                  </div>

                  {/* Employer and Reward */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Employer</p>
                      <p className="text-white font-semibold">{selectedTask.employer_username}</p>
                    </div>
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Reward per Worker</p>
                      <p className="text-white font-semibold">{Number(selectedTask.reward_per_worker || 0).toFixed(2)} π</p>
                    </div>
                  </div>

                  {/* Slots and Deadline */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Total Slots</p>
                      <p className="text-2xl font-bold text-white">{selectedTask.total_slots}</p>
                    </div>
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Filled</p>
                      <p className="text-2xl font-bold text-purple-400">{selectedTask.filled_slots}</p>
                    </div>
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Remaining</p>
                      <p className="text-2xl font-bold text-green-400">{selectedTask.total_slots - selectedTask.filled_slots}</p>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Created</p>
                      <p className="text-white">{new Date(selectedTask.created_at).toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Deadline</p>
                      <p className="text-white">{new Date(selectedTask.deadline).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="bg-slate-700/30 p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-2">Description</p>
                    <p className="text-white whitespace-pre-wrap">{selectedTask.description}</p>
                  </div>

                  {/* Submissions Info */}
                  <div className="bg-slate-700/30 p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">Submissions Received</p>
                    <p className="text-2xl font-bold text-blue-400">{selectedTask.submission_count}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 space-y-2">
                  <Button
                    onClick={() => toggleFeatured(selectedTask.id)}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Feature Task
                  </Button>
                  <Button
                    onClick={() => {
                      removeTask(selectedTask.id);
                      setShowDetails(false);
                    }}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                  >
                    Remove Task
                  </Button>
                  <Button
                    onClick={() => setShowDetails(false)}
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
