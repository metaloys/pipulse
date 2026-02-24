/**
 * tRPC Client Configuration
 * 
 * This file sets up the tRPC client for use in the browser.
 * It enables type-safe RPC calls from React components.
 * 
 * Usage in a React component:
 * ```tsx
 * const trpc = useTRPC();
 * const user = await trpc.auth.createUser.mutate({ piUid: '...', piUsername: '...' });
 * ```
 */

import { createTRPCClient, httpBatchLink } from '@trpc/client'
import type { AppRouter } from './routers/_app'

/**
 * Create tRPC client that connects to the API at /api/trpc
 */
export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: '/api/trpc',
      // Optional: Add custom headers if needed for authentication
      async headers() {
        return {
          // Add any custom headers here if needed
        }
      },
    }),
  ],
})

/**
 * Type-safe wrapper for calling tRPC endpoints
 * Returns the same client but with full TypeScript support
 */
export type TRPC = typeof trpcClient

/**
 * Hook for using tRPC client in React components
 * Must be used inside a client component ('use client')
 */
export function useTRPC(): TRPC {
  return trpcClient
}
