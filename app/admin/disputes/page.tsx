'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/admin-sidebar';
import { AdminStatsBar } from '@/components/admin-stats-bar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Eye, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface Dispute {
  id: string;
  task_id: string;
  task_title: string;
  complainant_username: string;
  respondent_username: string;
  dispute_type: 'quality' | 'non_payment' | 'non_delivery' | 'misconduct' | 'other';
  reason: string;
  status: 'open' | 'in_review' | 'resolved' | 'dismissed';
  resolution?: string;
  admin_decision?: 'complainant_win' | 'respondent_win' | 'split' | 'dismissed';
  created_at: string;
  resolved_at?: string;
  admin_notes?: string;
}

interface Stats {
  totalCommission: number;
  dailyCommission: number;
  totalTransactions: number;
  totalVolume: number;
}

export default function AdminDisputesPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [filteredDisputes, setFilteredDisputes] = useState<Dispute[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

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

      // Fetch disputes
      const disputesRes = await fetch('/api/admin/disputes');
      if (disputesRes.ok) {
        const disputesData = await disputesRes.json();
        setDisputes(disputesData || []);
      }

      setError('');
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load disputes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = [...disputes];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(d =>
        d.task_title.toLowerCase().includes(query) ||
        d.complainant_username.toLowerCase().includes(query) ||
        d.respondent_username.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(d => d.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter(d => d.dispute_type === typeFilter);
    }

    // Sort by created date descending
    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setFilteredDisputes(result);
  }, [disputes, searchQuery, statusFilter, typeFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-500/20 text-red-400';
      case 'in_review': return 'bg-yellow-500/20 text-yellow-400';
      case 'resolved': return 'bg-green-500/20 text-green-400';
      case 'dismissed': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'quality': 'bg-orange-500/20 text-orange-400',
      'non_payment': 'bg-red-500/20 text-red-400',
      'non_delivery': 'bg-pink-500/20 text-pink-400',
      'misconduct': 'bg-purple-500/20 text-purple-400',
      'other': 'bg-blue-500/20 text-blue-400',
    };
    return colors[type] || 'bg-gray-500/20 text-gray-400';
  };

  const resolveDispute = async (submissionId: string, decision: string, notes: string) => {
    try {
      await fetch(`/api/admin/disputes/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disputeId: submissionId, decision, notes }),
      });
      fetchData();
      setShowDetails(false);
    } catch (err) {
      console.error('Error resolving dispute:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <AdminSidebar />
      <div className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Disputes</h1>
          <p className="text-gray-400">Review and resolve user disputes</p>
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
                  placeholder="Task or user..."
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
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in_review">In Review</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 text-white rounded-md focus:outline-none focus:border-purple-500"
              >
                <option value="all">All Types</option>
                <option value="quality">Quality Issue</option>
                <option value="non_payment">Non-Payment</option>
                <option value="non_delivery">Non-Delivery</option>
                <option value="misconduct">Misconduct</option>
                <option value="other">Other</option>
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
                  setStatusFilter('all');
                  setTypeFilter('all');
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
            <p className="text-gray-400 text-sm">Total Disputes</p>
            <p className="text-3xl font-bold text-white mt-2">{disputes.length}</p>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700 p-4">
            <p className="text-gray-400 text-sm">Open</p>
            <p className="text-3xl font-bold text-red-400 mt-2">{disputes.filter(d => d.status === 'open').length}</p>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700 p-4">
            <p className="text-gray-400 text-sm">In Review</p>
            <p className="text-3xl font-bold text-yellow-400 mt-2">{disputes.filter(d => d.status === 'in_review').length}</p>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700 p-4">
            <p className="text-gray-400 text-sm">Resolved</p>
            <p className="text-3xl font-bold text-green-400 mt-2">{disputes.filter(d => d.status === 'resolved').length}</p>
          </Card>
        </div>

        {/* Disputes Table */}
        <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <p className="text-gray-400">Loading disputes...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <p className="text-red-400">{error}</p>
            </div>
          ) : filteredDisputes.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-400">No disputes found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-700/50 border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-gray-300">Task</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-300">Complainant</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-300">Respondent</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-300">Type</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-300">Status</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-300">Filed</th>
                    <th className="px-6 py-3 text-center font-semibold text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredDisputes.map((dispute) => (
                    <tr key={dispute.id} className="hover:bg-slate-700/30 transition">
                      <td className="px-6 py-4 font-medium text-white truncate max-w-xs">{dispute.task_title}</td>
                      <td className="px-6 py-4 text-gray-300">{dispute.complainant_username}</td>
                      <td className="px-6 py-4 text-gray-300">{dispute.respondent_username}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(dispute.dispute_type)}`}>
                          {dispute.dispute_type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(dispute.status)}`}>
                          {dispute.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-xs">
                        {new Date(dispute.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-center space-x-2">
                        <Button
                          onClick={() => {
                            setSelectedDispute(dispute);
                            setShowDetails(true);
                          }}
                          size="sm"
                          variant="outline"
                          className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Dispute Detail Modal */}
        {showDetails && selectedDispute && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="bg-slate-800 border-slate-700 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-white mb-6">Dispute Details</h2>

                <div className="space-y-4">
                  {/* Task Info */}
                  <div className="bg-slate-700/30 p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-2">Task</p>
                    <p className="text-white font-semibold">{selectedDispute.task_title}</p>
                  </div>

                  {/* Parties */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Complainant</p>
                      <p className="text-white font-semibold">{selectedDispute.complainant_username}</p>
                    </div>
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Respondent</p>
                      <p className="text-white font-semibold">{selectedDispute.respondent_username}</p>
                    </div>
                  </div>

                  {/* Type and Status */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Dispute Type</p>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(selectedDispute.dispute_type)}`}>
                        {selectedDispute.dispute_type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Status</p>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedDispute.status)}`}>
                        {selectedDispute.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="bg-slate-700/30 p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-2">Complaint Reason</p>
                    <p className="text-white">{selectedDispute.reason}</p>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Filed</p>
                      <p className="text-white text-sm">{new Date(selectedDispute.created_at).toLocaleString()}</p>
                    </div>
                    {selectedDispute.resolved_at && (
                      <div className="bg-slate-700/30 p-4 rounded-lg">
                        <p className="text-sm text-gray-400 mb-1">Resolved</p>
                        <p className="text-white text-sm">{new Date(selectedDispute.resolved_at).toLocaleString()}</p>
                      </div>
                    )}
                  </div>

                  {/* Admin Notes (if resolved) */}
                  {selectedDispute.admin_notes && (
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <p className="text-sm text-gray-400 mb-2">Admin Notes</p>
                      <p className="text-white">{selectedDispute.admin_notes}</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {selectedDispute.status === 'open' || selectedDispute.status === 'in_review' ? (
                  <div className="mt-6 space-y-2">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-300">Decision</label>
                      <select
                        id="decision"
                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 text-white rounded-md focus:outline-none focus:border-purple-500"
                      >
                        <option value="complainant_win">Award to Complainant</option>
                        <option value="respondent_win">Award to Respondent</option>
                        <option value="split">Split Resolution</option>
                        <option value="dismissed">Dismiss Dispute</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-300">Notes</label>
                      <textarea
                        id="notes"
                        placeholder="Enter resolution notes..."
                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 text-white rounded-md focus:outline-none focus:border-purple-500 h-20 resize-none"
                      />
                    </div>
                    <Button
                      onClick={() => {
                        const decision = (document.getElementById('decision') as HTMLSelectElement)?.value || 'dismissed';
                        const notes = (document.getElementById('notes') as HTMLTextAreaElement)?.value || '';
                        if (notes.trim()) {
                          resolveDispute(selectedDispute.id, decision, notes);
                        }
                      }}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Resolve Dispute
                    </Button>
                  </div>
                ) : (
                  <div className="mt-6 bg-slate-700/30 p-4 rounded-lg text-center">
                    <p className="text-gray-300">This dispute has been resolved</p>
                  </div>
                )}

                <Button
                  onClick={() => setShowDetails(false)}
                  className="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-white"
                >
                  Close
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
