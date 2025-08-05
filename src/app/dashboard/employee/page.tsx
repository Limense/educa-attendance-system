/**
 * =============================================
 * EMPLOYEE DASHBOARD PAGE
 * =============================================
 * 
 * Descripción: Página del dashboard del empleado refactorizada
 * Sigue el patrón de AdminDashboardPage para consistencia arquitectónica
 * 
 * Arquitectura:
 * - Verificación de autenticación
 * - Carga de datos del empleado
 * - Delegación a componente principal
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/client';
import { Employee } from '@/types/database';
import { EmployeeDashboard } from '@/components/employee';

export default function EmployeeDashboardPage() {
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/auth/login');
          return;
        }

        // Cargar datos del empleado con relaciones
        const { data: employeeData, error } = await supabase
          .from('employees')
          .select(`
            *,
            department:departments(id, name),
            position:positions(id, title),
            organization:organizations(id, name)
          `)
          .eq('email', session.user.email)
          .eq('is_active', true)
          .single();

        if (error || !employeeData) {
          console.error('Error loading employee:', error);
          router.push('/auth/login');
          return;
        }

        setEmployee(employeeData);
      } catch (error) {
        console.error('Error checking auth:', error);
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      const supabase = createSupabaseClient();
      await supabase.auth.signOut();
      localStorage.removeItem('currentEmployee');
      router.push('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">No se pudo cargar la información del empleado</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <EmployeeDashboard 
      employee={employee}
      onLogout={handleLogout}
    />
  );
}
