'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { createTask } from '@/lib/database';
import type { TaskCategory } from '@/lib/types';

interface CreateTaskModalProps {
  employerId: string;
  employerUsername: string;
  onTaskCreated?: () => void;
}

export function CreateTaskModal({
  employerId,
  employerUsername,
  onTaskCreated,
}: CreateTaskModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'app-testing' as TaskCategory,
    piReward: '',
    slots: '',
    deadline: '',
    instructions: '',
  });

  const categories: { value: TaskCategory; label: string }[] = [
    { value: 'app-testing', label: 'App Testing' },
    { value: 'survey', label: 'Survey' },
    { value: 'translation', label: 'Translation' },
    { value: 'audio-recording', label: 'Audio Recording' },
    { value: 'photo-capture', label: 'Photo Capture' },
    { value: 'content-review', label: 'Content Review' },
    { value: 'data-labeling', label: 'Data Labeling' },
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCategoryChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      category: value as TaskCategory,
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.title.trim()) return 'Task title is required';
    if (!formData.description.trim()) return 'Task description is required';
    if (!formData.instructions.trim()) return 'Task instructions are required';
    
    const piReward = parseFloat(formData.piReward);
    if (isNaN(piReward) || piReward <= 0) return 'Pi reward must be a positive number';
    
    const slots = parseInt(formData.slots, 10);
    if (isNaN(slots) || slots <= 0) return 'Number of slots must be a positive number';
    
    if (!formData.deadline) return 'Deadline is required';
    
    const deadline = new Date(formData.deadline);
    if (deadline <= new Date()) return 'Deadline must be in the future';

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const slots = parseInt(formData.slots, 10);
      const piReward = parseFloat(formData.piReward);

      console.log('📝 Creating new task:', {
        title: formData.title,
        employer: employerUsername,
        category: formData.category,
        reward: piReward,
        slots,
      });

      const result = await createTask({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        pi_reward: piReward,
        time_estimate: 60, // Default 60 minutes
        requirements: [],
        slots_available: slots,
        slots_remaining: slots,
        deadline: new Date(formData.deadline).toISOString(),
        employer_id: employerId,
        task_status: 'available',
        instructions: formData.instructions,
      });

      if (result) {
        console.log('✅ Task created successfully:', {
          id: result.id,
          title: result.title,
          reward: result.pi_reward,
          slots: result.slots_remaining,
        });

        // Reset form
        setFormData({
          title: '',
          description: '',
          category: 'app-testing',
          piReward: '',
          slots: '',
          deadline: '',
          instructions: '',
        });

        setIsOpen(false);

        // Trigger refresh
        if (onTaskCreated) {
          onTaskCreated();
        }
      } else {
        setError('Failed to create task. Please try again.');
      }
    } catch (err) {
      console.error('Error creating task:', err);
      setError(
        err instanceof Error ? err.message : 'An error occurred while creating the task'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full bg-primary hover:bg-primary/90 px-8 gap-2">
          <Plus className="w-4 h-4" />
          Create New Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Post a task for Pioneers to complete. Set the reward and choose how many workers you need.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="e.g., Test login flow"
              value={formData.title}
              onChange={handleInputChange}
              disabled={isLoading}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Brief description of the task"
              rows={3}
              value={formData.description}
              onChange={handleInputChange}
              disabled={isLoading}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={handleCategoryChange} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <Label htmlFor="instructions">Detailed Instructions</Label>
            <Textarea
              id="instructions"
              name="instructions"
              placeholder="Step-by-step instructions for workers"
              rows={4}
              value={formData.instructions}
              onChange={handleInputChange}
              disabled={isLoading}
            />
          </div>

          {/* Pi Reward */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="piReward">Pi Reward per Worker</Label>
              <Input
                id="piReward"
                name="piReward"
                type="number"
                placeholder="e.g., 10"
                step="0.1"
                min="0"
                value={formData.piReward}
                onChange={handleInputChange}
                disabled={isLoading}
              />
            </div>

            {/* Slots */}
            <div className="space-y-2">
              <Label htmlFor="slots">Number of Workers Needed</Label>
              <Input
                id="slots"
                name="slots"
                type="number"
                placeholder="e.g., 5"
                min="1"
                value={formData.slots}
                onChange={handleInputChange}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Deadline */}
          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline</Label>
            <Input
              id="deadline"
              name="deadline"
              type="datetime-local"
              value={formData.deadline}
              onChange={handleInputChange}
              disabled={isLoading}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
