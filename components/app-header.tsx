'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePiAuth } from '@/contexts/pi-auth-context';
import { UserCircle, Flame } from 'lucide-react';
import type { UserRole } from '@/lib/types';

interface AppHeaderProps {
  userRole: UserRole;
  onRoleSwitch: () => void;
  currentStreak?: number;
}

export function AppHeader({ userRole, onRoleSwitch, currentStreak }: AppHeaderProps) {
  const { userData } = usePiAuth();

  return (
    <header className="sticky top-0 z-50 glassmorphism border-b border-white/10 px-4 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            PiPulse
          </div>
          {currentStreak && currentStreak > 0 && (
            <Badge variant="secondary" className="bg-orange-500/20 text-orange-400 border-orange-500/30">
              <Flame className="w-3 h-3 mr-1" />
              {currentStreak} day streak
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onRoleSwitch}
            className="rounded-full border-primary/50 text-xs"
          >
            Switch to {userRole === 'worker' ? 'Employer' : 'Worker'}
          </Button>
          <div className="flex items-center gap-2">
            <UserCircle className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-foreground hidden sm:inline">
              {userData?.username || 'Pioneer'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
