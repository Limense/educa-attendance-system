'use client';

import { useState, useEffect } from 'react';
import { attendanceService } from '@/services/attendance.service';
import { createSupabaseClient } from '@/lib/supabase/client';

interface TestEmployee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  organization_id: string;
  role: string;
}

interface TestAttendance {
  id: string;
  status: string;
  check_in_time?: string;
  check_out_time?: string;
  work_hours?: number;
}

export default function TestAttendancePage() {
  const [employee, setEmployee] = useState<TestEmployee | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<TestAttendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    loadTestData();
  }, []);

  const loadTestData = async () => {
    try {
      const supabase = createSupabaseClient();
      
      // Obtener primer empleado activo
      const { data: employees } = await supabase
        .from('employees')
        .select('id, first_name, last_name, email, organization_id, role')
        .eq('is_active', true)
        .eq('role', 'employee')
        .limit(1);

      if (employees && employees.length > 0) {
        const emp = employees[0] as TestEmployee;
        setEmployee(emp);
        
        // Cargar asistencia del día
        const attendance = await attendanceService.getTodayAttendance(emp.id);
        setTodayAttendance((attendance as unknown as TestAttendance) || null);
      }
    } catch (error) {
      console.error('Error cargando datos de prueba:', error);
      setMessage('Error cargando datos de prueba');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!employee) return;
    
    try {
      setProcessing(true);
      const result = await attendanceService.checkIn(employee.id, employee.organization_id);
      
      if (result.success) {
        setMessage('✅ ' + result.message);
        setTodayAttendance((result.data as unknown as TestAttendance) || null);
      } else {
        setMessage('❌ ' + result.message);
      }
    } catch (error) {
      console.error('Error en check-in:', error);
      setMessage('❌ Error inesperado en check-in');
    } finally {
      setProcessing(false);
    }
  };

  const handleCheckOut = async () => {
    if (!employee) return;
    
    try {
      setProcessing(true);
      const result = await attendanceService.checkOut(employee.id);
      
      if (result.success) {
        setMessage('✅ ' + result.message);
        setTodayAttendance((result.data as unknown as TestAttendance) || null);
      } else {
        setMessage('❌ ' + result.message);
      }
    } catch (error) {
      console.error('Error en check-out:', error);
      setMessage('❌ Error inesperado en check-out');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Cargando prueba de asistencias...</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">No se encontró un empleado de prueba</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🧪 Prueba de Sistema de Asistencias
        </h1>

        {/* Información del empleado de prueba */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Empleado de Prueba</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Nombre:</strong> {employee.first_name} {employee.last_name}
            </div>
            <div>
              <strong>Email:</strong> {employee.email}
            </div>
            <div>
              <strong>ID:</strong> {employee.id}
            </div>
            <div>
              <strong>Rol:</strong> {employee.role}
            </div>
          </div>
        </div>

        {/* Mensaje de estado */}
        {message && (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-6">
            {message}
          </div>
        )}

        {/* Estado actual de asistencia */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Estado Actual - {new Date().toLocaleDateString()}</h2>
          
          {todayAttendance ? (
            <div className="space-y-2">
              <div><strong>ID Asistencia:</strong> {todayAttendance.id}</div>
              <div><strong>Estado:</strong> {todayAttendance.status}</div>
              <div>
                <strong>Entrada:</strong> {
                  todayAttendance.check_in_time 
                    ? new Date(todayAttendance.check_in_time).toLocaleString()
                    : 'No registrada'
                }
              </div>
              <div>
                <strong>Salida:</strong> {
                  todayAttendance.check_out_time 
                    ? new Date(todayAttendance.check_out_time).toLocaleString()
                    : 'No registrada'
                }
              </div>
              {todayAttendance.work_hours && (
                <div><strong>Horas trabajadas:</strong> {todayAttendance.work_hours}</div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">No hay registro de asistencia para hoy</p>
          )}
        </div>

        {/* Botones de prueba */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Acciones de Prueba</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleCheckIn}
              disabled={processing || (!!todayAttendance?.check_in_time && !todayAttendance?.check_out_time)}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? 'Procesando...' : '🚪 Registrar Entrada'}
            </button>

            <button
              onClick={handleCheckOut}
              disabled={processing || !todayAttendance?.check_in_time || !!todayAttendance?.check_out_time}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? 'Procesando...' : '🚪 Registrar Salida'}
            </button>

            <button
              onClick={loadTestData}
              disabled={processing}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🔄 Recargar Datos
            </button>

            <button
              onClick={() => window.open('/dashboard/employee', '_blank')}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700"
            >
              👤 Dashboard Empleado
            </button>
          </div>
        </div>

        {/* Información de debugging */}
        <div className="bg-gray-100 rounded-lg p-4 mt-6">
          <details>
            <summary className="cursor-pointer font-medium">🔍 Información de Debug</summary>
            <div className="mt-4 space-y-2 text-sm">
              <div><strong>Empleado ID:</strong> {employee.id}</div>
              <div><strong>Organization ID:</strong> {employee.organization_id}</div>
              <div><strong>Fecha actual:</strong> {new Date().toISOString().split('T')[0]}</div>
              <div><strong>Hora actual:</strong> {new Date().toLocaleTimeString()}</div>
              <div><strong>Timezone:</strong> {Intl.DateTimeFormat().resolvedOptions().timeZone}</div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
