/**
 * =============================================
 * COMPONENTE DE KPIs DEL DASHBOARD
 * =============================================
 * 
 * Tarjetas de métricas principales con indicadores visuales
 */

'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import type { DashboardKPIs } from '@/hooks/useDashboardAnalytics';

interface DashboardKPIsProps {
  kpis: DashboardKPIs;
  loading: boolean;
}

export function DashboardKPIsComponent({ kpis, loading }: DashboardKPIsProps) {
  
  // Función para obtener el color del indicador de tendencia
  const getTrendColor = (value: number): string => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  // Función para obtener el ícono de tendencia
  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="w-4 h-4" />;
    if (value < 0) return <TrendingDown className="w-4 h-4" />;
    return null;
  };

  // Función para obtener el color de la métrica según el valor
  const getMetricColor = (type: string, value: number): string => {
    switch (type) {
      case 'attendance':
        if (value >= 95) return 'text-green-600';
        if (value >= 85) return 'text-yellow-600';
        return 'text-red-600';
      case 'punctuality':
        if (value >= 90) return 'text-green-600';
        if (value >= 80) return 'text-yellow-600';
        return 'text-red-600';
      case 'absenteeism':
        if (value <= 5) return 'text-green-600';
        if (value <= 15) return 'text-yellow-600';
        return 'text-red-600';
      default:
        return 'text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
                <div className="w-24 h-4 bg-gray-200 rounded"></div>
              </div>
              <div className="w-16 h-8 bg-gray-200 rounded mb-2"></div>
              <div className="w-20 h-3 bg-gray-200 rounded"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      
      {/* Total de Empleados */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Total Empleados</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">{kpis.totalEmployees}</div>
            <p className="text-xs text-blue-600 mt-1">Empleados activos</p>
          </div>
          <div className="p-3 bg-blue-200 rounded-full">
            <Users className="w-6 h-6 text-blue-700" />
          </div>
        </div>
      </Card>

      {/* Presentes Hoy */}
      <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <UserCheck className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-700">Presentes Hoy</span>
            </div>
            <div className="text-2xl font-bold text-green-900">{kpis.presentToday}</div>
            <div className="flex items-center space-x-1 mt-1">
              <span className={`text-xs ${getTrendColor(kpis.attendanceVsYesterday)}`}>
                {kpis.attendanceVsYesterday > 0 ? '+' : ''}{kpis.attendanceVsYesterday} vs ayer
              </span>
              <span className={getTrendColor(kpis.attendanceVsYesterday)}>
                {getTrendIcon(kpis.attendanceVsYesterday)}
              </span>
            </div>
          </div>
          <div className="p-3 bg-green-200 rounded-full">
            <UserCheck className="w-6 h-6 text-green-700" />
          </div>
        </div>
      </Card>

      {/* Ausentes Hoy */}
      <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <UserX className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-red-700">Ausentes Hoy</span>
            </div>
            <div className="text-2xl font-bold text-red-900">{kpis.absentToday}</div>
            <p className="text-xs text-red-600 mt-1">
              {kpis.totalEmployees > 0 ? 
                `${((kpis.absentToday / kpis.totalEmployees) * 100).toFixed(1)}% del total` : 
                '0% del total'
              }
            </p>
          </div>
          <div className="p-3 bg-red-200 rounded-full">
            <UserX className="w-6 h-6 text-red-700" />
          </div>
        </div>
      </Card>

      {/* Tardanzas Hoy */}
      <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-medium text-orange-700">Tardanzas Hoy</span>
            </div>
            <div className="text-2xl font-bold text-orange-900">{kpis.lateToday}</div>
            <div className="flex items-center space-x-1 mt-1">
              <span className={`text-xs ${getTrendColor(-kpis.lateVsYesterday)}`}>
                {kpis.lateVsYesterday > 0 ? '+' : ''}{kpis.lateVsYesterday} vs ayer
              </span>
              <span className={getTrendColor(-kpis.lateVsYesterday)}>
                {getTrendIcon(-kpis.lateVsYesterday)}
              </span>
            </div>
          </div>
          <div className="p-3 bg-orange-200 rounded-full">
            <Clock className="w-6 h-6 text-orange-700" />
          </div>
        </div>
      </Card>

      {/* Tasa de Asistencia */}
      <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">Tasa de Asistencia</span>
            </div>
            <div className={`text-2xl font-bold ${getMetricColor('attendance', kpis.attendanceRate)}`}>
              {kpis.attendanceRate.toFixed(1)}%
            </div>
            <p className="text-xs text-purple-600 mt-1">Incluye tardanzas</p>
          </div>
          <div className="p-3 bg-purple-200 rounded-full">
            <CheckCircle className="w-6 h-6 text-purple-700" />
          </div>
        </div>
      </Card>

      {/* Tasa de Puntualidad */}
      <Card className="p-6 bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="w-5 h-5 text-teal-600" />
              <span className="text-sm font-medium text-teal-700">Puntualidad</span>
            </div>
            <div className={`text-2xl font-bold ${getMetricColor('punctuality', kpis.punctualityRate)}`}>
              {kpis.punctualityRate.toFixed(1)}%
            </div>
            <p className="text-xs text-teal-600 mt-1">Sin tardanzas</p>
          </div>
          <div className="p-3 bg-teal-200 rounded-full">
            <Clock className="w-6 h-6 text-teal-700" />
          </div>
        </div>
      </Card>

      {/* Ausentismo */}
      <Card className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-700">Ausentismo</span>
            </div>
            <div className={`text-2xl font-bold ${getMetricColor('absenteeism', kpis.absenteeismRate)}`}>
              {kpis.absenteeismRate.toFixed(1)}%
            </div>
            <p className="text-xs text-yellow-600 mt-1">Del total de empleados</p>
          </div>
          <div className="p-3 bg-yellow-200 rounded-full">
            <AlertTriangle className="w-6 h-6 text-yellow-700" />
          </div>
        </div>
      </Card>

      {/* Alertas */}
      <Card className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-indigo-600" />
              <span className="text-sm font-medium text-indigo-700">Alertas Activas</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-lg font-bold text-red-600">
                {kpis.criticalAlerts}
              </div>
              <div className="text-sm text-gray-500">críticas</div>
              <div className="text-lg font-bold text-yellow-600">
                {kpis.warningAlerts}
              </div>
              <div className="text-sm text-gray-500">avisos</div>
            </div>
            <p className="text-xs text-indigo-600 mt-1">Requieren atención</p>
          </div>
          <div className="p-3 bg-indigo-200 rounded-full">
            <AlertTriangle className="w-6 h-6 text-indigo-700" />
          </div>
        </div>
      </Card>
    </div>
  );
}
