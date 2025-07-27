// =============================================
// CONFIGURACIÓN DE SUPABASE - SERVIDOR SSR ESCALABLE
// Descripción: Cliente del servidor optimizado para Next.js App Router
// Funcionalidades: SSR, Middleware, API Routes, Server Components
// =============================================

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Cliente de Supabase para Server Components y API Routes
 * Maneja automáticamente las cookies y autenticación del servidor
 * 
 * Uso en Server Components:
 * ```tsx
 * import { createServerSupabaseClient } from '@/lib/supabase/server'
 * 
 * export default async function Page() {
 *   const supabase = await createServerSupabaseClient()
 *   const { data } = await supabase.auth.getUser()
 *   return <div>Hello {data.user?.email}</div>
 * }
 * ```
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Implementación escalable de manejo de cookies
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Las cookies de respuesta pueden fallar en Middleware
            // Esta es una limitación conocida de Next.js
          }
        },
      },
      auth: {
        autoRefreshToken: true,
        persistSession: true,
      },
      global: {
        headers: {
          'X-Client-Info': 'educa-attendance-system-server',
          'X-Request-Source': 'server-component',
        },
      },
    }
  )
}

/**
 * Cliente de Supabase para Middleware
 * Optimizado para verificación de autenticación en rutas
 * 
 * Uso en middleware.ts:
 * ```tsx
 * import { createMiddlewareSupabaseClient } from '@/lib/supabase/server'
 * 
 * export async function middleware(request: NextRequest) {
 *   const { supabase, response } = createMiddlewareSupabaseClient(request)
 *   const { data: { user } } = await supabase.auth.getUser()
 *   
 *   if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
 *     return NextResponse.redirect(new URL('/login', request.url))
 *   }
 *   
 *   return response
 * }
 * ```
 */
export function createMiddlewareSupabaseClient(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
      auth: {
        autoRefreshToken: false, // Optimización para middleware
        persistSession: true,
      },
      global: {
        headers: {
          'X-Client-Info': 'educa-attendance-system-middleware',
          'X-Request-Source': 'middleware',
        },
      },
    }
  )

  return { supabase, response }
}

/**
 * Cliente de Supabase para API Routes
 * Incluye manejo avanzado de errores y logging
 * 
 * Uso en API Routes:
 * ```tsx
 * import { createAPISupabaseClient } from '@/lib/supabase/server'
 * 
 * export async function GET(request: Request) {
 *   const supabase = createAPISupabaseClient(request)
 *   const { data, error } = await supabase.from('employees').select('*')
 *   
 *   if (error) {
 *     return Response.json({ error: error.message }, { status: 400 })
 *   }
 *   
 *   return Response.json({ data })
 * }
 * ```
 */
export function createAPISupabaseClient(request: Request) {
  const cookieHeader = request.headers.get('cookie')
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          if (!cookieHeader) return []
          
          return cookieHeader
            .split(';')
            .map((cookie) => cookie.trim().split('='))
            .filter(([name]) => name)
            .map(([name, value]) => ({ name, value }))
        },
        setAll() {
          // En API routes, las cookies se manejan en la respuesta
          // Esta función se mantiene para compatibilidad
        },
      },
      auth: {
        autoRefreshToken: true,
        persistSession: false, // Las API routes son stateless
      },
      global: {
        headers: {
          'X-Client-Info': 'educa-attendance-system-api',
          'X-Request-Source': 'api-route',
          'X-User-Agent': request.headers.get('user-agent') || 'unknown',
        },
      },
    }
  )
}

/**
 * Helper para validar la sesión del usuario en el servidor
 * Incluye manejo de errores y logging para debugging
 */
export async function getServerSession() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Error al obtener sesión del servidor:', error)
      return { session: null, user: null, error }
    }
    
    return { 
      session, 
      user: session?.user || null, 
      error: null 
    }
  } catch (error) {
    console.error('Error crítico en getServerSession:', error)
    return { 
      session: null, 
      user: null, 
      error: error as Error 
    }
  }
}

/**
 * Helper para verificar si el usuario tiene permisos específicos
 * Implementa el patrón Repository para escalabilidad
 */
export async function checkUserPermissions(
  requiredRole: string[] | string,
  userId?: string
) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Si no se proporciona userId, usar el usuario actual
    if (!userId) {
      const { user } = await getServerSession()
      if (!user) return { hasPermission: false, error: 'No hay sesión activa' }
      userId = user.id
    }
    
    // Consultar el rol del usuario en la base de datos
    const { data: employee, error } = await supabase
      .from('employees')
      .select('role, is_active')
      .eq('id', userId)
      .single()
    
    if (error || !employee) {
      return { hasPermission: false, error: 'Usuario no encontrado' }
    }
    
    if (!employee.is_active) {
      return { hasPermission: false, error: 'Usuario inactivo' }
    }
    
    // Verificar permisos
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    const hasPermission = allowedRoles.includes(employee.role)
    
    return { 
      hasPermission, 
      userRole: employee.role,
      error: null 
    }
  } catch (error) {
    console.error('Error al verificar permisos:', error)
    return { 
      hasPermission: false, 
      error: 'Error interno del servidor' 
    }
  }
}
