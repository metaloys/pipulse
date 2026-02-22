'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePiAuth } from '@/contexts/pi-auth-context';
import type { LeaderboardData, TopEarner, TopEmployer, RisingStar } from '@/lib/types';
import { Trophy, Medal, TrendingUp, RefreshCw, Clock } from 'lucide-react';

export function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('earners');
  const { userData } = usePiAuth();
  const userId = userData?.id;

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (userId) {
        params.append('userId', userId);
        params.append('type', activeTab === 'earners' ? 'earners' : 'employers');
      }

      const response = await fetch(`/api/leaderboard?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch leaderboard');

      const data: LeaderboardData = await response.json();
      setLeaderboard(data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setLeaderboard({
        lastUpdated: new Date().toISOString(),
        topEarners: [],
        topEmployers: [],
        risingStars: [],
        userPosition: null,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [userId, activeTab]);

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-lg shadow-yellow-500/50 text-white font-bold text-lg">
            👑
          </div>
        );
      case 2:
        return (
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 shadow-lg shadow-gray-400/50 text-white font-bold text-lg">
            🥈
          </div>
        );
      case 3:
        return (
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 shadow-lg shadow-amber-600/50 text-white font-bold text-lg">
            🥉
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted text-muted-foreground font-bold text-sm">
            {rank}
          </div>
        );
    }
  };

  const getLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'elite pioneer':
        return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'advanced':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      case 'established':
        return 'bg-gradient-to-r from-green-500 to-emerald-500';
      default:
        return 'bg-gray-500';
    }
  };

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Trophy className="w-12 h-12 text-muted-foreground/50 mb-4" />
      <p className="text-muted-foreground">
        No pioneers on the leaderboard yet.<br />
        Complete tasks to be the first!
      </p>
    </div>
  );

  const LeaderboardRow = ({ entry, isUser }: { entry: TopEarner | TopEmployer | RisingStar; isUser: boolean }) => {
    const isTopEarner = 'total_earnings' in entry;
    const isTopEmployer = 'total_pi_spent' in entry;

    return (
      <div
        className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
          isUser
            ? 'border-2 border-purple-500 bg-purple-500/10'
            : entry.rank <= 3
              ? 'bg-gradient-to-r from-muted/30 to-muted/10 border border-muted/30'
              : 'bg-muted/20 border border-muted/20 hover:bg-muted/40'
        }`}
      >
        {/* Rank Badge */}
        <div className="shrink-0">{getRankBadge(entry.rank)}</div>

        {/* Username and Level */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">
            {entry.pi_username}
          </p>
          <Badge className={`text-xs mt-1 ${getLevelColor(entry.level)} text-white border-0`}>
            {entry.level}
          </Badge>
        </div>

        {/* Stats Column */}
        <div className="text-right">
          {isTopEarner && (
            <>
              <p className="font-bold text-sm text-primary">
                {(entry as TopEarner).total_earnings.toFixed(1)} π
              </p>
              <p className="text-xs text-muted-foreground">
                {(entry as TopEarner).total_tasks_completed} tasks
              </p>
            </>
          )}
          {isTopEmployer && (
            <>
              <p className="font-bold text-sm text-primary">
                {(entry as TopEmployer).total_pi_spent.toFixed(1)} π spent
              </p>
              <p className="text-xs text-muted-foreground">
                {(entry as TopEmployer).tasks_posted} posted
              </p>
            </>
          )}
          {!isTopEarner && !isTopEmployer && (
            <>
              <p className="font-bold text-sm text-primary">
                {(entry as RisingStar).total_earnings.toFixed(1)} π
              </p>
              <p className="text-xs text-muted-foreground">
                {(entry as RisingStar).days_as_member} days old
              </p>
            </>
          )}
        </div>
      </div>
    );
  };

  if (loading && !leaderboard) {
    return (
      <Card className="glassmorphism p-6 border-white/10">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin">
            <Trophy className="w-8 h-8 text-primary" />
          </div>
        </div>
      </Card>
    );
  }

  const lastUpdated = leaderboard?.lastUpdated
    ? new Date(leaderboard.lastUpdated).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : 'now';

  return (
    <Card className="glassmorphism border-white/10 overflow-hidden">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-2xl font-bold text-foreground">Leaderboards</h2>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3" />
                Updated {lastUpdated}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLeaderboard}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="earners" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Top Earners</span>
              <span className="sm:hidden">Earners</span>
            </TabsTrigger>
            <TabsTrigger value="employers" className="flex items-center gap-2">
              <Medal className="w-4 h-4" />
              <span className="hidden sm:inline">Top Employers</span>
              <span className="sm:hidden">Employers</span>
            </TabsTrigger>
            <TabsTrigger value="rising" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Rising Stars</span>
              <span className="sm:hidden">Rising</span>
            </TabsTrigger>
          </TabsList>

          {/* Top Earners Tab */}
          <TabsContent value="earners" className="space-y-3">
            {leaderboard && leaderboard.topEarners.length > 0 ? (
              <>
                <div className="space-y-3">
                  {leaderboard.topEarners.map((earner) => (
                    <LeaderboardRow
                      key={earner.id}
                      entry={earner}
                      isUser={userId === earner.id}
                    />
                  ))}
                </div>

                {/* User Position if not in top 10 */}
                {userId && leaderboard.userPosition && !leaderboard.topEarners.find((e) => e.id === userId) && (
                  <div className="mt-6 pt-6 border-t border-muted/30">
                    <p className="text-xs text-muted-foreground text-center mb-3">Your position</p>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-purple-500/10 border-2 border-purple-500">
                      <p className="font-semibold text-purple-400">
                        #{leaderboard.userPosition.rank}
                      </p>
                      <p className="font-bold text-purple-300">
                        {leaderboard.userPosition.earnings.toFixed(1)} π earned
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <EmptyState />
            )}
          </TabsContent>

          {/* Top Employers Tab */}
          <TabsContent value="employers" className="space-y-3">
            {leaderboard && leaderboard.topEmployers.length > 0 ? (
              <>
                <div className="space-y-3">
                  {leaderboard.topEmployers.map((employer) => (
                    <LeaderboardRow
                      key={employer.id}
                      entry={employer}
                      isUser={userId === employer.id}
                    />
                  ))}
                </div>

                {/* User Position if not in top 10 */}
                {userId && leaderboard.userPosition && !leaderboard.topEmployers.find((e) => e.id === userId) && (
                  <div className="mt-6 pt-6 border-t border-muted/30">
                    <p className="text-xs text-muted-foreground text-center mb-3">Your position</p>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-purple-500/10 border-2 border-purple-500">
                      <p className="font-semibold text-purple-400">
                        #{leaderboard.userPosition.rank}
                      </p>
                      <p className="font-bold text-purple-300">
                        {leaderboard.userPosition.earnings.toFixed(1)} π spent
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <EmptyState />
            )}
          </TabsContent>

          {/* Rising Stars Tab */}
          <TabsContent value="rising" className="space-y-3">
            {leaderboard && leaderboard.risingStars.length > 0 ? (
              <>
                <div className="space-y-3">
                  {leaderboard.risingStars.map((star) => (
                    <LeaderboardRow
                      key={star.id}
                      entry={star}
                      isUser={userId === star.id}
                    />
                  ))}
                </div>

                {/* User Position if not in top 10 */}
                {userId &&
                  leaderboard.risingStars.length > 0 &&
                  !leaderboard.risingStars.find((s) => s.id === userId) &&
                  leaderboard.userPosition && (
                    <div className="mt-6 pt-6 border-t border-muted/30">
                      <p className="text-xs text-muted-foreground text-center mb-3">Your position</p>
                      <div className="flex items-center justify-between p-4 rounded-lg bg-purple-500/10 border-2 border-purple-500">
                        <p className="font-semibold text-purple-400">
                          #{leaderboard.userPosition.rank}
                        </p>
                        <p className="font-bold text-purple-300">
                          {leaderboard.userPosition.earnings.toFixed(1)} π earned
                        </p>
                      </div>
                    </div>
                  )}
              </>
            ) : (
              <EmptyState />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
}
