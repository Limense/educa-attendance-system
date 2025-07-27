/**
 * =============================================
 * HOOK PARA GESTIÓN DE ASISTENCIAS
 * =============================================
 * 
 * Descripción: Hook personalizado que encapsula la lógica de asistencias
 * Utiliza los servicios implementados con arquitectura escalable
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { EmployeeRepository } from '@/repositories/employee.repository';
import { AttendanceService, type AttendanceResponse, type AttendanceStats, BreakType } from '@/services/attendance.service';
import { Logger } from '@/utils/logger';
import type { Attendance } from '@/types/database';

/**
 * Hook para gestión completa de asistencias
 */
export function useAttendance(employeeId: string | null) {
  // Estados principales
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<Attendance[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Servicios
  const [attendanceService, setAttendanceService] = useState<AttendanceService | null>(null);
  
  // Logger estático para evitar dependencias en hooks
  const logger = new Logger('useAttendance');

  /**
   * Inicializa los servicios necesarios
   */
  useEffect(() => {
    const initializeServices = async () => {
      try {
        const employeeRepo = new EmployeeRepository();
        const service = new AttendanceService(employeeRepo);
        setAttendanceService(service);
      } catch (error) {
        logger.error('Error inicializando servicios', { error });
      }
    };

    initializeServices();
  }, []);

  /**
   * Carga los datos de asistencia cuando el servicio está listo
   */
  useEffect(() => {
    if (attendanceService && employeeId) {
      loadAttendanceData();
    }
  }, [attendanceService, employeeId]);

  /**
   * Carga todos los datos de asistencia
   */
  const loadAttendanceData = useCallback(async () => {
    if (!attendanceService || !employeeId) return;

    try {
      setLoading(true);

      // Cargar asistencia del día actual
      const today = await attendanceService.getTodayAttendance(employeeId);
      setTodayAttendance(today);

      // Cargar historial reciente (últimos 30 días)
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const history = await attendanceService.getAttendanceHistory(employeeId, {
        startDate,
        endDate,
        limit: 30
      });
      setAttendanceHistory(history);

      // Cargar estadísticas del mes
      const monthStats = await attendanceService.getEmployeeAttendanceStats(employeeId, {
        startDate,
        endDate
      });
      setStats(monthStats);

    } catch (error) {
      logger.error('Error cargando datos de asistencia', { employeeId, error });
    } finally {
      setLoading(false);
    }
  }, [attendanceService, employeeId]);

  /**
   * Registra la entrada del empleado
   */
  const checkIn = useCallback(async (location?: GeolocationPosition): Promise<AttendanceResponse> => {
    if (!attendanceService || !employeeId) {
      return {
        success: false,
        message: 'Servicio no disponible'
      };
    }

    try {
      setIsProcessing(true);
      logger.info('Iniciando check-in', { employeeId });

      const locationData = location ? {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: new Date().toISOString()
      } : undefined;

      const result = await attendanceService.checkIn(employeeId, locationData);
      
      if (result.success) {
        // Actualizar estado local
        setTodayAttendance(result.attendance || null);
        // Recargar datos para mantener sincronización
        await loadAttendanceData();
      }

      return result;
    } catch (error) {
      logger.error('Error en check-in', { employeeId, error });
      return {
        success: false,
        message: 'Error al registrar entrada'
      };
    } finally {
      setIsProcessing(false);
    }
  }, [attendanceService, employeeId, loadAttendanceData]);

  /**
   * Registra la salida del empleado
   */
  const checkOut = useCallback(async (location?: GeolocationPosition): Promise<AttendanceResponse> => {
    if (!attendanceService || !employeeId) {
      return {
        success: false,
        message: 'Servicio no disponible'
      };
    }

    try {
      setIsProcessing(true);
      logger.info('Iniciando check-out', { employeeId });

      const locationData = location ? {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: new Date().toISOString()
      } : undefined;

      const result = await attendanceService.checkOut(employeeId, locationData);
      
      if (result.success) {
        setTodayAttendance(result.attendance || null);
        await loadAttendanceData();
      }

      return result;
    } catch (error) {
      logger.error('Error en check-out', { employeeId, error });
      return {
        success: false,
        message: 'Error al registrar salida'
      };
    } finally {
      setIsProcessing(false);
    }
  }, [attendanceService, employeeId, loadAttendanceData]);

  /**
   * Inicia un descanso
   */
  const startBreak = useCallback(async (breakType: 'lunch' | 'short_break' | 'personal' | 'medical' = 'short_break'): Promise<AttendanceResponse> => {
    if (!attendanceService || !employeeId) {
      return {
        success: false,
        message: 'Servicio no disponible'
      };
    }

    try {
      setIsProcessing(true);
      // Mapear tipos al enum correcto
      const mappedBreakType = breakType as BreakType;
      const result = await attendanceService.registerBreak(employeeId, mappedBreakType);
      
      if (result.success) {
        setTodayAttendance(result.attendance || null);
      }

      return result;
    } catch (error) {
      logger.error('Error iniciando descanso', { employeeId, breakType, error });
      return {
        success: false,
        message: 'Error al iniciar descanso'
      };
    } finally {
      setIsProcessing(false);
    }
  }, [attendanceService, employeeId, logger]);

  /**
   * Termina el descanso activo
   */
  const endBreak = useCallback(async (): Promise<AttendanceResponse> => {
    if (!attendanceService || !employeeId) {
      return {
        success: false,
        message: 'Servicio no disponible'
      };
    }

    try {
      setIsProcessing(true);
      const result = await attendanceService.endBreak(employeeId);
      
      if (result.success) {
        setTodayAttendance(result.attendance || null);
      }

      return result;
    } catch (error) {
      logger.error('Error terminando descanso', { employeeId, error });
      return {
        success: false,
        message: 'Error al terminar descanso'
      };
    } finally {
      setIsProcessing(false);
    }
  }, [attendanceService, employeeId]);

  /**
   * Obtiene la ubicación actual del usuario
   */
  const getCurrentLocation = useCallback((): Promise<GeolocationPosition | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        logger.warn('Geolocalización no disponible');
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          logger.debug('Ubicación obtenida', {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          resolve(position);
        },
        (error) => {
          logger.warn('Error obteniendo ubicación', { error: error.message });
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutos
        }
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
   * Verifica si hay un descanso activo
   */
  const hasActiveBreak = useCallback((): boolean => {
    if (!todayAttendance?.breaks) return false;
    return todayAttendance.breaks.some(b => !b.end_time);
  }, [todayAttendance]);

  return {
    // Estados
    todayAttendance,
    attendanceHistory,
    stats,
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
