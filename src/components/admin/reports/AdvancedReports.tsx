/**
 * =============================================
 * REPORTES AVANZADOS - COMPONENTE PRINCIPAL
 * =============================================
 * 
 * Solo accesible para admin y super_admin
 * Características:
 * - Filtros avanzados
 * - Múltiples tipos de reportes
 * - Exportación HTML/PDF con plantillas
 * - Estadísticas en tiempo real
 */

'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ReportFilters } from './ReportFilters';
import { ReportStats } from './ReportStats';
import { ReportTable } from './ReportTable';
import { ReportExport } from './ReportExport';
import { useReportData } from '@/hooks/useReportData';
import type { ReportFilters as IReportFilters } from '@/types/reports.types';
import { 
  FileBarChart, 
  RefreshCw,
  TrendingUp 
} from 'lucide-react';

/**
 * Componente principal de reportes avanzados
 * Solo para admin/super_admin
 */
export function AdvancedReports() {
  const [filters, setFilters] = useState<IReportFilters>({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 días atrás
    endDate: new Date().toISOString().split('T')[0],
    reportType: 'general',
    period: 'week'  // Cambiar a week por defecto
  });
  
  // Hook personalizado para cargar datos del reporte
  const { data, stats, loading, error, refreshData } = useReportData(filters);

  const handleFiltersChange = (newFilters: Partial<IReportFilters>) => {
    setFilters((prev: IReportFilters) => ({ ...prev, ...newFilters }));
  };

  const handleRefresh = async () => {
    await refreshData();
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="text-red-500 mr-3 text-2xl">⚠️</div>
            <div>
              <h3 className="text-red-800 font-medium text-lg">Error al cargar reportes</h3>
              <p className="text-red-700 mt-1">{error}</p>
              <Button 
                onClick={handleRefresh}
                variant="outline"
                className="mt-3"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reintentar
              </Button>
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
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <FileBarChart className="w-8 h-8 mr-3 text-blue-600" />
            Reportes Avanzados
          </h2>
          <p className="text-gray-600 mt-1">
            Análisis detallado de asistencias, estadísticas y exportación profesional
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            disabled={loading}
            className="flex items-center"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Filtros Avanzados */}
      <Card className="p-6">
        <ReportFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          loading={loading}
        />
      </Card>

      {/* Estadísticas Resumidas */}
      {stats && (
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Estadísticas del Período
            </h3>
          </div>
          <ReportStats stats={stats} />
        </Card>
      )}

      {/* Tabla de Resultados */}
      <Card className="p-6">
        <ReportTable
          data={data || []}
          loading={loading}
          filters={filters}
        />
      </Card>

      {/* Exportación y Acciones */}
      <Card className="p-4">
        <ReportExport
          data={data || []}
          stats={stats || undefined}
          filters={filters}
          onExport={() => {}} // Función vacía ya que ReportExport maneja su propia exportación
          loading={false}
          disabled={loading || !data?.length}
        />
      </Card>
    </div>
  );
}
