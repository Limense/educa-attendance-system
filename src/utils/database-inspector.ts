/**
 * Utilidad para inspeccionar la estructura de las tablas de Supabase
 */

import { createSupabaseClient } from '@/lib/supabase/client';

export async function inspectAttendancesTable() {
  const supabase = createSupabaseClient();
  
  try {
    console.log('🔍 Inspeccionando estructura de la tabla attendances...');
    
    // Hacer una consulta simple para obtener un registro y ver sus columnas
    const { data, error } = await supabase
      .from('attendances')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error consultando attendances:', error);
      return null;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Estructura de attendances encontrada:');
      console.log('📋 Columnas disponibles:', Object.keys(data[0]));
      console.log('📄 Ejemplo de registro:', data[0]);
      return data[0];
    } else {
      console.log('⚠️ No hay datos en la tabla attendances');
      return null;
    }
  } catch (error) {
    console.error('❌ Error inspeccionando tabla:', error);
    return null;
  }
}

export async function inspectEmployeesTable() {
  const supabase = createSupabaseClient();
  
  try {
    console.log('🔍 Inspeccionando estructura de la tabla employees...');
    
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error consultando employees:', error);
      return null;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Estructura de employees encontrada:');
      console.log('📋 Columnas disponibles:', Object.keys(data[0]));
      console.log('📄 Ejemplo de registro:', data[0]);
      return data[0];
    } else {
      console.log('⚠️ No hay datos en la tabla employees');
      return null;
    }
  } catch (error) {
    console.error('❌ Error inspeccionando tabla:', error);
    return null;
  }
}

export async function countRecords() {
  const supabase = createSupabaseClient();
  
  try {
    const { count: attendanceCount } = await supabase
      .from('attendances')
      .select('*', { count: 'exact', head: true });
      
    const { count: employeeCount } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true });
    
    console.log('📊 Conteo de registros:');
    console.log(`- Attendances: ${attendanceCount}`);
    console.log(`- Employees: ${employeeCount}`);
    
    return { attendanceCount, employeeCount };
  } catch (error) {
    console.error('❌ Error contando registros:', error);
    return null;
  }
}
