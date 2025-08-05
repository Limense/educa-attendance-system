/**
 * =============================================
 * ATTENDANCE HISTORY COMPONENT
 * =============================================
 * 
 * Descripción: Componente para mostrar el historial de asistencias
 * Implementa Pagination Pattern y Observer Pattern para filtros
 * 
 * Responsabilidades:
 * - Mostrar historial de asistencias paginado
 * - Filtros por fecha, estado, etc.
 * - Vista tabular responsive
 * - Cálculo de estadísticas básicas
 */

'use client';

import React, { useMemo, useState } from 'react';
import type { Attendance } from '@/types/database';

interface AttendanceHistoryProps {
  /** Array de registros de asistencia */
  attendances: Attendance[];
  /** Estado de carga */
  loading?: boolean;
  /** Función para cargar más datos (opcional - para paginación infinita) */
  onLoadMore?: (() => void) | null;
  /** Función para refrescar datos */
  onRefresh?: () => void;
  /** Número de elementos por página */
  pageSize?: number;
  /** Clases CSS adicionales */
  className?: string;
}

/**
 * Filtros disponibles para el historial
 */
interface HistoryFilters {
  dateFrom?: string;
  dateTo?: string;
  status?: string;
}

/**
 * Utilidades para el procesamiento de asistencias
 */
class AttendanceHistoryUtils {
  /**
   * Formatea una fecha ISO para mostrar
   */
  static formatDate(isoString: string): string {
    return new Date(isoString).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Formatea una hora ISO para mostrar
   */
  static formatTime(isoString: string): string {
    return new Date(isoString).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Calcula las horas trabajadas
   */
  static calculateHours(checkIn: string, checkOut?: string): string {
    if (!checkOut) return '--';
    
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
    
    return `${hours}h`;
  }

  /**
   * Obtiene el color del estado
   */
  static getStatusColor(status: string): string {
    const statusColors: Record<string, string> = {
      'present': 'bg-green-100 text-green-800',
      'late': 'bg-yellow-100 text-yellow-800',
      'absent': 'bg-red-100 text-red-800',
      'half_day': 'bg-blue-100 text-blue-800',
      'sick_leave': 'bg-purple-100 text-purple-800'
    };

    return statusColors[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Traduce el estado al español
   */
  static translateStatus(status: string): string {
    const statusTranslations: Record<string, string> = {
      'present': 'Presente',
      'late': 'Tardanza',
      'absent': 'Ausente',
      'half_day': 'Medio día',
      'sick_leave': 'Permiso médico'
    };

    return statusTranslations[status] || status;
  }

  /**
   * Filtra asistencias según criterios
   */
  static filterAttendances(attendances: Attendance[], filters: HistoryFilters): Attendance[] {
    return attendances.filter(attendance => {
      // Filtro por fecha desde
      if (filters.dateFrom && attendance.attendance_date < filters.dateFrom) {
        return false;
      }

      // Filtro por fecha hasta
      if (filters.dateTo && attendance.attendance_date > filters.dateTo) {
        return false;
      }

      // Filtro por estado
      if (filters.status && attendance.status !== filters.status) {
        return false;
      }

      return true;
    });
  }
}

/**
 * Componente de historial de asistencias
 */
export const AttendanceHistory: React.FC<AttendanceHistoryProps> = ({
  attendances,
  loading = false,
  onRefresh,
  pageSize = 10,
  className = ''
}) => {
  const [filters, setFilters] = useState<HistoryFilters>({});
  const [currentPage, setCurrentPage] = useState(1);

  // Aplicar filtros a las asistencias
  const filteredAttendances = useMemo(() => {
    return AttendanceHistoryUtils.filterAttendances(attendances, filters);
  }, [attendances, filters]);

  // Paginación
  const paginatedAttendances = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAttendances.slice(startIndex, startIndex + pageSize);
  }, [filteredAttendances, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredAttendances.length / pageSize);

  // Estadísticas básicas
  const stats = useMemo(() => {
    const total = filteredAttendances.length;
    const present = filteredAttendances.filter(a => a.status === 'present').length;
    const late = filteredAttendances.filter(a => a.status === 'late').length;
    const absent = filteredAttendances.filter(a => a.status === 'absent').length;

    return { total, present, late, absent };
  }, [filteredAttendances]);

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-lg border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-1/3"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Historial de Asistencias
          </h3>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              🔄 Actualizar
            </button>
          )}
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.present}</div>
            <div className="text-xs text-gray-500">Presente</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.late}</div>
            <div className="text-xs text-gray-500">Tardanza</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
            <div className="text-xs text-gray-500">Ausente</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Desde
            </label>
            <input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hasta
            </label>
            <input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={filters.status || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Todos</option>
              <option value="present">Presente</option>
              <option value="late">Tardanza</option>
              <option value="absent">Ausente</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de asistencias */}
      <div className="overflow-x-auto">
        <table className="w-full">
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
            {paginatedAttendances.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  <div className="text-4xl mb-2">📅</div>
                  <p>No hay registros de asistencia para mostrar</p>
                </td>
              </tr>
            ) : (
              paginatedAttendances.map((attendance) => (
                <tr key={attendance.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {AttendanceHistoryUtils.formatDate(attendance.attendance_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {attendance.check_in_time 
                      ? AttendanceHistoryUtils.formatTime(attendance.check_in_time)
                      : '--:--'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {attendance.check_out_time 
                      ? AttendanceHistoryUtils.formatTime(attendance.check_out_time)
                      : '--:--'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {attendance.check_in_time 
                      ? AttendanceHistoryUtils.calculateHours(attendance.check_in_time, attendance.check_out_time || undefined)
                      : '--'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      AttendanceHistoryUtils.getStatusColor(attendance.status)
                    }`}>
                      {AttendanceHistoryUtils.translateStatus(attendance.status)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-700">
            Página {currentPage} de {totalPages} ({filteredAttendances.length} registros)
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50"
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceHistory;
