'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { DatabaseTask } from '@/lib/types';
import { Clock, Users, Calendar, AlertCircle } from 'lucide-react';

interface TaskSubmissionModalProps {
  isOpen: boolean;
  task: DatabaseTask | null;
  onClose: () => void;
  onSubmit: (taskId: string, proof: string, submissionType: 'text' | 'photo' | 'audio' | 'file') => Promise<void>;
}

export function TaskSubmissionModal({ isOpen, task, onClose, onSubmit }: TaskSubmissionModalProps) {
  const [submissionType, setSubmissionType] = useState<'text' | 'photo' | 'audio' | 'file'>('text');
  const [proofContent, setProofContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!task || !proofContent.trim()) {
      setError('Please provide proof of task completion');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit(task.id, proofContent, submissionType);
      setProofContent('');
      setSubmissionType('text');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit task');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit Task: {task.title}</DialogTitle>
          <DialogDescription>
            Complete the task and submit your proof below
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Task Details */}
          <div className="glassmorphism p-4 border-white/10 rounded-lg space-y-3">
            <p className="text-sm text-muted-foreground">{task.description}</p>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-primary" />
                <span>{task.time_estimate} min</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-primary" />
                <span>{task.slots_remaining}/{task.slots_available} slots</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-primary" />
                <span>{new Date(task.deadline).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10">
              <p className="text-sm font-semibold mb-2">Instructions:</p>
              <p className="text-sm text-muted-foreground">{task.instructions}</p>
            </div>

            {task.requirements && task.requirements.length > 0 && (
              <div className="pt-3 border-t border-white/10">
                <p className="text-sm font-semibold mb-2">Requirements:</p>
                <div className="flex flex-wrap gap-2">
                  {task.requirements.map((req, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs border-white/10">
                      {req}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-white/10">
              <p className="text-lg font-bold text-primary">{task.pi_reward} π Reward</p>
            </div>
          </div>

          {/* Submission Type Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Proof Type</Label>
            <div className="grid grid-cols-2 gap-3">
              {(['text', 'photo', 'audio', 'file'] as const).map((type) => (
                <Button
                  key={type}
                  variant={submissionType === type ? 'default' : 'outline'}
                  onClick={() => setSubmissionType(type)}
                  className={`rounded-lg text-sm ${
                    submissionType === type ? 'bg-primary' : 'border-white/10'
                  }`}
                >
                  {type === 'text' && '📝 Text'}
                  {type === 'photo' && '📸 Photo'}
                  {type === 'audio' && '🎙️ Audio'}
                  {type === 'file' && '📄 File'}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {submissionType === 'text' && 'Paste text or describe your completion'}
              {submissionType === 'photo' && 'Paste image URL or describe the photo'}
              {submissionType === 'audio' && 'Paste audio URL or recording details'}
              {submissionType === 'file' && 'Paste file URL or document link'}
            </p>
          </div>

          {/* Proof Input */}
          <div className="space-y-3">
            <Label htmlFor="proof" className="text-base font-semibold">
              Your Proof
            </Label>
            <Textarea
              id="proof"
              placeholder={
                submissionType === 'text'
                  ? 'Describe what you did to complete this task...'
                  : `Paste your ${submissionType} URL or link here...`
              }
              value={proofContent}
              onChange={(e) => setProofContent(e.target.value)}
              className="min-h-30 bg-muted border-white/10 rounded-lg"
            />
            <p className="text-xs text-muted-foreground">
              {proofContent.length} characters entered
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/50">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 rounded-lg border-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !proofContent.trim()}
              className="flex-1 rounded-lg bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Proof'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
