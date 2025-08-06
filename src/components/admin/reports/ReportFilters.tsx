/**
 * =============================================
 * FILTROS DE REPORTES AVANZADOS
 * =============================================
 * 
 * Componente para configurar filtros de reportes
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createSupabaseClient } from '@/lib/supabase/client';
import type { ReportFilters, Employee, Department } from '@/types/reports.types';
import { 
  Calendar, 
  Users, 
  Building, 
  Filter,
  Clock
} from 'lucide-react';

interface ReportFiltersProps {
  filters: ReportFilters;
  onFiltersChange: (filters: Partial<ReportFilters>) => void;
  loading: boolean;
}

export function ReportFilters({ filters, onFiltersChange, loading }: ReportFiltersProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Cargar empleados y departamentos al montar el componente
  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      setLoadingOptions(true);
      const supabase = createSupabaseClient();

      // Cargar empleados activos
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('id, full_name, employee_code')
        .eq('is_active', true)
        .order('full_name');

      if (employeeError) {
        console.error('Error loading employees:', employeeError);
      } else {
        setEmployees(employeeData || []);
      }

      // Cargar departamentos activos
      const { data: departmentData, error: departmentError } = await supabase
        .from('departments')
        .select('id, name, code')
        .eq('is_active', true)
        .order('name');

      if (departmentError) {
        console.error('Error loading departments:', departmentError);
      } else {
        setDepartments(departmentData || []);
      }

    } catch (error) {
      console.error('Error loading filter options:', error);
    } finally {
      setLoadingOptions(false);
    }
  };
  const handlePeriodChange = (period: string) => {
    const today = new Date();
    let startDate: Date;
    const endDate = new Date(today);
    
    switch (period) {
      case 'today':
        startDate = new Date(today);
        break;
      case 'week':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 1);
        break;
      case 'quarter':
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 3);
        break;
      default:
        return;
    }
    
    onFiltersChange({
      period,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });
  };

  const reportTypes = [
    { value: 'general', label: '📊 Reporte General' },
    { value: 'individual', label: '👤 Por Empleado' },
    { value: 'department', label: '🏢 Por Departamento' },
    { value: 'attendance', label: '✅ Solo Asistencias' },
    { value: 'punctuality', label: '⏰ Puntualidad' }
  ];

  const statusOptions = [
    { value: '', label: '🔍 Todos los estados' },
    { value: 'present', label: '✅ Solo Presentes' },
    { value: 'absent', label: '❌ Solo Ausentes' },
    { value: 'incomplete', label: '⚠️ Salida Pendiente' },
    { value: 'late', label: '⏰ Llegadas Tardías' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-4">
        <Filter className="w-5 h-5 mr-2 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Configuración de Filtros
        </h3>
      </div>

      {/* Período Rápido */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          <Calendar className="w-4 h-4 inline mr-1" />
          Período
        </label>
        <div className="flex flex-wrap gap-2">
          {['today', 'week', 'month', 'quarter', 'custom'].map((period) => (
            <Button
              key={period}
              variant={filters.period === period ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePeriodChange(period)}
              disabled={loading}
            >
              {period === 'today' && '📅 Hoy'}
              {period === 'week' && '📅 Semana'}
              {period === 'month' && '📅 Mes'}
              {period === 'quarter' && '📅 Trimestre'}
              {period === 'custom' && '📅 Personalizado'}
            </Button>
          ))}
        </div>
      </div>

      {/* Fechas personalizadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha Inicio
          </label>
          <Input
            type="date"
            value={filters.startDate}
            onChange={(e) => onFiltersChange({ 
              startDate: e.target.value, 
              period: 'custom' as 'today' | 'week' | 'month' | 'quarter' | 'custom'
            })}
            disabled={loading}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha Fin
          </label>
          <Input
            type="date"
            value={filters.endDate}
            onChange={(e) => onFiltersChange({ 
              endDate: e.target.value, 
              period: 'custom' as 'today' | 'week' | 'month' | 'quarter' | 'custom'
            })}
            disabled={loading}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Building className="w-4 h-4 inline mr-1" />
            Tipo de Reporte
          </label>
          <select
            value={filters.reportType}
            onChange={(e) => onFiltersChange({ 
              reportType: e.target.value as 'individual' | 'department' | 'general' | 'attendance' | 'punctuality'
            })}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {reportTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Clock className="w-4 h-4 inline mr-1" />
            Estado
          </label>
          <select
            value={filters.status || ''}
            onChange={(e) => onFiltersChange({ 
              status: e.target.value ? e.target.value as 'present' | 'absent' | 'incomplete' | 'late' : undefined 
            })}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {statusOptions.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filtros adicionales */}
      {filters.reportType === 'individual' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="w-4 h-4 inline mr-1" />
              Empleado Específico
            </label>
            <select
              value={filters.employeeId || ''}
              onChange={(e) => onFiltersChange({ employeeId: e.target.value || undefined })}
              disabled={loading || loadingOptions}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Seleccionar empleado...</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.full_name} ({employee.employee_code})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {filters.reportType === 'department' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-green-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building className="w-4 h-4 inline mr-1" />
              Departamento Específico
            </label>
            <select
              value={filters.departmentId || ''}
              onChange={(e) => onFiltersChange({ departmentId: e.target.value || undefined })}
              disabled={loading || loadingOptions}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los departamentos</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
