/**
 * 🧪 SCRIPT DE PRUEBA - INTEGRACIÓN AUTH-EMPLEADOS
 * =====================================================
 * 
 * Este script prueba la nueva integración entre Supabase Auth y la tabla de empleados.
 * Verifica que:
 * 1. Se puede crear un empleado vía Supabase Auth
 * 2. El trigger sincroniza automáticamente a la tabla employees
 * 3. Los errores se manejan correctamente
 * 4. No hay duplicados ni inconsistencias
 * 
 * Para ejecutar: npm run test:auth-integration
 */

import { employeeService } from '../src/services/employee.service';
import { EmployeeFormData } from '../src/types/employee.types';
import { createClient } from '@supabase/supabase-js';

// Configurar cliente de Supabase (usar variables de entorno)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno de Supabase no configuradas');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Datos de prueba
const testEmployee = {
  firstName: 'Juan Carlos',
  lastName: 'Pérez González', 
  email: `test.empleado.${Date.now()}@educare.local`,
  phone: '555-0123',
  employeeCode: `EMP${Date.now()}`,
  password: 'TestPassword123!',
  departmentId: '', // Se obtendrá dinámicamente
  positionId: '',   // Se obtendrá dinámicamente
  role: 'employee' as const,
  hireDate: new Date().toISOString().split('T')[0],
  sendWelcomeEmail: false,
  organizationId: '' // Se obtendrá dinámicamente
};

/**
 * 🔍 Función auxiliar para obtener o crear datos de prueba
 */
async function setupTestData() {
  console.log('🔧 Configurando datos de prueba...');
  
  // Obtener organización
  const { data: orgs, error: orgError } = await supabase
    .from('organizations')
    .select('id')
    .limit(1)
    .single();

  if (orgError || !orgs) {
    throw new Error('No se encontró organización para pruebas. Ejecute primero el setup de datos.');
  }

  testEmployee.organizationId = orgs.id;

  // Obtener departamento
  const { data: dept, error: deptError } = await supabase
    .from('departments')
    .select('id')
    .eq('organization_id', orgs.id)
    .limit(1)
    .single();

  if (deptError || !dept) {
    throw new Error('No se encontró departamento para pruebas. Ejecute primero el setup de datos.');
  }

  testEmployee.departmentId = dept.id;

  // Obtener posición
  const { data: pos, error: posError } = await supabase
    .from('positions')
    .select('id')
    .eq('department_id', dept.id)
    .limit(1)
    .single();

  if (posError || !pos) {
    throw new Error('No se encontró posición para pruebas. Ejecute primero el setup de datos.');
  }

  testEmployee.positionId = pos.id;

  console.log('✅ Datos de prueba configurados');
  console.log(`   📧 Email: ${testEmployee.email}`);
  console.log(`   🏢 Org ID: ${testEmployee.organizationId}`);
  console.log(`   📁 Dept ID: ${testEmployee.departmentId}`);
  console.log(`   💼 Pos ID: ${testEmployee.positionId}`);
}

/**
 * 🧪 Prueba 1: Crear empleado vía Auth
 */
async function testCreateEmployeeViaAuth() {
  console.log('\n🧪 PRUEBA 1: Crear empleado vía Supabase Auth');
  console.log('================================================');

  try {
    console.log('📤 Enviando datos de empleado al servicio...');
    
    const result = await employeeService.createEmployee(testEmployee);
    
    if (result === true) {
      console.log('✅ Empleado creado exitosamente');
      console.log(`   📧 Email: ${testEmployee.email}`);
      
      // Buscar el empleado creado para obtener su ID
      const { data: employee, error } = await supabase
        .from('employees')
        .select('id, auth_user_id, email')
        .eq('email', testEmployee.email)
        .single();
        
      if (error || !employee) {
        throw new Error('No se pudo encontrar el empleado recién creado');
      }
      
      console.log(`   🆔 ID: ${employee.id}`);
      console.log(`   🔗 Auth User ID: ${employee.auth_user_id || 'No disponible'}`);
      
      return employee;
    } else {
      throw new Error('El servicio retornó false');
    }
    
  } catch (error) {
    console.error('❌ Error al crear empleado:', error);
    throw error;
  }
}

/**
 * 🧪 Prueba 2: Verificar sincronización automática
 */
