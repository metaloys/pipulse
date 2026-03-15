import { z } from 'zod';

/**
 * User Validation Schemas
 */
export const CreateUserSchema = z.object({
  piUid: z.string().min(1, 'Pi UID is required').max(255, 'Pi UID too long'),
  piUsername: z.string().min(1, 'Pi Username is required').max(255, 'Username too long'),
});

export const SwitchRoleSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  newRole: z.enum(['WORKER', 'EMPLOYER'], { errorMap: () => ({ message: 'Role must be WORKER or EMPLOYER' }) }),
});

export const UpdateUserSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  userRole: z.enum(['WORKER', 'EMPLOYER']).optional(),
  level: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  totalEarnings: z.number().min(0).optional(),
  totalTasksCompleted: z.number().min(0).optional(),
  currentStreak: z.number().min(0).optional(),
});

/**
 * Task Validation Schemas
 */
export const CreateTaskSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 chars').max(200, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 chars').max(2000, 'Description too long'),
  category: z.enum(['app-testing', 'survey', 'translation', 'audio-recording', 'photo-capture', 'content-review', 'data-labeling']),
  piReward: z.number().min(0.1, 'Reward must be at least 0.1 π').max(1000, 'Reward too high'),
  slotsAvailable: z.number().min(1, 'Must have at least 1 slot').max(1000, 'Too many slots'),
  estimatedDuration: z.number().min(1, 'Duration must be at least 1 minute').max(1440, 'Duration too long (max 24 hours)'),
  expiresAt: z.string().datetime(),
  employerId: z.string().uuid('Invalid employer ID'),
});

export const UpdateTaskSchema = z.object({
  taskId: z.string().uuid('Invalid task ID'),
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).max(2000).optional(),
  category: z.enum(['app-testing', 'survey', 'translation', 'audio-recording', 'photo-capture', 'content-review', 'data-labeling']).optional(),
  piReward: z.number().min(0.1).max(1000).optional(),
  slotsRemaining: z.number().min(0).optional(),
  status: z.enum(['AVAILABLE', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  estimatedDuration: z.number().min(1).max(1440).optional(),
  expiresAt: z.string().datetime().optional(),
});

export const GetTaskByIdSchema = z.object({
  taskId: z.string().uuid('Invalid task ID'),
});

/**
 * Submission Validation Schemas
 */
export const CreateSubmissionSchema = z.object({
  taskId: z.string().uuid('Invalid task ID'),
  workerId: z.string().uuid('Invalid worker ID'),
  proofContent: z.string().min(1, 'Proof content is required'),
  submissionType: z.enum(['TEXT', 'PHOTO', 'AUDIO', 'FILE']),
  submissionStatus: z.enum(['SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'REVISION_REQUESTED']).default('SUBMITTED'),
  agreedReward: z.number().min(0).optional(),
});

export const ApproveSubmissionSchema = z.object({
  submissionId: z.string().uuid('Invalid submission ID'),
  agreedReward: z.number().min(0.1, 'Agreed reward must be at least 0.1 π'),
  workerId: z.string().uuid('Invalid worker ID'),
  taskId: z.string().uuid('Invalid task ID'),
  piTransactionId: z.string().optional(),
});

export const RejectSubmissionSchema = z.object({
  submissionId: z.string().uuid('Invalid submission ID'),
  rejectionReason: z.string().min(10, 'Reason must be at least 10 chars').max(500, 'Reason too long'),
  workerId: z.string().uuid('Invalid worker ID'),
});

export const RequestRevisionSchema = z.object({
  submissionId: z.string().uuid('Invalid submission ID'),
  revisionReason: z.string().min(10, 'Reason must be at least 10 chars').max(500, 'Reason too long'),
  workerId: z.string().uuid('Invalid worker ID'),
});

/**
 * Type Exports for Runtime Validation Results
 */
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type SwitchRoleInput = z.infer<typeof SwitchRoleSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type CreateSubmissionInput = z.infer<typeof CreateSubmissionSchema>;
export type ApproveSubmissionInput = z.infer<typeof ApproveSubmissionSchema>;
export type RejectSubmissionInput = z.infer<typeof RejectSubmissionSchema>;
export type RequestRevisionInput = z.infer<typeof RequestRevisionSchema>;

/**
 * Helper Functions
 */
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ');
      return { success: false, error: messages };
    }
    return { success: false, error: 'Validation failed' };
  }
}
