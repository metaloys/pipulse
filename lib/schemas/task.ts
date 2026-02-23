/**
 * Task Validation Schemas
 * Zod schemas for type-safe validation of task-related inputs
 * Used in task router and API endpoints
 */

import { z } from 'zod'

/**
 * Schema for task categories
 * Matches database enum exactly
 */
export const taskCategorySchema = z.enum([
  'APP_TESTING',
  'SURVEY',
  'TRANSLATION',
  'AUDIO_RECORDING',
  'PHOTO_CAPTURE',
  'CONTENT_REVIEW',
  'DATA_LABELING',
])

export type TaskCategory = z.infer<typeof taskCategorySchema>

/**
 * Schema for proof types
 * How workers submit their work
 */
export const proofTypeSchema = z.enum([
  'TEXT',
  'PHOTO',
  'AUDIO',
  'FILE',
])

export type ProofType = z.infer<typeof proofTypeSchema>

/**
 * Schema for task status
 */
export const taskStatusSchema = z.enum([
  'AVAILABLE',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
])

export type TaskStatus = z.infer<typeof taskStatusSchema>

/**
 * Schema for creating a new task
 * Used by employers posting tasks
 */
export const createTaskSchema = z.object({
  title: z.string().min(10).max(100).describe('Task title'),
  description: z.string().min(20).describe('Detailed description'),
  instructions: z.string().min(20).describe('Step-by-step instructions'),
  category: taskCategorySchema,
  proofType: proofTypeSchema,
  piReward: z.number().positive().describe('π reward amount'),
  timeEstimate: z.number().positive().describe('Estimated minutes to complete'),
  deadline: z.date().describe('Task deadline'),
  slotsAvailable: z.number().positive().describe('Number of workers needed'),
})

export type CreateTaskInput = z.infer<typeof createTaskSchema>
