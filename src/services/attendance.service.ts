/**
 * =============================================
 * ATTENDANCE SERVICE - GESTIÓN DE ASISTENCIAS
 * =============================================
 * 
 * Descripción: Maneja todas las operaciones relacionadas con asistencias
 * 
 * Principios SOLID aplicados:
 * - S: Single Responsibility - Solo maneja operaciones de asistencia
 * - O: Open/Closed - Extensible para nuevos tipos de asistencia
 * - L: Liskov Substitution - Implementa interfaces base
 * - I: Interface Segregation - Interfaces específicas
 * - D: Dependency Inversion - Depende de abstracciones
 * 
 * Patrones de diseño:
 * - Service Layer Pattern - Lógica de negocio centralizada
 * - Strategy Pattern - Para diferentes cálculos de tiempo
 * - Observer Pattern - Para notificaciones de eventos
 * - Command Pattern - Para operaciones reversibles
 */

import { createSupabaseClient } from '@/lib/supabase/client';
import { Attendance, Employee, AttendanceType, AttendanceStatus } from '@/types/database';
import { IEmployeeRepository } from '@/repositories/employee.repository';
import { Logger } from '@/utils/logger';

/**
 * Interface que define las operaciones de asistencia
 */
export interface IAttendanceService {
  // Operaciones de registro
  checkIn(employeeId: string, location?: GeolocationData): Promise<AttendanceResponse>;
  checkOut(employeeId: string, location?: GeolocationData): Promise<AttendanceResponse>;
  registerBreak(employeeId: string, breakType: BreakType): Promise<AttendanceResponse>;
  endBreak(employeeId: string): Promise<AttendanceResponse>;
  
  // Consultas de asistencia
  getTodayAttendance(employeeId: string): Promise<Attendance | null>;
  getAttendanceHistory(employeeId: string, filters: AttendanceFilters): Promise<Attendance[]>;
  getEmployeeAttendanceStats(employeeId: string, period: TimePeriod): Promise<AttendanceStats>;
  
  // Operaciones administrativas
  approveAttendance(attendanceId: string, approvedBy: string): Promise<boolean>;
  rejectAttendance(attendanceId: string, rejectedBy: string, reason: string): Promise<boolean>;
  bulkAttendanceReport(organizationId: string, filters: ReportFilters): Promise<AttendanceReport[]>;
  
  // Validaciones y cálculos
  calculateWorkHours(attendance: Attendance): WorkHoursCalculation;
  validateAttendanceRules(employeeId: string, operation: AttendanceOperation): Promise<ValidationResult>;
}

/**
 * Datos de geolocalización para registro de asistencia
 */
export interface GeolocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
}

/**
 * Tipos de descanso disponibles
 */
export enum BreakType {
  LUNCH = 'lunch',
  SHORT_BREAK = 'short_break',
  PERSONAL = 'personal',
  MEDICAL = 'medical'
}

/**
 * Operaciones de asistencia
 */
export enum AttendanceOperation {
  CHECK_IN = 'check_in',
  CHECK_OUT = 'check_out',
  BREAK_START = 'break_start',
  BREAK_END = 'break_end'
}

/**
 * Períodos de tiempo para reportes
 */
export interface TimePeriod {
  startDate: string;
  endDate: string;
  groupBy?: 'day' | 'week' | 'month';
}

/**
 * Filtros para consultas de asistencia
 */
export interface AttendanceFilters {
  startDate?: string;
  endDate?: string;
  status?: AttendanceStatus;
  type?: AttendanceType;
  departmentId?: string;
  limit?: number;
  offset?: number;
}

/**
 * Filtros para reportes
 */
export interface ReportFilters extends AttendanceFilters {
  includeBreaks?: boolean;
  includeOvertime?: boolean;
  employeeIds?: string[];
}

/**
 * Respuesta de operaciones de asistencia
 */
export interface AttendanceResponse {
  success: boolean;
  attendance?: Attendance;
  message: string;
  warnings?: string[];
  nextAction?: string;
}

/**
 * Estadísticas de asistencia de empleado
 */
export interface AttendanceStats {
  totalWorkDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  earlyDepartures: number;
  totalWorkHours: number;
  averageWorkHours: number;
  overtimeHours: number;
  attendanceRate: number;
  punctualityRate: number;
}

/**
 * Cálculo de horas trabajadas
 */
