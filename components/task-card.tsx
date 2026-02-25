'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Task, DatabaseTask } from '@/lib/types';
import { Clock, Users, Calendar } from 'lucide-react';

interface TaskCardProps {
  task: Task | DatabaseTask;
  onAccept?: (task: Task | DatabaseTask) => void;
}

const categoryIcons: Record<string, string> = {
  'app-testing': '📱',
  'survey': '📊',
  'translation': '🌐',
  'audio-recording': '🎙️',
  'photo-capture': '📸',
  'content-review': '✍️',
  'data-labeling': '🏷️',
};

const categoryLabels: Record<string, string> = {
  'app-testing': 'App Testing',
  'survey': 'Survey',
  'translation': 'Translation',
  'audio-recording': 'Audio Recording',
  'photo-capture': 'Photo Capture',
  'content-review': 'Content Review',
  'data-labeling': 'Data Labeling',
};

export function TaskCard({ task, onAccept }: TaskCardProps) {
  // Handle both old Task type and new DatabaseTask type
  const slots = 'slots' in task ? task.slots : task.slots_available;
  const slotsRemaining = 'slotsRemaining' in task ? task.slotsRemaining : task.slots_remaining;
  const piReward = 'piReward' in task ? task.piReward : task.pi_reward;
  const timeEstimate = 'timeEstimate' in task ? task.timeEstimate : task.time_estimate;
  const employerName = 'employerName' in task ? task.employerName : 'Unknown Employer';
  const createdAt = 'created_at' in task ? (task as DatabaseTask).created_at : null;
  const updatedAt = 'updated_at' in task ? (task as DatabaseTask).updated_at : null;
  
  const slotsPercentage = ((slots - slotsRemaining) / slots) * 100;

  // Check if task was recently updated (updated_at > created_at)
  const wasUpdated = updatedAt && createdAt && new Date(updatedAt) > new Date(createdAt);
  const updateHoursAgo = wasUpdated ? Math.floor((Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60)) : 0;
  const showUpdateBadge = wasUpdated && updateHoursAgo < 24; // Show badge if updated within last 24 hours

  return (
    <Card className="glassmorphism p-5 border-white/10 hover:border-primary/50 transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{categoryIcons[task.category]}</div>
          <div>
            <h3 className="font-semibold text-foreground text-base">{task.title}</h3>
            <p className="text-xs text-muted-foreground">{employerName}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">{piReward} π</div>
          <p className="text-xs text-muted-foreground">reward</p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
        {task.description}
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        <Badge variant="secondary" className="text-xs bg-secondary/50">
          {categoryLabels[task.category]}
        </Badge>
        <Badge variant="outline" className="text-xs border-white/10">
          <Clock className="w-3 h-3 mr-1" />
          {timeEstimate} min
        </Badge>
        <Badge variant="outline" className="text-xs border-white/10">
          <Users className="w-3 h-3 mr-1" />
          {slotsRemaining}/{slots} slots
        </Badge>
        {showUpdateBadge && (
          <Badge variant="outline" className="text-xs border-amber-500/50 bg-amber-500/10 text-amber-600">
            Updated {updateHoursAgo === 0 ? 'now' : `${updateHoursAgo}h ago`}
          </Badge>
        )}
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Progress</span>
          <span>{Math.round(slotsPercentage)}% filled</span>
        </div>
        <div className="w-full bg-muted rounded-full h-1.5">
          <div 
            className="bg-primary h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${slotsPercentage}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          <span>Due {new Date(task.deadline).toLocaleDateString()}</span>
        </div>
        <Button
          onClick={() => onAccept?.(task)}
          className="rounded-full bg-primary hover:bg-primary/90 text-sm px-6"
          size="sm"
        >
          Accept Task
        </Button>
      </div>
    </Card>
  );
}
