/**
 * tRPC API Handler
 * 
 * This is the HTTP handler for all tRPC calls
 * Next.js routes all /api/trpc/* requests here
 * 
 * Usage (frontend):
 *   const result = await trpc.auth.createUser.mutate({ piUsername: 'test' })
 * 
 * This translates to: POST /api/trpc/auth.createUser
 */

import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter } from '@/lib/trpc/routers/_app'

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => ({}),
  })

export { handler as GET, handler as POST }
