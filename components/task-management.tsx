'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateTask, deleteTask } from '@/lib/database';
import type { DatabaseTask, TaskCategory } from '@/lib/types';
import { Edit2, Trash2, Eye, AlertCircle, Clock } from 'lucide-react';

interface TaskManagementProps {
  tasks: DatabaseTask[];
  onTasksUpdated: () => void;
}

const CATEGORIES: TaskCategory[] = [
  'data-entry',
  'photo-capture',
  'video-recording',
  'writing',
  'review',
  'translation',
  'research',
  'design',
  'marketing',
  'development',
  'testing',
  'other',
];

// Calculate time remaining until deadline
function calculateTimeRemaining(deadline: string): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  formatted: string;
} {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diff = deadlineDate.getTime() - now.getTime();

  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
      formatted: 'Expired',
    };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  let formatted = '';
  if (days > 0) formatted += `${days}d `;
  if (hours > 0) formatted += `${hours}h `;
  if (minutes > 0) formatted += `${minutes}m`;
  if (!formatted) formatted = `${seconds}s`;

  return {
    days,
    hours,
    minutes,
    seconds,
    isExpired: false,
    formatted: formatted.trim(),
  };
}

export function TaskManagement({ 
  tasks, 
  onTasksUpdated,
  employerId,
  employerUsername,
  onCreateTask,
}: TaskManagementProps) {
  const [editingTask, setEditingTask] = useState<DatabaseTask | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<DatabaseTask | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewingTask, setViewingTask] = useState<DatabaseTask | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<{ [key: string]: ReturnType<typeof calculateTimeRemaining> }>({});

  // Form state for editing
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '' as TaskCategory,
    pi_reward: 0,
    slots_available: 0,
    deadline: '',
    instructions: '',
  });

  // Update countdown timers every second
  useEffect(() => {
    const updateTimers = () => {
      const newTimeRemaining: typeof timeRemaining = {};
      tasks.forEach((task) => {
        newTimeRemaining[task.id] = calculateTimeRemaining(task.deadline);
      });
      setTimeRemaining(newTimeRemaining);
    };

    updateTimers();
    const interval = setInterval(updateTimers, 1000);
    return () => clearInterval(interval);
  }, [tasks]);

  const handleEditTask = (task: DatabaseTask) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      category: task.category,
      pi_reward: task.pi_reward,
      slots_available: task.slots_available,
      deadline: task.deadline,
      instructions: task.instructions,
    });
    setIsEditModalOpen(true);
    setError(null);
  };

  const handleViewTask = (task: DatabaseTask) => {
    setViewingTask(task);
    setIsViewModalOpen(true);
  };

  const handleDeleteTask = (task: DatabaseTask) => {
    setTaskToDelete(task);
    setIsDeleteConfirmOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      if (!editingTask) return;

      // Validate form
      if (!formData.title.trim()) {
        setError('Task title is required');
        return;
      }
      if (!formData.description.trim()) {
        setError('Task description is required');
        return;
      }
      if (formData.pi_reward <= 0) {
        setError('Task reward must be positive');
        return;
      }
      if (formData.slots_available <= 0) {
        setError('Slots available must be positive');
        return;
      }
      if (new Date(formData.deadline) <= new Date()) {
        setError('Deadline must be in the future');
        return;
      }

      setIsSubmitting(true);
      setError(null);

      await updateTask(editingTask.id, {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        pi_reward: formData.pi_reward,
        slots_available: formData.slots_available,
        deadline: formData.deadline,
        instructions: formData.instructions,
      });

      console.log(`✅ Task updated successfully: ${editingTask.id}`);
      setIsEditModalOpen(false);
      setEditingTask(null);
      onTasksUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
      console.error('Error updating task:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      if (!taskToDelete) return;

      // Can only delete tasks with no submissions
      if (taskToDelete.slots_remaining < taskToDelete.slots_available) {
        setError('Cannot delete task with existing submissions');
        return;
      }

      setIsSubmitting(true);
      setError(null);

      await deleteTask(taskToDelete.id);

      console.log(`🗑️ Task deleted successfully: ${taskToDelete.id}`);
      setIsDeleteConfirmOpen(false);
      setTaskToDelete(null);
      onTasksUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
      console.error('Error deleting task:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Tasks List */}
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <Card className="glassmorphism p-8 border-white/10 text-center">
            <p className="text-muted-foreground">No tasks yet. Create one to get started!</p>
          </Card>
        ) : (
          <>
            <h3 className="font-semibold text-foreground mb-4">Your Tasks ({tasks.length})</h3>
            {tasks.map((task) => (
              <Card
                key={task.id}
                className="glassmorphism p-4 border-white/10 hover:border-primary/50 transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{task.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                    <div className="flex gap-2 mt-3 flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        {task.category}
                      </Badge>
                      <Badge variant="outline" className="text-xs border-primary/50">
                        {task.pi_reward} π
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          task.slots_remaining > 0
                            ? 'border-green-500/50 text-green-400'
                            : 'border-red-500/50 text-red-400'
                        }`}
                      >
                        {task.slots_remaining}/{task.slots_available} slots
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          task.task_status === 'available'
                            ? 'border-blue-500/50 text-blue-400'
                            : 'border-gray-500/50 text-gray-400'
                        }`}
                      >
                        {task.task_status}
                      </Badge>
                      {/* Countdown Timer Badge */}
                      {timeRemaining[task.id] && (
                        <Badge
                          variant="outline"
                          className={`text-xs flex items-center gap-1 ${
                            timeRemaining[task.id].isExpired
                              ? 'border-red-500/50 text-red-400'
                              : timeRemaining[task.id].days < 1
                              ? 'border-orange-500/50 text-orange-400'
                              : 'border-green-500/50 text-green-400'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          {timeRemaining[task.id].formatted}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleViewTask(task)}
                      className="hover:bg-blue-500/20"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditTask(task)}
                      className="hover:bg-primary/20"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteTask(task)}
                      className="hover:bg-red-500/20"
                      disabled={task.slots_remaining < task.slots_available}
                      title={
                        task.slots_remaining < task.slots_available
                          ? 'Cannot delete task with submissions'
                          : 'Delete task'
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </>
        )}
      </div>

      {/* View Task Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewingTask?.title}</DialogTitle>
            <DialogDescription>Task Details</DialogDescription>
          </DialogHeader>

          {viewingTask && (
            <div className="space-y-4">
              <div>
                <Label className="text-foreground">Description</Label>
                <p className="text-sm text-muted-foreground mt-1">{viewingTask.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-foreground">Category</Label>
                  <p className="text-sm text-muted-foreground mt-1">{viewingTask.category}</p>
                </div>
                <div>
                  <Label className="text-foreground">Reward</Label>
                  <p className="text-sm text-muted-foreground mt-1">{viewingTask.pi_reward} π</p>
                </div>
                <div>
                  <Label className="text-foreground">Available Slots</Label>
                  <p className="text-sm text-muted-foreground mt-1">{viewingTask.slots_available}</p>
                </div>
                <div>
                  <Label className="text-foreground">Remaining Slots</Label>
                  <p className="text-sm text-muted-foreground mt-1">{viewingTask.slots_remaining}</p>
                </div>
                <div>
                  <Label className="text-foreground">Status</Label>
                  <p className="text-sm text-muted-foreground mt-1">{viewingTask.task_status}</p>
                </div>
                <div>
                  <Label className="text-foreground">Deadline</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(viewingTask.deadline).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-foreground">Instructions</Label>
                <p className="text-sm text-muted-foreground mt-1">{viewingTask.instructions}</p>
              </div>

              <Button onClick={() => setIsViewModalOpen(false)} className="w-full mt-4">
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Task Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update task details and settings</DialogDescription>
          </DialogHeader>

          {error && (
            <div className="flex gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/50">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-foreground">
                Task Title *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Task title"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-foreground">
                Description *
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed task description"
                className="mt-2"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="category" className="text-foreground">
                Category *
              </Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value as TaskCategory })}>
                <SelectTrigger id="category" className="mt-2">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.replace('-', ' ').toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="reward" className="text-foreground">
                  Pi Reward *
                </Label>
                <Input
                  id="reward"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={formData.pi_reward}
                  onChange={(e) => setFormData({ ...formData, pi_reward: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="slots" className="text-foreground">
                  Slots Available *
                </Label>
                <Input
                  id="slots"
                  type="number"
                  min="1"
                  value={formData.slots_available}
                  onChange={(e) => setFormData({ ...formData, slots_available: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="deadline" className="text-foreground">
                Deadline *
              </Label>
              <Input
                id="deadline"
                type="datetime-local"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="instructions" className="text-foreground">
                Instructions
              </Label>
              <Textarea
                id="instructions"
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                placeholder="How to complete this task"
                className="mt-2"
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t border-white/10">
              <Button
                variant="ghost"
                onClick={() => setIsEditModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary/90"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task?</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>

          {error && (
            <div className="flex gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/50">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {taskToDelete && (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Task: {taskToDelete.title}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Are you sure you want to delete this task? This cannot be undone.
                </p>
              </div>

              {taskToDelete.slots_remaining < taskToDelete.slots_available && (
                <div className="flex gap-2 p-3 rounded-lg bg-orange-500/10 border border-orange-500/50">
                  <AlertCircle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-orange-400">
                    This task has {taskToDelete.slots_available - taskToDelete.slots_remaining} submission(s).
                    Please delete or archive submissions first.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-4 border-t border-white/10">
            <Button
              variant="ghost"
              onClick={() => setIsDeleteConfirmOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isSubmitting || (taskToDelete?.slots_remaining ?? 0) < (taskToDelete?.slots_available ?? 0)}
            >
              {isSubmitting ? 'Deleting...' : 'Delete Task'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