export interface WorkHoursCalculation {
  regularHours: number;
  overtimeHours: number;
  breakHours: number;
  totalHours: number;
  isIncomplete: boolean;
  penalties?: WorkTimePenalty[];
}

/**
 * Penalizaciones por tiempo de trabajo
 */
export interface WorkTimePenalty {
  type: 'late_arrival' | 'early_departure' | 'extended_break';
  minutes: number;
  description: string;
}

/**
 * Resultado de validación
 */
export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  suggestions?: string[];
}

/**
 * Reporte de asistencia
 */
export interface AttendanceReport {
  employee: Employee;
  attendance: Attendance[];
  stats: AttendanceStats;
  summary: {
    totalDays: number;
    workDays: number;
    presentDays: number;
    efficiency: number;
  };
}

/**
 * Implementación del servicio de asistencias
 */
export class AttendanceService implements IAttendanceService {
  private logger: Logger;
  private employeeRepository: IEmployeeRepository;

  constructor(
    employeeRepository: IEmployeeRepository,
    logger: Logger = new Logger('AttendanceService')
  ) {
    this.employeeRepository = employeeRepository;
    this.logger = logger;
  }

  /**
   * Registra la entrada del empleado
   * 
   * @param employeeId - ID del empleado
   * @param location - Datos de geolocalización opcional
   * @returns Promise<AttendanceResponse> - Resultado del registro
   * 
   * @example
   * ```typescript
   * const service = new AttendanceService(employeeRepo);
   * const result = await service.checkIn('emp123', { latitude: 40.7128, longitude: -74.0060 });
   * ```
   */
  async checkIn(employeeId: string, location?: GeolocationData): Promise<AttendanceResponse> {
    try {
      this.logger.info('Iniciando check-in', { employeeId });

      // Validar reglas de asistencia
      const validation = await this.validateAttendanceRules(employeeId, AttendanceOperation.CHECK_IN);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.errors.join(', '),
          warnings: validation.warnings
        };
      }

      // Verificar si ya hay check-in del día
      const todayAttendance = await this.getTodayAttendance(employeeId);
      if (todayAttendance && todayAttendance.check_in_time) {
        return {
          success: false,
          message: 'Ya has registrado tu entrada el día de hoy',
          attendance: todayAttendance
        };
      }

      // Obtener información del empleado
      const employee = await this.employeeRepository.findById(employeeId);
      if (!employee) {
        return {
          success: false,
          message: 'Empleado no encontrado'
        };
      }

      const now = new Date();
      const supabase = createSupabaseClient();

      let attendance: Attendance;

      if (todayAttendance) {
        // Actualizar registro existente
        const { data, error } = await supabase
          .from('attendances')
          .update({
            check_in_time: now.toISOString(),
            check_in_location: location ? JSON.stringify(location) : null,
            status: this.calculateAttendanceStatus(employee, now, 'check_in'),
            updated_at: now.toISOString()
          })
          .eq('id', todayAttendance.id)
          .select()
          .single();

        if (error) throw error;
        attendance = data as Attendance;
      } else {
        // Crear nuevo registro
        const { data, error } = await supabase
          .from('attendances')
          .insert({
            employee_id: employeeId,
            organization_id: employee.organization_id,
            date: now.toISOString().split('T')[0],
            check_in_time: now.toISOString(),
            check_in_location: location ? JSON.stringify(location) : null,
            type: 'regular',
            status: this.calculateAttendanceStatus(employee, now, 'check_in')
          })
          .select()
          .single();

        if (error) throw error;
        attendance = data as Attendance;
      }

      this.logger.info('Check-in registrado exitosamente', { 
        employeeId, 
        attendanceId: attendance.id,
        time: attendance.check_in_time 
      });

