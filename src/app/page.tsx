'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/client';

export default function HomePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  const checkAuthAndRedirect = useCallback(async () => {
    try {
      const supabase = createSupabaseClient();
      
      // Verificar si hay una sesión activa
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        // No hay sesión, ir a login
        router.push('/auth/login');
        return;
      }

      // Hay sesión, obtener datos del empleado para dirigir al dashboard correcto
      const { data: employee, error: empError } = await supabase
        .from('employees')
        .select('role, is_active')
        .eq('email', session.user.email)
        .single();

      if (empError || !employee || !employee.is_active) {
        // Empleado no encontrado o inactivo, cerrar sesión y ir a login
        await supabase.auth.signOut();
        router.push('/auth/login');
        return;
      }

      // Redirigir según el rol
      switch (employee.role) {
        case 'super_admin':
        case 'admin':
          router.push('/dashboard/admin');
          break;
        case 'manager':
        case 'hr':
          router.push('/dashboard/admin'); // Por ahora usar admin dashboard
          break;
        default:
          router.push('/dashboard/employee');
      }

    } catch (error) {
      console.error('Error verificando autenticación:', error);
      router.push('/auth/login');
    } finally {
      setChecking(false);
    }
  }, [router]);

  useEffect(() => {
    checkAuthAndRedirect();
  }, [checkAuthAndRedirect]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl mx-auto mb-4 flex items-center justify-center animate-pulse">
          <span className="text-white font-bold text-xl">E</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Educa Attendance</h1>
        <p className="text-gray-600 mb-4">
          {checking ? 'Verificando sesión...' : 'Redirigiendo...'}
        </p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        
        {/* Links de acceso directo si tarda mucho */}
        <div className="mt-8 space-x-4 text-sm">
          <button
            onClick={() => router.push('/auth/login')}
            className="text-blue-600 hover:underline"
          >
            Ir a Login
          </button>
          <button
            onClick={() => router.push('/auth-test')}
            className="text-green-600 hover:underline"
          >
            Probar Autenticación
          </button>
        </div>
      </div>
    </div>
  );
}
