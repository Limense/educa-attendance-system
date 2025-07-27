// =============================================
// TEST DE CONEXIÓN SUPABASE
// Descripción: Verificar que la configuración funcione correctamente
// Uso: Ejecutar después de configurar las variables de entorno
// =============================================

import { createSupabaseClient, validateSupabaseConfig } from './supabase/client'
import { createServerSupabaseClient } from './supabase/server'

interface Department {
  id: string
  name: string
  code: string
  organization?: { name: string }
}

interface Employee {
  id: string
  full_name: string
  email: string
  role: string
  is_active: boolean
  department?: { name: string }
}

interface Setting {
  category: string
  key: string
  value: unknown
  is_public: boolean
}

/**
 * Test completo de conexión y configuración
 * Verifica cliente, servidor y datos de prueba
 */
export async function testSupabaseConnection() {
  console.log('🔍 Iniciando test de conexión Supabase...\n')
  
  // 1. Validar configuración
  console.log('1️⃣ Validando configuración...')
  const configValidation = validateSupabaseConfig()
  
  if (!configValidation.isValid) {
    console.error('❌ Configuración inválida:')
    configValidation.errors.forEach(error => console.error(`   - ${error}`))
    return false
  }
  
  if (configValidation.warnings.length > 0) {
    console.warn('⚠️  Warnings de configuración:')
    configValidation.warnings.forEach(warning => console.warn(`   - ${warning}`))
  }
  
  console.log('✅ Configuración válida\n')
  
  // 2. Test del cliente del navegador
  console.log('2️⃣ Probando cliente del navegador...')
  try {
    const supabase = createSupabaseClient()
    
    // Test básico de conexión
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name, created_at')
      .limit(1)
    
    if (error) {
      console.error('❌ Error en cliente del navegador:', error.message)
      return false
    }
    
    console.log('✅ Cliente del navegador funcionando')
    if (data && data.length > 0) {
      console.log(`   📊 Organización encontrada: ${data[0].name}`)
    }
    console.log()
    
  } catch (error) {
    console.error('❌ Error crítico en cliente del navegador:', error)
    return false
  }
  
  // 3. Test del cliente del servidor
  console.log('3️⃣ Probando cliente del servidor...')
  try {
    const supabase = await createServerSupabaseClient()
    
    // Test de consulta más compleja
    const { data: departments, error } = await supabase
      .from('departments')
      .select(`
        id,
        name,
        code,
        organization:organizations(name)
      `)
      .limit(3)
    
    if (error) {
      console.error('❌ Error en cliente del servidor:', error.message)
      return false
    }
    
    console.log('✅ Cliente del servidor funcionando')
    if (departments && departments.length > 0) {
      console.log('   📋 Departamentos encontrados:')
      departments.forEach(dept => {
        console.log(`      - ${dept.name} (${dept.code})`)
      })
    }
    console.log()
    
  } catch (error) {
    console.error('❌ Error crítico en cliente del servidor:', error)
    return false
  }
  
  // 4. Test de datos de empleados
  console.log('4️⃣ Verificando datos de empleados...')
  try {
    const supabase = createSupabaseClient()
    
    const { data: employees, error } = await supabase
      .from('employees')
      .select(`
        id,
        full_name,
        email,
        role,
        is_active,
        department:departments(name)
      `)
      .eq('is_active', true)
      .limit(5)
    
    if (error) {
      console.error('❌ Error consultando empleados:', error.message)
      return false
    }
    
    console.log('✅ Datos de empleados disponibles')
    if (employees && employees.length > 0) {
      console.log('   👥 Empleados activos:')
      employees.forEach((emp: Employee) => {
        console.log(`      - ${emp.full_name} (${emp.role}) - ${emp.email}`)
      })
    }
    console.log()
    
  } catch (error) {
    console.error('❌ Error consultando empleados:', error)
    return false
  }
  
  // 5. Test de configuraciones del sistema
  console.log('5️⃣ Verificando configuraciones del sistema...')
  try {
    const supabase = createSupabaseClient()
    
    const { data: settings, error } = await supabase
      .from('system_settings')
      .select('category, key, value, is_public')
      .eq('is_public', true)
      .limit(3)
    
    if (error) {
      console.error('❌ Error consultando configuraciones:', error.message)
      return false
    }
    
    console.log('✅ Configuraciones del sistema disponibles')
    if (settings && settings.length > 0) {
      console.log('   ⚙️  Configuraciones públicas:')
      settings.forEach((setting: Setting) => {
        console.log(`      - ${setting.category}.${setting.key}`)
      })
    }
    console.log()
    
  } catch (error) {
    console.error('❌ Error consultando configuraciones:', error)
    return false
  }
  
  // 6. Test de funciones personalizadas
  console.log('6️⃣ Probando funciones personalizadas...')
  try {
    const supabase = createSupabaseClient()
    
    // Test de función RPC (Remote Procedure Call)
    const { error } = await supabase
      .rpc('create_default_settings', { 
        org_id: '550e8400-e29b-41d4-a716-446655440000' 
      })
    
    if (error && !error.message.includes('duplicate key')) {
      console.error('❌ Error en funciones RPC:', error.message)
      return false
    }
    
    console.log('✅ Funciones personalizadas funcionando')
    console.log()
    
  } catch (error) {
    console.error('❌ Error en funciones personalizadas:', error)
    return false
  }
  
  // 7. Resumen final
  console.log('🎉 ¡TEST COMPLETADO EXITOSAMENTE!')
  console.log('📊 Resumen:')
  console.log('   ✅ Configuración válida')
  console.log('   ✅ Cliente del navegador funcionando')
  console.log('   ✅ Cliente del servidor funcionando')
  console.log('   ✅ Datos de prueba disponibles')
  console.log('   ✅ Configuraciones del sistema cargadas')
  console.log('   ✅ Funciones personalizadas activas')
  console.log()
  console.log('🚀 ¡Supabase está listo para el desarrollo!')
  
  return true
}

