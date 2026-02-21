'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import type { DatabaseTaskSubmission, DatabaseTask } from '@/lib/types';
import { AlertCircle, CheckCircle2, XCircle, FileText } from 'lucide-react';
import { createDispute } from '@/lib/database';

interface DisputeModalProps {
  isOpen: boolean;
  submission: DatabaseTaskSubmission | null;
  task: DatabaseTask | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DisputeModal({
  isOpen,
  submission,
  task,
  onClose,
  onSuccess,
}: DisputeModalProps) {
  const [disputeReason, setDisputeReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmitDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!submission || !task) return;
    if (!disputeReason.trim()) {
      setError('Please provide a reason for your dispute');
      return;
    }

    if (disputeReason.length < 20) {
      setError('Please provide at least 20 characters explaining your dispute');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Create the dispute
      const dispute = await createDispute({
        submission_id: submission.id,
        task_id: task.id,
        worker_id: submission.worker_id,
        employer_id: task.employer_id,
        dispute_reason: disputeReason,
        original_rejection_reason: submission.rejection_reason,
        dispute_status: 'pending',
        pi_amount_in_dispute: task.pi_reward,
      });

      if (!dispute) {
        throw new Error('Failed to create dispute');
      }

      setSuccess(true);
      setDisputeReason('');

      // Close modal after success message
      setTimeout(() => {
        onClose();
        setSuccess(false);
        onSuccess?.();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit dispute');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!submission || !task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-slate-900 border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">Appeal Submission Rejection</DialogTitle>
          <DialogDescription className="text-gray-400">
            Explain why you believe your submission meets the task requirements
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="space-y-4 py-8">
            <div className="flex justify-center">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-2">Dispute Submitted</h3>
              <p className="text-gray-400">
                Your appeal has been submitted to the PiPulse admin team for review.
              </p>
              <p className="text-sm text-gray-500 mt-3">
                You'll be notified once a decision is made.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitDispute} className="space-y-6">
            {/* Task & Submission Info */}
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-slate-800/50 border border-white/10 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-white">{task.title}</h4>
                    <p className="text-sm text-gray-400 mt-1">{task.description}</p>
                  </div>
                  <Badge className="bg-orange-500/20 text-orange-300">Disputed</Badge>
                </div>
                <div className="pt-2 border-t border-white/10 flex gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Reward Amount</p>
                    <p className="font-semibold text-white">{task.pi_reward} π</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Submitted</p>
                    <p className="text-sm text-white">
                      {new Date(submission.submitted_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Original Rejection Reason */}
              {submission.rejection_reason && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 space-y-2">
                  <label className="text-sm font-semibold text-red-400 flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    Original Rejection Reason
                  </label>
                  <p className="text-sm text-red-300 whitespace-pre-wrap">
                    {submission.rejection_reason}
                  </p>
                </div>
              )}
            </div>

            {/* Error Alert */}
            {error && (
              <Alert className="bg-red-500/10 border-red-500/50">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <AlertDescription className="text-red-400 ml-2">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Dispute Reason Input */}
            <div className="space-y-2">
              <Label className="text-white font-semibold">
                Why do you disagree with this rejection?
              </Label>
              <Textarea
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Explain why you believe your submission meets the requirements. Be specific and detailed."
                className="bg-slate-800/50 border-white/10 text-white min-h-32 resize-none"
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500">
                Minimum 20 characters ({disputeReason.length} entered)
              </p>
            </div>

            {/* Info Box */}
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-sm text-blue-300 flex gap-2">
                <FileText className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  A PiPulse admin will review your dispute and make a final decision. 
                  If approved, you'll receive the full reward ({task.pi_reward} π).
                </span>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 border-white/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !disputeReason.trim() || disputeReason.length < 20}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Dispute'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
