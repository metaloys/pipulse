/**
 * tRPC Client Configuration
 * 
 * This file sets up the tRPC client for use in the browser.
 * It enables type-safe RPC calls from React components.
 * 
 * Usage in a React component:
 * ```tsx
 * const result = await trpcClient.auth.createUser.mutate({ piUid: '...', piUsername: '...' });
 * ```
 */

import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import type { AppRouter } from './routers/_app'

/**
 * Create tRPC client that connects to the API at /api/trpc
 */
export const trpcClient = createTRPCProxyClient<AppRouter>({
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
