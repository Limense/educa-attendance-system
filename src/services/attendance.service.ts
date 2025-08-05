/**
 * =============================================
 * ATTENDANCE SERVICE - GESTIÓN DE ASISTENCIAS
 * =============================================
 * 
 * Servicio simplificado que funciona con el esquema real de Supabase
 * Restaura la funcionalidad que funcionaba anteriormente
 */

import { createSupabaseClient } from '@/lib/supabase/client';

/**
 * Interface para respuestas de operaciones de asistencia
 */
export interface AttendanceResponse {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

/**
 * Servicio para gestión de asistencias - Versión funcional simplificada
 */
export class AttendanceService {
  /**
   * Registra la entrada del empleado
   */
  async checkIn(employeeId: string, organizationId: string): Promise<AttendanceResponse> {
    try {
      const supabase = createSupabaseClient();
      
      // Usar fecha/hora local en vez de UTC
      const now = new Date();
      const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
      const today = localDateTime.toISOString().split('T')[0];

      // Verificar si ya hay entrada registrada hoy
      const { data: existing } = await supabase
        .from('attendances')
        .select('id, check_in_time')
        .eq('employee_id', employeeId)
        .eq('attendance_date', today)
        .single();

      if (existing && existing.check_in_time) {
        return {
          success: false,
          message: 'Ya has registrado tu entrada hoy'
        };
      }

      // Registrar nueva entrada o actualizar registro existente
      const attendanceData = {
        employee_id: employeeId,
        organization_id: organizationId,
        attendance_date: today,
        check_in_time: localDateTime.toISOString(),
        status: 'present',
        work_hours: 0,
        break_duration: 0,
        overtime_hours: 0,
        location_data: null, // Se puede agregar geolocalización después
        created_at: localDateTime.toISOString(),
        updated_at: localDateTime.toISOString()
      };

      let result;
      
      if (existing) {
        // Actualizar registro existente
        result = await supabase
          .from('attendances')
          .update({
            check_in_time: localDateTime.toISOString(),
            status: 'present',
            updated_at: localDateTime.toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single();
      } else {
        // Crear nuevo registro
        result = await supabase
          .from('attendances')
          .insert(attendanceData)
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      return {
        success: true,
        message: 'Entrada registrada exitosamente',
        data: result.data
      };

    } catch (error) {
      console.error('Error en check-in:', error);
      return {
        success: false,
        message: 'Error al registrar entrada'
      };
    }
  }

  /**
   * Registra la salida del empleado
   */
  async checkOut(employeeId: string): Promise<AttendanceResponse> {
    try {
      const supabase = createSupabaseClient();
      
      // Usar fecha/hora local en vez de UTC
      const now = new Date();
      const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
      const today = localDateTime.toISOString().split('T')[0];

      // Buscar registro de entrada del día
      const { data: attendance, error: fetchError } = await supabase
        .from('attendances')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('attendance_date', today)
        .single();

      if (fetchError || !attendance) {
        return {
          success: false,
          message: 'No se encontró registro de entrada para hoy'
        };
      }

      if (!attendance.check_in_time) {
        return {
          success: false,
          message: 'Debes registrar tu entrada primero'
        };
      }

      if (attendance.check_out_time) {
        return {
          success: false,
          message: 'Ya has registrado tu salida hoy'
        };
      }

      // Calcular horas trabajadas
      const checkInTime = new Date(attendance.check_in_time);
      const workHours = (localDateTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

      // Actualizar registro con salida
      const { data, error } = await supabase
        .from('attendances')
        .update({
          check_out_time: localDateTime.toISOString(),
          work_hours: Math.round(workHours * 100) / 100,
          status: 'present',
          updated_at: localDateTime.toISOString()
        })
        .eq('id', attendance.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        message: `Salida registrada. Trabajaste ${Math.round(workHours * 100) / 100} horas`,
        data
      };

    } catch (error) {
      console.error('Error en check-out:', error);
      return {
        success: false,
        message: 'Error al registrar salida'
      };
    }
  }

  /**
   * Obtiene la asistencia del día actual
   */
  async getTodayAttendance(employeeId: string): Promise<Record<string, unknown> | null> {
    try {
      const supabase = createSupabaseClient();
      
      // Usar fecha local consistente
      const now = new Date();
      const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
      const today = localDateTime.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('attendances')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('attendance_date', today)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error('Error obteniendo asistencia del día:', error);
      return null;
    }
  }

  /**
   * Obtiene el historial de asistencias
   */
  async getAttendanceHistory(employeeId: string, limit: number = 10): Promise<Record<string, unknown>[]> {
    try {
      const supabase = createSupabaseClient();

      const { data, error } = await supabase
        .from('attendances')
        .select('*')
        .eq('employee_id', employeeId)
        .order('attendance_date', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error obteniendo historial:', error);
      return [];
    }
  }
}

/**
 * Función utilitaria para obtener fecha/hora local consistente
 * Soluciona el problema de zona horaria UTC vs local
 */
export function getLocalDateTime(): Date {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000);
}

// Instancia singleton del servicio
export const attendanceService = new AttendanceService();
