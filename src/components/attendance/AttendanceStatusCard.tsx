/**
 * =============================================
 * ATTENDANCE STATUS CARD COMPONENT
 * =============================================
 * 
 * Descripción: Tarjeta que muestra el estado actual de asistencia del empleado
 * Implementa Strategy Pattern para diferentes estados de asistencia
 * 
 * Responsabilidades:
 * - Mostrar entrada y salida del día
 * - Calcular horas trabajadas
 * - Mostrar estado visual apropiado
 * - Botones de acción contextual
 */

'use client';

import React, { useMemo } from 'react';
import type { Attendance } from '@/types/database';

interface AttendanceStatusCardProps {
  /** Registro de asistencia del día actual */
  todayAttendance: Attendance | null;
  /** Función para registrar entrada */
  onCheckIn: () => void;
  /** Función para registrar salida */
  onCheckOut: () => void;
  /** Estado de carga para operaciones */
  isProcessing: boolean;
  /** Clases CSS adicionales */
  className?: string;
}

/**
 * Estrategia para calcular el estado de la asistencia
 */
class AttendanceStatusStrategy {
  /**
   * Calcula las horas trabajadas entre entrada y salida
   */
  static calculateWorkedHours(checkIn: string, checkOut?: string): number {
    if (!checkOut) return 0;
    
    const startTime = new Date(checkIn);
    const endTime = new Date(checkOut);
    const diffMs = endTime.getTime() - startTime.getTime();
    
    return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // Redondear a 2 decimales
  }

  /**
   * Formatea el tiempo para mostrar
   */
  static formatDisplayTime(isoString: string): string {
    return new Date(isoString).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Determina el estado visual de la asistencia
   */
  static getAttendanceStatus(attendance: Attendance | null): {
    status: 'not-started' | 'in-progress' | 'completed';
    message: string;
    color: 'gray' | 'blue' | 'green';
  } {
    if (!attendance || !attendance.check_in_time) {
      return {
        status: 'not-started',
        message: 'No has registrado tu entrada hoy',
        color: 'gray'
      };
    }

    if (!attendance.check_out_time) {
      return {
        status: 'in-progress',
        message: 'Jornada en progreso',
        color: 'blue'
      };
    }

    return {
      status: 'completed',
      message: 'Jornada completada',
      color: 'green'
    };
  }
}

/**
 * Componente de tarjeta de estado de asistencia
 */
export const AttendanceStatusCard: React.FC<AttendanceStatusCardProps> = ({
  todayAttendance,
  onCheckIn,
  onCheckOut,
  isProcessing,
  className = ''
}) => {
  // Calcular estado usando la estrategia
  const attendanceStatus = useMemo(() => 
    AttendanceStatusStrategy.getAttendanceStatus(todayAttendance),
    [todayAttendance]
  );

  // Calcular horas trabajadas
  const workedHours = useMemo(() => {
    if (!todayAttendance?.check_in_time) return 0;
    return AttendanceStatusStrategy.calculateWorkedHours(
      todayAttendance.check_in_time,
      todayAttendance.check_out_time || undefined
    );
  }, [todayAttendance]);

  // Renderizar según el estado
  const renderContent = () => {
    switch (attendanceStatus.status) {
      case 'not-started':
        return (
          <div className="text-center">
            <div className="mb-4">
              <div className="text-6xl mb-2">🕐</div>
              <p className="text-gray-600">{attendanceStatus.message}</p>
            </div>
            <button
              onClick={onCheckIn}
              disabled={isProcessing}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
            >
              {isProcessing ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Registrando...
                </span>
              ) : (
                '🚪 Registrar Entrada'
              )}
            </button>
          </div>
        );

      case 'in-progress':
      case 'completed':
        return (
          <div className="space-y-6">
            {/* Estado visual */}
            <div className="text-center">
              <div className="text-4xl mb-2">
                {attendanceStatus.status === 'in-progress' ? '⏱️' : '✅'}
              </div>
              <p className={`text-sm font-medium ${
                attendanceStatus.color === 'blue' ? 'text-blue-600' : 'text-green-600'
              }`}>
                {attendanceStatus.message}
              </p>
            </div>

            {/* Información de tiempos */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-sm font-medium text-green-800 mb-1">Entrada</div>
                  <div className="text-xl font-bold text-green-900">
                    {todayAttendance?.check_in_time 
                      ? AttendanceStatusStrategy.formatDisplayTime(todayAttendance.check_in_time)
                      : '--:--'
                    }
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-sm font-medium text-blue-800 mb-1">Salida</div>
                  <div className="text-xl font-bold text-blue-900">
                    {todayAttendance?.check_out_time 
                      ? AttendanceStatusStrategy.formatDisplayTime(todayAttendance.check_out_time)
                      : '--:--'
                    }
                  </div>
                </div>
              </div>
            </div>

            {/* Horas trabajadas */}
            {workedHours > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-600 mb-1">Horas Trabajadas</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {workedHours}h
                  </div>
                </div>
              </div>
            )}

            {/* Botón de acción */}
            {attendanceStatus.status === 'in-progress' && (
              <button
                onClick={onCheckOut}
                disabled={isProcessing}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Registrando...
                  </span>
                ) : (
                  '🚪 Registrar Salida'
                )}
              </button>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Registro de Asistencia - Hoy
        </h3>
        <p className="text-sm text-gray-500">
          {new Date().toLocaleDateString('es-MX', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
          })}
        </p>
      </div>
      
      {renderContent()}
    </div>
  );
};

export default AttendanceStatusCard;
