/**
 * Supabase server client.
 *
 * In mock mode (NEXT_PUBLIC_USE_MOCK_DATA=true) this file is never imported
 * because lib/data.ts lazy-loads it only when USE_MOCK is false.
 *
 * We wrap next/headers in a try/catch so this file can be safely imported
 * in any context without throwing at module-evaluation time.
 */

import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  // Dynamically require cookies so this module doesn't crash
  // when evaluated outside a Server Component context
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { cookies } = require('next/headers') as typeof import('next/headers')
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component — ignore
          }
        },
      },
    }
  )
}
