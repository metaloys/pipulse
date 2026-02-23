/**
 * User Router - Placeholder for Week 3+
 * Handles:
 * - Get user profile
 * - Update profile
 * - Get user stats (earnings, completed tasks)
 * - Get user submissions
 */

import { router, publicProcedure } from '../trpc'
import { z } from 'zod'

export const userRouter = router({
  /**
   * Get user profile
   */
  getProfile: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      // Placeholder - implement in Week 3+
      return null
    }),

  /**
   * Get user stats (earnings, task count, etc)
   */
  getStats: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      // Placeholder - implement in Week 3+
      return {
        totalEarnings: '0',
        totalTasksCompleted: 0,
        level: 'NEWCOMER',
      }
    }),
})
