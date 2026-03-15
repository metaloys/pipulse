/**
 * User Validation Schemas
 * Zod schemas for type-safe validation of user-related inputs
 * Used in auth router and API endpoints
 */

import { z } from 'zod'

/**
 * Schema for creating a new user
 * Minimal input from Pi authentication
 */
export const createUserSchema = z.object({
  piUsername: z.string().min(1).max(255).describe('Pi Network username'),
  piWallet: z.string().optional().nullable().describe('Pi wallet address'),
})

export type CreateUserInput = z.infer<typeof createUserSchema>

/**
 * Schema for user roles
 * Used when switching roles or validating permissions
 */
export const userRoleSchema = z.enum(['WORKER', 'EMPLOYER', 'ADMIN'])

export type UserRole = z.infer<typeof userRoleSchema>

/**
 * Schema for user status
 */
export const userStatusSchema = z.enum(['ACTIVE', 'BANNED', 'SUSPENDED'])

export type UserStatus = z.infer<typeof userStatusSchema>

/**
 * Schema for user levels
 * Used for reputation system
 */
export const userLevelSchema = z.enum([
  'NEWCOMER',
  'ESTABLISHED',
  'ADVANCED',
  'ELITE_PIONEER',
])

export type UserLevel = z.infer<typeof userLevelSchema>
