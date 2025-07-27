// =============================================
// CONFIGURACIÓN DE SUPABASE - CLIENTE ESCALABLE
// Descripción: Cliente optimizado para performance y escalabilidad
// Autor: Sistema de Asistencia Educa
// Versión: 1.0.0
// =============================================

import { createBrowserClient } from '@supabase/ssr'

// Tipos para type safety
export interface SupabaseConfig {
  url: string
  anonKey: string
  options?: {
    auth?: {
      autoRefreshToken?: boolean
      persistSession?: boolean
      detectSessionInUrl?: boolean
    }
    global?: {
      headers?: Record<string, string>
    }
  }
}

/**
 * Configuración escalable de Supabase
 * - Manejo automático de tokens
 * - Configuración de headers personalizados
 * - Optimización para performance
 */
const supabaseConfig: SupabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  options: {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        'X-Client-Info': 'educa-attendance-system',
        'X-Client-Version': '1.0.0',
      },
    },
  },
}

/**
 * Cliente de Supabase para el navegador
 * Implementa patrón Singleton para optimización de memoria
 */
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null

export function createSupabaseClient() {
  // Patrón Singleton: Una sola instancia por sesión del navegador
  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient(
      supabaseConfig.url,
      supabaseConfig.anonKey,
      supabaseConfig.options
    )
  }
  
  return supabaseInstance
}

/**
 * Cliente principal exportado
 * Uso: import { supabase } from '@/lib/supabase/client'
 */
export const supabase = createSupabaseClient()

/**
 * Helper para verificar la configuración
 * Útil para debugging y validación inicial
 */
export function validateSupabaseConfig(): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Validar variables de entorno requeridas
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL no está configurada')
  }
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY no está configurada')
  }
  
  // Validar formato de URL
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && 
      !process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('https://')) {
    warnings.push('La URL de Supabase debería usar HTTPS en producción')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

// Exportar tipos para uso en otros archivos
export type SupabaseClient = ReturnType<typeof createSupabaseClient>
