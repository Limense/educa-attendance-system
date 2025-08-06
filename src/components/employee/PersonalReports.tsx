/**
 * =============================================
 * PERSONAL REPORTS COMPONENT
 * =============================================
 * 
 * Descripción: Sistema completo de reportes personales para empleados
 * Características: Filtros, estadísticas, gráficos y exportación a PDF
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';
import type { Attendance, Employee } from '@/types/database';
import { format, startOfMonth, endOfMonth, subMonths, parseISO, differenceInHours } from 'date-fns';
import { es } from 'date-fns/locale';

interface PersonalReportsProps {
  employeeId: string;
  employee: Employee;
}

interface ReportFilters {
  startDate: string;
  endDate: string;
  period: 'week' | 'month' | 'quarter' | 'custom';
}

interface ReportStats {
  totalDays: number;
  workDays: number;
  presentDays: number;
  absentDays: number;
  incompleteDays: number;
  totalHours: number;
  averageHours: number;
  punctualityRate: number;
  attendanceRate: number;
  overtimeHours: number;
}

/**
 * Hook para cargar datos del reporte
 */
function useReportData(employeeId: string, filters: ReportFilters) {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReportData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = createSupabaseClient();
      
      const { data, error } = await supabase
        .from('attendances')
        .select('*')
        .eq('employee_id', employeeId)
        .gte('attendance_date', filters.startDate)
        .lte('attendance_date', filters.endDate)
        .order('attendance_date', { ascending: true });

      if (error) throw error;
      
      setAttendances(data || []);
    } catch (error) {
      console.error('Error loading report data:', error);
      setError('Error al cargar los datos del reporte');
      setAttendances([]);
    } finally {
      setLoading(false);
    }
  }, [employeeId, filters.startDate, filters.endDate]);

  useEffect(() => {
    loadReportData();
  }, [employeeId, filters.startDate, filters.endDate, loadReportData]);

  return { attendances, loading, error, refreshData: loadReportData };
}

/**
 * Hook para calcular estadísticas del reporte
 */
function useReportStats(attendances: Attendance[], filters: ReportFilters): ReportStats {
  return useMemo(() => {
    const startDate = parseISO(filters.startDate);
    const endDate = parseISO(filters.endDate);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // Calcular días laborables (excluyendo fines de semana)
    let workDays = 0;
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      if (d.getDay() !== 0 && d.getDay() !== 6) workDays++;
    }
    
    const presentDays = attendances.filter(a => a.check_in_time).length;
    const completeDays = attendances.filter(a => a.check_in_time && a.check_out_time).length;
    const incompleteDays = attendances.filter(a => a.check_in_time && !a.check_out_time).length;
    const absentDays = workDays - presentDays;
    
    const totalHours = attendances.reduce((sum, attendance) => {
      if (attendance.check_in_time && attendance.check_out_time) {
        const checkIn = new Date(`${attendance.attendance_date}T${attendance.check_in_time}`);
        const checkOut = new Date(`${attendance.attendance_date}T${attendance.check_out_time}`);
        return sum + differenceInHours(checkOut, checkIn);
      }
      return sum;
    }, 0);
    
    const averageHours = completeDays > 0 ? totalHours / completeDays : 0;
    const attendanceRate = workDays > 0 ? (presentDays / workDays) * 100 : 0;
    const punctualityRate = presentDays > 0 ? (completeDays / presentDays) * 100 : 0;
    const overtimeHours = attendances.reduce((sum, a) => sum + (a.overtime_hours || 0), 0);
    
    return {
      totalDays,
      workDays,
      presentDays,
      absentDays,
      incompleteDays,
      totalHours,
      averageHours,
      punctualityRate,
      attendanceRate,
      overtimeHours
    };
  }, [attendances, filters]);
}

/**
 * Componente de filtros de reporte
 */
