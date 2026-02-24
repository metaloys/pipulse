/**
 * User Router - Week 2 Implementation
 * Handles:
 * - Get user profile
 * - Update profile
 * - Get user stats (earnings, completed tasks)
 * - Get leaderboard
 */

import { router, publicProcedure } from '../trpc'
import { z } from 'zod'
import { prisma } from '@/lib/db'

export const userRouter = router({
  /**
   * Get user profile
   */
  getProfile: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        const user = await prisma.user.findUnique({
          where: { id: input.id },
          include: {
            streak: true,
          },
        })

        return user
      } catch (error) {
        console.error('Error fetching profile:', error)
        return null
      }
    }),

  /**
   * Get user stats (earnings, task count, etc)
   */
  getStats: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        const user = await prisma.user.findUnique({
          where: { id: input.id },
          include: {
            submissionsAsWorker: {
              where: {
                status: 'APPROVED',
                deletedAt: null,
              },
            },
            tasksCreated: {
              where: {
                status: 'COMPLETED',
                deletedAt: null,
              },
            },
            streak: true,
          },
        })

        if (!user) {
          return null
        }

        return {
          totalEarnings: user.totalEarnings,
          totalTasksCompleted: user.submissionsAsWorker.length,
          totalTasksCreated: user.tasksCreated.length,
          level: user.level,
          currentStreak: user.streak?.currentStreak || 0,
          longestStreak: user.streak?.longestStreak || 0,
          status: user.status,
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
        return null
      }
    }),

  /**
   * Get leaderboard ranking
   */
  getLeaderboard: publicProcedure
    .input(
      z.object({
        limit: z.number().default(20).max(100),
        offset: z.number().default(0),
        orderBy: z
          .enum(['earnings', 'tasksCompleted', 'streak'])
          .default('earnings'),
      })
    )
    .query(async ({ input }) => {
      try {
        const users = await prisma.user.findMany({
          where: {
            status: 'ACTIVE',
            deletedAt: null,
          },
          select: {
            id: true,
            piUsername: true,
            level: true,
            totalEarnings: true,
            currentStreak: true,
            totalTasksCompleted: true,
          },
          skip: input.offset,
          take: input.limit,
          orderBy:
            input.orderBy === 'earnings'
              ? { totalEarnings: 'desc' }
              : input.orderBy === 'tasksCompleted'
                ? { totalTasksCompleted: 'desc' }
                : { currentStreak: 'desc' },
        })

        return users
      } catch (error) {
        console.error('Error fetching leaderboard:', error)
        return []
      }
    }),
})
