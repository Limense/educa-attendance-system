'use client';

import React, { useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';

export default function DatabaseDiagnostic() {
  const [results, setResults] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const runDiagnostic = async () => {
    setLoading(true);
    const supabase = createSupabaseClient();
    let report = '🔍 DIAGNÓSTICO DE BASE DE DATOS\n';
    report += '=====================================\n\n';

    try {
      // 1. Verificar autenticación
      report += '1. 🔑 AUTENTICACIÓN:\n';
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        report += `❌ Error: ${authError.message}\n\n`;
      } else {
        report += `✅ Usuario: ${user?.email || 'No autenticado'}\n\n`;
      }

      // 2. Verificar estructura de empleados
      report += '2. 👤 EMPLEADOS:\n';
      try {
        const { data: employees, error: empError } = await supabase
          .from('employees')
          .select('*')
          .limit(1);
        
        if (empError) {
          report += `❌ Error consultando employees: ${empError.message}\n`;
        } else {
          report += `✅ Tabla employees accesible\n`;
          if (employees && employees.length > 0) {
            report += `📊 Campos disponibles: ${Object.keys(employees[0]).join(', ')}\n`;
          }
        }
      } catch (error) {
        report += `❌ Error accediendo a employees: ${error}\n`;
      }
      report += '\n';

      // 3. Verificar empleado actual
      report += '3. 🏢 EMPLEADO ACTUAL:\n';
      if (user?.email) {
        try {
          const { data: currentEmployee, error: currentEmpError } = await supabase
            .from('employees')
            .select('*')
            .eq('email', user.email)
            .single();
          
          if (currentEmpError) {
            report += `❌ Error obteniendo empleado actual: ${currentEmpError.message}\n`;
          } else {
            report += `✅ Empleado encontrado: ${currentEmployee.first_name || 'Sin nombre'}\n`;
            report += `📧 Email: ${currentEmployee.email}\n`;
            report += `🆔 ID: ${currentEmployee.id}\n`;
            report += `🏢 Organization ID: ${currentEmployee.organization_id || 'No definido'}\n`;
          }
        } catch (error) {
          report += `❌ Error consultando empleado actual: ${error}\n`;
        }
      }
      report += '\n';

      // 4. Verificar estructura de attendances
      report += '4. 📅 ASISTENCIAS:\n';
      try {
        const { data: attendances, error: attError } = await supabase
          .from('attendances')
          .select('*')
          .limit(1);
        
        if (attError) {
          report += `❌ Error consultando attendances: ${attError.message}\n`;
        } else {
          report += `✅ Tabla attendances accesible\n`;
          if (attendances && attendances.length > 0) {
            report += `📊 Campos disponibles: ${Object.keys(attendances[0]).join(', ')}\n`;
          } else {
            report += `📊 Tabla vacía, pero accesible\n`;
          }
        }
      } catch (error) {
        report += `❌ Error accediendo a attendances: ${error}\n`;
      }
      report += '\n';

      // 5. Test de inserción simple
      report += '5. 🧪 TEST DE INSERCIÓN:\n';
      if (user?.email) {
        try {
          const { data: testEmployee } = await supabase
            .from('employees')
            .select('id')
            .eq('email', user.email)
            .single();

          if (testEmployee?.id) {
            const testData = {
              employee_id: testEmployee.id,
              attendance_date: '2025-01-01', // Fecha de prueba
              check_in_time: new Date().toISOString(),
              status: 'present'
            };

            report += `🔄 Intentando insertar: ${JSON.stringify(testData, null, 2)}\n`;

            const { error: insertError } = await supabase
              .from('attendances')
              .insert(testData)
              .select();

            if (insertError) {
              report += `❌ Error en inserción de prueba: ${insertError.message}\n`;
              report += `🔍 Detalles: ${JSON.stringify(insertError, null, 2)}\n`;
            } else {
              report += `✅ Inserción de prueba exitosa\n`;
              
              // Limpiar la inserción de prueba
              await supabase
                .from('attendances')
                .delete()
                .eq('employee_id', testEmployee.id)
                .eq('attendance_date', '2025-01-01');
              
              report += `🧹 Datos de prueba limpiados\n`;
            }
          }
        } catch (error) {
          report += `❌ Error en test de inserción: ${error}\n`;
        }
      }

    } catch (error) {
      report += `❌ Error general en diagnóstico: ${error}\n`;
    }

    report += '\n=====================================\n';
    report += 'FIN DEL DIAGNÓSTICO\n';

    setResults(report);
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
        🔍 Database Diagnostic
      </h1>
      
      <div className="mb-6">
        <button
          onClick={runDiagnostic}
          disabled={loading}
          className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors ${
            loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? '🔄 Ejecutando Diagnóstico...' : '🚀 Ejecutar Diagnóstico'}
        </button>
      </div>

      {results && (
        <div className="bg-gray-900 text-green-400 p-6 rounded-lg font-mono text-sm overflow-auto max-h-96">
          <pre>{results}</pre>
        </div>
      )}

      <div className="mt-6 text-center">
        <a 
          href="/dashboard/employee"
          className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors mr-4"
        >
          🏃‍♂️ Ir al Dashboard
        </a>
        <a 
          href="/testing"
          className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
        >
          🧪 Testing Page
        </a>
      </div>
    </div>
  );
}
