'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SubmissionReviewModal } from '@/components/submission-review-modal';
import { TaskManagement } from '@/components/task-management';
import { CreateTaskModal } from '@/components/create-task-modal';
import {
  getTaskSubmissions,
  getTaskById,
  getUserById,
  approveSubmission,
  rejectSubmission,
  createTransaction,
  updateTask,
  getTasksByEmployer,
} from '@/lib/database';
import type { DatabaseTaskSubmission, DatabaseTask, DatabaseUser } from '@/lib/types';
import { Clock, CheckCircle2, XCircle, AlertCircle, LayoutGrid } from 'lucide-react';

interface EmployerDashboardProps {
  employerId: string;
  employerTasks: DatabaseTask[];
}

interface SubmissionWithDetails {
  submission: DatabaseTaskSubmission;
  task: DatabaseTask | null;
  worker: DatabaseUser | null;
}

export function EmployerDashboard({ employerId, employerTasks }: EmployerDashboardProps) {
  const [activeTab, setActiveTab] = useState<'tasks' | 'submissions'>('tasks');
  const [submissions, setSubmissions] = useState<SubmissionWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<DatabaseTaskSubmission | null>(null);
  const [selectedTask, setSelectedTask] = useState<DatabaseTask | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<DatabaseTask[]>(employerTasks);

  // Reload tasks when prop changes
  useEffect(() => {
    setTasks(employerTasks);
  }, [employerTasks]);

  useEffect(() => {
    loadSubmissions();
  }, [employerTasks]);

  const loadSubmissions = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Call new API endpoint to get all submissions for employer's tasks
      const response = await fetch(`/api/submissions?employerId=${employerId}`, {
        headers: {
          'x-user-id': employerId,
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch submissions');
      }

      const data = await response.json();
      const fetchedSubmissions = data.submissions || [];

      // Transform submissions to include task and worker data
      const allSubmissions: SubmissionWithDetails[] = [];

      // Get all tasks map for quick lookup
      const taskMap = new Map(employerTasks.map(t => [t.id, t]));

      for (const submission of fetchedSubmissions) {
        const task = taskMap.get(submission.taskId) || null;
        const worker = submission.User ? {
          id: submission.User.id,
          piUsername: submission.User.piUsername,
        } as DatabaseUser : null;

        allSubmissions.push({
          submission: submission as DatabaseTaskSubmission,
          task,
          worker,
        });
      }

      // Sort by most recent first
      allSubmissions.sort(
        (a, b) =>
          new Date(b.submission.submittedAt).getTime() -
          new Date(a.submission.submittedAt).getTime()
      );

      setSubmissions(allSubmissions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load submissions');
      console.error('Error loading submissions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenReview = (submission: DatabaseTaskSubmission, task: DatabaseTask) => {
    setSelectedSubmission(submission);
    setSelectedTask(task);
    setIsReviewModalOpen(true);
  };

  const handleApproveSubmission = async (submissionId: string) => {
    try {
      if (!selectedSubmission || !selectedTask) return;

      // Call the approve endpoint which handles all the approval logic
      const response = await fetch('/api/submissions/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          taskId: selectedTask.id,
          workerId: selectedSubmission.workerId,
          piReward: selectedTask.piReward,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve submission');
      }

      // Reload submissions
      await loadSubmissions();
      setIsReviewModalOpen(false);
    } catch (err) {
      console.error('Error approving submission:', err);
      throw err;
    }
  };

  const handleRejectSubmission = async (submissionId: string, reason: string) => {
    try {
      // Call the reject endpoint
      const response = await fetch('/api/submissions/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          reason,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject submission');
      }

      // Reload submissions
      await loadSubmissions();
      setIsReviewModalOpen(false);
    } catch (err) {
      console.error('Error rejecting submission:', err);
      throw err;
    }
  };

  const handleTasksUpdated = async () => {
    // Reload tasks from database
    const updatedTasks = await getTasksByEmployer(employerId);
    setTasks(updatedTasks);
    // Reload submissions too
    await loadSubmissions();
  };

  const pendingSubmissions = submissions.filter(
    (item) => item.submission.status === 'SUBMITTED'
  );
  const approvedSubmissions = submissions.filter(
    (item) => item.submission.status === 'APPROVED'
  );
  const rejectedSubmissions = submissions.filter(
    (item) => item.submission.status === 'REJECTED'
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-white/10">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-all duration-200 ${
            activeTab === 'tasks'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground border-b-2 border-transparent'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          My Tasks ({tasks.length})
        </button>
        <button
          onClick={() => setActiveTab('submissions')}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-all duration-200 ${
            activeTab === 'submissions'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground border-b-2 border-transparent'
          }`}
        >
          <Clock className="w-4 h-4" />
          Submissions ({submissions.length})
        </button>
      </div>

      {/* Tasks Tab Content */}
      {activeTab === 'tasks' && (
        <TaskManagement 
          tasks={tasks} 
          onTasksUpdated={handleTasksUpdated}
          employerId={employerId}
          employerUsername="employer"
          onCreateTask={() => {
            // The CreateTaskModal below will handle the opening
          }}
        />
      )}

      {/* Submissions Tab Content */}
      {activeTab === 'submissions' && (
        <div className="space-y-6">
          {error && (
            <div className="flex gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/50">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Pending Submissions Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-orange-400" />
              <h2 className="text-xl font-bold text-foreground">
                Pending Review ({pendingSubmissions.length})
              </h2>
            </div>

        {pendingSubmissions.length === 0 ? (
          <Card className="glassmorphism p-8 border-white/10 text-center">
            <p className="text-muted-foreground">No pending submissions</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {pendingSubmissions.map(({ submission, task, worker }) => (
              <Card
                key={submission.id}
                className="glassmorphism p-4 border-white/10 hover:border-primary/50 transition-all duration-300 cursor-pointer"
                onClick={() => task && handleOpenReview(submission, task)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{task?.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Worker: {worker?.piUsername || 'Unknown'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Submitted {new Date(submission.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{task?.piReward} π</p>
                    <Badge variant="outline" className="mt-2 border-orange-500/50 text-orange-400">
                      Pending
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Approved Submissions Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          <h2 className="text-xl font-bold text-foreground">
            Approved ({approvedSubmissions.length})
          </h2>
        </div>

        {approvedSubmissions.length === 0 ? (
          <Card className="glassmorphism p-8 border-white/10 text-center">
            <p className="text-muted-foreground">No approved submissions</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {approvedSubmissions.map(({ submission, task, worker }) => (
              <Card
                key={submission.id}
                className="glassmorphism p-4 border-green-500/30 hover:border-primary/50 transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{task?.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Worker: {worker?.piUsername || 'Unknown'}
                    </p>
                    <p className="text-xs text-green-400 mt-1">
                      Approved on{' '}
                      {submission.reviewedAt ? new Date(submission.reviewedAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-400">{task?.piReward} π</p>
                    <Badge className="mt-2 bg-green-500/20 border-green-500/50 text-green-400">
                      Approved
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Rejected Submissions Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <XCircle className="w-5 h-5 text-red-400" />
          <h2 className="text-xl font-bold text-foreground">
            Rejected ({rejectedSubmissions.length})
          </h2>
        </div>

        {rejectedSubmissions.length === 0 ? (
          <Card className="glassmorphism p-8 border-white/10 text-center">
            <p className="text-muted-foreground">No rejected submissions</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {rejectedSubmissions.map(({ submission, task, worker }) => (
              <Card
                key={submission.id}
                className="glassmorphism p-4 border-red-500/30 hover:border-primary/50 transition-all duration-300 cursor-pointer"
                onClick={() => task && handleOpenReview(submission, task)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{task?.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Worker: {worker?.piUsername || 'Unknown'}
                    </p>
                    {submission.rejectionReason && (
                      <p className="text-xs text-red-400 mt-1">
                        Reason: {submission.rejectionReason.substring(0, 50)}...
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">{task?.piReward} π</p>
                    <Badge className="mt-2 bg-red-500/20 border-red-500/50 text-red-400">
                      Rejected
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
        </div>
      )}

      {/* Submission Review Modal */}
      <SubmissionReviewModal
        isOpen={isReviewModalOpen}
        submission={selectedSubmission}
        task={selectedTask}
        workerUsername={submissions.find((s) => s.submission.id === selectedSubmission?.id)?.worker?.piUsername || null}
        onClose={() => setIsReviewModalOpen(false)}
        onApprove={handleApproveSubmission}
        onReject={handleRejectSubmission}
      />

      {/* Create Task Modal */}
      <CreateTaskModal
        employerId={employerId}
        employerUsername="employer"
        onTaskCreated={() => {
          handleTasksUpdated();
        }}
      />
    </div>
  );
}
