/**
 * =============================================
 * ATTENDANCE DETAILS COMPONENT
 * =============================================
 * 
 * Descripción: Vista detallada del historial de asistencias
 * Incluye filtros, estadísticas y visualización de datos
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AttendanceHistory } from '@/components/attendance';
import { createSupabaseClient } from '@/lib/supabase/client';
import type { Attendance } from '@/types/database';

interface AttendanceDetailsProps {
  employeeId: string;
}

/**
 * Interface para filtros de búsqueda
 */
interface AttendanceFilters {
  startDate: string;
  endDate: string;
  status: 'all' | 'complete' | 'incomplete';
}

/**
 * Interface para estadísticas
 */
interface AttendanceStats {
  totalDays: number;
  completeDays: number;
  incompleteDays: number;
  totalHours: number;
  averageHours: number;
  punctualityRate: number;
}

/**
 * Componente para mostrar estadísticas de asistencia
 */
function AttendanceStatsCard({ stats }: { stats: AttendanceStats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-blue-600">{stats.totalDays}</div>
        <div className="text-sm text-blue-800">Días Registrados</div>
      </div>
      
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-green-600">{stats.completeDays}</div>
        <div className="text-sm text-green-800">Días Completos</div>
      </div>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-yellow-600">{stats.incompleteDays}</div>
        <div className="text-sm text-yellow-800">Días Incompletos</div>
      </div>
      
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-purple-600">{stats.totalHours.toFixed(1)}h</div>
        <div className="text-sm text-purple-800">Total Horas</div>
      </div>
      
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-indigo-600">{stats.averageHours.toFixed(1)}h</div>
        <div className="text-sm text-indigo-800">Promedio/Día</div>
      </div>
      
      <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-teal-600">{stats.punctualityRate.toFixed(1)}%</div>
        <div className="text-sm text-teal-800">Puntualidad</div>
      </div>
    </div>
  );
}

/**
 * Componente principal para el historial detallado de asistencias
 */
export function AttendanceDetails({ employeeId }: AttendanceDetailsProps) {
  const [attendanceHistory, setAttendanceHistory] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<AttendanceFilters>(() => {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    return {
      startDate,
      endDate,
      status: 'all'
    };
  });

  /**
   * Carga el historial de asistencias con filtros
   */
  const loadAttendanceHistory = useCallback(async () => {
    if (!employeeId) return;

    try {
      setLoading(true);
      const supabase = createSupabaseClient();
      
      let query = supabase
        .from('attendances')
        .select('*')
        .eq('employee_id', employeeId)
        .gte('attendance_date', filters.startDate)
        .lte('attendance_date', filters.endDate)
        .order('attendance_date', { ascending: false });

      // Aplicar filtro de estado
      if (filters.status === 'complete') {
        query = query.not('check_out_time', 'is', null);
      } else if (filters.status === 'incomplete') {
        query = query.is('check_out_time', null);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;

      setAttendanceHistory(data || []);
    } catch (error) {
      console.error('Error loading attendance history:', error);
    } finally {
      setLoading(false);
    }
  }, [employeeId, filters]);

  /**
   * Calcula estadísticas basadas en el historial cargado
   */
  const stats = useMemo((): AttendanceStats => {
    const totalDays = attendanceHistory.length;
    const completeDays = attendanceHistory.filter(a => a.check_out_time).length;
    const incompleteDays = totalDays - completeDays;
    
    let totalHours = 0;
    let punctualArrivals = 0;
    const standardStartTime = 9; // 9:00 AM

    attendanceHistory.forEach(attendance => {
      if (attendance.check_in_time && attendance.check_out_time) {
        const checkIn = new Date(attendance.check_in_time);
        const checkOut = new Date(attendance.check_out_time);
        const hours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
        totalHours += hours;

        // Verificar puntualidad (antes de las 9:00 AM)
        if (checkIn.getHours() < standardStartTime || 
            (checkIn.getHours() === standardStartTime && checkIn.getMinutes() <= 15)) {
          punctualArrivals++;
        }
      }
    });

    const averageHours = totalDays > 0 ? totalHours / totalDays : 0;
    const punctualityRate = totalDays > 0 ? (punctualArrivals / totalDays) * 100 : 0;

    return {
      totalDays,
      completeDays,
      incompleteDays,
      totalHours,
      averageHours,
      punctualityRate
    };
  }, [attendanceHistory]);

  /**
   * Maneja cambios en los filtros
   */
  const handleFilterChange = useCallback((newFilters: Partial<AttendanceFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  /**
   * Exporta datos a CSV
   */
  const exportToCSV = useCallback(() => {
    if (attendanceHistory.length === 0) return;

    const headers = ['Fecha', 'Entrada', 'Salida', 'Horas Trabajadas', 'Estado'];
    const csvData = attendanceHistory.map(attendance => {
      const date = attendance.attendance_date;
      const checkIn = attendance.check_in_time 
        ? new Date(attendance.check_in_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
        : 'N/A';
      const checkOut = attendance.check_out_time 
        ? new Date(attendance.check_out_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
        : 'N/A';
      
      let hoursWorked = 'N/A';
      if (attendance.check_in_time && attendance.check_out_time) {
        const hours = (new Date(attendance.check_out_time).getTime() - new Date(attendance.check_in_time).getTime()) / (1000 * 60 * 60);
        hoursWorked = hours.toFixed(2);
      }

      const status = attendance.check_out_time ? 'Completo' : 'Incompleto';

      return [date, checkIn, checkOut, hoursWorked, status];
    });

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `asistencias_${filters.startDate}_${filters.endDate}.csv`;
    link.click();
  }, [attendanceHistory, filters]);

  // Cargar datos cuando cambian los filtros
  useEffect(() => {
    loadAttendanceHistory();
  }, [loadAttendanceHistory]);

  return (
    <div className="p-6 space-y-6">
      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros de Búsqueda</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange({ startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Fin
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange({ endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange({ status: e.target.value as AttendanceFilters['status'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos</option>
              <option value="complete">Completos</option>
              <option value="incomplete">Incompletos</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={exportToCSV}
              disabled={attendanceHistory.length === 0}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              📊 Exportar CSV
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas del Período</h3>
        <AttendanceStatsCard stats={stats} />
      </div>

      {/* Historial */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Historial de Asistencias</h3>
            <button
              onClick={loadAttendanceHistory}
              disabled={loading}
              className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              {loading ? '🔄 Cargando...' : '🔄 Actualizar'}
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <AttendanceHistory
            attendances={attendanceHistory}
            loading={loading}
            onRefresh={loadAttendanceHistory}
          />
        </div>
      </div>
    </div>
  );
}
