'use client'

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  FileText, 
  Download, 
  Calendar, 
  Filter,
  Users,
  Building,
  Clock
} from 'lucide-react';

/**
 * Componente de sección de reportes
 * 
 * Principios aplicados:
 * - Single Responsibility: Solo maneja reportes
 * - Future-proof: Estructura preparada para funcionalidad real
 */
export function ReportsSection() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');

  const reportTypes = [
    {
      id: 'attendance',
      title: 'Reporte de Asistencia',
      description: 'Asistencias por empleado y fecha',
      icon: <Clock className="w-6 h-6" />
    },
    {
      id: 'department',
      title: 'Reporte por Departamento',
      description: 'Estadísticas agrupadas por departamento',
      icon: <Building className="w-6 h-6" />
    },
    {
      id: 'employee',
      title: 'Reporte Individual',
      description: 'Historial detallado de empleado',
      icon: <Users className="w-6 h-6" />
    }
  ];

  const handleGenerateReport = (reportType: string) => {
    // TODO: Implementar generación de reportes
    console.log('Generando reporte:', reportType, { dateFrom, dateTo, selectedDepartment });
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Reportes y Análisis
        </h2>
        <p className="text-gray-600">
          Genera reportes detallados de asistencia y exporta datos
        </p>
      </div>

      {/* Filtros */}
      <Card className="p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Filter className="w-5 h-5 mr-2" />
          Filtros de Reporte
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Desde
            </label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Hasta
            </label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Departamento
            </label>
            <select 
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              <option value="">Todos los departamentos</option>
              <option value="rrhh">Recursos Humanos</option>
              <option value="it">Tecnología</option>
              <option value="sales">Ventas</option>
              <option value="admin">Administración</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Tipos de reportes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reportTypes.map((report) => (
          <Card key={report.id} className="p-6">
            <div className="flex items-center mb-4">
              <div className="text-blue-600 mr-3">
                {report.icon}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {report.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {report.description}
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Button
                onClick={() => handleGenerateReport(report.id)}
                className="w-full flex items-center justify-center gap-2"
                variant="outline"
              >
                <FileText className="w-4 h-4" />
                Ver Reporte
              </Button>
              
              <Button
                onClick={() => handleGenerateReport(`${report.id}-export`)}
                className="w-full flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exportar Excel
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Acciones rápidas */}
      <Card className="p-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Reportes Rápidos
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button variant="outline" className="flex flex-col items-center p-4 h-auto">
            <Clock className="w-6 h-6 mb-2" />
            <span className="text-sm">Hoy</span>
          </Button>
          
          <Button variant="outline" className="flex flex-col items-center p-4 h-auto">
            <Calendar className="w-6 h-6 mb-2" />
            <span className="text-sm">Esta Semana</span>
          </Button>
          
          <Button variant="outline" className="flex flex-col items-center p-4 h-auto">
            <Calendar className="w-6 h-6 mb-2" />
            <span className="text-sm">Este Mes</span>
          </Button>
          
          <Button variant="outline" className="flex flex-col items-center p-4 h-auto">
            <Download className="w-6 h-6 mb-2" />
            <span className="text-sm">Nómina</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}
