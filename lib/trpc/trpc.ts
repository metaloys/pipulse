/**
 * tRPC Configuration
 * This file initializes tRPC and exports the base router and procedure
 * Used by all router implementations in ./routers
 */

import { initTRPC } from '@trpc/server'

const t = initTRPC.create()

export const router = t.router
export const publicProcedure = t.procedure
