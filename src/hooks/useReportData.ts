/**
 * =============================================
 * HOOK PARA DATOS DE REPORTES
 * =============================================
 * 
 * Hook personalizado para cargar y gestionar datos de reportes
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';
import type { AttendanceRecord, ReportFilters, ReportStats } from '@/types/reports.types';

export function useReportData(filters: ReportFilters) {
  const [data, setData] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReportData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const supabase = createSupabaseClient();
      
      console.log('🔍 Iniciando consulta a Supabase...');
      
      // CONSULTA MUY SIMPLE PARA DIAGNOSTICAR
      const { data: simpleTest, error: simpleError } = await supabase
        .from('attendances')
        .select('*')
        .limit(1);

      console.log('✅ Prueba simple:', { simpleTest, simpleError });

      if (simpleError) {
        console.error('❌ Error en consulta simple:', simpleError);
        throw new Error(`Error de conexión: ${simpleError.message}`);
      }

      // Si la consulta simple funciona, hacemos consultas separadas para evitar ambigüedad
      console.log('🔍 Cargando datos de asistencia...');
      
      // Definir tipos para las consultas separadas
      interface AttendanceQueryResult {
        id: string;
        attendance_date: string;
        check_in_time?: string;
        check_out_time?: string;
        work_hours?: number;
        overtime_hours?: number;
        status?: string;
        employee_id: string;
      }

      interface EmployeeQueryResult {
        id: string;
        full_name: string;
        employee_code: string;
        department_id: string;
        departments: {
          id: string;
          name: string;
          code: string;
        } | null;
      }
      
      // PRIMERA CONSULTA: Solo attendances con filtros básicos
      let attendanceQuery = supabase
        .from('attendances')
        .select(`
          id,
          attendance_date,
          check_in_time,
          check_out_time,
          work_hours,
          overtime_hours,
          status,
          employee_id
        `)
        .gte('attendance_date', filters.startDate)
        .lte('attendance_date', filters.endDate)
        .order('attendance_date', { ascending: false })
        .limit(100);

      console.log('🔍 Filtros aplicados:', {
        startDate: filters.startDate,
        endDate: filters.endDate,
        employeeId: filters.employeeId,
        departmentId: filters.departmentId,
        status: filters.status,
        reportType: filters.reportType
      });

      // Aplicar filtro de empleado específico
      if (filters.employeeId) {
        attendanceQuery = attendanceQuery.eq('employee_id', filters.employeeId);
      }

      // Aplicar filtros de status
      if (filters.status) {
        switch (filters.status) {
          case 'present':
            attendanceQuery = attendanceQuery.not('check_in_time', 'is', null);
            break;
          case 'absent':
            attendanceQuery = attendanceQuery.is('check_in_time', null);
            break;
          case 'incomplete':
            attendanceQuery = attendanceQuery.not('check_in_time', 'is', null).is('check_out_time', null);
            break;
          case 'late':
            // Filtrar por registros con entrada tardía (después de las 9:00 AM)
            attendanceQuery = attendanceQuery.not('check_in_time', 'is', null).gt('check_in_time', `${filters.startDate} 09:00:00`);
            break;
        }
      }

      const { data: attendanceData, error: attendanceError } = await attendanceQuery;

      console.log('📊 Resultado de consulta de asistencias:', { 
        count: attendanceData?.length || 0, 
        error: attendanceError 
      });

      if (attendanceError) {
        console.error('❌ Error en consulta de asistencias:', attendanceError);
        throw new Error(`Error de base de datos: ${attendanceError.message}`);
      }

      // SEGUNDA CONSULTA: Obtener datos de empleados y departamentos
      const employeeIds = [...new Set(attendanceData?.map((a: AttendanceQueryResult) => a.employee_id) || [])];
      
      if (employeeIds.length === 0) {
        console.log('⚠️ No hay registros de asistencia');
        setData([]);
        setStats(null);
        return;
      }

      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select(`
          id,
          full_name,
          employee_code,
          department_id,
          departments!inner(
            id,
            name,
            code
          )
        `)
        .in('id', employeeIds);

      console.log('👥 Resultado de consulta de empleados:', { 
        count: employeeData?.length || 0, 
        error: employeeError 
      });

      if (employeeError) {
        console.error('❌ Error en consulta de empleados:', employeeError);
        // No fallar completamente, usar datos sin nombres
      }

      // Filtrar por departamento si es necesario
      let filteredAttendanceData = attendanceData || [];
      if (filters.departmentId && employeeData) {
        const employeesInDept = employeeData
          .filter((emp: EmployeeQueryResult) => emp.department_id === filters.departmentId)
          .map((emp: EmployeeQueryResult) => emp.id);
        
        filteredAttendanceData = filteredAttendanceData.filter((att: AttendanceQueryResult) => 
          employeesInDept.includes(att.employee_id)
        );
      }

      console.log('📊 Datos de asistencia recibidos:', filteredAttendanceData);

      // Crear un mapa de empleados para búsqueda rápida
      const employeeMap = new Map();
      if (employeeData) {
        employeeData.forEach((emp: EmployeeQueryResult) => {
          employeeMap.set(emp.id, {
            full_name: emp.full_name,
            employee_code: emp.employee_code,
            department_name: emp.departments?.name || 'Sin Departamento'
          });
        });
      }

      // Procesar datos combinando attendance con employee info
      const processedData: AttendanceRecord[] = filteredAttendanceData.map((record: AttendanceQueryResult) => {
        const employeeInfo = employeeMap.get(record.employee_id) || {
          full_name: 'Empleado Sin Nombre',
          employee_code: 'N/A',
          department_name: 'Sin Departamento'
        };
        
        let total_hours = 0;
        
        // Usar work_hours si está disponible, sino calcular
        if (record.work_hours) {
          total_hours = record.work_hours;
        } else if (record.check_in_time && record.check_out_time) {
          const checkIn = new Date(`${record.attendance_date}T${record.check_in_time}`);
          const checkOut = new Date(`${record.attendance_date}T${record.check_out_time}`);
          total_hours = Math.abs((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60));
        }
        
        return {
          id: record.id,
          employee_name: employeeInfo.full_name,
          department_name: employeeInfo.department_name,
          clock_in: record.check_in_time,
          clock_out: record.check_out_time,
          status: record.status || (record.check_in_time ? 'present' : 'absent'),
          total_hours: Math.round(total_hours * 100) / 100, // Redondear a 2 decimales
          attendance_date: record.attendance_date,
          employee_code: employeeInfo.employee_code
        };
      });

      console.log('✅ Datos procesados para tabla:', processedData);
      setData(processedData);

      // Cargar estadísticas separadas
      await loadReportStats(processedData, filters);
      
    } catch (err) {
      console.error('Error loading report data:', err);
      setError('Error al cargar los datos del reporte');
      setData([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadReportStats = async (attendanceData: AttendanceRecord[], filters: ReportFilters) => {
    try {
      const supabase = createSupabaseClient();
      
      // Obtener conteo total de empleados activos en la organización
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('id')
        .eq('is_active', true);

      if (employeeError) {
        throw employeeError;
      }

      const totalEmployees = employeeData?.length || 0;
      const totalAttendances = attendanceData.length;
      const presentDays = attendanceData.filter(a => a.clock_in).length;
      const absentDays = attendanceData.filter(a => !a.clock_in).length;
      const incompleteDays = attendanceData.filter(a => a.clock_in && !a.clock_out).length;
      const completeDays = attendanceData.filter(a => a.clock_in && a.clock_out).length;

      const totalHours = attendanceData.reduce((sum, a) => sum + (a.total_hours || 0), 0);
      const overtimeHours = 0; // Temporal - no tenemos overtime_hours en AttendanceRecord
      const averageHours = completeDays > 0 ? totalHours / completeDays : 0;

      // Calcular días laborables en el período
      const startDate = new Date(filters.startDate);
      const endDate = new Date(filters.endDate);
      let workDays = 0;
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        if (d.getDay() !== 0 && d.getDay() !== 6) workDays++; // Excluir fines de semana
      }

      const attendanceRate = workDays > 0 ? (presentDays / (workDays * totalEmployees)) * 100 : 0;
      const punctualityRate = presentDays > 0 ? (completeDays / presentDays) * 100 : 0;

      const calculatedStats: ReportStats = {
        totalEmployees,
        totalAttendances,
        presentDays,
        absentDays,
        incompleteDays,
        attendanceRate,
        punctualityRate,
        totalHours,
        overtimeHours,
        averageHours
      };

      setStats(calculatedStats);

    } catch (err) {
      console.error('Error loading report stats:', err);
      // No fallar completamente si solo las estadísticas fallan
    }
  };

  useEffect(() => {
    loadReportData();
  }, [filters.startDate, filters.endDate, filters.reportType, filters.status, loadReportData]);

  return {
    data,
    stats,
    loading,
    error,
    refreshData: loadReportData
  };
}
