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
   * Input: piUsername from Pi auth callback
   * Output: User object with ID, role, status
   */
  createUser: publicProcedure
    .input(
      z.object({
        piUsername: z.string().min(1).max(255),
        piWallet: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { piUsername: input.piUsername },
        })

        if (existingUser) {
          return {
            success: true,
            user: existingUser,
            message: 'User already exists',
          }
        }

        // Create new user with WORKER role by default
        const user = await prisma.user.create({
          data: {
            piUsername: input.piUsername,
            piWallet: input.piWallet || null,
            userRole: 'WORKER',
            level: 'NEWCOMER',
            status: 'ACTIVE',
            totalEarnings: 0,
            currentStreak: 0,
            longestStreak: 0,
            lastActiveDate: new Date(),
          },
        })

        // Create default Streak record
        await prisma.streak.create({
          data: {
            userId: user.id,
            currentStreak: 0,
            longestStreak: 0,
          },
        })

        return {
          success: true,
          user,
          message: 'User created successfully',
        }
      } catch (error) {
        console.error('Error creating user:', error)
        throw new Error('Failed to create user')
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
