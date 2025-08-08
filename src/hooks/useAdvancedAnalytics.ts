/**
 * =============================================
 * HOOK PARA ANALÍTICAS AVANZADAS
 * =============================================
 * 
 * Hook para cargar y gestionar analíticas avanzadas de asistencia
 * Conecta directamente con Supabase y maneja errores
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';

// Tipos para las respuestas de Supabase
interface AttendanceFromDB {
  id: string;
  employee_id: string;
  attendance_date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  work_hours: number | null;
  overtime_hours: number | null;
  status: string;
}

interface EmployeeFromDB {
  id: string;
  full_name: string;
  employee_code: string;
  department_id: string | null;
  departments: {
    name: string;
  } | null;
}

export interface AdvancedAnalytics {
  totalHoursWorked: number;
  averageHoursPerEmployee: number;
  lateArrivals: number;
  absentDays: number;
  attendanceRate: number;
  punctualityRate: number;
  overtimeHours: number;
  totalEmployees: number;
}

export interface EmployeeAnalytics {
  employee_id: string;
  employee_name: string;
  employee_code: string;
  department_name: string;
  total_hours: number;
  regular_hours: number;
  overtime_hours: number;
  late_arrivals: number;
  absent_days: number;
  attendance_rate: number;
  punctuality_rate: number;
  present_days: number;
  expected_days: number;
  expected_hours: number; // Horas que debería trabajar
  hours_deficit: number;  // Déficit de horas (negativo si trabajó menos)
}

export interface WeeklyTrend {
  week: string;
  total_hours: number;
  attendance_rate: number;
  punctuality_rate: number;
  late_arrivals: number;
  absent_days: number;
}

export interface DepartmentComparison {
  department_name: string;
  total_employees: number;
  avg_hours: number;
  attendance_rate: number;
  punctuality_rate: number;
  total_late_arrivals: number;
}

export function useAdvancedAnalytics(startDate: string, endDate: string) {
  const [analytics, setAnalytics] = useState<AdvancedAnalytics | null>(null);
  const [employeeAnalytics, setEmployeeAnalytics] = useState<EmployeeAnalytics[]>([]);
  const [weeklyTrends, setWeeklyTrends] = useState<WeeklyTrend[]>([]);
  const [departmentComparisons, setDepartmentComparisons] = useState<DepartmentComparison[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const supabase = createSupabaseClient();
      
      console.log('📊 Cargando analíticas avanzadas:', { startDate, endDate });
      
      // 1. Primero verificar si hay datos básicos
      const { data: simpleTest, error: simpleError } = await supabase
        .from('attendances')
        .select('id')
        .limit(1);

      if (simpleError) {
        throw new Error(`Error de conexión: ${simpleError.message}`);
      }

      console.log('✅ Conexión exitosa, registros disponibles:', simpleTest?.length || 0);

      // 2. Obtener total de empleados activos
      const { count: totalEmployees, error: employeesError } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (employeesError) {
        console.error('Error consultando empleados:', employeesError);
      }

      console.log('👥 Total empleados activos:', totalEmployees || 0);

      // 3. Obtener asistencias del período con datos de empleados
      const attendanceQuery = await supabase
        .from('attendances')
        .select(`
          id,
          employee_id,
          attendance_date,
          check_in_time,
          check_out_time,
          work_hours,
          overtime_hours,
          status
        `)
        .gte('attendance_date', startDate)
        .lte('attendance_date', endDate)
        .order('attendance_date', { ascending: false });

      const attendanceData = attendanceQuery.data as AttendanceFromDB[] | null;
      const attendanceQueryError = attendanceQuery.error;

      if (attendanceQueryError) {
        throw new Error(`Error consultando asistencias: ${attendanceQueryError.message}`);
      }

      console.log('📅 Asistencias encontradas:', attendanceData?.length || 0);

      if (!attendanceData || attendanceData.length === 0) {
        console.log('⚠️ No hay registros de asistencia en el período seleccionado');
        setAnalytics({
          totalHoursWorked: 0,
          averageHoursPerEmployee: 0,
          lateArrivals: 0,
          absentDays: 0,
          attendanceRate: 0,
          punctualityRate: 0,
          overtimeHours: 0,
          totalEmployees: totalEmployees || 0
        });
        setEmployeeAnalytics([]);
        return;
      }

      // 4. Obtener datos de empleados únicos
      const uniqueEmployeeIds = [...new Set(attendanceData.map(att => att.employee_id))];
      
      const { data: employeesData, error: employeesDataError } = await supabase
        .from('employees')
        .select(`
          id,
          full_name,
          employee_code,
          department_id,
          departments (
            name
          )
        `)
        .in('id', uniqueEmployeeIds);

      if (employeesDataError) {
        console.error('Error consultando empleados:', employeesDataError);
      }

      // Crear mapa de empleados para lookup rápido
      const employeesMap = new Map<string, EmployeeFromDB>();
      employeesData?.forEach((emp: EmployeeFromDB) => {
        employeesMap.set(emp.id, emp);
      });

      // 4. Calcular analíticas generales
      const totalHoursWorked = attendanceData.reduce((sum, att) => 
        sum + (att.work_hours || 0), 0
      );
      
      const overtimeHours = attendanceData.reduce((sum, att) => 
        sum + (att.overtime_hours || 0), 0
      );

      const lateArrivals = attendanceData.filter(att => 
        att.status === 'late'
      ).length;

      const absentDays = attendanceData.filter(att => 
        att.status === 'absent'
      ).length;

      const presentDays = attendanceData.filter(att => 
        att.status && !['absent'].includes(att.status)
      ).length;

      // Calcular días laborables esperados (excluyendo fines de semana)
      const calculateWorkingDays = (start: string, end: string): number => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        let workingDays = 0;
        
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          const dayOfWeek = currentDate.getDay();
          if (dayOfWeek !== 0 && dayOfWeek !== 6) { // No domingo ni sábado
            workingDays++;
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
        return workingDays;
      };

      const workingDays = calculateWorkingDays(startDate, endDate);
      const expectedAttendances = (totalEmployees || 0) * workingDays;
      
      const attendanceRate = expectedAttendances > 0 ? 
        (presentDays / expectedAttendances) * 100 : 0;
      
      const punctualityRate = presentDays > 0 ? 
        ((presentDays - lateArrivals) / presentDays) * 100 : 0;
      
      const averageHoursPerEmployee = (totalEmployees || 0) > 0 ? 
        totalHoursWorked / (totalEmployees || 1) : 0;

      const generalAnalytics: AdvancedAnalytics = {
        totalHoursWorked: Math.round(totalHoursWorked * 100) / 100,
        averageHoursPerEmployee: Math.round(averageHoursPerEmployee * 100) / 100,
        lateArrivals,
        absentDays,
        attendanceRate: Math.round(attendanceRate * 100) / 100,
        punctualityRate: Math.round(punctualityRate * 100) / 100,
        overtimeHours: Math.round(overtimeHours * 100) / 100,
        totalEmployees: totalEmployees || 0
      };

      // 5. Calcular analíticas por empleado
      interface EmployeeMapData {
        employee_id: string;
        employee_name: string;
        employee_code: string;
        department_name: string;
        total_hours: number;
        regular_hours: number;
        overtime_hours: number;
        late_arrivals: number;
        absent_days: number;
        present_days: number;
      }
      
      const employeeMap = new Map<string, EmployeeMapData>();

      attendanceData.forEach((att: AttendanceFromDB) => {
        const empId = att.employee_id;
        const employeeInfo = employeesMap.get(empId);
        
        if (!employeeInfo) {
          console.warn(`Empleado no encontrado: ${empId}`);
          return;
        }
        
        if (!employeeMap.has(empId)) {
          employeeMap.set(empId, {
            employee_id: empId,
            employee_name: employeeInfo.full_name,
            employee_code: employeeInfo.employee_code,
            department_name: employeeInfo.departments?.name || 'Sin Departamento',
            total_hours: 0,
            regular_hours: 0,
            overtime_hours: 0,
            late_arrivals: 0,
            absent_days: 0,
            present_days: 0
          });
        }

        const emp = employeeMap.get(empId)!; // Sabemos que existe porque lo creamos arriba
        
        emp.total_hours += att.work_hours || 0;
        emp.overtime_hours += att.overtime_hours || 0;
        emp.regular_hours += Math.max(0, (att.work_hours || 0) - (att.overtime_hours || 0));

        if (att.status === 'late') {
          emp.late_arrivals += 1;
          emp.present_days += 1;
        } else if (att.status === 'absent') {
          emp.absent_days += 1;
        } else if (att.status && att.status !== 'absent') {
          emp.present_days += 1;
        }
      });

      const employeeAnalyticsData: EmployeeAnalytics[] = Array.from(employeeMap.values()).map(emp => {
        const expectedHours = workingDays * 8; // 8 horas por día laboral
        const hoursDeficit = emp.total_hours - expectedHours;
        
        return {
          ...emp,
          total_hours: Math.round(emp.total_hours * 100) / 100,
          regular_hours: Math.round(emp.regular_hours * 100) / 100,
          overtime_hours: Math.round(emp.overtime_hours * 100) / 100,
          expected_days: workingDays,
          expected_hours: expectedHours,
          hours_deficit: Math.round(hoursDeficit * 100) / 100,
          attendance_rate: workingDays > 0 ? 
            Math.round((emp.present_days / workingDays) * 10000) / 100 : 0,
          punctuality_rate: emp.present_days > 0 ? 
            Math.round(((emp.present_days - emp.late_arrivals) / emp.present_days) * 10000) / 100 : 0
        };
      });

      console.log('✅ Analíticas calculadas:', {
        general: generalAnalytics,
        employees: employeeAnalyticsData.length
      });

      // 6. Calcular tendencias semanales
      const weeklyTrendsData = calculateWeeklyTrends(attendanceData, startDate, endDate);
      
      // 7. Calcular comparaciones por departamento
      const departmentComparisonsData = calculateDepartmentComparisons(employeeAnalyticsData);

      setAnalytics(generalAnalytics);
      setEmployeeAnalytics(employeeAnalyticsData);
      setWeeklyTrends(weeklyTrendsData);
      setDepartmentComparisons(departmentComparisonsData);

    } catch (err) {
      console.error('❌ Error cargando analíticas:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  // Función auxiliar para calcular tendencias semanales
  const calculateWeeklyTrends = (attendanceData: AttendanceFromDB[], startDate: string, endDate: string): WeeklyTrend[] => {
    const weeks = new Map<string, {
      total_hours: number;
      present_days: number;
      late_arrivals: number;
      absent_days: number;
      total_possible_days: number;
    }>();

    // Agrupar por semana
    attendanceData.forEach(att => {
      const date = new Date(att.attendance_date);
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay() + 1); // Lunes como inicio de semana
      const weekKey = startOfWeek.toISOString().split('T')[0];

      if (!weeks.has(weekKey)) {
        weeks.set(weekKey, {
          total_hours: 0,
          present_days: 0,
          late_arrivals: 0,
          absent_days: 0,
          total_possible_days: 0
        });
      }

      const week = weeks.get(weekKey)!;
      week.total_hours += att.work_hours || 0;
      week.total_possible_days += 1;

      if (att.status === 'late') {
        week.late_arrivals += 1;
        week.present_days += 1;
      } else if (att.status === 'absent') {
        week.absent_days += 1;
      } else if (att.status && att.status !== 'absent') {
        week.present_days += 1;
      }
    });

    return Array.from(weeks.entries())
      .map(([week, data]) => ({
        week,
        total_hours: Math.round(data.total_hours * 100) / 100,
        attendance_rate: data.total_possible_days > 0 ? 
          Math.round((data.present_days / data.total_possible_days) * 10000) / 100 : 0,
        punctuality_rate: data.present_days > 0 ? 
          Math.round(((data.present_days - data.late_arrivals) / data.present_days) * 10000) / 100 : 0,
        late_arrivals: data.late_arrivals,
        absent_days: data.absent_days
      }))
      .sort((a, b) => a.week.localeCompare(b.week));
  };

  // Función auxiliar para calcular comparaciones por departamento
  const calculateDepartmentComparisons = (employeeAnalytics: EmployeeAnalytics[]): DepartmentComparison[] => {
    const departments = new Map<string, {
      employees: EmployeeAnalytics[];
      total_hours: number;
      total_late_arrivals: number;
      total_present_days: number;
      total_expected_days: number;
    }>();

    employeeAnalytics.forEach(emp => {
      const deptName = emp.department_name;
      
      if (!departments.has(deptName)) {
        departments.set(deptName, {
          employees: [],
          total_hours: 0,
          total_late_arrivals: 0,
          total_present_days: 0,
          total_expected_days: 0
        });
      }

      const dept = departments.get(deptName)!;
      dept.employees.push(emp);
      dept.total_hours += emp.total_hours;
      dept.total_late_arrivals += emp.late_arrivals;
      dept.total_present_days += emp.present_days;
      dept.total_expected_days += emp.expected_days;
    });

    return Array.from(departments.entries()).map(([department_name, data]) => ({
      department_name,
      total_employees: data.employees.length,
      avg_hours: data.employees.length > 0 ? 
        Math.round((data.total_hours / data.employees.length) * 100) / 100 : 0,
      attendance_rate: data.total_expected_days > 0 ? 
        Math.round((data.total_present_days / data.total_expected_days) * 10000) / 100 : 0,
      punctuality_rate: data.total_present_days > 0 ? 
        Math.round(((data.total_present_days - data.total_late_arrivals) / data.total_present_days) * 10000) / 100 : 0,
      total_late_arrivals: data.total_late_arrivals
    }));
  };

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return {
    analytics,
    employeeAnalytics,
    weeklyTrends,
    departmentComparisons,
    loading,
    error,
    refreshData: loadAnalytics
  };
}
