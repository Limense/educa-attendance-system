/**
 * =============================================
 * SERVICIO DE ESTADÍSTICAS DEL DASHBOARD
 * =============================================
 * 
 * Descripción: Servicio para obtener estadísticas reales desde Supabase
 * Implementa patrones de Repository y Service Layer
 */

import { createSupabaseClient } from '@/lib/supabase/client';

export interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  lateToday: number;
  absentToday: number;
  totalDepartments: number;
  attendanceRate: number;
  overtimeHours: number;
}

export interface TodayAttendance {
  checkInsToday: number;
  checkOutsToday: number;
  pendingCheckOuts: number;
}

export interface MonthlyTrends {
  punctualityRate: number;
  absenteeismRate: number;
  overtimeHours: number;
  averageWorkHours: number;
}

interface AttendanceResponse {
  status: string;
  work_hours: number | null;
  overtime_hours: number | null;
  check_in_time?: string | null;
  check_out_time?: string | null;
  employee_id?: string;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  department_id: string | null;
}

export class DashboardService {
  private supabase = createSupabaseClient();

  /**
   * Obtener estadísticas generales del dashboard
   */
  async getDashboardStats(organizationId: string): Promise<DashboardStats> {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Total de empleados activos
      const { count: totalEmployees } = await this.supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('is_active', true);

      // Total de departamentos
      const { count: totalDepartments } = await this.supabase
        .from('departments')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('is_active', true);

      // Asistencias de hoy
      const { data: todayAttendances } = await this.supabase
        .from('attendances')
        .select('status, work_hours, overtime_hours')
        .eq('organization_id', organizationId)
        .eq('attendance_date', today);

      // Calcular estadísticas
      const presentToday = todayAttendances?.filter((a: AttendanceResponse) => 
        ['present', 'late', 'early_leave', 'remote'].includes(a.status)
      ).length || 0;

      const lateToday = todayAttendances?.filter((a: AttendanceResponse) => a.status === 'late').length || 0;
      const absentToday = (totalEmployees || 0) - presentToday;

      const attendanceRate = totalEmployees ? 
        Math.round((presentToday / totalEmployees) * 100) : 0;

      const overtimeHours = todayAttendances?.reduce((sum: number, a: AttendanceResponse) => 
        sum + (a.overtime_hours || 0), 0
      ) || 0;

      return {
        totalEmployees: totalEmployees || 0,
        presentToday,
        lateToday,
        absentToday,
        totalDepartments: totalDepartments || 0,
        attendanceRate,
        overtimeHours: Number(overtimeHours.toFixed(1))
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw new Error('Error al obtener estadísticas del dashboard');
    }
  }

  /**
   * Obtener datos de asistencias de hoy
   */
  async getTodayAttendance(organizationId: string): Promise<TodayAttendance> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: attendances } = await this.supabase
        .from('attendances')
        .select('check_in_time, check_out_time')
        .eq('organization_id', organizationId)
        .eq('attendance_date', today);

      const checkInsToday = attendances?.filter((a: AttendanceResponse) => a.check_in_time).length || 0;
      const checkOutsToday = attendances?.filter((a: AttendanceResponse) => a.check_out_time).length || 0;
      const pendingCheckOuts = checkInsToday - checkOutsToday;

      return {
        checkInsToday,
        checkOutsToday,
        pendingCheckOuts
      };
    } catch (error) {
      console.error('Error fetching today attendance:', error);
      throw new Error('Error al obtener asistencias de hoy');
    }
  }

  /**
   * Obtener tendencias del mes actual
   */
  async getMonthlyTrends(organizationId: string): Promise<MonthlyTrends> {
    try {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const startDate = firstDayOfMonth.toISOString().split('T')[0];
      const endDate = lastDayOfMonth.toISOString().split('T')[0];

      const { data: monthlyAttendances } = await this.supabase
        .from('attendances')
        .select('status, work_hours, overtime_hours')
        .eq('organization_id', organizationId)
        .gte('attendance_date', startDate)
        .lte('attendance_date', endDate);

      if (!monthlyAttendances || monthlyAttendances.length === 0) {
        return {
          punctualityRate: 0,
          absenteeismRate: 0,
          overtimeHours: 0,
          averageWorkHours: 0
        };
      }

      const totalRecords = monthlyAttendances.length;
      const punctualRecords = monthlyAttendances.filter((a: AttendanceResponse) => 
        a.status === 'present'
      ).length;
      const absentRecords = monthlyAttendances.filter((a: AttendanceResponse) => 
        a.status === 'absent'
      ).length;

      const totalWorkHours = monthlyAttendances.reduce((sum: number, a: AttendanceResponse) => 
        sum + (a.work_hours || 0), 0
      );
      const totalOvertimeHours = monthlyAttendances.reduce((sum: number, a: AttendanceResponse) => 
        sum + (a.overtime_hours || 0), 0
      );

      return {
        punctualityRate: Number(((punctualRecords / totalRecords) * 100).toFixed(1)),
        absenteeismRate: Number(((absentRecords / totalRecords) * 100).toFixed(1)),
        overtimeHours: Number(totalOvertimeHours.toFixed(1)),
        averageWorkHours: Number((totalWorkHours / totalRecords).toFixed(1))
      };
    } catch (error) {
      console.error('Error fetching monthly trends:', error);
      throw new Error('Error al obtener tendencias mensuales');
    }
  }

  /**
   * Obtener lista de empleados ausentes hoy
   */
  async getAbsentEmployeesToday(organizationId: string) {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Obtener todos los empleados activos
      const { data: allEmployees } = await this.supabase
        .from('employees')
        .select('id, first_name, last_name, email, department_id')
        .eq('organization_id', organizationId)
        .eq('is_active', true);

      // Obtener empleados que registraron asistencia hoy
      const { data: presentEmployees } = await this.supabase
        .from('attendances')
        .select('employee_id')
        .eq('organization_id', organizationId)
        .eq('attendance_date', today)
        .in('status', ['present', 'late', 'early_leave', 'remote']);

      const presentEmployeeIds = presentEmployees?.map((a: { employee_id: string }) => a.employee_id) || [];

      // Filtrar empleados ausentes
      const absentEmployees = allEmployees?.filter((emp: Employee) => 
        !presentEmployeeIds.includes(emp.id)
      ) || [];

      return absentEmployees;
    } catch (error) {
      console.error('Error fetching absent employees:', error);
      throw new Error('Error al obtener empleados ausentes');
    }
  }
}

export const dashboardService = new DashboardService();