function ReportFilters({ filters, onFiltersChange, loading }: {
  filters: ReportFilters;
  onFiltersChange: (filters: ReportFilters) => void;
  loading: boolean;
}) {
  const handlePeriodChange = (period: ReportFilters['period']) => {
    const today = new Date();
    let startDate: Date;
    let endDate = today;
    
    switch (period) {
      case 'week':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        break;
      case 'month':
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        break;
      case 'quarter':
        startDate = subMonths(today, 3);
        break;
      default:
        return;
    }
    
    onFiltersChange({
      ...filters,
      period,
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd')
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros del Reporte</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Period selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Período
          </label>
          <select
            value={filters.period}
            onChange={(e) => handlePeriodChange(e.target.value as ReportFilters['period'])}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
          >
            <option value="week">Última semana</option>
            <option value="month">Este mes</option>
            <option value="quarter">Últimos 3 meses</option>
            <option value="custom">Personalizado</option>
          </select>
        </div>

        {/* Start date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha inicio
          </label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => onFiltersChange({ ...filters, startDate: e.target.value, period: 'custom' })}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
          />
        </div>

        {/* End date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha fin
          </label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => onFiltersChange({ ...filters, endDate: e.target.value, period: 'custom' })}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
          />
        </div>

        {/* Generate button */}
        <div className="flex items-end">
          <button
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
          >
            {loading ? 'Generando...' : 'Generar Reporte'}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Componente de estadísticas del reporte
 */
function ReportStatistics({ stats }: { stats: ReportStats }) {
  const statCards = [
    {
      title: 'Días Trabajados',
      value: stats.presentDays,
      total: stats.workDays,
      color: 'blue',
      icon: '📅',
      suffix: 'días'
    },
    {
      title: 'Tasa de Asistencia',
      value: stats.attendanceRate,
      color: 'green',
      icon: '✅',
      suffix: '%',
      precision: 1
    },
    {
      title: 'Tasa de Puntualidad',
      value: stats.punctualityRate,
      color: 'yellow',
      icon: '⏰',
      suffix: '%',
      precision: 1
    },
    {
      title: 'Horas Totales',
      value: stats.totalHours,
      color: 'purple',
      icon: '🕐',
      suffix: 'h'
    },
    {
      title: 'Promedio Diario',
      value: stats.averageHours,
      color: 'indigo',
      icon: '📊',
      suffix: 'h/día',
      precision: 1
    },
    {
      title: 'Horas Extra',
      value: stats.overtimeHours,
      color: 'orange',
      icon: '⏱️',
      suffix: 'h'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 border-blue-200 text-blue-800',
      green: 'bg-green-50 border-green-200 text-green-800',
      yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      purple: 'bg-purple-50 border-purple-200 text-purple-800',
      indigo: 'bg-indigo-50 border-indigo-200 text-indigo-800',
      orange: 'bg-orange-50 border-orange-200 text-orange-800'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {statCards.map((stat) => (
        <div
          key={stat.title}
          className={`rounded-xl border-2 p-6 ${getColorClasses(stat.color)} transition-all duration-200 hover:shadow-lg hover:scale-105`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl">{stat.icon}</div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {stat.precision ? stat.value.toFixed(stat.precision) : Math.round(stat.value)}
                <span className="text-lg font-normal ml-1">{stat.suffix}</span>
              </div>
              {stat.total && (
                <div className="text-sm opacity-75">
                  de {stat.total} {stat.suffix}
                </div>
              )}
            </div>
          </div>
          <h3 className="font-semibold text-sm">{stat.title}</h3>
        </div>
      ))}
    </div>
  );
}

/**
 * Componente principal de reportes personales
 */
export function PersonalReports({ employeeId, employee }: PersonalReportsProps) {
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    period: 'month'
  });

  const { attendances, loading, error } = useReportData(employeeId, filters);
  const stats = useReportStats(attendances, filters);

  const generatePDF = async () => {
    // TODO: Implementar generación de reportes desde cero
    console.log('Datos para reporte:', { employee, attendances, stats });
    alert('Funcionalidad de reportes en desarrollo');
  };

  const generateHTMLPDF = async () => {
    // TODO: Implementar generación de reportes desde cero
    console.log('Datos para reporte HTML:', { employee, attendances, stats });
    alert('Funcionalidad de reportes en desarrollo');
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-500 mr-3">⚠️</div>
            <div>
              <h3 className="text-red-800 font-medium">Error al cargar datos</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mis Reportes</h2>
          <p className="text-gray-600 mt-1">
            Genera reportes detallados de tu asistencia y productividad
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={generatePDF}
            disabled={loading || attendances.length === 0}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors font-medium"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            PDF Clásico
          </button>
          
          <button
            onClick={generateHTMLPDF}
            disabled={loading || attendances.length === 0}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            🎨 PDF Moderno
          </button>
        </div>
      </div>

      {/* Filtros */}
      <ReportFilters
        filters={filters}
        onFiltersChange={setFilters}
        loading={loading}
      />

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Cargando datos...</span>
        </div>
      )}

      {!loading && attendances.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sin datos en el período seleccionado</h3>
          <p className="text-gray-600">Intenta cambiar las fechas del filtro para ver información.</p>
        </div>
      )}

      {!loading && attendances.length > 0 && (
        <>
          {/* Estadísticas */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen del Período</h3>
            <ReportStatistics stats={stats} />
          </div>

          {/* Detalle por días */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalle de Asistencias</h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entrada
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Salida
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Horas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendances.map((attendance) => {
                    const hours = attendance.check_in_time && attendance.check_out_time
                      ? differenceInHours(
                          new Date(`${attendance.attendance_date}T${attendance.check_out_time}`),
                          new Date(`${attendance.attendance_date}T${attendance.check_in_time}`)
                        )
                      : 0;
                    
                    const status = attendance.check_in_time && attendance.check_out_time
                      ? 'complete'
                      : attendance.check_in_time
                      ? 'incomplete'
                      : 'absent';

                    const statusConfig = {
                      complete: { text: 'Completo', color: 'bg-green-100 text-green-800' },
                      incomplete: { text: 'Incompleto', color: 'bg-yellow-100 text-yellow-800' },
                      absent: { text: 'Ausente', color: 'bg-red-100 text-red-800' }
                    };

                    return (
                      <tr key={attendance.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {format(parseISO(attendance.attendance_date), 'dd/MM/yyyy', { locale: es })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {attendance.check_in_time || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {attendance.check_out_time || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {hours > 0 ? `${hours}h` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusConfig[status].color}`}>
                            {statusConfig[status].text}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
