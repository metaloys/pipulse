'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Loader } from 'lucide-react';

interface StatsBarProps {
  stats?: {
    totalCommission: number;
    dailyCommission: number;
    totalTransactions: number;
    totalVolume: number;
  };
  loading?: boolean;
}

export function AdminStatsBar({ stats, loading = false }: StatsBarProps) {
  const [data, setData] = useState(stats);

  useEffect(() => {
    if (stats) {
      setData(stats);
    }
  }, [stats]);

  if (!data) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Commission All Time */}
      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-purple-500/20 p-6">
        <p className="text-sm text-gray-400 mb-2">Total Commission</p>
        <div className="flex items-center justify-between">
          <p className="text-3xl font-bold text-white">
            {loading ? (
              <Loader className="w-6 h-6 animate-spin" />
            ) : (
              `${data.totalCommission.toFixed(2)} π`
            )}
          </p>
          <div className="w-12 h-12 rounded-lg bg-purple-600/20 flex items-center justify-center">
            <span className="text-xl">📈</span>
          </div>
        </div>
      </Card>

      {/* Commission Today */}
      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-purple-500/20 p-6">
        <p className="text-sm text-gray-400 mb-2">Today's Commission</p>
        <div className="flex items-center justify-between">
          <p className="text-3xl font-bold text-white">
            {loading ? (
              <Loader className="w-6 h-6 animate-spin" />
            ) : (
              `${data.dailyCommission.toFixed(2)} π`
            )}
          </p>
          <div className="w-12 h-12 rounded-lg bg-orange-600/20 flex items-center justify-center">
            <span className="text-xl">🔥</span>
          </div>
        </div>
      </Card>

      {/* Total Transactions */}
      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-purple-500/20 p-6">
        <p className="text-sm text-gray-400 mb-2">Total Transactions</p>
        <div className="flex items-center justify-between">
          <p className="text-3xl font-bold text-white">
            {loading ? (
              <Loader className="w-6 h-6 animate-spin" />
            ) : (
              data.totalTransactions
            )}
          </p>
          <div className="w-12 h-12 rounded-lg bg-blue-600/20 flex items-center justify-center">
            <span className="text-xl">💳</span>
          </div>
        </div>
      </Card>

      {/* Total Volume */}
      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-purple-500/20 p-6">
        <p className="text-sm text-gray-400 mb-2">Total Volume</p>
        <div className="flex items-center justify-between">
          <p className="text-3xl font-bold text-white">
            {loading ? (
              <Loader className="w-6 h-6 animate-spin" />
            ) : (
              `${data.totalVolume.toFixed(2)} π`
            )}
          </p>
          <div className="w-12 h-12 rounded-lg bg-green-600/20 flex items-center justify-center">
            <span className="text-xl">💰</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
