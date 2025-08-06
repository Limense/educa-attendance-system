/**
 * =============================================
 * EXPORTACIÓN DE REPORTES
 * =============================================
 * 
 * Componente para exportar reportes a PDF/Excel
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, File } from 'lucide-react';
import type { AttendanceRecord, ReportStats, ReportFilters } from '@/types/reports.types';

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
  onExport, 
  loading, 
  disabled 
}: ReportExportProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-gray-600">
        <span className="font-medium">{data.length}</span> registros listos para exportar
      </div>
      
      <div className="flex gap-2">
        <Button
          onClick={() => onExport('pdf')}
          disabled={disabled || loading}
          className="flex items-center bg-red-600 hover:bg-red-700 text-white"
          size="sm"
        >
          <FileText className="w-4 h-4 mr-2" />
          {loading ? 'Generando...' : 'PDF Profesional'}
        </Button>
        
        <Button
          onClick={() => onExport('excel')}
          disabled={disabled || loading}
          variant="outline"
          size="sm"
          className="flex items-center"
        >
          <File className="w-4 h-4 mr-2" />
          {loading ? 'Generando...' : 'Excel'}
        </Button>
      </div>
    </div>
  );
}
