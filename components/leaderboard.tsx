'use client';

import { Card } from '@/components/ui/card';
import type { LeaderboardEntry } from '@/lib/types';
import { Trophy, Medal, Award } from 'lucide-react';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
}

export function Leaderboard({ entries }: LeaderboardProps) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-700" />;
      default:
        return <div className="w-5 h-5 flex items-center justify-center text-xs font-bold text-muted-foreground">{rank}</div>;
    }
  };

  return (
    <Card className="glassmorphism p-5 border-white/10">
      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-primary" />
        Top Earners
      </h3>
      <div className="space-y-3">
        {entries.map((entry) => (
          <div
            key={entry.rank}
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="shrink-0">{getRankIcon(entry.rank)}</div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground truncate">
                {entry.username}
              </p>
              <p className="text-xs text-muted-foreground">
                {entry.tasksCompleted} tasks
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-sm text-primary">
                {entry.earnings.toFixed(1)} π
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