      return {
        success: true,
        attendance,
        message: 'Entrada registrada exitosamente',
        warnings: validation.warnings,
        nextAction: 'Puedes registrar tu salida cuando termines tu jornada'
      };

    } catch (error) {
      this.logger.error('Error en check-in', { employeeId, error });
      return {
        success: false,
        message: 'Error al registrar la entrada. Intenta nuevamente.'
      };
    }
  }

  /**
   * Registra la salida del empleado
   */
  async checkOut(employeeId: string, location?: GeolocationData): Promise<AttendanceResponse> {
    try {
      this.logger.info('Iniciando check-out', { employeeId });

      // Validar reglas
      const validation = await this.validateAttendanceRules(employeeId, AttendanceOperation.CHECK_OUT);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.errors.join(', '),
          warnings: validation.warnings
        };
      }

      // Obtener asistencia del día
      const todayAttendance = await this.getTodayAttendance(employeeId);
      if (!todayAttendance || !todayAttendance.check_in_time) {
        return {
          success: false,
          message: 'Debes registrar tu entrada antes de poder salir'
        };
      }

      if (todayAttendance.check_out_time) {
        return {
          success: false,
          message: 'Ya has registrado tu salida el día de hoy',
          attendance: todayAttendance
        };
      }

      const employee = await this.employeeRepository.findById(employeeId);
      if (!employee) {
        return {
          success: false,
          message: 'Empleado no encontrado'
        };
      }

      const now = new Date();
      const workHours = this.calculateWorkHours({
        ...todayAttendance,
        check_out_time: now.toISOString()
      } as Attendance);

      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from('attendances')
        .update({
          check_out_time: now.toISOString(),
          check_out_location: location ? JSON.stringify(location) : null,
          total_hours: workHours.totalHours,
          overtime_hours: workHours.overtimeHours,
          break_duration: workHours.breakHours,
          status: this.calculateAttendanceStatus(employee, now, 'check_out'),
          updated_at: now.toISOString()
        })
        .eq('id', todayAttendance.id)
        .select()
        .single();

      if (error) throw error;

      this.logger.info('Check-out registrado exitosamente', { 
        employeeId, 
        attendanceId: data.id,
        totalHours: workHours.totalHours 
      });

      return {
        success: true,
        attendance: data as Attendance,
        message: `Salida registrada. Trabajaste ${workHours.totalHours.toFixed(2)} horas`,
        warnings: validation.warnings
      };

    } catch (error) {
      this.logger.error('Error en check-out', { employeeId, error });
      return {
        success: false,
        message: 'Error al registrar la salida. Intenta nuevamente.'
      };
    }
  }

  /**
   * Registra el inicio de un descanso
   */
  async registerBreak(employeeId: string, breakType: BreakType): Promise<AttendanceResponse> {
    try {
      this.logger.info('Registrando inicio de descanso', { employeeId, breakType });

      const todayAttendance = await this.getTodayAttendance(employeeId);
      if (!todayAttendance || !todayAttendance.check_in_time) {
        return {
          success: false,
          message: 'Debes registrar tu entrada antes de tomar un descanso'
        };
      }

      const now = new Date();
      const currentBreaks = todayAttendance.breaks || [];
      
      // Verificar si ya hay un descanso activo
      const activeBreak = currentBreaks.find(b => !b.end_time);
      if (activeBreak) {
        return {
          success: false,
          message: 'Ya tienes un descanso activo. Debes terminarlo primero.'
        };
      }

      const newBreak = {
        type: breakType,
        start_time: now.toISOString(),
        end_time: null
      };

      const updatedBreaks = [...currentBreaks, newBreak];

      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from('attendances')
        .update({
          breaks: updatedBreaks,
          updated_at: now.toISOString()
        })
        .eq('id', todayAttendance.id)
        .select()
        .single();

      if (error) throw error;

      this.logger.info('Descanso iniciado', { employeeId, breakType });

      return {
        success: true,
        attendance: data as Attendance,
        message: `Descanso ${breakType} iniciado`,
        nextAction: 'Recuerda terminar tu descanso cuando regreses'
      };

    } catch (error) {
      this.logger.error('Error registrando descanso', { employeeId, breakType, error });
      return {
        success: false,
        message: 'Error al registrar el descanso'
      };
    }
  }

  /**
   * Termina el descanso activo
   */
  async endBreak(employeeId: string): Promise<AttendanceResponse> {
    try {
      this.logger.info('Terminando descanso', { employeeId });

      const todayAttendance = await this.getTodayAttendance(employeeId);
      if (!todayAttendance) {
        return {
          success: false,
          message: 'No hay registro de asistencia para el día de hoy'
        };
      }

      const currentBreaks = todayAttendance.breaks || [];
      const activeBreak = currentBreaks.find(b => !b.end_time);
      
      if (!activeBreak) {
        return {
          success: false,
          message: 'No tienes ningún descanso activo'
        };
      }

      const now = new Date();
      const updatedBreaks = currentBreaks.map(b => 
        b === activeBreak ? { ...b, end_time: now.toISOString() } : b
      );

      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from('attendances')
        .update({
          breaks: updatedBreaks,
          updated_at: now.toISOString()
        })
        .eq('id', todayAttendance.id)
        .select()
        .single();

      if (error) throw error;

      const breakDuration = (now.getTime() - new Date(activeBreak.start_time).getTime()) / (1000 * 60);

      this.logger.info('Descanso terminado', { 
        employeeId, 
        breakType: activeBreak.type,
        duration: breakDuration 
      });

      return {
        success: true,
        attendance: data as Attendance,
        message: `Descanso terminado. Duración: ${Math.round(breakDuration)} minutos`
      };

    } catch (error) {
      this.logger.error('Error terminando descanso', { employeeId, error });
      return {
        success: false,
        message: 'Error al terminar el descanso'
      };
    }
  }

  /**
   * Obtiene la asistencia del día actual
   */
  async getTodayAttendance(employeeId: string): Promise<Attendance | null> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const supabase = createSupabaseClient();

      const { data, error } = await supabase
        .from('attendances')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('date', today)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data as Attendance || null;
    } catch (error) {
      this.logger.error('Error obteniendo asistencia del día', { employeeId, error });
      return null;
    }
  }

  /**
   * Obtiene el historial de asistencias
   */
  async getAttendanceHistory(employeeId: string, filters: AttendanceFilters): Promise<Attendance[]> {
    try {
      const supabase = createSupabaseClient();
      let query = supabase
        .from('attendances')
        .select('*')
        .eq('employee_id', employeeId);

      if (filters.startDate) {
        query = query.gte('date', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('date', filters.endDate);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.type) {
        query = query.eq('type', filters.type);
      }

      query = query.order('date', { ascending: false });

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 100) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data as Attendance[]) || [];
    } catch (error) {
      this.logger.error('Error obteniendo historial', { employeeId, error });
      return [];
    }
  }

  /**
   * Calcula estadísticas de asistencia
   */
  async getEmployeeAttendanceStats(employeeId: string, period: TimePeriod): Promise<AttendanceStats> {
    try {
      const attendances = await this.getAttendanceHistory(employeeId, {
        startDate: period.startDate,
        endDate: period.endDate
      });

      const stats: AttendanceStats = {
        totalWorkDays: this.calculateWorkDays(period),
        presentDays: attendances.filter(a => a.check_in_time).length,
        absentDays: 0,
        lateDays: 0,
        earlyDepartures: 0,
        totalWorkHours: 0,
        averageWorkHours: 0,
        overtimeHours: 0,
        attendanceRate: 0,
        punctualityRate: 0
      };

      // Calcular estadísticas detalladas
      attendances.forEach(attendance => {
        if (attendance.total_hours) {
          stats.totalWorkHours += attendance.total_hours;
        }
        if (attendance.overtime_hours) {
          stats.overtimeHours += attendance.overtime_hours;
        }
        // Aquí se pueden agregar más cálculos específicos
      });

      stats.absentDays = stats.totalWorkDays - stats.presentDays;
      stats.averageWorkHours = stats.presentDays > 0 ? stats.totalWorkHours / stats.presentDays : 0;
      stats.attendanceRate = stats.totalWorkDays > 0 ? (stats.presentDays / stats.totalWorkDays) * 100 : 0;

      return stats;
    } catch (error) {
      this.logger.error('Error calculando estadísticas', { employeeId, error });
      throw error;
    }
  }

  /**
   * Aprueba una asistencia
   */
  async approveAttendance(attendanceId: string, approvedBy: string): Promise<boolean> {
    try {
      const supabase = createSupabaseClient();
      const { error } = await supabase
        .from('attendances')
        .update({
          status: 'approved',
          approved_by: approvedBy,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', attendanceId);

      if (error) throw error;

      this.logger.info('Asistencia aprobada', { attendanceId, approvedBy });
      return true;
    } catch (error) {
      this.logger.error('Error aprobando asistencia', { attendanceId, error });
      return false;
    }
  }

  /**
   * Rechaza una asistencia
   */
  async rejectAttendance(attendanceId: string, rejectedBy: string, reason: string): Promise<boolean> {
    try {
      const supabase = createSupabaseClient();
      const { error } = await supabase
        .from('attendances')
        .update({
          status: 'rejected',
          rejected_by: rejectedBy,
          rejection_reason: reason,
          rejected_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', attendanceId);

      if (error) throw error;

      this.logger.info('Asistencia rechazada', { attendanceId, rejectedBy, reason });
      return true;
    } catch (error) {
      this.logger.error('Error rechazando asistencia', { attendanceId, error });
      return false;
    }
  }

  /**
   * Genera reporte masivo de asistencias
   */
  async bulkAttendanceReport(organizationId: string, _filters: ReportFilters): Promise<AttendanceReport[]> {
    try {
      this.logger.info('Generando reporte masivo', { organizationId });

      // Implementación del reporte masivo
      // Por ahora retornamos array vacío
      return [];
    } catch (error) {
      this.logger.error('Error generando reporte', { organizationId, error });
      return [];
    }
  }

  /**
   * Calcula las horas trabajadas
   */
  calculateWorkHours(attendance: Attendance): WorkHoursCalculation {
    if (!attendance.check_in_time || !attendance.check_out_time) {
      return {
        regularHours: 0,
        overtimeHours: 0,
        breakHours: 0,
        totalHours: 0,
        isIncomplete: true
      };
    }

    const checkIn = new Date(attendance.check_in_time);
    const checkOut = new Date(attendance.check_out_time);
    const totalMinutes = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60);

    // Calcular tiempo de descansos
    let breakMinutes = 0;
    if (attendance.breaks) {
      attendance.breaks.forEach(breakItem => {
        if (breakItem.start_time && breakItem.end_time) {
          const breakStart = new Date(breakItem.start_time);
          const breakEnd = new Date(breakItem.end_time);
          breakMinutes += (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60);
        }
      });
    }

    const workMinutes = totalMinutes - breakMinutes;
    const totalHours = workMinutes / 60;
    const standardHours = 8; // Horas estándar por día
    
    const regularHours = Math.min(totalHours, standardHours);
    const overtimeHours = Math.max(0, totalHours - standardHours);

    return {
      regularHours,
      overtimeHours,
      breakHours: breakMinutes / 60,
      totalHours,
      isIncomplete: false
    };
  }

  /**
   * Valida reglas de asistencia
   */
  async validateAttendanceRules(employeeId: string, operation: AttendanceOperation): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      warnings: [],
      errors: []
    };

    try {
      const employee = await this.employeeRepository.findById(employeeId);
      if (!employee) {
        result.isValid = false;
        result.errors.push('Empleado no encontrado');
        return result;
      }

      if (!employee.is_active) {
        result.isValid = false;
        result.errors.push('Empleado inactivo');
        return result;
      }

      // Aquí se pueden agregar más validaciones específicas
      // por ejemplo: horarios permitidos, ubicación, etc.

      return result;
    } catch (error) {
      this.logger.error('Error validando reglas', { employeeId, operation, error });
      result.isValid = false;
      result.errors.push('Error validando reglas de asistencia');
      return result;
    }
  }

  // =============================================
  // MÉTODOS PRIVADOS - UTILIDADES
  // =============================================

  /**
   * Calcula el estado de la asistencia basado en horarios
   */
  private calculateAttendanceStatus(employee: Employee, time: Date, operation: string): AttendanceStatus {
    // Lógica simplificada para el ejemplo
    const hour = time.getHours();
    
    if (operation === 'check_in') {
      if (hour > 9) {
        return 'late';
      }
      return 'on_time';
    }
    
    if (operation === 'check_out') {
      if (hour < 17) {
        return 'early_departure';
      }
      return 'complete';
    }
    
    return 'pending';
  }

  /**
   * Calcula días laborales en un período
   */
  private calculateWorkDays(period: TimePeriod): number {
    const start = new Date(period.startDate);
    const end = new Date(period.endDate);
    let workDays = 0;
    
    const current = new Date(start);
    while (current <= end) {
      const dayOfWeek = current.getDay();
      // Excluir sábados (6) y domingos (0)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workDays++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return workDays;
  }
}

/**
 * Factory para crear instancias del servicio
 */
export class AttendanceServiceFactory {
  public static create(employeeRepository: IEmployeeRepository): AttendanceService {
    return new AttendanceService(employeeRepository);
  }
}
