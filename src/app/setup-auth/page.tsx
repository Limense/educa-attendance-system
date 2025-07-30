'use client';

import React, { useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';

export default function SetupAuthPage() {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const setupUsers = async () => {
    setLoading(true);
    setStatus('Configurando usuarios de autenticación...');

    try {
      const supabase = createSupabaseClient();

      // Obtener todos los empleados de la base de datos
      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select('*');

      if (employeesError) {
        throw new Error(`Error obteniendo empleados: ${employeesError.message}`);
      }

      setStatus(`Encontrados ${employees?.length || 0} empleados. Verificando usuarios de auth...`);

      // Para cada empleado, intentar crear el usuario si no existe
      for (const employee of employees || []) {
        try {
          // Verificar si el usuario ya existe (actualmente no se usa en esta demo)
          const { data: existingUser } = await supabase.auth.getUser();
          void existingUser; // Prevenir warning de variable no utilizada
          
          setStatus(`Procesando: ${employee.email}`);
          
          // Nota: En una aplicación real, esto requeriría usar el service role key
          // Por ahora, mostraremos las instrucciones para crear manualmente
          
          console.log(`Usuario necesario: ${employee.email} - Rol: ${employee.role}`);
          
        } catch (error) {
          console.error(`Error procesando ${employee.email}:`, error);
        }
      }

      setStatus(`✅ Verificación completada. Revisa la consola para ver los usuarios que necesitas crear.`);

    } catch (error) {
      console.error('Error en setup:', error);
      setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const manualInstructions = `
Para crear los usuarios de autenticación manualmente:

1. Ve a tu proyecto Supabase → Authentication → Users
2. Haz clic en "Invite user" o "Add user"
3. Crea estos usuarios:

📧 admin@educa-demo.com
🔐 admin123
✅ Confirmar email automáticamente

📧 empleado1@educa-demo.com  
🔐 empleado123
✅ Confirmar email automáticamente

📧 empleado2@educa-demo.com
🔐 empleado123  
✅ Confirmar email automáticamente

IMPORTANTE: Los emails deben coincidir exactamente con los de la tabla employees.
  `;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🔐 Configuración de Autenticación
          </h1>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Estado Actual:</h2>
            {status && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-blue-800">{status}</p>
              </div>
            )}
          </div>

          <div className="mb-8">
            <button
              onClick={setupUsers}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verificando...' : 'Verificar Usuarios de Auth'}
            </button>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">📋 Instrucciones Manuales:</h3>
            <pre className="text-sm text-gray-700 whitespace-pre-wrap">
              {manualInstructions}
            </pre>
          </div>

          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Nota Importante:</h4>
            <p className="text-yellow-700 text-sm">
              Para crear usuarios automáticamente, necesitarías el SERVICE_ROLE_KEY con permisos de administrador.
              Por seguridad, es mejor crear los usuarios manualmente desde la interfaz de Supabase.
            </p>
          </div>

          <div className="mt-6">
            <a
              href="/auth/login"
              className="inline-block bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
            >
              ➡️ Ir a Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
