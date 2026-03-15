/**
 * Prisma Client Singleton
 * Prevents multiple Prisma instances in development (hot reload causes issues)
 * Only instantiates on the server side
 * 
 * Usage:
 *   import { prisma } from '@/lib/db'
 *   // Only use in server-side code, API routes, or server actions
 *   const user = await prisma.user.findUnique(...)
 */

import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined }

// Only create Prisma client on the server side
function getPrismaClient(): PrismaClient {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    throw new Error('PrismaClient cannot be used in browser environment. Use API routes instead.')
  }

  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma
  }

  const client = new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  })

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client
  }

  return client
}

// Export a lazy-loaded proxy that prevents bundling issues
export const prisma = new Proxy({} as PrismaClient, {
  get(target: any, prop: string | symbol) {
    const client = getPrismaClient()
    return client[prop as keyof PrismaClient]
  },
})