/**
 * Test rápido para verificar solo la conexión básica
 */
export async function quickConnectionTest() {
  try {
    const supabase = createSupabaseClient()
    const { error } = await supabase
      .from('organizations')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Error de conexión:', error.message)
      return false
    }
    
    console.log('✅ Conexión básica exitosa')
    return true
    
  } catch (error) {
    console.error('❌ Error crítico:', error)
    return false
  }
}

/**
 * Helper para mostrar información del proyecto
 */
export async function showProjectInfo() {
  try {
    const supabase = createSupabaseClient()
    
    // Contar registros en tablas principales
    const promises = [
      supabase.from('organizations').select('count', { count: 'exact' }),
      supabase.from('departments').select('count', { count: 'exact' }),
      supabase.from('employees').select('count', { count: 'exact' }),
      supabase.from('attendances').select('count', { count: 'exact' }),
      supabase.from('system_settings').select('count', { count: 'exact' }),
    ]
    
    const results = await Promise.all(promises)
    const [orgs, depts, emps, attendances, settings] = results
    
    console.log('📊 INFORMACIÓN DEL PROYECTO:')
    console.log('──────────────────────────────')
    console.log(`   Organizaciones: ${orgs.count || 0}`)
    console.log(`   Departamentos:  ${depts.count || 0}`)
    console.log(`   Empleados:      ${emps.count || 0}`)
    console.log(`   Asistencias:    ${attendances.count || 0}`)
    console.log(`   Configuraciones: ${settings.count || 0}`)
    console.log('──────────────────────────────')
    
  } catch (error) {
    console.error('Error obteniendo información del proyecto:', error)
  }
}

// Exportar funciones para uso en desarrollo
const testFunctions = {
  testSupabaseConnection,
  quickConnectionTest,
  showProjectInfo,
}

export default testFunctions
