'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/admin-sidebar';
import { AdminStatsBar } from '@/components/admin-stats-bar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Eye, CheckCircle, XCircle, RefreshCw, Download } from 'lucide-react';

interface Submission {
  id: string;
  task_id: string;
  task_title: string;
  worker_username: string;
  employer_username: string;
  status: 'pending' | 'approved' | 'rejected';
  proof_type: 'text' | 'image' | 'video' | 'file';
  proof_content: string;
  proof_url?: string;
  created_at: string;
  reviewed_at?: string;
  reviewer_notes?: string;
}

interface Stats {
  totalCommission: number;
  dailyCommission: number;
  totalTransactions: number;
  totalVolume: number;
}

export default function AdminSubmissionsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [proofTypeFilter, setProofTypeFilter] = useState('all');

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

      // Fetch submissions
      const submissionsRes = await fetch('/api/admin/submissions');
      if (submissionsRes.ok) {
        const submissionsData = await submissionsRes.json();
        setSubmissions(submissionsData || []);
      }

      setError('');
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = [...submissions];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(sub =>
        sub.task_title.toLowerCase().includes(query) ||
        sub.worker_username.toLowerCase().includes(query) ||
        sub.employer_username.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(sub => sub.status === statusFilter);
    }

    // Proof type filter
    if (proofTypeFilter !== 'all') {
      result = result.filter(sub => sub.proof_type === proofTypeFilter);
    }

    // Sort by created date descending
    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setFilteredSubmissions(result);
  }, [submissions, searchQuery, statusFilter, proofTypeFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/20 text-green-400';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'rejected': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const approveSubmission = async (submissionId: string, notes = '') => {
    try {
      await fetch(`/api/admin/submissions/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, notes }),
      });
      fetchData();
      setShowDetails(false);
    } catch (err) {
      console.error('Error approving submission:', err);
    }
  };

  const rejectSubmission = async (submissionId: string, reason: string) => {
    try {
      await fetch(`/api/admin/submissions/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, reason }),
      });
      fetchData();
      setShowDetails(false);
    } catch (err) {
      console.error('Error rejecting submission:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <AdminSidebar />
      <div className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Submissions</h1>
          <p className="text-gray-400">Review and manage task submissions</p>
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
                  placeholder="Task or worker..."
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
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Proof Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Proof Type</label>
              <select
                value={proofTypeFilter}
                onChange={(e) => setProofTypeFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 text-white rounded-md focus:outline-none focus:border-purple-500"
              >
                <option value="all">All Types</option>
                <option value="text">Text</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="file">File</option>
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
                  setProofTypeFilter('all');
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
            <p className="text-gray-400 text-sm">Total Submissions</p>
            <p className="text-3xl font-bold text-white mt-2">{submissions.length}</p>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700 p-4">
            <p className="text-gray-400 text-sm">Pending Review</p>
            <p className="text-3xl font-bold text-yellow-400 mt-2">{submissions.filter(s => s.status === 'pending').length}</p>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700 p-4">
            <p className="text-gray-400 text-sm">Approved</p>
            <p className="text-3xl font-bold text-green-400 mt-2">{submissions.filter(s => s.status === 'approved').length}</p>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700 p-4">
            <p className="text-gray-400 text-sm">Rejected</p>
            <p className="text-3xl font-bold text-red-400 mt-2">{submissions.filter(s => s.status === 'rejected').length}</p>
          </Card>
        </div>

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
                    <th className="px-6 py-3 text-left font-semibold text-gray-300">Proof Type</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-300">Status</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-300">Submitted</th>
                    <th className="px-6 py-3 text-center font-semibold text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredSubmissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-slate-700/30 transition">
                      <td className="px-6 py-4 font-medium text-white truncate max-w-xs">{submission.task_title}</td>
                      <td className="px-6 py-4 text-gray-300">{submission.worker_username}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-500/20 text-blue-400 capitalize">
                          {submission.proof_type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(submission.status)}`}>
                          {submission.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-xs">
                        {new Date(submission.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center space-x-2">
                        <Button
                          onClick={() => {
                            setSelectedSubmission(submission);
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

        {/* Submission Detail Modal */}
        {showDetails && selectedSubmission && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="bg-slate-800 border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-white mb-6">Submission Details</h2>

                <div className="space-y-4">
                  {/* Task Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Task</p>
                      <p className="text-white font-semibold">{selectedSubmission.task_title}</p>
                    </div>
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Employer</p>
                      <p className="text-white font-semibold">{selectedSubmission.employer_username}</p>
                    </div>
                  </div>

                  {/* Worker Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Worker</p>
                      <p className="text-white font-semibold">{selectedSubmission.worker_username}</p>
                    </div>
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Status</p>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedSubmission.status)}`}>
                        {selectedSubmission.status}
                      </span>
                    </div>
                  </div>

                  {/* Proof Type and Date */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Proof Type</p>
                      <p className="text-white font-semibold capitalize">{selectedSubmission.proof_type}</p>
                    </div>
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Submitted</p>
                      <p className="text-white text-sm">{new Date(selectedSubmission.created_at).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Proof Content */}
                  <div className="bg-slate-700/30 p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-2">Proof Content</p>
                    <div className="bg-slate-800 p-3 rounded border border-slate-600 text-gray-300 text-sm max-h-48 overflow-y-auto whitespace-pre-wrap break-words">
                      {selectedSubmission.proof_content}
                    </div>
                    {selectedSubmission.proof_url && (
                      <p className="text-xs text-gray-500 mt-2">
                        <a href={selectedSubmission.proof_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                          View File →
                        </a>
                      </p>
                    )}
                  </div>

                  {/* Reviewer Notes (if exists) */}
                  {selectedSubmission.reviewer_notes && (
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <p className="text-sm text-gray-400 mb-2">Reviewer Notes</p>
                      <p className="text-white text-sm">{selectedSubmission.reviewer_notes}</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {selectedSubmission.status === 'pending' && (
                  <div className="mt-6 space-y-2">
                    <Button
                      onClick={() => approveSubmission(selectedSubmission.id)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve Submission
                    </Button>
                    <Button
                      onClick={() => {
                        const reason = prompt('Enter rejection reason:');
                        if (reason) {
                          rejectSubmission(selectedSubmission.id, reason);
                        }
                      }}
                      className="w-full bg-red-600 hover:bg-red-700 text-white"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject Submission
                    </Button>
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
