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
    proofType: 'TEXT' as 'TEXT' | 'PHOTO' | 'AUDIO' | 'FILE',
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

  const handleProofTypeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      proofType: value as 'TEXT' | 'PHOTO' | 'AUDIO' | 'FILE',
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.title.trim()) return 'Task title is required';
    if (!formData.description.trim()) return 'Task description is required';
    if (!formData.instructions.trim()) return 'Task instructions are required';
    
    const piReward = parseFloat(formData.piReward);
    if (isNaN(piReward) || piReward < 0.01) return 'Pi reward must be at least 0.01π';
    
    const slots = parseInt(formData.slots, 10);
    if (isNaN(slots) || slots < 1 || slots > 100) return 'Number of slots must be between 1 and 100';
    
    // Deadline is optional per requirements
    if (formData.deadline) {
      const deadline = new Date(formData.deadline);
      if (deadline <= new Date()) return 'Deadline must be in the future';
    }

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
      const escrowAmount = piReward * slots;

      console.log('💳 [STEP 1] Starting task creation with escrow payment:', {
        title: formData.title,
        employer: employerUsername,
        category: formData.category,
        proofType: formData.proofType,
        reward: piReward,
        slots,
        escrowAmount,
      });

      // STEP 1: Request Pi escrow payment
      const paymentApproved = new Promise<any>((resolve, reject) => {
        if (!window.pay) {
          console.warn('⚠️ Pi payment not available, skipping payment step');
          resolve({ identifier: 'offline-test' });
          return;
        }

        console.log('💰 [STEP 2] Initiating Pi escrow payment...');
        window.pay?.({
          amount: escrowAmount,
          memo: `PiPulse task escrow: ${formData.title}`,
          metadata: {
            type: 'task_escrow',
            title: formData.title,
            employerId: employerId,
            piReward: piReward,
            slotsCount: slots,
            category: formData.category,
          },
          onComplete: (paymentData: any) => {
            console.log('✅ [STEP 3] Pi payment approved:', paymentData);
            resolve(paymentData);
          },
          onError: (error: Error) => {
            console.error('❌ [STEP 3] Pi payment failed:', error);
            reject(error);
          },
        });
      });

      // Wait for payment to be approved
      const paymentData = await paymentApproved;

      console.log('🔐 [STEP 4] Payment approved, creating task in database...');

      // STEP 2: Call API to create task
      const response = await fetch('/api/tasks/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          proofType: formData.proofType,
          piReward,
          slotsAvailable: slots,
          deadline: formData.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          employerId,
          instructions: formData.instructions,
          paymentId: paymentData?.identifier || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create task');
      }

      console.log('✅ [STEP 5] Task created successfully:', {
        id: result.task?.id,
        title: result.task?.title,
        reward: result.task?.pi_reward,
        slots: result.task?.slots_remaining,
      });

      console.log('🎉 [STEP 6] Task posting complete!');

      // Reset form
      setFormData({
        title: '',
        description: '',
        category: 'app-testing',
        proofType: 'TEXT',
        piReward: '',
        slots: '',
        deadline: '',
        instructions: '',
      });

      setIsOpen(false);

      // Show success message
      setError(`✅ Task "${result.task?.title}" created with escrow of ${escrowAmount}π`);
      setTimeout(() => setError(null), 5000);

      // Trigger refresh
      if (onTaskCreated) {
        onTaskCreated();
      }
    } catch (err) {
      console.error('❌ Error creating task:', err);
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
          Post New Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Post New Task</DialogTitle>
          <DialogDescription>
            Create a task for Pioneers to complete. The escrow amount will be deducted when you submit.
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

          {/* Proof Type */}
          <div className="space-y-2">
            <Label htmlFor="proofType">Proof Type Required</Label>
            <Select value={formData.proofType} onValueChange={handleProofTypeChange} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TEXT">Text</SelectItem>
                <SelectItem value="PHOTO">Photo</SelectItem>
                <SelectItem value="AUDIO">Audio</SelectItem>
                <SelectItem value="FILE">File</SelectItem>
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
                placeholder="e.g., 0.1"
                step="0.01"
                min="0.01"
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
                max="100"
                value={formData.slots}
                onChange={handleInputChange}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Escrow Calculation */}
          {formData.piReward && formData.slots && (
            <div className="p-4 bg-blue-500/10 border border-blue-500/50 rounded-lg">
              <p className="text-sm text-blue-400">
                💰 <strong>Total Escrow:</strong> {(parseFloat(formData.piReward) * parseInt(formData.slots, 10)).toFixed(2)}π
              </p>
              <p className="text-xs text-blue-300 mt-1">
                ({parseFloat(formData.piReward).toFixed(2)}π × {formData.slots} workers)
              </p>
            </div>
          )}

          {/* Deadline */}
          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline <span className="text-xs text-gray-400">(optional)</span></Label>
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
