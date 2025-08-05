'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

interface RoleCheck {
  role: string;
  count: number;
  employees: Array<{
    id: string;
    name: string;
    email: string;
  }>;
}

export default function CheckRolesPage() {
  const [roles, setRoles] = useState<RoleCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkRoles();
  }, []);

  const checkRoles = async () => {
    try {
      setLoading(true);
      
      // Obtener todos los empleados
      const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('id, name, email, role')
        .order('role', { ascending: true });

      if (empError) throw empError;

      // Agrupar por rol
      const roleGroups: { [key: string]: RoleCheck } = {};
      
      employees?.forEach((emp: Record<string, unknown>) => {
        const role = emp.role as string || 'sin_rol';
        if (!roleGroups[role]) {
          roleGroups[role] = {
            role,
            count: 0,
            employees: []
          };
        }
        roleGroups[role].count++;
        roleGroups[role].employees.push({
          id: emp.id as string,
          name: emp.name as string,
          email: emp.email as string
        });
      });

      setRoles(Object.values(roleGroups));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            🔍 Verificando Roles en Supabase...
          </h1>
          <div className="animate-pulse bg-white rounded-lg p-6">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-red-600 mb-8">
            ❌ Error al verificar roles
          </h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const expectedRoles = [
    'employee',
    'admin',
    'super_admin'
    // Roles futuros (comentados por ahora):
    // 'supervisor', 
    // 'manager',
    // 'hr'
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🔍 Roles Actuales en Supabase
        </h1>

        {/* Resumen de roles encontrados */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">📊 Resumen de Roles</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {roles.map(roleData => (
              <div 
                key={roleData.role}
                className={`p-4 rounded-lg border-2 ${
                  expectedRoles.includes(roleData.role)
                    ? 'border-green-200 bg-green-50'
                    : 'border-yellow-200 bg-yellow-50'
                }`}
              >
                <div className="text-lg font-semibold">
                  {expectedRoles.includes(roleData.role) ? '✅' : '⚠️'} {roleData.role}
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {roleData.count}
                </div>
                <div className="text-sm text-gray-600">empleados</div>
              </div>
            ))}
          </div>
        </div>

        {/* Verificación de roles esperados */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">🎯 Roles Esperados vs Encontrados</h2>
          <div className="space-y-2">
            {expectedRoles.map(expectedRole => {
              const found = roles.find(r => r.role === expectedRole);
              return (
                <div 
                  key={expectedRole}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    found 
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <span className="font-medium">
                    {found ? '✅' : '❌'} {expectedRole}
                  </span>
                  <span className="text-sm">
                    {found ? `${found.count} empleados` : 'No encontrado'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detalle de empleados por rol */}
        <div className="space-y-6">
          {roles.map(roleData => (
            <div key={roleData.role} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">
                👥 Empleados con rol: <span className="text-blue-600">{roleData.role}</span>
              </h3>
              <div className="grid gap-3">
                {roleData.employees.map(emp => (
                  <div key={emp.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                      {emp.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium">{emp.name}</div>
                      <div className="text-sm text-gray-600">{emp.email}</div>
                    </div>
                    <div className="text-xs text-gray-500 font-mono">
                      ID: {emp.id.slice(0, 8)}...
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Botón para refrescar */}
        <div className="mt-8 text-center">
          <button
            onClick={checkRoles}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium"
          >
            🔄 Refrescar Datos
          </button>
        </div>
      </div>
    </div>
  );
}
