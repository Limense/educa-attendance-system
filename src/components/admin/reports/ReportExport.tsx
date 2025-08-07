/**
 * =============================================
 * EXPORTACIÓN DE REPORTES
 * =============================================
 * 
 * Componente para exportar reportes a PDF/Excel con plantillas profesionales
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Download, Settings } from 'lucide-react';
import type { AttendanceRecord, ReportStats, ReportFilters } from '@/types/reports.types';
import { ReportExportService, type ExportData, type ExportOptions } from '@/services/report-export.service';

interface ReportExportProps {
  data: AttendanceRecord[];
  stats?: ReportStats;
  filters: ReportFilters;
  onExport: (format: 'pdf' | 'excel') => void;
  loading: boolean;
  disabled: boolean;
}

export function ReportExport({ 
  data, 
  stats,
  filters,
  onExport, 
  loading, 
  disabled 
}: ReportExportProps) {
  const [exportLoading, setExportLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<'professional' | 'simple' | 'detailed'>('professional');

  const handleExport = async (format: 'pdf' | 'excel', template?: 'professional' | 'simple' | 'detailed') => {
    try {
      setExportLoading(true);
      
      // Preparar datos para exportación
      const exportData: ExportData = {
        data,
        stats,
        filters,
        metadata: {
          generatedAt: new Date().toISOString(),
          generatedBy: 'Administrador', // TODO: Obtener del contexto de usuario
          reportTitle: generateReportTitle(filters),
          period: generatePeriodString(filters)
        }
      };

      // Opciones de exportación
      const exportOptions: ExportOptions = {
        format,
        template: template || selectedTemplate,
        includeCharts: true,
        includeStats: true,
        organizationInfo: {
          name: 'Educa-Crea Sistema de Asistencia',
          address: 'Dirección de la Organización',
          phone: '+51 999 999 999'
          // logo: '/images/logo.png' // TODO: Configurar logo
        }
      };

      // Ejecutar exportación
      await ReportExportService.exportReport(exportData, exportOptions);
      
      // Notificar al componente padre
      onExport(format);
      
    } catch (error) {
      console.error('Error exportando reporte:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error al exportar: ${errorMessage}`);
    } finally {
      setExportLoading(false);
    }
  };

  const generateReportTitle = (filters: ReportFilters): string => {
    const typeLabels = {
      'general': 'Reporte General de Asistencias',
      'individual': 'Reporte Individual de Asistencias',
      'department': 'Reporte por Departamento',
      'attendance': 'Reporte de Solo Asistencias',
      'punctuality': 'Análisis de Puntualidad'
    };
    
    return typeLabels[filters.reportType] || 'Reporte de Asistencias';
  };

  const generatePeriodString = (filters: ReportFilters): string => {
    const startDate = new Date(filters.startDate).toLocaleDateString('es-ES');
    const endDate = new Date(filters.endDate).toLocaleDateString('es-ES');
    
    if (filters.startDate === filters.endDate) {
      return `${startDate}`;
    }
    
    return `${startDate} - ${endDate}`;
  };

  const isExportDisabled = disabled || loading || exportLoading || data.length === 0;

  return (
    <div className="space-y-4">
      {/* Header de Exportación */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Download className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Exportar Reporte
          </h3>
        </div>
        
        <div className="text-sm text-gray-600">
          <span className="font-medium">{data.length}</span> registros listos para exportar
        </div>
      </div>

      {/* Selector de Plantilla */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Settings className="w-4 h-4 inline mr-1" />
          Plantilla de Exportación
        </label>
        <div className="flex space-x-2">
          <Button
            variant={selectedTemplate === 'professional' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTemplate('professional')}
            disabled={isExportDisabled}
          >
            📊 Profesional
          </Button>
          <Button
            variant={selectedTemplate === 'simple' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTemplate('simple')}
            disabled={isExportDisabled}
          >
            📄 Simple
          </Button>
          <Button
            variant={selectedTemplate === 'detailed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTemplate('detailed')}
            disabled={isExportDisabled}
          >
            📈 Detallado
          </Button>
        </div>
      </div>

      {/* Botones de Exportación */}
      <div className="flex flex-wrap gap-3">
        {/* PDF Profesional */}
        <Button
          onClick={() => handleExport('pdf')}
          disabled={isExportDisabled}
          className="flex items-center bg-red-600 hover:bg-red-700 text-white"
          size="default"
        >
          <FileText className="w-4 h-4 mr-2" />
          {exportLoading ? 'Generando...' : 'PDF Profesional'}
        </Button>

        {/* Excel/CSV */}
        <Button
          onClick={() => handleExport('excel')}
          disabled={isExportDisabled}
          variant="outline"
          className="flex items-center border-green-600 text-green-600 hover:bg-green-50"
          size="default"
        >
          <Download className="w-4 h-4 mr-2" />
          {exportLoading ? 'Generando...' : 'Excel/CSV'}
        </Button>
      </div>

      {/* Información sobre plantillas */}
      <div className="text-xs text-gray-500 space-y-1">
        <p><strong>📊 Profesional:</strong> Incluye estadísticas, gráficos y diseño corporativo completo</p>
        <p><strong>📄 Simple:</strong> Solo tabla de datos, ideal para impresión rápida</p>
        <p><strong>📈 Detallado:</strong> Análisis completo con métricas avanzadas y insights</p>
      </div>

      {/* Estado de Exportación */}
      {exportLoading && (
        <div className="flex items-center space-x-2 text-blue-600 bg-blue-50 p-3 rounded-lg">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm">Preparando reporte con plantilla {selectedTemplate}...</span>
        </div>
      )}

      {/* Mensaje si no hay datos */}
      {data.length === 0 && !loading && (
        <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No hay datos para exportar con los filtros actuales</p>
          <p className="text-sm">Ajusta los filtros para generar un reporte</p>
        </div>
      )}
    </div>
  );
}
