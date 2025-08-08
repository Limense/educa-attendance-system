/**
 * =============================================
 * SERVICIO DE ANALÍTICAS DE ASISTENCIA
 * =============================================
 * 
 * Descripción: Servicio para calcular estadísticas avanzadas de asistencia
 * Incluye detección de tardanzas, cálculo de horas trabajadas y análisis de patrones
 */

import { createSupabaseClient } from '@/lib/supabase/client';

export interface AttendanceAnalytics {
  totalEmployees: number;
  totalHoursWorked: number;
  averageHoursPerEmployee: number;
  lateArrivals: number;
  earlyDepartures: number;
  overtimeHours: number;
  attendanceRate: number;
  punctualityRate: number;
}

export interface EmployeeAttendanceDetails {
  employee_id: string;
  employee_name: string;
  department_name: string;
  total_hours: number;
  regular_hours: number;
  overtime_hours: number;
  late_arrivals: number;
  early_departures: number;
  attendance_rate: number;
  punctuality_rate: number;
  absent_days: number;
}

export interface LatenessAnalysis {
  employee_id: string;
  employee_name: string;
  scheduled_start: string;
  actual_arrival: string;
  minutes_late: number;
  is_late: boolean;
  penalty_hours?: number;
}

interface AttendanceRecord {
  employee_id: string;
  work_hours: number | null;
  overtime_hours: number | null;
  status: string;
  check_in_time: string | null;
  employees: {
    full_name: string;
    departments: {
      name: string;
    } | null;
  };
}

interface WorkPolicyRecord {
  start_time: string;
  end_time: string;
  late_threshold: number;
}

interface EmployeeStats {
  employee_id: string;
  employee_name: string;
  department_name: string;
  total_hours: number;
  regular_hours: number;
  overtime_hours: number;
  late_arrivals: number;
  early_departures: number;
  absent_days: number;
  total_days: number;
}

export class AttendanceAnalyticsService {
  private supabase = createSupabaseClient();

  /**
   * Obtiene análisis completo de asistencia para un período
   */
  async getAttendanceAnalytics(
    organizationId: string,
    startDate: string,
    endDate: string
  ): Promise<AttendanceAnalytics> {
    try {
      console.log('📊 Calculando analíticas de asistencia:', { organizationId, startDate, endDate });

      // 1. Obtener total de empleados activos
      const { count: totalEmployees } = await this.supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('is_active', true);

      // 2. Obtener asistencias del período
      const { data: attendances } = await this.supabase
        .from('attendances')
        .select(`
          id,
          employee_id,
          attendance_date,
          check_in_time,
          check_out_time,
          work_hours,
          overtime_hours,
          status,
          employees!inner (
            id,
            full_name,
            departments (
              name
            )
          )
        `)
        .eq('organization_id', organizationId)
        .gte('attendance_date', startDate)
        .lte('attendance_date', endDate);

      // 3. Obtener política de trabajo (horarios)
      const { data: workPolicy } = await this.supabase
        .from('work_policies')
        .select('start_time, end_time, late_threshold')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .single();

      if (!attendances || !workPolicy) {
        return this.getEmptyAnalytics();
      }

      // 4. Calcular métricas
      const totalHoursWorked = attendances.reduce((total: number, att: AttendanceRecord) => total + (att.work_hours || 0), 0);
      const overtimeHours = attendances.reduce((total: number, att: AttendanceRecord) => total + (att.overtime_hours || 0), 0);
      const averageHoursPerEmployee = totalEmployees ? totalHoursWorked / totalEmployees : 0;

      // 5. Analizar tardanzas y salidas tempranas
      const latenessAnalysis = await this.analyzeLateArrivals(attendances, workPolicy);
      const lateArrivals = latenessAnalysis.filter(l => l.is_late).length;

      // 6. Calcular tasas de asistencia y puntualidad
      const totalWorkingDays = this.calculateWorkingDays(startDate, endDate);
      const expectedAttendances = totalEmployees! * totalWorkingDays;
      const actualAttendances = attendances.length;
      
      const attendanceRate = expectedAttendances > 0 ? (actualAttendances / expectedAttendances) * 100 : 0;
      const punctualityRate = actualAttendances > 0 ? ((actualAttendances - lateArrivals) / actualAttendances) * 100 : 0;

      console.log('✅ Analíticas calculadas exitosamente');

      return {
        totalEmployees: totalEmployees || 0,
        totalHoursWorked: Math.round(totalHoursWorked * 100) / 100,
        averageHoursPerEmployee: Math.round(averageHoursPerEmployee * 100) / 100,
        lateArrivals,
        earlyDepartures: 0, // TODO: Implementar análisis de salidas tempranas
        overtimeHours: Math.round(overtimeHours * 100) / 100,
        attendanceRate: Math.round(attendanceRate * 100) / 100,
        punctualityRate: Math.round(punctualityRate * 100) / 100,
      };

    } catch (error) {
      console.error('❌ Error calculando analíticas:', error);
      return this.getEmptyAnalytics();
    }
  }

