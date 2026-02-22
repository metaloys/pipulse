'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Download, Filter, Search } from 'lucide-react';

interface Transaction {
  id: string;
  sender_id: string;
  receiver_id: string;
  amount: number;
  pipulse_fee: number;
  transaction_status: string;
  pi_blockchain_txid: string;
  created_at: string;
  sender_username?: string;
  receiver_username?: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Check authentication
  useEffect(() => {
    const stored = sessionStorage.getItem('adminAuthenticated');
    if (stored !== 'true') {
      window.location.href = '/admin';
    }
  }, []);

  // Load transactions
  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const response = await fetch('/api/admin/transactions');
        if (!response.ok) throw new Error('Failed to load transactions');

        const data = await response.json();
        setTransactions(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, []);

  // Filter transactions
  useEffect(() => {
    let filtered = transactions;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.transaction_status === statusFilter);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.id.toLowerCase().includes(query) ||
        t.sender_id.toLowerCase().includes(query) ||
        t.receiver_id.toLowerCase().includes(query) ||
        t.pi_blockchain_txid.toLowerCase().includes(query) ||
        t.sender_username?.toLowerCase().includes(query) ||
        t.receiver_username?.toLowerCase().includes(query)
      );
    }

    setFilteredTransactions(filtered);
  }, [transactions, searchQuery, statusFilter]);

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return;

    const headers = ['ID', 'Sender', 'Receiver', 'Amount (π)', 'Fee (π)', 'Status', 'Date', 'Blockchain TX'];
    const rows = filteredTransactions.map(t => [
      t.id,
      t.sender_username || t.sender_id,
      t.receiver_username || t.receiver_id,
      t.amount.toFixed(2),
      t.pipulse_fee.toFixed(2),
      t.transaction_status,
      new Date(t.created_at).toLocaleString(),
      t.pi_blockchain_txid,
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
              <h1 className="text-2xl font-bold text-white">Transactions</h1>
              <p className="text-sm text-gray-400">Monitor all platform transactions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Search */}
        <Card className="bg-slate-800/50 border-slate-700 mb-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Search by ID, sender, receiver..."
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

            {/* Export Button */}
            <div className="flex items-end">
              <Button
                onClick={handleExportCSV}
                disabled={filteredTransactions.length === 0}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-slate-800/50 border-slate-700 p-4">
            <p className="text-gray-400 text-sm">Total Transactions</p>
            <p className="text-3xl font-bold text-white mt-2">{transactions.length}</p>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700 p-4">
            <p className="text-gray-400 text-sm">Total Volume</p>
            <p className="text-3xl font-bold text-white mt-2">
              {(transactions.reduce((sum, t) => sum + t.amount, 0)).toFixed(2)} π
            </p>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700 p-4">
            <p className="text-gray-400 text-sm">Total Fees Collected</p>
            <p className="text-3xl font-bold text-white mt-2">
              {(transactions.reduce((sum, t) => sum + t.pipulse_fee, 0)).toFixed(2)} π
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
                    <th className="px-6 py-3 text-left font-semibold text-gray-300">ID</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-300">From</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-300">To</th>
                    <th className="px-6 py-3 text-right font-semibold text-gray-300">Amount</th>
                    <th className="px-6 py-3 text-right font-semibold text-gray-300">Fee</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-300">Status</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-300">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-700/30 transition">
                      <td className="px-6 py-4 text-gray-300 font-mono text-xs">{tx.id.slice(0, 8)}...</td>
                      <td className="px-6 py-4 text-gray-300">
                        <div className="text-sm">{tx.sender_username || 'Unknown'}</div>
                        <div className="text-xs text-gray-500 font-mono">{tx.sender_id.slice(0, 8)}...</div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        <div className="text-sm">{tx.receiver_username || 'Unknown'}</div>
                        <div className="text-xs text-gray-500 font-mono">{tx.receiver_id.slice(0, 8)}...</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-white font-semibold">{tx.amount.toFixed(2)} π</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-orange-400">{tx.pipulse_fee.toFixed(2)} π</span>
                      </td>
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
                      <td className="px-6 py-4 text-gray-400 text-xs">
                        {new Date(tx.created_at).toLocaleString()}
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
          Showing {filteredTransactions.length} of {transactions.length} transactions
        </div>
      </div>
    </div>
  );
}
