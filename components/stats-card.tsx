'use client';

import { Card } from '@/components/ui/card';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
}

export function StatsCard({ label, value, icon, trend }: StatsCardProps) {
  return (
    <Card className="glassmorphism p-4 border-white/10">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {trend && (
            <p className="text-xs text-primary mt-1">{trend}</p>
          )}
        </div>
        <div className="text-primary/80 ml-4">{icon}</div>
      </div>
    </Card>
  );
}
