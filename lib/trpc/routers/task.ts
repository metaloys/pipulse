/**
 * Task Router - Week 2 Implementation
 * Handles:
 * - List tasks
 * - Get task details
 * - Submit task
 */

import { router, publicProcedure } from '../trpc'
import { z } from 'zod'
import { prisma } from '@/lib/db'

export const taskRouter = router({
  /**
   * List available tasks
   * Filters: category, status, minReward, maxReward
   */
  listTasks: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        status: z.string().optional(),
        limit: z.number().default(20).max(100),
        offset: z.number().default(0).min(0),
      })
    )
    .query(async ({ input }) => {
      try {
        const where: any = {
          status: 'ACTIVE',
          deletedAt: null,
        }

        if (input.category) {
          where.category = input.category
        }

        if (input.status) {
          where.status = input.status
        }

        const tasks = await prisma.task.findMany({
          where,
          skip: input.offset,
          take: input.limit,
          include: {
            employer: {
              select: {
                id: true,
                piUsername: true,
              },
            },
            submissions: {
              where: {
                deletedAt: null,
              },
              select: {
                id: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        })

        return tasks
      } catch (error) {
        console.error('Error listing tasks:', error)
        return []
      }
    }),

  /**
   * Get task details with submissions
   */
  getTask: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        const task = await prisma.task.findUnique({
          where: { id: input.id },
          include: {
            employer: {
              select: {
                id: true,
                piUsername: true,
                level: true,
                totalTasksCreated: true,
              },
            },
            submissions: {
              where: {
                deletedAt: null,
              },
              include: {
                worker: {
                  select: {
                    id: true,
                    piUsername: true,
                  },
                },
              },
            },
            taskVersions: {
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
        })

        return task
      } catch (error) {
        console.error('Error fetching task:', error)
        return null
      }
    }),

  /**
   * Submit proof for a task
   */
  submitTask: publicProcedure
    .input(
      z.object({
        taskId: z.string(),
        workerId: z.string(),
        proofContent: z.string(),
        proofType: z.enum(['SCREENSHOT', 'DOCUMENT', 'TEXT', 'LINK']),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Check if task exists
        const task = await prisma.task.findUnique({
          where: { id: input.taskId },
        })

        if (!task) {
          throw new Error('Task not found')
        }

        // Check if user already has a submission
        const existingSubmission = await prisma.submission.findFirst({
          where: {
            taskId: input.taskId,
            workerId: input.workerId,
            deletedAt: null,
          },
        })

        if (existingSubmission) {
          throw new Error('You already have a submission for this task')
        }

        // Check slot availability
        if (task.slotsRemaining <= 0) {
          throw new Error('No slots available for this task')
        }

        // Create submission
        const submission = await prisma.submission.create({
          data: {
            taskId: input.taskId,
            workerId: input.workerId,
            proofContent: input.proofContent,
            submissionType: input.proofType,
            status: 'SUBMITTED',
            agreedReward: task.piReward,
          },
          include: {
            worker: {
              select: {
                id: true,
                piUsername: true,
              },
            },
          },
        })

        // Decrement available slots
        await prisma.task.update({
          where: { id: input.taskId },
          data: {
            slotsRemaining: task.slotsRemaining - 1,
          },
        })

        return {
          success: true,
          submission,
          message: 'Task submission created successfully',
        }
      } catch (error) {
        console.error('Error submitting task:', error)
        throw error
      }
    }),
})
