'use client';

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { DatabaseTask } from '@/lib/types';
import { Clock, Users, Calendar, AlertCircle, Upload, CheckCircle } from 'lucide-react';

interface TaskSubmissionModalProps {
  isOpen: boolean;
  task: DatabaseTask | null;
  onClose: () => void;
  onSubmit: (taskId: string, proof: string, submissionType: 'TEXT' | 'PHOTO' | 'AUDIO' | 'FILE') => Promise<void>;
}

export function TaskSubmissionModal({ isOpen, task, onClose, onSubmit }: TaskSubmissionModalProps) {
  const [proofContent, setProofContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get proof type from task (employer's requirement)
  const requiredProofType = (task?.proofType || 'TEXT') as 'TEXT' | 'PHOTO' | 'AUDIO' | 'FILE';

  const getProofTypeLabel = (type: string) => {
    switch (type) {
      case 'TEXT':
        return '📝 Text Description';
      case 'PHOTO':
        return '📸 Photo Upload';
      case 'AUDIO':
        return '🎙️ Audio Upload';
      case 'FILE':
        return '📄 File Upload';
      default:
        return type;
    }
  };

  const getFileAccept = (type: string) => {
    switch (type) {
      case 'PHOTO':
        return 'image/*';
      case 'AUDIO':
        return 'audio/*';
      case 'FILE':
        return '.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv';
      default:
        return '*/*';
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      setFileName(file.name);

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      // Validate file type
      if (requiredProofType === 'PHOTO' && !file.type.startsWith('image/')) {
        setError('Please upload a valid image file');
        return;
      }
      if (requiredProofType === 'AUDIO' && !file.type.startsWith('audio/')) {
        setError('Please upload a valid audio file');
        return;
      }

      // Convert file to base64
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setProofContent(base64);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Error processing file');
    }
  };

  const handleSubmit = async () => {
    if (!task || !proofContent.trim()) {
      setError(`Please provide ${requiredProofType.toLowerCase()} proof of task completion`);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit(task.id, proofContent, requiredProofType);
      setProofContent('');
      setFileName('');
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

          {/* Required Proof Type */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Proof Type Required</Label>
              <Badge className="bg-primary/20 text-primary border-primary/50">
                {getProofTypeLabel(requiredProofType)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Employer requires {requiredProofType.toLowerCase()} proof for this task
            </p>
          </div>

          {/* Proof Input Based on Type */}
          <div className="space-y-3">
            {requiredProofType === 'TEXT' ? (
              <>
                <Label htmlFor="proof" className="text-base font-semibold">
                  📝 Describe Your Completion
                </Label>
                <Textarea
                  id="proof"
                  placeholder="Describe what you did to complete this task... Provide detailed explanation of your work."
                  value={proofContent}
                  onChange={(e) => setProofContent(e.target.value)}
                  className="min-h-40 bg-muted border-white/10 rounded-lg resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  {proofContent.length} characters | Minimum 50 characters recommended
                </p>
              </>
            ) : (
              <>
                <Label className="text-base font-semibold">
                  {getProofTypeLabel(requiredProofType)}
                </Label>
                
                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={getFileAccept(requiredProofType)}
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* File Upload Area */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                  {proofContent ? (
                    <div className="space-y-3">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                      <div>
                        <p className="text-sm font-semibold text-green-400">File Selected ✓</p>
                        <p className="text-xs text-muted-foreground mt-1 break-words max-w-xs mx-auto">
                          {fileName}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-white/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                      >
                        Change File
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
                      <div>
                        <p className="text-sm font-semibold">
                          {requiredProofType === 'PHOTO' && 'Click to upload a photo'}
                          {requiredProofType === 'AUDIO' && 'Click to upload an audio file'}
                          {requiredProofType === 'FILE' && 'Click to upload a document'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {requiredProofType === 'PHOTO' && 'Supported: JPG, PNG, GIF'}
                          {requiredProofType === 'AUDIO' && 'Supported: MP3, WAV, OGG'}
                          {requiredProofType === 'FILE' && 'Supported: PDF, DOC, DOCX, XLS, XLSX, TXT, CSV'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">Max 10MB</p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
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
