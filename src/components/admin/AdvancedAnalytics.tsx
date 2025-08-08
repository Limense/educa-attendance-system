/**
 * =============================================
 * COMPONENTE DE ANALÍTICAS AVANZADAS
 * =============================================
 * 
 * Descripción: Componente para mostrar analíticas detalladas de asistencia
 * Incluye sumatoria de horas, detección de tardanzas y análisis por empleado
 */

'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  TrendingUp, 
  Users, 
  AlertTriangle,
  Award,
  BarChart3,
  Download,
  RefreshCw,
  Calendar
} from 'lucide-react';
import { useAdvancedAnalytics } from '@/hooks/useAdvancedAnalytics';

interface AdvancedAnalyticsProps {
  organizationId?: string; // Ahora opcional ya que el hook maneja la lógica
  dateRange?: {
    startDate: string;
    endDate: string;
  };
}

export function AdvancedAnalytics({ dateRange }: AdvancedAnalyticsProps) {
  // Configurar fechas por defecto (últimos 3 meses para vista general)
  const defaultEndDate = new Date().toISOString().split('T')[0];
  const defaultStartDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const startDate = dateRange?.startDate || defaultStartDate;
  const endDate = dateRange?.endDate || defaultEndDate;
  
  const [activeTab, setActiveTab] = useState<'overview' | 'employees' | 'trends'>('overview');
  
  // Usar el nuevo hook
  const { 
    analytics, 
    employeeAnalytics,
    weeklyTrends,
    departmentComparisons,
    loading, 
    error, 
    refreshData 
  } = useAdvancedAnalytics(startDate, endDate);

  const exportToCSV = () => {
    if (!employeeAnalytics.length) return;

    const csvContent = [
      // Headers
      ['Empleado', 'Código', 'Departamento', 'Horas Trabajadas', 'Horas Esperadas', 'Déficit/Superávit', 'Horas Extra', 'Tardanzas', 'Días Ausentes', 'Tasa Asistencia', 'Tasa Puntualidad'].join(','),
      // Data
      ...employeeAnalytics.map(emp => [
        emp.employee_name,
        emp.employee_code,
        emp.department_name,
        emp.total_hours,
        emp.expected_hours,
        emp.hours_deficit,
        emp.overtime_hours,
        emp.late_arrivals,
        emp.absent_days,
        `${emp.attendance_rate}%`,
        `${emp.punctuality_rate}%`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analíticas-asistencia-${startDate}-${endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar analíticas</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={refreshData} className="flex items-center gap-2 mx-auto">
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </Button>
        </Card>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-6 text-center">
        <Card className="p-8">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay datos disponibles</h3>
          <p className="text-gray-500 mb-4">
            No se encontraron datos de asistencia para el período seleccionado
          </p>
          <Button onClick={refreshData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            Analíticas Avanzadas
          </h2>
          <p className="text-gray-600 flex items-center gap-2 mt-1">
            <Calendar className="w-4 h-4" />
            Período: {startDate} - {endDate} 
            <span className="text-sm text-blue-600 font-medium">
              (Vista General - Últimos 3 meses)
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={refreshData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
          <Button onClick={exportToCSV} variant="outline" size="sm" disabled={!employeeAnalytics.length}>
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Resumen General', icon: BarChart3 },
            { id: 'employees', label: 'Por Empleado', icon: Users },
            { id: 'trends', label: 'Tendencias', icon: TrendingUp }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'overview' | 'employees' | 'trends')}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-blue-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Total Horas Trabajadas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.totalHoursWorked.toLocaleString()}h
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-green-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Promedio por Empleado</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.averageHoursPerEmployee.toFixed(1)}h
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="w-8 h-8 text-orange-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Llegadas Tarde</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.lateArrivals}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <Award className="w-8 h-8 text-purple-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Horas Extra</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.overtimeHours.toFixed(1)}h
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Additional metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6">
              <div className="flex items-center">
                <Users className="w-6 h-6 text-indigo-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Total Empleados</p>
                  <p className="text-xl font-bold text-gray-900">{analytics.totalEmployees}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Días Ausentes</p>
                  <p className="text-xl font-bold text-gray-900">{analytics.absentDays}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Empleados Activos</h3>
              <p className="text-lg text-gray-600">
                {employeeAnalytics.length} de {analytics.totalEmployees} con actividad
              </p>
            </Card>
          </div>

          {/* Rates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Tasa de Asistencia</h3>
              <div className="flex items-center">
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-green-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(analytics.attendanceRate, 100)}%` }}
                    ></div>
                  </div>
                </div>
                <span className="ml-3 text-2xl font-bold text-gray-900">
                  {analytics.attendanceRate.toFixed(1)}%
                </span>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Tasa de Puntualidad</h3>
              <div className="flex items-center">
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(analytics.punctualityRate, 100)}%` }}
                    ></div>
                  </div>
                </div>
                <span className="ml-3 text-2xl font-bold text-gray-900">
                  {analytics.punctualityRate.toFixed(1)}%
                </span>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Employees Tab */}
      {activeTab === 'employees' && (
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Detalles por Empleado</h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Empleado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Departamento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Horas Trabajadas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Horas Esperadas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Déficit/Superávit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Horas Extra
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tardanzas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Asistencia
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Puntualidad
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {employeeAnalytics.map((employee, index) => (
                    <tr key={employee.employee_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{employee.employee_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{employee.employee_code}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{employee.department_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-medium">{employee.total_hours.toFixed(1)}h</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-700">{employee.expected_hours.toFixed(1)}h</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          employee.hours_deficit >= 0 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {employee.hours_deficit >= 0 ? '+' : ''}{employee.hours_deficit.toFixed(1)}h
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{employee.overtime_hours.toFixed(1)}h</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          employee.late_arrivals > 3 
                            ? 'bg-red-100 text-red-800' 
                            : employee.late_arrivals > 1 
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                        }`}>
                          {employee.late_arrivals}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{employee.attendance_rate.toFixed(1)}%</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{employee.punctuality_rate.toFixed(1)}%</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {employeeAnalytics.length === 0 && (
              <div className="text-center py-8">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay datos de empleados</h3>
                <p className="text-gray-500">No se encontraron registros de asistencia para el período seleccionado</p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          {/* Tendencias Semanales */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Tendencias Semanales
            </h3>
            
            {weeklyTrends.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Semana (Inicio)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Horas Totales
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tasa Asistencia
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tasa Puntualidad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tardanzas
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ausencias
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {weeklyTrends.map((week, index) => (
                      <tr key={week.week} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {new Date(week.week).toLocaleDateString('es-ES', { 
                              day: '2-digit', 
                              month: '2-digit', 
                              year: 'numeric' 
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{week.total_hours.toFixed(1)}h</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-1 mr-3">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-green-600 h-2 rounded-full"
                                  style={{ width: `${Math.min(week.attendance_rate, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                            <span className="text-sm text-gray-900">{week.attendance_rate.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-1 mr-3">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${Math.min(week.punctuality_rate, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                            <span className="text-sm text-gray-900">{week.punctuality_rate.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            week.late_arrivals > 5 
                              ? 'bg-red-100 text-red-800' 
                              : week.late_arrivals > 2 
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                          }`}>
                            {week.late_arrivals}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            week.absent_days > 3 
                              ? 'bg-red-100 text-red-800' 
                              : week.absent_days > 1 
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                          }`}>
                            {week.absent_days}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay datos de tendencias</h3>
                <p className="text-gray-500">No se encontraron suficientes datos para mostrar tendencias semanales</p>
              </div>
            )}
          </Card>

          {/* Comparación por Departamentos */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-green-600" />
              Comparación por Departamentos
            </h3>
            
            {departmentComparisons.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Departamento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Empleados
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Promedio Horas
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Asistencia
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Puntualidad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Tardanzas
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {departmentComparisons
                      .sort((a, b) => b.attendance_rate - a.attendance_rate)
                      .map((dept, index) => (
                      <tr key={dept.department_name} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{dept.department_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{dept.total_employees}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{dept.avg_hours.toFixed(1)}h</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-1 mr-3">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-green-600 h-2 rounded-full"
                                  style={{ width: `${Math.min(dept.attendance_rate, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                            <span className="text-sm text-gray-900">{dept.attendance_rate.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-1 mr-3">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${Math.min(dept.punctuality_rate, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                            <span className="text-sm text-gray-900">{dept.punctuality_rate.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            dept.total_late_arrivals > 10 
                              ? 'bg-red-100 text-red-800' 
                              : dept.total_late_arrivals > 5 
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                          }`}>
                            {dept.total_late_arrivals}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay datos de departamentos</h3>
                <p className="text-gray-500">No se encontraron datos suficientes para comparar departamentos</p>
              </div>
            )}
          </Card>

          {/* Resumen de Insights */}
          <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              Insights y Recomendaciones
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="font-medium text-gray-900 mb-2">🏆 Mejor Departamento</h4>
                {departmentComparisons.length > 0 ? (
                  <p className="text-sm text-gray-600">
                    <strong>{departmentComparisons.reduce((best, dept) => 
                      dept.attendance_rate > best.attendance_rate ? dept : best
                    ).department_name}</strong> tiene la mejor tasa de asistencia 
                    ({departmentComparisons.reduce((best, dept) => 
                      dept.attendance_rate > best.attendance_rate ? dept : best
                    ).attendance_rate.toFixed(1)}%)
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">No hay datos suficientes</p>
                )}
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="font-medium text-gray-900 mb-2">📈 Tendencia General</h4>
                {weeklyTrends.length >= 2 ? (
                  <p className="text-sm text-gray-600">
                    La asistencia ha {
                      weeklyTrends[weeklyTrends.length - 1].attendance_rate > 
                      weeklyTrends[weeklyTrends.length - 2].attendance_rate ? 
                      'mejorado' : 'empeorado'
                    } esta semana
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">Necesita más datos para mostrar tendencias</p>
                )}
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="font-medium text-gray-900 mb-2">⚠️ Área de Atención</h4>
                {departmentComparisons.length > 0 ? (
                  <p className="text-sm text-gray-600">
                    <strong>{departmentComparisons.reduce((worst, dept) => 
                      dept.punctuality_rate < worst.punctuality_rate ? dept : worst
                    ).department_name}</strong> necesita mejorar la puntualidad 
                    ({departmentComparisons.reduce((worst, dept) => 
                      dept.punctuality_rate < worst.punctuality_rate ? dept : worst
                    ).punctuality_rate.toFixed(1)}%)
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">No hay datos suficientes</p>
                )}
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="font-medium text-gray-900 mb-2">📊 Estadística Clave</h4>
                {analytics ? (
                  <p className="text-sm text-gray-600">
                    Promedio de <strong>{analytics.averageHoursPerEmployee.toFixed(1)} horas</strong> por empleado
                    con {analytics.overtimeHours.toFixed(1)}h de horas extra total
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">Cargando estadísticas...</p>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
