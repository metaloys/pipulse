/**
 * App Router - Root composition
 * Combines all sub-routers (auth, task, user) into one app router
 * Exported to clients via trpc.ts on the frontend
 */

import { router } from '../trpc'
import { authRouter } from './auth'
import { taskRouter } from './task'
import { userRouter } from './user'

export const appRouter = router({
  auth: authRouter,
  task: taskRouter,
  user: userRouter,
})

export type AppRouter = typeof appRouter
