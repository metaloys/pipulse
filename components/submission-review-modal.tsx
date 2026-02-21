'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { DatabaseTaskSubmission, DatabaseTask } from '@/lib/types';
import { Clock, User, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

interface SubmissionReviewModalProps {
  isOpen: boolean;
  submission: DatabaseTaskSubmission | null;
  task: DatabaseTask | null;
  workerUsername: string | null;
  onClose: () => void;
  onApprove: (submissionId: string) => Promise<void>;
  onReject: (submissionId: string, reason: string) => Promise<void>;
}

export function SubmissionReviewModal({
  isOpen,
  submission,
  task,
  workerUsername,
  onClose,
  onApprove,
  onReject,
}: SubmissionReviewModalProps) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRejectForm, setShowRejectForm] = useState(false);

  const handleApprove = async () => {
    if (!submission) return;
    try {
      setIsApproving(true);
      setError(null);
      await onApprove(submission.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve submission');
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!submission || !rejectionReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }
    try {
      setIsRejecting(true);
      setError(null);
      await onReject(submission.id, rejectionReason);
      setRejectionReason('');
      setShowRejectForm(false);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject submission');
    } finally {
      setIsRejecting(false);
    }
  };

  if (!submission || !task) return null;

  const submissionTypeLabels: Record<string, string> = {
    'text': '📝 Text',
    'photo': '📸 Photo',
    'audio': '🎙️ Audio',
    'file': '📄 File',
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Submission</DialogTitle>
          <DialogDescription>
            Review worker submission for: {task.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Task Details */}
          <div className="glassmorphism p-4 border-white/10 rounded-lg space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-foreground">{task.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">{task.pi_reward} π</p>
                <p className="text-xs text-muted-foreground">reward</p>
              </div>
            </div>
          </div>

          {/* Worker Info */}
          <Card className="glassmorphism p-4 border-white/10">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Worker</p>
                <p className="font-semibold text-foreground">{workerUsername || 'Unknown'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Submitted</p>
                <p className="text-sm font-semibold">
                  {new Date(submission.submitted_at).toLocaleDateString()} {new Date(submission.submitted_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </Card>

          {/* Submission Type & Status */}
          <div className="flex gap-3">
            <Badge variant="secondary" className="text-sm">
              {submissionTypeLabels[submission.submission_type]}
            </Badge>
            <Badge
              variant="outline"
              className={`text-sm ${
                submission.submission_status === 'approved'
                  ? 'bg-green-500/10 border-green-500/50 text-green-400'
                  : submission.submission_status === 'rejected'
                  ? 'bg-red-500/10 border-red-500/50 text-red-400'
                  : 'border-white/10'
              }`}
            >
              {submission.submission_status.charAt(0).toUpperCase() + submission.submission_status.slice(1)}
            </Badge>
          </div>

          {/* Proof Content */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Worker's Proof</Label>
            <div className="glassmorphism p-4 border-white/10 rounded-lg bg-muted/30 max-h-48 overflow-y-auto">
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {submission.proof_content}
              </p>
            </div>
          </div>

          {/* Rejection Reason (if rejected) */}
          {submission.submission_status === 'rejected' && submission.rejection_reason && (
            <div className="space-y-3">
              <Label className="text-base font-semibold text-red-400">Rejection Reason</Label>
              <div className="glassmorphism p-4 border-red-500/50 rounded-lg bg-red-500/10 max-h-32 overflow-y-auto">
                <p className="text-sm text-red-300 whitespace-pre-wrap">
                  {submission.rejection_reason}
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/50">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          {submission.submission_status === 'pending' ? (
            <>
              {!showRejectForm ? (
                <div className="flex gap-3 pt-4 border-t border-white/10">
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectForm(true)}
                    className="flex-1 rounded-lg border-white/10"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={handleApprove}
                    disabled={isApproving}
                    className="flex-1 rounded-lg bg-primary hover:bg-primary/90"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    {isApproving ? 'Approving...' : 'Approve & Pay'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 pt-4 border-t border-white/10">
                  <div>
                    <Label htmlFor="rejection-reason" className="text-sm font-semibold">
                      Reason for Rejection
                    </Label>
                    <Textarea
                      id="rejection-reason"
                      placeholder="Explain why this submission doesn't meet the requirements..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="mt-2 min-h-24 bg-muted border-white/10 rounded-lg"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowRejectForm(false);
                        setRejectionReason('');
                      }}
                      disabled={isRejecting}
                      className="flex-1 rounded-lg border-white/10"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleReject}
                      disabled={isRejecting || !rejectionReason.trim()}
                      className="flex-1 rounded-lg bg-red-500 hover:bg-red-600"
                    >
                      {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex gap-3 pt-4 border-t border-white/10">
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full rounded-lg border-white/10"
              >
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
