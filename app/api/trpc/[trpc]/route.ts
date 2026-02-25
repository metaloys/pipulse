import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter } from '@/lib/trpc/routers/_app'

export const GET = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => ({}),
  })

export const POST = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => ({}),
  })
