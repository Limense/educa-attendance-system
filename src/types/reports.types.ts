/**
 * =============================================
 * TIPOS PARA SISTEMA DE REPORTES
 * =============================================
 */

export interface AttendanceRecord {
  id: string;
  employee_name: string;
  department_name: string | null;
  clock_in: string | null;
  clock_out: string | null;
  status: string;
  total_hours: number;
  attendance_date: string;
  employee_code?: string;
}

export interface ReportFilters {
  startDate: string;
  endDate: string;
  employeeId?: string;
  departmentId?: string;
  reportType: 'individual' | 'department' | 'general' | 'attendance' | 'punctuality';
  status?: 'present' | 'absent' | 'incomplete' | 'late';
  period: 'today' | 'week' | 'month' | 'quarter' | 'custom';
}

export interface ReportStats {
  totalEmployees: number;
  totalAttendances: number;
  presentDays: number;
  absentDays: number;
  incompleteDays: number;
  attendanceRate: number;
  punctualityRate: number;
  totalHours: number;
  overtimeHours: number;
  averageHours: number;
}

export interface Employee {
  id: string;
  full_name: string;
  employee_code: string;
  department?: {
    id: string;
    name: string;
  };
}

export interface Department {
  id: string;
  name: string;
}
