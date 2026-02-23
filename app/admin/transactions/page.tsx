'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/admin-sidebar';
import { AdminStatsBar } from '@/components/admin-stats-bar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Download, Eye, Copy, RefreshCw } from 'lucide-react';

interface Transaction {
  id: string;
  task_title: string;
  employer_username: string;
  worker_username: string;
  amount: number;
  pipulse_fee: number;
  blockchain_tx_id: string;
  transaction_status: 'completed' | 'pending' | 'failed';
  created_at: string;
}

interface Stats {
  totalCommission: number;
  dailyCommission: number;
  totalTransactions: number;
  totalVolume: number;
}

export default function AdminTransactionsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');

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

      // Fetch transactions
      const txRes = await fetch('/api/admin/transactions');
      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(txData || []);
      }
      
      setError('');
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = [...transactions];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(tx =>
        tx.employer_username.toLowerCase().includes(query) ||
        tx.worker_username.toLowerCase().includes(query) ||
        tx.task_title.toLowerCase().includes(query) ||
        tx.id.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(tx => tx.transaction_status === statusFilter);
    }

    // Sorting
    switch (sortBy) {
      case 'date-asc':
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'amount-desc':
        result.sort((a, b) => b.amount - a.amount);
        break;
      case 'amount-asc':
        result.sort((a, b) => a.amount - b.amount);
        break;
      case 'fee-desc':
        result.sort((a, b) => b.pipulse_fee - a.pipulse_fee);
        break;
      case 'date-desc':
      default:
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    setFilteredTransactions(result);
  }, [transactions, searchQuery, statusFilter, sortBy]);

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return;

    const headers = ['Timestamp', 'Task', 'Employer', 'Worker', 'Amount', 'Fee', 'Status', 'TxID'];
    const rows = filteredTransactions.map(tx => [
      new Date(tx.created_at).toLocaleString(),
      tx.task_title,
      tx.employer_username,
      tx.worker_username,
      Number(tx.amount || 0).toFixed(2),
      Number(tx.pipulse_fee || 0).toFixed(2),
      tx.transaction_status,
      tx.blockchain_tx_id,
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <AdminSidebar />
      <div className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Transactions</h1>
          <p className="text-gray-400">View and manage all transactions</p>
        </div>

        {/* Stats Bar */}
        <AdminStatsBar stats={stats || undefined} loading={loading} />

        {/* Filters Card */}
        <Card className="bg-slate-800/50 border-slate-700 mb-6 p-6">
          <h3 className="text-lg font-bold text-white mb-4">Filters & Search</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="ID, username, task..."
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
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 text-white rounded-md focus:outline-none focus:border-purple-500"
              >
                <option value="date-desc">Date (Newest)</option>
                <option value="date-asc">Date (Oldest)</option>
                <option value="amount-desc">Amount (High to Low)</option>
                <option value="amount-asc">Amount (Low to High)</option>
                <option value="fee-desc">Fee (High to Low)</option>
              </select>
            </div>

            {/* Export Button */}
            <div className="flex items-end gap-2">
              <Button
                onClick={handleExportCSV}
                disabled={filteredTransactions.length === 0}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button
                onClick={fetchData}
                variant="outline"
                className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Clear Filters */}
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setSortBy('date-desc');
              }}
              variant="outline"
              className="border-gray-500/50 text-gray-400 hover:bg-gray-500/10"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-slate-800/50 border-slate-700 p-4">
            <p className="text-gray-400 text-sm">Transactions</p>
            <p className="text-3xl font-bold text-white mt-2">{filteredTransactions.length}</p>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700 p-4">
            <p className="text-gray-400 text-sm">Volume</p>
            <p className="text-3xl font-bold text-white mt-2">
              {Number(filteredTransactions.reduce((sum, t) => sum + t.amount, 0) || 0).toFixed(2)} π
            </p>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700 p-4">
            <p className="text-gray-400 text-sm">Fees</p>
            <p className="text-3xl font-bold text-white mt-2">
              {Number(filteredTransactions.reduce((sum, t) => sum + t.pipulse_fee, 0) || 0).toFixed(2)} π
            </p>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <p className="text-gray-400">Loading transactions...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <p className="text-red-400">{error}</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-400">No transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-700/50 border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-gray-300">Timestamp</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-300">Task</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-300">Employer</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-300">Worker</th>
                    <th className="px-6 py-3 text-right font-semibold text-gray-300">Amount</th>
                    <th className="px-6 py-3 text-right font-semibold text-gray-300">Fee</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-300">Status</th>
                    <th className="px-6 py-3 text-center font-semibold text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-700/30 transition">
                      <td className="px-6 py-4 text-gray-300 text-xs whitespace-nowrap">
                        {new Date(tx.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-white font-medium truncate">{tx.task_title}</td>
                      <td className="px-6 py-4 text-gray-300">{tx.employer_username}</td>
                      <td className="px-6 py-4 text-gray-300">{tx.worker_username}</td>
                      <td className="px-6 py-4 text-right text-white font-semibold">{Number(tx.amount || 0).toFixed(2)} π</td>
                      <td className="px-6 py-4 text-right text-orange-400">{Number(tx.pipulse_fee || 0).toFixed(2)} π</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          tx.transaction_status === 'completed'
                            ? 'bg-green-500/20 text-green-400'
                            : tx.transaction_status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {tx.transaction_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Button
                          onClick={() => {
                            setSelectedTransaction(tx);
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

        {/* Details Modal */}
        {showDetails && selectedTransaction && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="bg-slate-800 border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-2xl font-bold text-white mb-6">Transaction Details</h3>

                <div className="space-y-4">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Task</p>
                      <p className="text-white font-semibold">{selectedTransaction.task_title}</p>
                    </div>
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Date</p>
                      <p className="text-white">{new Date(selectedTransaction.created_at).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Users */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Employer</p>
                      <p className="text-white font-semibold">{selectedTransaction.employer_username}</p>
                    </div>
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Worker</p>
                      <p className="text-white font-semibold">{selectedTransaction.worker_username}</p>
                    </div>
                  </div>

                  {/* Amounts */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Amount</p>
                      <p className="text-lg font-bold text-white">{Number(selectedTransaction.amount || 0).toFixed(2)} π</p>
                    </div>
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Fee</p>
                      <p className="text-lg font-bold text-orange-400">{Number(selectedTransaction.pipulse_fee || 0).toFixed(2)} π</p>
                    </div>
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Worker Got</p>
                      <p className="text-lg font-bold text-green-400">
                        {(Number(selectedTransaction.amount || 0) - Number(selectedTransaction.pipulse_fee || 0)).toFixed(2)} π
                      </p>
                    </div>
                  </div>

                  {/* TxID */}
                  <div className="bg-slate-700/30 p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-2">Blockchain TxID</p>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-mono text-sm break-all">{selectedTransaction.blockchain_tx_id}</p>
                      <Button
                        onClick={() => copyToClipboard(selectedTransaction.blockchain_tx_id)}
                        size="sm"
                        variant="ghost"
                        className="text-blue-400 hover:bg-blue-500/20"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="bg-slate-700/30 p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-2">Status</p>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold inline-block ${
                      selectedTransaction.transaction_status === 'completed'
                        ? 'bg-green-500/20 text-green-400'
                        : selectedTransaction.transaction_status === 'pending'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {selectedTransaction.transaction_status}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    setShowDetails(false);
                    setSelectedTransaction(null);
                  }}
                  className="w-full mt-6 bg-slate-700 hover:bg-slate-600 text-white"
                >
                  Close
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Results Count */}
        <div className="mt-4 text-sm text-gray-400">
          Showing {filteredTransactions.length} of {transactions.length} transactions
        </div>
      </div>
    </div>
  );
}