  /**
   * Obtiene detalles de asistencia por empleado
   */
  async getEmployeeAttendanceDetails(
    organizationId: string,
    startDate: string,
    endDate: string
  ): Promise<EmployeeAttendanceDetails[]> {
    try {
      const { data: attendances } = await this.supabase
        .from('attendances')
        .select(`
          employee_id,
          work_hours,
          overtime_hours,
          status,
          check_in_time,
          employees!inner (
            full_name,
            departments (
              name
            )
          )
        `)
        .eq('organization_id', organizationId)
        .gte('attendance_date', startDate)
        .lte('attendance_date', endDate);

      if (!attendances) return [];

      // Agrupar por empleado
      const employeeMap = new Map<string, EmployeeStats>();

      attendances.forEach((att: AttendanceRecord) => {
        const empId = att.employee_id;
        if (!employeeMap.has(empId)) {
          employeeMap.set(empId, {
            employee_id: empId,
            employee_name: att.employees.full_name,
            department_name: att.employees.departments?.name || 'Sin Departamento',
            total_hours: 0,
            regular_hours: 0,
            overtime_hours: 0,
            late_arrivals: 0,
            early_departures: 0,
            absent_days: 0,
            total_days: 0,
          });
        }

        const emp = employeeMap.get(empId);
        if (!emp) return;
        
        emp.total_hours += att.work_hours || 0;
        emp.overtime_hours += att.overtime_hours || 0;
        emp.regular_hours += Math.max(0, (att.work_hours || 0) - (att.overtime_hours || 0));
        emp.total_days += 1;

        if (att.status === 'late') {
          emp.late_arrivals += 1;
        } else if (att.status === 'absent') {
          emp.absent_days += 1;
        }
      });

      // Calcular tasas
      const totalWorkingDays = this.calculateWorkingDays(startDate, endDate);
      
      return Array.from(employeeMap.values()).map(emp => ({
        ...emp,
        total_hours: Math.round(emp.total_hours * 100) / 100,
        regular_hours: Math.round(emp.regular_hours * 100) / 100,
        overtime_hours: Math.round(emp.overtime_hours * 100) / 100,
        attendance_rate: totalWorkingDays > 0 ? Math.round((emp.total_days / totalWorkingDays) * 10000) / 100 : 0,
        punctuality_rate: emp.total_days > 0 ? Math.round(((emp.total_days - emp.late_arrivals) / emp.total_days) * 10000) / 100 : 0,
      }));

    } catch (error) {
      console.error('❌ Error obteniendo detalles por empleado:', error);
      return [];
    }
  }

  /**
   * Analiza llegadas tarde basándose en la política de trabajo
   */
  private async analyzeLateArrivals(
    attendances: AttendanceRecord[],
    workPolicy: WorkPolicyRecord
  ): Promise<LatenessAnalysis[]> {
    const lateThreshold = workPolicy.late_threshold || 15; // minutos
    const scheduledStart = workPolicy.start_time; // HH:MM:SS

    return attendances
      .filter(att => att.check_in_time)
      .map(att => {
        const checkInTime = new Date(att.check_in_time!);
        const checkInHours = checkInTime.getHours();
        const checkInMinutes = checkInTime.getMinutes();
        
        // Convertir horario programado a minutos
        const [startHour, startMinute] = scheduledStart.split(':').map(Number);
        const scheduledMinutes = startHour * 60 + startMinute;
        const actualMinutes = checkInHours * 60 + checkInMinutes;
        
        const minutesLate = Math.max(0, actualMinutes - scheduledMinutes);
        const isLate = minutesLate > lateThreshold;

        return {
          employee_id: att.employee_id,
          employee_name: att.employees.full_name,
          scheduled_start: scheduledStart,
          actual_arrival: `${checkInHours.toString().padStart(2, '0')}:${checkInMinutes.toString().padStart(2, '0')}`,
          minutes_late: minutesLate,
          is_late: isLate,
          penalty_hours: isLate ? minutesLate / 60 : undefined,
        };
      });
  }

  /**
   * Calcula días laborales en un período (excluyendo fines de semana)
   */
  private calculateWorkingDays(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let workingDays = 0;

    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay();
      // 0 = Domingo, 6 = Sábado
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return workingDays;
  }

  /**
   * Retorna analíticas vacías en caso de error
   */
  private getEmptyAnalytics(): AttendanceAnalytics {
    return {
      totalEmployees: 0,
      totalHoursWorked: 0,
      averageHoursPerEmployee: 0,
      lateArrivals: 0,
      earlyDepartures: 0,
      overtimeHours: 0,
      attendanceRate: 0,
      punctualityRate: 0,
    };
  }
}

// Instancia singleton del servicio
export const attendanceAnalyticsService = new AttendanceAnalyticsService();
