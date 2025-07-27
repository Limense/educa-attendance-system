/**
 * =============================================
 * HOOK SIMPLIFICADO PARA ASISTENCIAS
 * =============================================
 * 
 * Descripción: Hook limpio sin problemas de dependencias
 * Utiliza los servicios con arquitectura escalable
 */

'use client';

import { useState, useEffect } from 'react';
import { EmployeeRepository } from '@/repositories/employee.repository';
import { AttendanceService } from '@/services/attendance.service';
import type { Attendance } from '@/types/database';

/**
 * Resultado de operaciones de asistencia
 */
export interface AttendanceResult {
  success: boolean;
  message: string;
  attendance?: Attendance;
}

/**
 * Hook simplificado para gestión de asistencias
 */
export function useAttendance(employeeId: string | null) {
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Inicializar servicios
  const attendanceService = new AttendanceService(new EmployeeRepository());

  /**
   * Cargar asistencia del día actual
   */
  const loadTodayAttendance = async () => {
    if (!employeeId) return;

    try {
      setLoading(true);
      const today = await attendanceService.getTodayAttendance(employeeId);
      setTodayAttendance(today);
    } catch (error) {
      console.error('Error cargando asistencia:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Efecto para cargar datos iniciales
   */
  useEffect(() => {
    if (employeeId) {
      loadTodayAttendance();
    }
  }, [employeeId]);

  /**
   * Registrar entrada
   */
  const checkIn = async (): Promise<AttendanceResult> => {
    if (!employeeId || isProcessing) {
      return { success: false, message: 'No disponible' };
    }

    try {
      setIsProcessing(true);
      const result = await attendanceService.checkIn(employeeId);
      
      if (result.success && result.attendance) {
        setTodayAttendance(result.attendance);
      }

      return {
        success: result.success,
        message: result.message,
        attendance: result.attendance
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error al registrar entrada'
      };
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Registrar salida
   */
  const checkOut = async (): Promise<AttendanceResult> => {
    if (!employeeId || isProcessing) {
      return { success: false, message: 'No disponible' };
    }

    try {
      setIsProcessing(true);
      const result = await attendanceService.checkOut(employeeId);
      
      if (result.success && result.attendance) {
        setTodayAttendance(result.attendance);
      }

      return {
        success: result.success,
        message: result.message,
        attendance: result.attendance
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error al registrar salida'
      };
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Verificar si puede hacer check-in
   */
  const canCheckIn = (): boolean => {
    return !todayAttendance?.check_in_time;
  };

  /**
   * Verificar si puede hacer check-out
   */
  const canCheckOut = (): boolean => {
    return !!(todayAttendance?.check_in_time && !todayAttendance?.check_out_time);
  };

  /**
   * Obtener estado actual
   */
  const getAttendanceStatus = (): string => {
    if (!todayAttendance) return 'Sin registro';
    if (!todayAttendance.check_in_time) return 'Pendiente entrada';
    if (!todayAttendance.check_out_time) return 'En trabajo';
    return 'Jornada completada';
  };

  return {
    // Estados
    todayAttendance,
    loading,
    isProcessing,

    // Acciones
    checkIn,
    checkOut,

    // Utilidades
    canCheckIn,
    canCheckOut,
    getAttendanceStatus,
    refreshData: loadTodayAttendance
  };
}