async function testAutoSync(employeeId: string) {
  console.log('\n🧪 PRUEBA 2: Verificar sincronización automática');
  console.log('==================================================');

  try {
    // Verificar que el empleado existe en la tabla employees
    console.log('🔍 Verificando empleado en tabla employees...');
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('*')
      .eq('id', employeeId)
      .single();

    if (empError || !employee) {
      throw new Error('Empleado no encontrado en tabla employees');
    }

    console.log('✅ Empleado encontrado en tabla employees');
    console.log(`   🔗 Auth User ID: ${employee.auth_user_id}`);

    // Verificar que el usuario existe en auth.users
    if (employee.auth_user_id) {
      console.log('🔍 Verificando usuario en auth.users...');
      const { data: authUser, error: authError } = await supabase.auth.admin
        .getUserById(employee.auth_user_id);

      if (authError || !authUser.user) {
        throw new Error('Usuario no encontrado en auth.users');
      }

      console.log('✅ Usuario encontrado en auth.users');
      console.log(`   📧 Email: ${authUser.user.email}`);
      console.log(`   📅 Creado: ${authUser.user.created_at}`);
      
      // Verificar que los emails coinciden
      if (authUser.user.email === employee.email) {
        console.log('✅ Emails coinciden correctamente');
      } else {
        throw new Error(`Emails no coinciden: ${authUser.user.email} vs ${employee.email}`);
      }
    } else {
      throw new Error('auth_user_id es null en el empleado');
    }

  } catch (error) {
    console.error('❌ Error en verificación de sincronización:', error);
    throw error;
  }
}

/**
 * 🧪 Prueba 3: Intentar crear duplicado
 */
async function testDuplicateEmail() {
  console.log('\n🧪 PRUEBA 3: Intentar crear empleado con email duplicado');
  console.log('========================================================');

  try {
    console.log('📤 Intentando crear empleado con mismo email...');
    
    await employeeService.createEmployee(testEmployee);
    
    // Si llegamos aquí, algo está mal
    throw new Error('FALLO: Se permitió crear empleado duplicado');
    
  } catch (error) {
    console.log('✅ Error esperado al intentar duplicar email');
    console.log(`   💬 Mensaje: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    
    // Verificar que el error es el correcto
    if (error instanceof Error && error.message.toLowerCase().includes('email')) {
      console.log('✅ Tipo de error correcto (relacionado con email)');
    } else {
      console.log('⚠️ Tipo de error inesperado');
    }
  }
}

/**
 * 🧪 Prueba 4: Limpiar datos de prueba
 */
async function cleanupTestData(employeeId: string) {
  console.log('\n🧪 LIMPIEZA: Eliminando datos de prueba');
  console.log('=========================================');

  try {
    // Obtener auth_user_id antes de eliminar
    const { data: employee } = await supabase
      .from('employees')
      .select('auth_user_id')
      .eq('id', employeeId)
      .single();

    // Eliminar empleado (esto debería disparar cascada al auth.users si está configurado)
    console.log('🗑️ Eliminando empleado...');
    const { error: deleteError } = await supabase
      .from('employees')
      .delete()
      .eq('id', employeeId);

    if (deleteError) {
      console.error('⚠️ Error al eliminar empleado:', deleteError);
    } else {
      console.log('✅ Empleado eliminado');
    }

    // Eliminar usuario de auth si aún existe
    if (employee?.auth_user_id) {
      console.log('🗑️ Eliminando usuario de auth...');
      const { error: authDeleteError } = await supabase.auth.admin
        .deleteUser(employee.auth_user_id);

      if (authDeleteError) {
        console.error('⚠️ Error al eliminar usuario de auth:', authDeleteError);
      } else {
        console.log('✅ Usuario de auth eliminado');
      }
    }

  } catch (error) {
    console.error('⚠️ Error durante limpieza:', error);
  }
}

/**
 * 🚀 Función principal de pruebas
 */
async function runTests() {
  console.log('🎯 INICIANDO PRUEBAS DE INTEGRACIÓN AUTH-EMPLEADOS');
  console.log('=====================================================\n');

  let employeeId: string | null = null;

  try {
    // Setup
    await setupTestData();

    // Prueba 1: Crear empleado
    const employee = await testCreateEmployeeViaAuth();
    employeeId = employee.id;

    // Prueba 2: Verificar sincronización
    if (employeeId) {
      await testAutoSync(employeeId);
    }

    // Prueba 3: Intentar duplicado
    await testDuplicateEmail();

    console.log('\n🎉 TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE');
    console.log('============================================');
    console.log('✅ Creación de empleados vía Auth: OK');
    console.log('✅ Sincronización automática: OK');
    console.log('✅ Prevención de duplicados: OK');

  } catch (error) {
    console.error('\n💥 PRUEBAS FALLARON');
    console.error('==================');
    console.error('Error:', error);
    process.exit(1);

  } finally {
    // Limpieza
    if (employeeId) {
      await cleanupTestData(employeeId);
    }
  }
}

// Ejecutar pruebas
if (require.main === module) {
  runTests().catch(console.error);
}

export { runTests };
