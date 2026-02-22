'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, Eye, CheckCircle, XCircle } from 'lucide-react';

interface Submission {
  id: string;
  task_id: string;
  task_title?: string;
  worker_id: string;
  worker_username?: string;
  status: string;
  proof_content: string;
  created_at: string;
  reviewed_at?: string;
  reviewer_notes?: string;
}

interface ProofModalData {
  submission: Submission;
  isOpen: boolean;
}

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [proofModal, setProofModal] = useState<ProofModalData>({ submission: null as any, isOpen: false });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Check authentication
  useEffect(() => {
    const stored = sessionStorage.getItem('adminAuthenticated');
    if (stored !== 'true') {
      window.location.href = '/admin';
    }
  }, []);

  // Load submissions
  useEffect(() => {
    const loadSubmissions = async () => {
      try {
        const response = await fetch('/api/admin/submissions');
        if (!response.ok) throw new Error('Failed to load submissions');

        const data = await response.json();
        setSubmissions(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadSubmissions();
  }, []);

  // Filter submissions
  useEffect(() => {
    let filtered = submissions;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.id.toLowerCase().includes(query) ||
        s.task_id.toLowerCase().includes(query) ||
        s.task_title?.toLowerCase().includes(query) ||
        s.worker_username?.toLowerCase().includes(query)
      );
    }

    setFilteredSubmissions(filtered);
  }, [submissions, searchQuery, statusFilter]);

  const handleApproveSubmission = async (submissionId: string) => {
    setActionLoading(submissionId);
    try {
      const response = await fetch('/api/admin/submissions/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId }),
      });

      if (!response.ok) throw new Error('Failed to approve submission');

      setSubmissions(submissions.map(s =>
        s.id === submissionId ? { ...s, status: 'approved' } : s
      ));
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectSubmission = async (submissionId: string) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    setActionLoading(submissionId);
    try {
      const response = await fetch('/api/admin/submissions/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, reason }),
      });

      if (!response.ok) throw new Error('Failed to reject submission');

      setSubmissions(submissions.map(s =>
        s.id === submissionId ? { ...s, status: 'rejected', reviewer_notes: reason } : s
      ));
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
              <h1 className="text-2xl font-bold text-white">Submissions</h1>
              <p className="text-sm text-gray-400">Review and manage task submissions</p>
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
                  placeholder="Search by submission, task, or worker..."
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
                <option value="pending">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Stats */}
            <div className="flex items-end">
              <Card className="bg-purple-500/20 border-purple-500/50 w-full p-3">
                <p className="text-sm text-gray-300">Total Submissions: <span className="font-bold text-white">{submissions.length}</span></p>
              </Card>
            </div>
          </div>
        </Card>

        {/* Submissions Table */}
        <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <p className="text-gray-400">Loading submissions...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <p className="text-red-400">{error}</p>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-400">No submissions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-700/50 border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-gray-300">Task</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-300">Worker</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-300">Status</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-300">Submitted</th>
                    <th className="px-6 py-3 text-center font-semibold text-gray-300">Proof</th>
                    <th className="px-6 py-3 text-center font-semibold text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredSubmissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-slate-700/30 transition">
                      <td className="px-6 py-4">
                        <div className="text-gray-300 font-medium max-w-xs truncate">{submission.task_title}</div>
                        <div className="text-xs text-gray-500 font-mono">{submission.task_id.slice(0, 8)}...</div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        <div className="text-sm font-medium">{submission.worker_username}</div>
                        <div className="text-xs text-gray-500 font-mono">{submission.worker_id.slice(0, 8)}...</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          submission.status === 'approved'
                            ? 'bg-green-500/20 text-green-400'
                            : submission.status === 'rejected'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {submission.status === 'pending' ? 'Pending Review' : submission.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-xs">
                        {new Date(submission.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Button
                          onClick={() => setProofModal({ submission, isOpen: true })}
                          size="sm"
                          variant="outline"
                          className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {submission.status === 'pending' && (
                            <>
                              <Button
                                onClick={() => handleApproveSubmission(submission.id)}
                                disabled={actionLoading === submission.id}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                {actionLoading === submission.id ? 'Processing...' : <CheckCircle className="w-3 h-3" />}
                              </Button>
                              <Button
                                onClick={() => handleRejectSubmission(submission.id)}
                                disabled={actionLoading === submission.id}
                                size="sm"
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                {actionLoading === submission.id ? 'Processing...' : <XCircle className="w-3 h-3" />}
                              </Button>
                            </>
                          )}
                          {submission.status !== 'pending' && (
                            <span className="text-xs text-gray-500">Already {submission.status}</span>
                          )}
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
          Showing {filteredSubmissions.length} of {submissions.length} submissions
        </div>
      </div>

      {/* Proof Modal */}
      {proofModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="bg-slate-800 border-slate-700 max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Submission Proof</h2>
                <Button
                  onClick={() => setProofModal({ ...proofModal, isOpen: false })}
                  variant="outline"
                  className="text-gray-400"
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400 mb-2">Task</p>
                  <p className="text-white font-medium">{proofModal.submission?.task_title}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-400 mb-2">Worker</p>
                  <p className="text-white font-medium">{proofModal.submission?.worker_username}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-400 mb-2">Proof Content</p>
                  <div className="bg-slate-700/50 p-4 rounded border border-slate-600 text-gray-300 text-sm whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
                    {proofModal.submission?.proof_content || 'No proof provided'}
                  </div>
                </div>

                {proofModal.submission?.status !== 'pending' && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Reviewer Notes</p>
                    <p className="text-white text-sm">{proofModal.submission?.reviewer_notes || 'N/A'}</p>
                  </div>
                )}
              </div>

              <Button
                onClick={() => setProofModal({ ...proofModal, isOpen: false })}
                className="w-full mt-6 bg-purple-600 hover:bg-purple-700 text-white"
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
