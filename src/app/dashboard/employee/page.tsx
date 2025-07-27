'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/client';
import { Employee } from '@/types/database';

export default function EmployeeDashboard() {
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayAttendance, setTodayAttendance] = useState<any>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadEmployeeData();
    loadTodayAttendance();
  }, []);

  const loadEmployeeData = async () => {
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

      setEmployee(employeeData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTodayAttendance = async () => {
    try {
      const supabase = createSupabaseClient();
      const today = new Date().toISOString().split('T')[0];
      
      const { data } = await supabase
        .from('attendances')
        .select('*')
        .eq('employee_id', employee?.id)
        .eq('date', today)
        .single();

      setTodayAttendance(data);
    } catch (error) {
      console.error('Error loading attendance:', error);
    }
  };

  const handleCheckIn = async () => {
    if (!employee) return;
    
    setCheckingIn(true);
    try {
      const supabase = createSupabaseClient();
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const time = now.toTimeString().split(' ')[0];

      const { data, error } = await supabase
        .from('attendances')
        .insert({
          employee_id: employee.id,
          organization_id: employee.organization_id,
          date: today,
          check_in_time: time,
          status: 'present'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      setTodayAttendance(data);
      alert('¡Check-in registrado exitosamente!');
    } catch (error) {
      console.error('Error en check-in:', error);
      alert('Error al registrar check-in');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    if (!employee || !todayAttendance) return;
    
    setCheckingIn(true);
    try {
      const supabase = createSupabaseClient();
      const now = new Date();
      const time = now.toTimeString().split(' ')[0];

      const { data, error } = await supabase
        .from('attendances')
        .update({
          check_out_time: time
        })
        .eq('id', todayAttendance.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setTodayAttendance(data);
      alert('¡Check-out registrado exitosamente!');
    } catch (error) {
      console.error('Error en check-out:', error);
      alert('Error al registrar check-out');
    } finally {
      setCheckingIn(false);
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
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Empleado</h1>
                <p className="text-sm text-gray-600">
                  Bienvenido, {employee?.full_name}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Current Time */}
          <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6 text-center">
              <h2 className="text-3xl font-bold text-gray-900">
                {currentTime.toLocaleTimeString('es-MX', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </h2>
              <p className="text-gray-600">
                {currentTime.toLocaleDateString('es-MX', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>

          {/* Employee Info */}
          <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Mi Información
              </h3>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Nombre Completo</dt>
                  <dd className="mt-1 text-sm text-gray-900">{employee?.full_name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{employee?.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Departamento</dt>
                  <dd className="mt-1 text-sm text-gray-900">{employee?.department?.name || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Posición</dt>
                  <dd className="mt-1 text-sm text-gray-900">{employee?.position?.title || 'N/A'}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Attendance Actions */}
          <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Registro de Asistencia - Hoy
              </h3>
              
              {todayAttendance ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-green-800">Entrada</p>
                      <p className="text-2xl font-bold text-green-900">
                        {todayAttendance.check_in_time || 'No registrada'}
                      </p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-blue-800">Salida</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {todayAttendance.check_out_time || 'Pendiente'}
                      </p>
                    </div>
                  </div>
                  
                  {!todayAttendance.check_out_time && (
                    <button
                      onClick={handleCheckOut}
                      disabled={checkingIn}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {checkingIn ? 'Registrando...' : '🚪 Registrar Salida'}
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-gray-600 mb-4">No has registrado tu entrada hoy</p>
                  <button
                    onClick={handleCheckIn}
                    disabled={checkingIn}
                    className="bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {checkingIn ? 'Registrando...' : '🕐 Registrar Entrada'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Acciones Rápidas
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button className="bg-gray-100 p-4 rounded-lg text-center hover:bg-gray-200">
                  <div className="text-2xl mb-2">📊</div>
                  <p className="text-sm font-medium">Ver Historial</p>
                </button>
                <button className="bg-gray-100 p-4 rounded-lg text-center hover:bg-gray-200">
                  <div className="text-2xl mb-2">📝</div>
                  <p className="text-sm font-medium">Solicitar Permiso</p>
                </button>
                <button className="bg-gray-100 p-4 rounded-lg text-center hover:bg-gray-200">
                  <div className="text-2xl mb-2">⚙️</div>
                  <p className="text-sm font-medium">Configuración</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
