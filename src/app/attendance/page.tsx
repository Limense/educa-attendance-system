'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/client';

interface Employee {
  id: string;
  full_name: string;
  email: string;
  role: string;
  organization_id: string;
}

interface AttendanceRecord {
  id: string;
  attendance_date: string;
  check_in_time: string;
  check_out_time?: string;
  status: string;
  work_hours: number;
}

export default function AttendancePage() {
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [recentAttendances, setRecentAttendances] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Cambiar título de la página
    document.title = "Registro de Asistencias - Educa Attendance";
    
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      const supabase = createSupabaseClient();
      
      // Verificar autenticación
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        router.push('/auth/login');
        return;
      }

      // Obtener datos del empleado
      const { data: empData, error: empError } = await supabase
        .from('employees')
        .select('id, full_name, email, role, organization_id')
        .eq('email', session.user.email)
        .eq('is_active', true)
        .single();

      if (empError || !empData) {
        setError('No se encontraron datos del empleado');
        return;
      }

      setEmployee(empData);

      // Cargar asistencia de hoy
      await loadTodayAttendance(empData.id);
      
      // Cargar asistencias recientes
      await loadRecentAttendances(empData.id);

    } catch (err) {
      console.error('Error cargando datos:', err);
      setError('Error cargando datos del usuario');
    } finally {
      setLoading(false);
    }
  };

  const loadTodayAttendance = async (employeeId: string) => {
    const supabase = createSupabaseClient();
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('attendances')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('attendance_date', today)
      .single();

    if (!error && data) {
      setTodayAttendance(data);
    }
  };

  const loadRecentAttendances = async (employeeId: string) => {
    const supabase = createSupabaseClient();

    const { data, error } = await supabase
      .from('attendances')
      .select('*')
      .eq('employee_id', employeeId)
      .order('attendance_date', { ascending: false })
      .limit(7);

    if (!error && data) {
      setRecentAttendances(data);
    }
  };

  const handleCheckIn = async () => {
    if (!employee) return;

    setActionLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseClient();
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      const attendanceData = {
        employee_id: employee.id,
        organization_id: employee.organization_id,
        attendance_date: today,
        check_in_time: now.toISOString(),
        status: 'present',
        work_hours: 0,
        break_duration: 0,
        overtime_hours: 0
      };

      const { data, error } = await supabase
        .from('attendances')
        .insert(attendanceData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setTodayAttendance(data);
      await loadRecentAttendances(employee.id);

    } catch (err) {
      console.error('Error en check-in:', err);
      setError(err instanceof Error ? err.message : 'Error registrando entrada');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!employee || !todayAttendance) return;

    setActionLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseClient();
      const now = new Date();
      const checkInTime = new Date(todayAttendance.check_in_time);
      const workHours = (now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

      const { data, error } = await supabase
        .from('attendances')
        .update({
          check_out_time: now.toISOString(),
          work_hours: Math.round(workHours * 100) / 100
        })
        .eq('id', todayAttendance.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setTodayAttendance(data);
      await loadRecentAttendances(employee.id);

    } catch (err) {
      console.error('Error en check-out:', err);
      setError(err instanceof Error ? err.message : 'Error registrando salida');
    } finally {
      setActionLoading(false);
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando sistema de asistencias...</p>
        </div>
      </div>
    );
  }

  if (error && !employee) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <h2 className="font-bold mb-2">❌ Error</h2>
            <p>{error}</p>
          </div>
          <button
            onClick={() => router.push('/auth/login')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Volver al Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🕐 Control de Asistencias</h1>
              <p className="text-gray-600 mt-1">
                Bienvenido, <span className="font-medium">{employee?.full_name}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">
                {new Date().toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </p>
              <p className="text-sm text-gray-500">
                {formatDate(new Date().toISOString())}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Error Alert */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <p>{error}</p>
          </div>
        )}

        {/* Check In/Out Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">📅 Registro del día de hoy</h2>
          
          {!todayAttendance ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚪</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">¡Registra tu entrada!</h3>
              <p className="text-gray-600 mb-6">Marca tu llegada para comenzar el día laboral</p>
              <button
                onClick={handleCheckIn}
                disabled={actionLoading}
                className="bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Registrando...' : '✅ Marcar Entrada'}
              </button>
            </div>
          ) : !todayAttendance.check_out_time ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⏰</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Sesión activa</h3>
              <p className="text-gray-600 mb-2">
                Entrada registrada a las <span className="font-medium">{formatTime(todayAttendance.check_in_time)}</span>
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Tiempo transcurrido: {Math.floor((new Date().getTime() - new Date(todayAttendance.check_in_time).getTime()) / (1000 * 60))} minutos
              </p>
              <button
                onClick={handleCheckOut}
                disabled={actionLoading}
                className="bg-red-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Registrando...' : '🚪 Marcar Salida'}
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✅</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Jornada completada</h3>
              <div className="text-gray-600 space-y-1">
                <p>Entrada: <span className="font-medium">{formatTime(todayAttendance.check_in_time)}</span></p>
                <p>Salida: <span className="font-medium">{formatTime(todayAttendance.check_out_time)}</span></p>
                <p>Horas trabajadas: <span className="font-medium">{todayAttendance.work_hours}h</span></p>
              </div>
            </div>
          )}
        </div>

        {/* Recent Attendances */}
        {recentAttendances.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">📊 Asistencias recientes</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Fecha</th>
                    <th className="text-left py-2">Entrada</th>
                    <th className="text-left py-2">Salida</th>
                    <th className="text-left py-2">Horas</th>
                    <th className="text-left py-2">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAttendances.map((attendance) => (
                    <tr key={attendance.id} className="border-b">
                      <td className="py-2">{new Date(attendance.attendance_date).toLocaleDateString('es-ES')}</td>
                      <td className="py-2">{formatTime(attendance.check_in_time)}</td>
                      <td className="py-2">{attendance.check_out_time ? formatTime(attendance.check_out_time) : '-'}</td>
                      <td className="py-2">{attendance.work_hours}h</td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          attendance.status === 'present' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {attendance.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 text-center space-x-4">
          <button
            onClick={() => router.push('/dashboard/employee')}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            🏠 Volver al Dashboard
          </button>
          <button
            onClick={() => window.location.reload()}
            className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700"
          >
            🔄 Actualizar
          </button>
        </div>
      </div>
    </div>
  );
}
