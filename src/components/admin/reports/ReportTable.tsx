/**
 * =============================================
 * TABLA DE RESULTADOS DE REPORTES
 * =============================================
 * 
 * Tabla para mostrar datos del reporte desde Supabase
 */

'use client';

import React from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { AttendanceRecord, ReportFilters } from '@/types/reports.types';

interface ReportTableProps {
  data: AttendanceRecord[];
  loading: boolean;
  filters: ReportFilters;
}

export function ReportTable({ data, loading, filters }: ReportTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Cargando datos del reporte...</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Sin datos en el período seleccionado
        </h3>
        <p className="text-gray-600">
          Intenta cambiar los filtros para ver información.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          📋 Resultados del Reporte
        </h3>
        <div className="text-sm text-gray-600">
          {data.length} registro{data.length !== 1 ? 's' : ''} encontrado{data.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 bg-white rounded-lg border">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Empleado
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
            {data.map((record, index) => {
              const status = record.clock_in && record.clock_out
                ? 'complete'
                : record.clock_in
                ? 'incomplete'
                : 'absent';

              const statusConfig = {
                complete: { text: 'Completo', color: 'bg-green-100 text-green-800' },
                incomplete: { text: 'Incompleto', color: 'bg-yellow-100 text-yellow-800' },
                absent: { text: 'Ausente', color: 'bg-red-100 text-red-800' }
              };

              return (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {format(parseISO(record.attendance_date), 'dd/MM/yyyy', { locale: es })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      <div className="font-medium">{record.employee_name}</div>
                      <div className="text-xs text-gray-400">
                        {record.employee_code} • {record.department_name || 'Sin dept.'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.clock_in || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.clock_out || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.total_hours ? `${record.total_hours.toFixed(1)}h` : '-'}
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

      {/* Info del reporte */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <div className="text-sm text-blue-800">
          <strong>📋 Tipo de reporte:</strong> {filters.reportType} | 
          <strong> 📅 Período:</strong> {filters.startDate} - {filters.endDate}
          {filters.status && (
            <span> | <strong>🔍 Estado:</strong> {filters.status}</span>
          )}
        </div>
      </div>
    </div>
  );
}
