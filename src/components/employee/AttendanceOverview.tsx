/**
 * =============================================
 * ATTENDANCE OVERVIEW COMPONENT
 * =============================================
 * 
 * Descripción: Vista principal de asistencia del empleado
 * Muestra el reloj, estado actual y acciones de check-in/check-out
 */

'use client';

import React, { useCallback } from 'react';
import { useAttendance } from '@/hooks/useAttendance';
import { 
  AttendanceClock
} from '@/components/attendance';

interface AttendanceOverviewProps {
  employeeId: string;
}

// Interfaz temporal para los datos de asistencia
interface TodayAttendanceData {
  check_in_time?: string;
  check_out_time?: string;
  status?: string;
}

/**
 * Hook para gestión de notificaciones
 */
const useNotifications = () => {
  const [message, setMessage] = React.useState<{
    text: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const showNotification = useCallback((text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  }, []);

  const clearNotification = useCallback(() => {
    setMessage(null);
  }, []);

  return { message, showNotification, clearNotification };
};

/**
 * Componente principal de la vista de asistencia
 */
export function AttendanceOverview({ employeeId }: AttendanceOverviewProps) {
  const { message, showNotification, clearNotification } = useNotifications();
  
  // Hook de asistencias
  const attendance = useAttendance(employeeId);

  /**
   * Maneja el check-in del empleado
   */
  const handleCheckIn = useCallback(async () => {
    try {
      const result = await attendance.checkIn();
      
      if (result.success) {
        showNotification('✅ Entrada registrada exitosamente', 'success');
      } else {
        showNotification(`❌ ${result.message}`, 'error');
      }
    } catch (error) {
      console.error('Error en check-in:', error);
      showNotification('❌ Error inesperado al registrar entrada', 'error');
    }
  }, [attendance, showNotification]);

  /**
   * Maneja el check-out del empleado
   */
  const handleCheckOut = useCallback(async () => {
    try {
      const result = await attendance.checkOut();
      
      if (result.success) {
        showNotification('✅ Salida registrada exitosamente', 'success');
      } else {
        showNotification(`❌ ${result.message}`, 'error');
      }
    } catch (error) {
      console.error('Error en check-out:', error);
      showNotification('❌ Error inesperado al registrar salida', 'error');
    }
  }, [attendance, showNotification]);

  /**
   * Maneja el inicio de descanso
   */
  const handleStartBreak = useCallback(async (breakType: 'lunch' | 'short_break' | 'personal' | 'medical' = 'short_break') => {
    try {
      console.log(`Descanso tipo ${breakType} no implementado`);
      showNotification('⏸️ Función de descanso no disponible temporalmente', 'info');
    } catch (error) {
      console.error('Error iniciando descanso:', error);
      showNotification('❌ Error inesperado al iniciar descanso', 'error');
    }
  }, [showNotification]);

  /**
   * Maneja el fin del descanso
   */
  const handleEndBreak = useCallback(async () => {
    try {
      const result = await attendance.endBreak();
      
      if (result.success) {
        showNotification('✅ Descanso terminado', 'success');
      } else {
        showNotification(`❌ ${result.message}`, 'error');
      }
    } catch (error) {
      console.error('Error terminando descanso:', error);
      showNotification('❌ Error inesperado al terminar descanso', 'error');
    }
  }, [attendance, showNotification]);

  // Loading state
  if (attendance.loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando información de asistencia...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Notificaciones */}
      {message && (
        <div className={`p-4 rounded-lg flex justify-between items-center ${
          message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
          message.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
          'bg-blue-100 text-blue-800 border border-blue-200'
        }`}>
          <span>{message.text}</span>
          <button
            onClick={clearNotification}
            className="ml-4 text-gray-600 hover:text-gray-900"
          >
            ✕
          </button>
        </div>
      )}

      {/* Primera fila: Reloj y resumen de hoy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reloj en tiempo real */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Hora Actual</h3>
          <AttendanceClock />
        </div>

        {/* Resumen del día */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen de Hoy</h3>
          {attendance.todayAttendance ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Entrada:</span>
                <span className="font-medium">
                  {(attendance.todayAttendance as TodayAttendanceData)?.check_in_time 
                    ? new Date((attendance.todayAttendance as TodayAttendanceData).check_in_time!).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'No registrada'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Salida:</span>
                <span className="font-medium">
                  {(attendance.todayAttendance as TodayAttendanceData)?.check_out_time 
                    ? new Date((attendance.todayAttendance as TodayAttendanceData).check_out_time!).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'No registrada'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Estado:</span>
                <span className={`font-medium ${
                  (attendance.todayAttendance as TodayAttendanceData)?.check_in_time && !(attendance.todayAttendance as TodayAttendanceData).check_out_time
                    ? 'text-green-600' 
                    : (attendance.todayAttendance as TodayAttendanceData)?.check_out_time 
                    ? 'text-blue-600' 
                    : 'text-gray-600'
                }`}>
                  {(attendance.todayAttendance as TodayAttendanceData)?.check_in_time && !(attendance.todayAttendance as TodayAttendanceData).check_out_time
                    ? 'Trabajando' 
                    : (attendance.todayAttendance as TodayAttendanceData)?.check_out_time 
                    ? 'Jornada completa' 
                    : 'No iniciado'}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No hay registro de asistencia hoy</p>
          )}
        </div>
      </div>

      {/* Segunda fila: Control de asistencia */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex gap-4">
          <button
            onClick={handleCheckIn}
            disabled={attendance.isProcessing}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            {attendance.isProcessing ? 'Procesando...' : '✅ Registrar Entrada'}
          </button>
          
          <button
            onClick={handleCheckOut}
            disabled={attendance.isProcessing}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            {attendance.isProcessing ? 'Procesando...' : '❌ Registrar Salida'}
          </button>
        </div>
      </div>

      {/* Tercera fila: Controles de descanso */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Control de Descansos</h3>
        
        {attendance.hasActiveBreak() ? (
          <div className="text-center">
            <div className="mb-4">
              <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-yellow-100 text-yellow-800">
                Descanso en curso
              </span>
            </div>
            <button
              onClick={handleEndBreak}
              disabled={attendance.isProcessing}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {attendance.isProcessing ? 'Procesando...' : 'Terminar Descanso'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => handleStartBreak('short_break')}
              disabled={attendance.isProcessing || !attendance.canCheckOut()}
              className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-center hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <div className="text-2xl mb-1">☕</div>
              <p className="text-xs font-medium text-blue-900">Descanso Corto</p>
            </button>
            
            <button
              onClick={() => handleStartBreak('lunch')}
              disabled={attendance.isProcessing || !attendance.canCheckOut()}
              className="bg-orange-50 border border-orange-200 p-3 rounded-lg text-center hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <div className="text-2xl mb-1">🍽️</div>
              <p className="text-xs font-medium text-orange-900">Almuerzo</p>
            </button>
            
            <button
              onClick={() => handleStartBreak('personal')}
              disabled={attendance.isProcessing || !attendance.canCheckOut()}
              className="bg-purple-50 border border-purple-200 p-3 rounded-lg text-center hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <div className="text-2xl mb-1">🚶</div>
              <p className="text-xs font-medium text-purple-900">Personal</p>
            </button>
            
            <button
              onClick={() => handleStartBreak('medical')}
              disabled={attendance.isProcessing || !attendance.canCheckOut()}
              className="bg-red-50 border border-red-200 p-3 rounded-lg text-center hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <div className="text-2xl mb-1">⚕️</div>
              <p className="text-xs font-medium text-red-900">Médico</p>
            </button>
          </div>
        )}
      </div>

      {/* Cuarta fila: Acciones rápidas */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button 
            onClick={attendance.refreshData}
            disabled={attendance.loading}
            className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-center hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <div className="text-3xl mb-2">🔄</div>
            <p className="text-sm font-medium text-blue-900">Refrescar Datos</p>
          </button>
          
          <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg text-center">
            <div className="text-3xl mb-2">📍</div>
            <p className="text-sm font-medium text-gray-700">Ubicación</p>
            <p className="text-xs text-gray-500 mt-1">
              {navigator.geolocation ? 'Disponible' : 'No disponible'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
