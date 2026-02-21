'use client';

import { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { DatabaseDispute, DatabaseTask, DatabaseUser } from '@/lib/types';
import { 
  getPendingDisputes, 
  resolveDispute,
  getTaskById,
  getUserById,
} from '@/lib/database';
import { toast } from 'sonner';

interface AdminDisputesPanelProps {
  adminId: string;
}

export function AdminDisputesPanel({ adminId }: AdminDisputesPanelProps) {
  const [disputes, setDisputes] = useState<DatabaseDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<DatabaseDispute | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [resolving, setResolving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [ruling, setRuling] = useState<'in_favor_of_worker' | 'in_favor_of_employer' | null>(null);
  const [taskDetails, setTaskDetails] = useState<DatabaseTask | null>(null);
  const [workerDetails, setWorkerDetails] = useState<DatabaseUser | null>(null);

  // Load pending disputes on mount
  useEffect(() => {
    loadDisputes();
  }, []);

  // Load task and worker details when dispute is selected
  useEffect(() => {
    if (selectedDispute) {
      loadDisputeDetails();
    }
  }, [selectedDispute]);

  const loadDisputes = async () => {
    try {
      setLoading(true);
      const pending = await getPendingDisputes();
      setDisputes(pending);
    } catch (error) {
      console.error('Error loading disputes:', error);
      toast.error('Failed to load disputes');
    } finally {
      setLoading(false);
    }
  };

  const loadDisputeDetails = async () => {
    if (!selectedDispute) return;

    try {
      const [task, worker] = await Promise.all([
        getTaskById(selectedDispute.task_id),
        getUserById(selectedDispute.worker_id),
      ]);
      setTaskDetails(task);
      setWorkerDetails(worker);
    } catch (error) {
      console.error('Error loading dispute details:', error);
      toast.error('Failed to load dispute details');
    }
  };

  const handleResolveDispute = async () => {
    if (!selectedDispute || !ruling) return;

    try {
      setResolving(true);

      await resolveDispute(
        selectedDispute.id,
        ruling,
        adminNotes || 'No notes provided',
        adminId
      );

      toast.success(`Dispute resolved: ${ruling === 'in_favor_of_worker' ? 'Worker' : 'Employer'} wins`);

      // Refresh disputes list
      await loadDisputes();

      // Reset form
      setSelectedDispute(null);
      setAdminNotes('');
      setRuling(null);
      setShowConfirm(false);
    } catch (error) {
      console.error('Error resolving dispute:', error);
      toast.error('Failed to resolve dispute');
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return (
      <Card className="glassmorphism border-white/10 p-6">
        <div className="text-center text-white/60">Loading disputes...</div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Disputes Overview */}
      <Card className="glassmorphism border-white/10 p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Pending Disputes</h2>
          <Badge variant="default" className="bg-amber-600">
            {disputes.length}
          </Badge>
        </div>

        {disputes.length === 0 ? (
          <div className="text-center py-8 text-white/60">
            No pending disputes - all clear! ✓
          </div>
        ) : (
          <div className="space-y-3">
            {disputes.map((dispute) => (
              <div
                key={dispute.id}
                className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all cursor-pointer"
                onClick={() => setSelectedDispute(dispute)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-white mb-1">
                      Task: {taskDetails?.title || 'Loading...'}
                    </div>
                    <div className="text-sm text-white/60 mb-2">
                      Worker: {workerDetails?.username || dispute.worker_id.slice(0, 8)}...
                    </div>
                    <div className="text-sm text-white/50 line-clamp-2">
                      {dispute.dispute_reason}
                    </div>
                  </div>
                  <Badge 
                    variant="outline" 
                    className="ml-2 border-amber-500/50 text-amber-300 whitespace-nowrap"
                  >
                    {dispute.pi_amount_in_dispute} π
                  </Badge>
                </div>
                <div className="mt-3 text-xs text-white/40">
                  {new Date(dispute.created_at).toLocaleDateString()} at {new Date(dispute.created_at).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Dispute Details & Resolution */}
      {selectedDispute && (
        <Card className="glassmorphism border-blue-500/30 p-6 bg-blue-500/5">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white mb-4">Dispute Details</h3>

            {/* Task Info */}
            <div className="mb-6 p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="text-sm text-white/60 mb-1">Task</div>
              <div className="text-white font-medium">
                {taskDetails?.title || 'Loading...'}
              </div>
              <div className="text-sm text-white/50 mt-2">
                Reward: {selectedDispute.pi_amount_in_dispute} π
              </div>
            </div>

            {/* Worker Info */}
            <div className="mb-6 p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="text-sm text-white/60 mb-1">Worker</div>
              <div className="text-white font-medium">
                {workerDetails?.username || selectedDispute.worker_id}
              </div>
              <div className="text-sm text-white/50 mt-2">
                Email: {workerDetails?.email || 'N/A'}
              </div>
            </div>

            {/* Original Rejection Reason */}
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
              <div className="text-sm text-red-300 mb-2">Original Rejection Reason</div>
              <div className="text-white">
                {selectedDispute.original_rejection_reason || 'No reason provided'}
              </div>
            </div>

            {/* Worker's Dispute Explanation */}
            <div className="mb-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <div className="text-sm text-amber-300 mb-2">Worker's Dispute Explanation</div>
              <div className="text-white">
                {selectedDispute.dispute_reason}
              </div>
            </div>

            {/* Admin Notes */}
            <div className="mb-6">
              <label className="text-sm text-white/60 mb-2 block">
                Admin Notes (Required)
              </label>
              <Textarea
                placeholder="Explain your ruling decision..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="min-h-24 bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
            </div>

            {/* Ruling Buttons */}
            <div className="mb-6">
              <div className="text-sm text-white/60 mb-3">Make a Ruling</div>
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setRuling('in_favor_of_worker');
                    setShowConfirm(true);
                  }}
                  className={`flex-1 ${
                    ruling === 'in_favor_of_worker'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-green-600/30 hover:bg-green-600/40'
                  } text-white`}
                  disabled={resolving}
                >
                  ✓ Worker Wins
                </Button>
                <Button
                  onClick={() => {
                    setRuling('in_favor_of_employer');
                    setShowConfirm(true);
                  }}
                  className={`flex-1 ${
                    ruling === 'in_favor_of_employer'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-red-600/30 hover:bg-red-600/40'
                  } text-white`}
                  disabled={resolving}
                >
                  ✗ Employer Wins
                </Button>
              </div>
            </div>

            {/* Close Button */}
            <Button
              onClick={() => {
                setSelectedDispute(null);
                setAdminNotes('');
                setRuling(null);
              }}
              variant="outline"
              className="w-full border-white/10 text-white hover:bg-white/5"
              disabled={resolving}
            >
              Close
            </Button>
          </div>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="bg-gray-950 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Confirm Dispute Ruling</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              {ruling === 'in_favor_of_worker'
                ? `You are ruling in favor of the worker. The worker will receive ${selectedDispute?.pi_amount_in_dispute} π for this task.`
                : `You are confirming the employer's rejection. The worker will not receive payment for this task.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4 p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="text-sm text-white/60 mb-2">Admin Notes</div>
            <div className="text-white text-sm">{adminNotes || '(No notes provided)'}</div>
          </div>
          <div className="flex gap-3">
            <AlertDialogCancel 
              className="border-white/10 text-white hover:bg-white/5"
              onClick={() => setRuling(null)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResolveDispute}
              disabled={resolving || !adminNotes.trim()}
              className={`${
                ruling === 'in_favor_of_worker'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {resolving ? 'Resolving...' : 'Confirm Ruling'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
