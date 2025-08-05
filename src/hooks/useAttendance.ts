/**
 * =============================================
 * HOOK PARA GESTIÓN DE ASISTENCIAS
 * =============================================
 * 
 * Hook simplificado que funciona con el servicio restaurado
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { attendanceService, AttendanceResponse } from '@/services/attendance.service';

/**
 * Hook para gestión completa de asistencias
 */
export function useAttendance(employeeId?: string) {
  // Estados principales
  const [todayAttendance, setTodayAttendance] = useState<Record<string, unknown> | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Carga los datos de asistencia
   */
  const loadAttendanceData = useCallback(async () => {
    if (!employeeId) return;

    try {
      setLoading(true);

      // Cargar asistencia del día actual
      const today = await attendanceService.getTodayAttendance(employeeId);
      setTodayAttendance(today);

      // Cargar historial reciente
      const history = await attendanceService.getAttendanceHistory(employeeId, 30);
      setAttendanceHistory(history);

    } catch (error) {
      console.error('Error cargando datos de asistencia:', error);
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  /**
   * Carga datos cuando el empleado cambia
   */
  useEffect(() => {
    if (employeeId) {
      loadAttendanceData();
    }
  }, [employeeId, loadAttendanceData]);

  /**
   * Registra la entrada del empleado
   */
  const checkIn = useCallback(async (): Promise<AttendanceResponse> => {
    if (!employeeId) {
      return {
        success: false,
        message: 'ID de empleado no disponible'
      };
    }

    try {
      setIsProcessing(true);

      // Necesito obtener el organization_id del empleado
      // Por ahora uso el primer empleado del contexto como referencia
      const organizationId = await getEmployeeOrganizationId(employeeId);
      
      const result = await attendanceService.checkIn(employeeId, organizationId);
      
      if (result.success) {
        // Actualizar estado local
        setTodayAttendance(result.data || null);
        // Recargar datos
        await loadAttendanceData();
      }

      return result;
    } catch (error) {
      console.error('Error en check-in:', error);
      return {
        success: false,
        message: 'Error al registrar entrada'
      };
    } finally {
      setIsProcessing(false);
    }
  }, [employeeId, loadAttendanceData]);

  /**
   * Registra la salida del empleado
   */
  const checkOut = useCallback(async (): Promise<AttendanceResponse> => {
    if (!employeeId) {
      return {
        success: false,
        message: 'ID de empleado no disponible'
      };
    }

    try {
      setIsProcessing(true);
      const result = await attendanceService.checkOut(employeeId);
      
      if (result.success) {
        setTodayAttendance(result.data || null);
        await loadAttendanceData();
      }

      return result;
    } catch (error) {
      console.error('Error en check-out:', error);
      return {
        success: false,
        message: 'Error al registrar salida'
      };
    } finally {
      setIsProcessing(false);
    }
  }, [employeeId, loadAttendanceData]);

  /**
   * Obtiene la ubicación actual (stub para compatibilidad)
   */
  const getCurrentLocation = useCallback((): Promise<GeolocationPosition | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        () => resolve(null),
        { timeout: 5000 }
      );
    });
  }, []);

  /**
   * Verifica si el empleado puede hacer check-in
   */
  const canCheckIn = useCallback((): boolean => {
    return !todayAttendance?.check_in_time;
  }, [todayAttendance]);

  /**
   * Verifica si el empleado puede hacer check-out
   */
  const canCheckOut = useCallback((): boolean => {
    return !!(todayAttendance?.check_in_time && !todayAttendance?.check_out_time);
  }, [todayAttendance]);

  /**
   * Verifica si hay un descanso activo (stub para compatibilidad)
   */
  const hasActiveBreak = useCallback((): boolean => {
    return false; // Simplificado por ahora
  }, []);

  /**
   * Inicia un descanso (stub para compatibilidad)
   */
  const startBreak = useCallback(async (): Promise<AttendanceResponse> => {
    return {
      success: false,
      message: 'Función de descansos pendiente de implementar'
    };
  }, []);

  /**
   * Termina el descanso activo (stub para compatibilidad)
   */
  const endBreak = useCallback(async (): Promise<AttendanceResponse> => {
    return {
      success: false,
      message: 'Función de descansos pendiente de implementar'
    };
  }, []);

  return {
    // Estados
    todayAttendance,
    attendanceHistory,
    loading,
    isProcessing,

    // Acciones principales
    checkIn,
    checkOut,
    startBreak,
    endBreak,

    // Utilidades
    getCurrentLocation,
    canCheckIn,
    canCheckOut,
    hasActiveBreak,
    
    // Métodos de recarga
    refreshData: loadAttendanceData
  };
}

/**
 * Función auxiliar para obtener el organization_id del empleado
 */
async function getEmployeeOrganizationId(employeeId: string): Promise<string> {
  try {
    const { createSupabaseClient } = await import('@/lib/supabase/client');
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase
      .from('employees')
      .select('organization_id')
      .eq('id', employeeId)
      .single();

    if (error || !data) {
      throw new Error('No se pudo obtener la organización del empleado');
    }

    return data.organization_id;
  } catch (error) {
    console.error('Error obteniendo organization_id:', error);
    // Valor por defecto o error
    throw error;
  }
}
