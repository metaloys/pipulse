/**
 * Prisma Client Singleton
 * Prevents multiple Prisma instances in development (hot reload causes issues)
 * 
 * Usage:
 *   import { prisma } from '@/lib/db'
 *   const user = await prisma.user.findUnique(...)
 */

import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined, initialized?: boolean }

function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma
  }

  // Create client on first use
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

// Use a lazy getter to delay client creation
export const prisma = new Proxy({} as PrismaClient, {
  get(target: any, prop: string | symbol) {
    const client = getPrismaClient()
    return client[prop as keyof PrismaClient]
  },
})


