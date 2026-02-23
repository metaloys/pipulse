/**
 * Task Router - Placeholder for Week 3+
 * Handles:
 * - Create task
 * - List tasks
 * - Get task details
 * - Update task
 * - Cancel task
 */

import { router, publicProcedure } from '../trpc'
import { z } from 'zod'

export const taskRouter = router({
  /**
   * List available tasks
   * Filters: category, status, minReward, maxReward, employer
   */
  listTasks: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        status: z.string().optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      // Placeholder - implement in Week 3+
      return []
    }),

  /**
   * Get task details
   */
  getTask: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      // Placeholder - implement in Week 3+
      return null
    }),
})
