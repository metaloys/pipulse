'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, CheckCircle, XCircle } from 'lucide-react';

interface Dispute {
  id: string;
  task_id: string;
  task_title?: string;
  complainant_id: string;
  complainant_username?: string;
  respondent_id: string;
  respondent_username?: string;
  complaint_type: string;
  reason: string;
  status: string;
  created_at: string;
  resolved_at?: string;
  admin_decision?: string;
  admin_notes?: string;
}

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [filteredDisputes, setFilteredDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [showResolutionForm, setShowResolutionForm] = useState(false);
  const [resolutionData, setResolutionData] = useState({ decision: 'dismiss', notes: '' });

  // Check authentication
  useEffect(() => {
    const stored = sessionStorage.getItem('adminAuthenticated');
    if (stored !== 'true') {
      window.location.href = '/admin';
    }
  }, []);

  // Load disputes
  useEffect(() => {
    const loadDisputes = async () => {
      try {
        const response = await fetch('/api/admin/disputes');
        if (!response.ok) throw new Error('Failed to load disputes');

        const data = await response.json();
        setDisputes(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadDisputes();
  }, []);

  // Filter disputes
  useEffect(() => {
    let filtered = disputes;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(d => d.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(d =>
        d.id.toLowerCase().includes(query) ||
        d.task_title?.toLowerCase().includes(query) ||
        d.complainant_username?.toLowerCase().includes(query) ||
        d.respondent_username?.toLowerCase().includes(query)
      );
    }

    setFilteredDisputes(filtered);
  }, [disputes, searchQuery, statusFilter]);

  const handleResolveDispute = async () => {
    if (!selectedDispute) return;

    setActionLoading(selectedDispute.id);
    try {
      const response = await fetch('/api/admin/disputes/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disputeId: selectedDispute.id,
          decision: resolutionData.decision,
          notes: resolutionData.notes,
        }),
      });

      if (!response.ok) throw new Error('Failed to resolve dispute');

      setDisputes(disputes.map(d =>
        d.id === selectedDispute.id
          ? {
              ...d,
              status: 'resolved',
              admin_decision: resolutionData.decision,
              admin_notes: resolutionData.notes,
              resolved_at: new Date().toISOString(),
            }
          : d
      ));

      setShowResolutionForm(false);
      setSelectedDispute(null);
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
              <h1 className="text-2xl font-bold text-white">Disputes</h1>
              <p className="text-sm text-gray-400">Resolve user disputes and complaints</p>
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
                  placeholder="Search by ID, task, or user..."
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
                <option value="open">Open</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            {/* Stats */}
            <div className="flex items-end">
              <Card className="bg-purple-500/20 border-purple-500/50 w-full p-3">
                <p className="text-sm text-gray-300">Total Disputes: <span className="font-bold text-white">{disputes.length}</span></p>
              </Card>
            </div>
          </div>
        </Card>

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
                      <td className="px-6 py-4">
                        <div className="text-gray-300 font-medium max-w-xs truncate">{dispute.task_title}</div>
                        <div className="text-xs text-gray-500 font-mono">{dispute.task_id.slice(0, 8)}...</div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {dispute.complainant_username}
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {dispute.respondent_username}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          dispute.complaint_type === 'quality_issue'
                            ? 'bg-orange-500/20 text-orange-400'
                            : dispute.complaint_type === 'payment_issue'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {dispute.complaint_type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          dispute.status === 'resolved'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {dispute.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-xs">
                        {new Date(dispute.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {dispute.status === 'open' ? (
                          <Button
                            onClick={() => {
                              setSelectedDispute(dispute);
                              setShowResolutionForm(true);
                            }}
                            size="sm"
                            variant="outline"
                            className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                          >
                            Resolve
                          </Button>
                        ) : (
                          <span className="text-xs text-gray-500">Resolved</span>
                        )}
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
          Showing {filteredDisputes.length} of {disputes.length} disputes
        </div>
      </div>

      {/* Resolution Modal */}
      {showResolutionForm && selectedDispute && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="bg-slate-800 border-slate-700 max-w-2xl w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">Resolve Dispute</h2>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm text-gray-400 mb-2">Dispute Details</p>
                  <div className="bg-slate-700/50 p-4 rounded border border-slate-600 text-sm text-gray-300 space-y-2">
                    <p><span className="text-gray-400">Task:</span> {selectedDispute.task_title}</p>
                    <p><span className="text-gray-400">Complainant:</span> {selectedDispute.complainant_username}</p>
                    <p><span className="text-gray-400">Respondent:</span> {selectedDispute.respondent_username}</p>
                    <p><span className="text-gray-400">Type:</span> {selectedDispute.complaint_type.replace(/_/g, ' ')}</p>
                    <p><span className="text-gray-400">Reason:</span> {selectedDispute.reason}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Admin Decision</label>
                  <select
                    value={resolutionData.decision}
                    onChange={(e) => setResolutionData({ ...resolutionData, decision: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 text-white rounded-md focus:outline-none focus:border-purple-500"
                  >
                    <option value="dismiss">Dismiss Dispute</option>
                    <option value="uphold">Uphold Complaint</option>
                    <option value="partial">Partial Resolution</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Admin Notes</label>
                  <textarea
                    value={resolutionData.notes}
                    onChange={(e) => setResolutionData({ ...resolutionData, notes: e.target.value })}
                    placeholder="Enter decision details and notes..."
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 text-white rounded-md focus:outline-none focus:border-purple-500 h-24 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleResolveDispute}
                  disabled={actionLoading === selectedDispute.id || !resolutionData.notes}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  {actionLoading === selectedDispute.id ? 'Resolving...' : 'Resolve Dispute'}
                </Button>
                <Button
                  onClick={() => setShowResolutionForm(false)}
                  variant="outline"
                  className="flex-1 border-gray-500/50 text-gray-400 hover:bg-gray-500/10"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
