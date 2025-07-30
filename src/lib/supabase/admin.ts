// =============================================
// SUPABASE ADMIN CLIENT (SERVICE ROLE KEY)
// Descripción: Cliente exclusivo para operaciones administrativas en backend/API
// =============================================

import { createServerClient } from '@supabase/ssr'

/**
 * Cliente de Supabase con Service Role Key
 * USO EXCLUSIVO en backend seguro (API routes, server actions)
 * NUNCA usar en frontend, SSR, ni Server Components
 */
export function createAdminSupabaseClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return [] },
        setAll() {},
      },
      global: {
        headers: {
          'X-Client-Info': 'educa-attendance-system-admin',
          'X-Request-Source': 'admin-server',
        },
      },
    }
  )
}
