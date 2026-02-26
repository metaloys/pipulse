'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { getWorkerHistoryWithEmployer } from '@/lib/database';
import type { DatabaseTaskSubmission, DatabaseTask } from '@/lib/types';
import { User, CheckCircle2, XCircle, AlertCircle, TrendingUp } from 'lucide-react';

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
  const [workerHistory, setWorkerHistory] = useState<{
    totalTasks: number;
    approved: number;
    rejected: number;
  } | null>(null);

  // Fetch worker history when modal opens or when worker/task changes
  useEffect(() => {
    if (isOpen && submission && task) {
      const fetchHistory = async () => {
        const history = await getWorkerHistoryWithEmployer(submission.workerId, task.employerId);
        setWorkerHistory(history);
      };
      fetchHistory();
    }
  }, [isOpen, submission, task]);

  const handleApprove = async () => {
    if (!submission || !task) return;
    try {
      setIsApproving(true);
      setError(null);

      // Call onApprove which calls the API endpoint
      // The endpoint handles: submission approval, worker payment, earnings update, slots update
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
                <p className="text-2xl font-bold text-primary">{task.piReward} π</p>
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
                  {new Date(submission.submittedAt).toLocaleDateString()} {new Date(submission.submittedAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </Card>

          {/* Worker History with this Employer */}
          {workerHistory && (
            <Card className="glassmorphism p-4 border-blue-500/20 bg-blue-500/5">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-300">Worker History with this Employer</p>
                  <div className="flex gap-4 mt-2 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Total Tasks</p>
                      <p className="font-bold text-foreground">{workerHistory.totalTasks}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">✅ Approved</p>
                      <p className="font-bold text-green-400">{workerHistory.approved}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">❌ Rejected</p>
                      <p className="font-bold text-red-400">{workerHistory.rejected}</p>
                    </div>
                    {workerHistory.totalTasks > 0 && (
                      <div>
                        <p className="text-muted-foreground text-xs">Approval Rate</p>
                        <p className="font-bold text-yellow-400">
                          {Math.round((workerHistory.approved / workerHistory.totalTasks) * 100)}%
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Submission Type & Status */}
          <div className="flex gap-3">
            <Badge variant="secondary" className="text-sm">
              {submissionTypeLabels[submission.submissionType?.toLowerCase()] || submissionTypeLabels[submission.submissionType]}
            </Badge>
            <Badge
              variant="outline"
              className={`text-sm ${
                submission.status === 'APPROVED'
                  ? 'bg-green-500/10 border-green-500/50 text-green-400'
                  : submission.status === 'REJECTED'
                  ? 'bg-red-500/10 border-red-500/50 text-red-400'
                  : 'border-white/10'
              }`}
            >
              {submission.status}
            </Badge>
          </div>

          {/* Proof Content */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Worker's Proof</Label>
            <div className="glassmorphism p-4 border-white/10 rounded-lg bg-muted/30 max-h-48 overflow-y-auto">
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {submission.proofContent}
              </p>
            </div>
          </div>

          {/* Rejection Reason (if rejected) */}
          {submission.status === 'REJECTED' && submission.rejectionReason && (
            <div className="space-y-3">
              <Label className="text-base font-semibold text-red-400">Rejection Reason</Label>
              <div className="glassmorphism p-4 border-red-500/50 rounded-lg bg-red-500/10 max-h-32 overflow-y-auto">
                <p className="text-sm text-red-300 whitespace-pre-wrap">
                  {submission.rejectionReason}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-xs text-blue-300">
                  💡 <strong>Note:</strong> The worker can dispute this rejection by providing additional context.
                  PiPulse admins will review disputes and make final determinations.
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

          {/* Payment Breakdown (before approval) */}
          {submission.status === 'SUBMITTED' && (
            <div className="glassmorphism p-4 rounded-lg bg-green-500/5 border border-green-500/20 space-y-3">
              <h4 className="font-semibold text-green-400">Payment Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Task Reward:</span>
                  <span className="font-semibold">{task.piReward} π</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">PiPulse Fee (15%):</span>
                  <span className="font-semibold text-orange-400">{(parseFloat(String((task.piReward || 0) * 0.15)) || 0).toFixed(2)} π</span>
                </div>
                <div className="h-px bg-white/10 my-2" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-semibold">Worker Receives:</span>
                  <span className="font-bold text-green-400">{(parseFloat(String((task.piReward || 0) * 0.85)) || 0).toFixed(2)} π</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Approving will trigger a Pi Network payment from PiPulse owner wallet to worker wallet.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          {submission.status === 'SUBMITTED' ? (
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
