'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/client';
import { Employee } from '@/types/database';

export default function AdminDashboard() {
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    lateToday: 0,
    absentToday: 0
  });
  const [recentAttendances, setRecentAttendances] = useState<any[]>([]);

  useEffect(() => {
    loadAdminData();
    loadStats();
    loadRecentAttendances();
  }, []);

  const loadAdminData = async () => {
    try {
      const supabase = createSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data: employeeData, error } = await supabase
        .from('employees')
        .select(`
          *,
          department:departments(name),
          position:positions(title)
        `)
        .eq('email', user.email)
        .single();

      if (error || !employeeData) {
        console.error('Error loading employee:', error);
        router.push('/auth/login');
        return;
      }

      // Verificar que sea admin
      if (!['admin', 'super_admin'].includes(employeeData.role)) {
        router.push('/dashboard/employee');
        return;
      }

      setEmployee(employeeData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const supabase = createSupabaseClient();
      const today = new Date().toISOString().split('T')[0];

      // Total empleados
      const { count: totalEmployees } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Asistencias de hoy
      const { data: todayAttendances } = await supabase
        .from('attendances')
        .select('*')
        .eq('date', today);

      const presentToday = todayAttendances?.length || 0;
      const lateToday = todayAttendances?.filter(a => a.status === 'late').length || 0;
      const absentToday = (totalEmployees || 0) - presentToday;

      setStats({
        totalEmployees: totalEmployees || 0,
        presentToday,
        lateToday,
        absentToday
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadRecentAttendances = async () => {
    try {
      const supabase = createSupabaseClient();
      
      const { data } = await supabase
        .from('attendances')
        .select(`
          *,
          employee:employees(full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      setRecentAttendances(data || []);
    } catch (error) {
      console.error('Error loading recent attendances:', error);
    }
  };

  const handleLogout = async () => {
    const supabase = createSupabaseClient();
    await supabase.auth.signOut();
    localStorage.removeItem('currentEmployee');
    router.push('/auth/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center mr-4">
                <span className="text-white font-bold">E</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Administrador</h1>
                <p className="text-sm text-gray-600">
                  Bienvenido, {employee?.full_name}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                {employee?.role?.toUpperCase()}
              </span>
              <button
                onClick={handleLogout}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-3xl">👥</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Empleados
                      </dt>
                      <dd className="text-3xl font-bold text-gray-900">
                        {stats.totalEmployees}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-3xl">✅</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Presentes Hoy
                      </dt>
                      <dd className="text-3xl font-bold text-green-600">
                        {stats.presentToday}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-3xl">⏰</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Llegadas Tarde
                      </dt>
                      <dd className="text-3xl font-bold text-yellow-600">
                        {stats.lateToday}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-3xl">❌</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Ausentes Hoy
                      </dt>
                      <dd className="text-3xl font-bold text-red-600">
                        {stats.absentToday}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Acciones Rápidas
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button className="bg-blue-50 p-4 rounded-lg text-center hover:bg-blue-100 border border-blue-200">
                  <div className="text-3xl mb-2">👥</div>
                  <p className="text-sm font-medium text-blue-700">Gestionar Empleados</p>
                </button>
                <button className="bg-green-50 p-4 rounded-lg text-center hover:bg-green-100 border border-green-200">
                  <div className="text-3xl mb-2">📊</div>
                  <p className="text-sm font-medium text-green-700">Reportes</p>
                </button>
                <button className="bg-purple-50 p-4 rounded-lg text-center hover:bg-purple-100 border border-purple-200">
                  <div className="text-3xl mb-2">🏢</div>
                  <p className="text-sm font-medium text-purple-700">Departamentos</p>
                </button>
                <button className="bg-orange-50 p-4 rounded-lg text-center hover:bg-orange-100 border border-orange-200">
                  <div className="text-3xl mb-2">⚙️</div>
                  <p className="text-sm font-medium text-orange-700">Configuración</p>
                </button>
              </div>
            </div>
          </div>

          {/* Recent Attendances */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Asistencias Recientes
              </h3>
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Empleado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Entrada
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Salida
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentAttendances.map((attendance) => (
                      <tr key={attendance.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {attendance.employee?.full_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(attendance.date).toLocaleDateString('es-MX')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {attendance.check_in_time || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {attendance.check_out_time || 'Pendiente'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            attendance.status === 'present' 
                              ? 'bg-green-100 text-green-800'
                              : attendance.status === 'late'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {attendance.status === 'present' ? 'Presente' : 
                             attendance.status === 'late' ? 'Tarde' : 'Ausente'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {recentAttendances.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No hay asistencias registradas
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
