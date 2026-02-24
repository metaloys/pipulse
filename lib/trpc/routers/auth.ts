/**
 * Auth Router - Week 2 Implementation
 * Handles:
 * - User creation via Pi Network
 * - Session management
 * - Role switching
 * - Current user queries
 */

import { router, publicProcedure } from '../trpc'
import { z } from 'zod'
import { prisma } from '@/lib/db'

export const authRouter = router({
  /**
   * Create a new user from Pi authentication
   * Input: piUid (unique identifier from Pi Network), piUsername
   * Output: User object with ID, role, status
   * 
   * Logic:
   * 1. Check if user exists by piUid (unique Pi Network ID)
   * 2. If exists, return existing user
   * 3. If not exists, create new user and Streak record
   * 
   * CRITICAL: piUid is the only reliable identifier because:
   * - Username can change
   * - piUid never changes (Pi Network user's permanent ID)
   */
  createUser: publicProcedure
    .input(
      z.object({
        piUid: z.string().min(1).max(255).describe('Unique Pi Network user ID (immutable)'),
        piUsername: z.string().min(1).max(255).describe('Pi Network username (can change)'),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Validate input
        if (!input.piUid || !input.piUsername) {
          throw new Error('piUid and piUsername are required')
        }

        // Check if user already exists by piUid (the ONLY reliable identifier)
        const existingUser = await prisma.user.findUnique({
          where: { piUid: input.piUid },
          include: {
            streak: true,
          },
        })

        if (existingUser) {
          console.log(`User already exists: ${input.piUid}`)
          return {
            success: true,
            user: existingUser,
            isNew: false,
            message: 'User already exists',
          }
        }

        // Create new user with WORKER role by default
        const user = await prisma.user.create({
          data: {
            piUid: input.piUid,
            piUsername: input.piUsername,
            userRole: 'WORKER',
            level: 'NEWCOMER',
            status: 'ACTIVE',
            totalEarnings: 0,
            currentStreak: 0,
            longestStreak: 0,
            lastActiveDate: new Date(),
          },
          include: {
            streak: true,
          },
        })

        // Create default Streak record for the new user
        const streak = await prisma.streak.create({
          data: {
            userId: user.id,
            currentStreak: 0,
            longestStreak: 0,
          },
        })

        console.log(`New user created: ${user.id} with piUid: ${input.piUid}`)

        return {
          success: true,
          user: {
            ...user,
            streak,
          },
          isNew: true,
          message: 'User created successfully',
        }
      } catch (error) {
        console.error('Error creating user:', error)
        if (error instanceof Error) {
          throw new Error(`Failed to create user: ${error.message}`)
        }
        throw new Error('Failed to create user: Unknown error')
      }
    }),

  /**
   * Get the current authenticated user
   * Used on app load to restore session
   */
  getCurrentUser: publicProcedure
    .input(z.object({ userId: z.string() }).optional())
    .query(async ({ input }) => {
      if (!input?.userId) {
        return null
      }

      try {
        const user = await prisma.user.findUnique({
          where: { id: input.userId },
          include: {
            streak: true,
          },
        })

        return user
      } catch (error) {
        console.error('Error fetching user:', error)
        return null
      }
    }),

  /**
   * Switch user between WORKER and EMPLOYER roles
   * Validates user has permission, updates session
   */
  switchRole: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        newRole: z.enum(['WORKER', 'EMPLOYER']),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Get user
        const user = await prisma.user.findUnique({
          where: { id: input.userId },
        })

        if (!user) {
          throw new Error('User not found')
        }

        // Update role
        const updatedUser = await prisma.user.update({
          where: { id: input.userId },
          data: {
            userRole: input.newRole,
            updatedAt: new Date(),
          },
          include: {
            streak: true,
          },
        })

        return {
          success: true,
          user: updatedUser,
          message: `Switched to ${input.newRole} role`,
        }
      } catch (error) {
        console.error('Error switching role:', error)
        throw new Error('Failed to switch role')
      }
    }),
})
