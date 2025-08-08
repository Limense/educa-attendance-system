/**
 * =============================================
 * GRÁFICOS DE TENDENCIAS DEL DASHBOARD
 * =============================================
 * 
 * Componente con gráficos interactivos de asistencia y tendencias
 */

'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  BarChart3, 
  PieChart as PieChartIcon,
  Calendar
} from 'lucide-react';
import type { AttendanceTrend, DepartmentMetric } from '@/hooks/useDashboardAnalytics';

interface DashboardChartsProps {
  weeklyTrend: AttendanceTrend[];
  monthlyTrend: AttendanceTrend[];
  departmentMetrics: DepartmentMetric[];
  loading: boolean;
}

type ChartType = 'line' | 'area' | 'bar';
type TimePeriod = 'weekly' | 'monthly';

export function DashboardCharts({ 
  weeklyTrend, 
  monthlyTrend, 
  departmentMetrics, 
  loading 
}: DashboardChartsProps) {
  const [chartType, setChartType] = useState<ChartType>('area');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('weekly');

  // Colores para los gráficos
  const colors = {
    present: '#10b981',
    late: '#f59e0b',
    absent: '#ef4444',
    attendance: '#3b82f6'
  };

  // Colores para el gráfico de pie
  const pieColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const currentData = timePeriod === 'weekly' ? weeklyTrend : monthlyTrend;

  // Formatear tooltip personalizado
  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{
      name: string;
      value: number;
      color: string;
    }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{`Fecha: ${label}`}</p>
          {payload.map((entry, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.name}: ${entry.value}`}
              {entry.name === 'Tasa de Asistencia' && '%'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse">
              <div className="w-32 h-6 bg-gray-200 rounded mb-4"></div>
              <div className="w-full h-64 bg-gray-200 rounded"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  const renderChart = () => {
    const chartProps = {
      data: currentData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fontSize: 12 }}
            />
            <YAxis className="text-xs" tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="present" 
              stroke={colors.present} 
              strokeWidth={2}
              name="Presentes"
              dot={{ fill: colors.present, strokeWidth: 2, r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="late" 
              stroke={colors.late} 
              strokeWidth={2}
              name="Tardanzas"
              dot={{ fill: colors.late, strokeWidth: 2, r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="absent" 
              stroke={colors.absent} 
              strokeWidth={2}
              name="Ausentes"
              dot={{ fill: colors.absent, strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fontSize: 12 }}
            />
            <YAxis className="text-xs" tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="present" 
              stackId="1"
              stroke={colors.present} 
              fill={colors.present}
              fillOpacity={0.7}
              name="Presentes"
            />
            <Area 
              type="monotone" 
              dataKey="late" 
              stackId="1"
              stroke={colors.late} 
              fill={colors.late}
              fillOpacity={0.7}
              name="Tardanzas"
            />
            <Area 
              type="monotone" 
              dataKey="absent" 
              stackId="1"
              stroke={colors.absent} 
              fill={colors.absent}
              fillOpacity={0.7}
              name="Ausentes"
            />
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fontSize: 12 }}
            />
            <YAxis className="text-xs" tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="present" fill={colors.present} name="Presentes" />
            <Bar dataKey="late" fill={colors.late} name="Tardanzas" />
            <Bar dataKey="absent" fill={colors.absent} name="Ausentes" />
          </BarChart>
        );

      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Tipo de gráfico no válido</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Gráfico Principal de Tendencias */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Tendencia de Asistencia
            </h3>
            <p className="text-sm text-gray-600">
              Evolución diaria de presencias, tardanzas y ausencias
            </p>
          </div>

          {/* Controles del gráfico */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4 lg:mt-0">
            {/* Selector de período */}
            <div className="flex rounded-lg border border-gray-200 p-1">
              <Button
                variant={timePeriod === 'weekly' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTimePeriod('weekly')}
                className="text-xs"
              >
                <Calendar className="w-3 h-3 mr-1" />
                Semanal
              </Button>
              <Button
                variant={timePeriod === 'monthly' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTimePeriod('monthly')}
                className="text-xs"
              >
                <Calendar className="w-3 h-3 mr-1" />
                Mensual
              </Button>
            </div>

            {/* Selector de tipo de gráfico */}
            <div className="flex rounded-lg border border-gray-200 p-1">
              <Button
                variant={chartType === 'area' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartType('area')}
                className="text-xs"
              >
                <TrendingUp className="w-3 h-3 mr-1" />
                Área
              </Button>
              <Button
                variant={chartType === 'line' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartType('line')}
                className="text-xs"
              >
                <TrendingUp className="w-3 h-3 mr-1" />
                Línea
              </Button>
              <Button
                variant={chartType === 'bar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartType('bar')}
                className="text-xs"
              >
                <BarChart3 className="w-3 h-3 mr-1" />
                Barras
              </Button>
            </div>
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gráfico de Tasa de Asistencia */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Tasa de Asistencia
              </h3>
              <p className="text-sm text-gray-600">
                Porcentaje diario de asistencia
              </p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={currentData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  className="text-xs" 
                  tick={{ fontSize: 12 }}
                  domain={[0, 100]}
                />
                <Tooltip 
                  content={<CustomTooltip />}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Tasa de Asistencia']}
                />
                <Area 
                  type="monotone" 
                  dataKey="attendanceRate" 
                  stroke={colors.attendance} 
                  fill={colors.attendance}
                  fillOpacity={0.6}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Gráfico por Departamentos */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Asistencia por Departamento
              </h3>
              <p className="text-sm text-gray-600">
                Distribución actual por área
              </p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <PieChartIcon className="w-5 h-5 text-purple-600" />
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={departmentMetrics}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="present"
                  label={({ department, present }) => `${department}: ${present}`}
                  labelLine={false}
                >
                  {departmentMetrics.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={pieColors[index % pieColors.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
