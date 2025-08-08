/**
 * =============================================
 * DASHBOARD OVERVIEW MEJORADO CON ANALÍTICAS
 * =============================================
 * 
 * Panel principal con KPIs, gráficos interactivos y alertas inteligentes
 */

'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart3,
  LineChart,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  Activity,
  Bell
} from 'lucide-react';
import { useDashboardAnalytics } from '@/hooks/useDashboardAnalytics';
import { DashboardKPIsComponent } from './analytics/DashboardKPIs';
import { DashboardCharts } from './analytics/DashboardCharts';
import { DashboardAlerts } from './analytics/DashboardAlerts';
import { AllEmployeeAttendance } from './AllEmployeeAttendance';

type DashboardView = 'overview' | 'charts' | 'alerts';

/**
 * Componente principal del dashboard con analíticas avanzadas
 * 
 * Funcionalidades:
 * - KPIs en tiempo real con indicadores de tendencia
 * - Gráficos interactivos (líneas, barras, áreas, pie)
 * - Sistema de alertas inteligentes
 * - Navegación entre vistas
 */
export function DashboardOverview() {
  const [currentView, setCurrentView] = useState<DashboardView>('overview');
  
  // Hook personalizado para obtener todas las analíticas
  const {
    kpis,
    weeklyTrend,
    monthlyTrend,
    departmentMetrics,
    recentAlerts,
    loading,
    error,
    refreshData
  } = useDashboardAnalytics();

  // Manejo de errores
  if (error) {
    return (
      <div className="p-6">
        <Card className="p-8">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar analíticas</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={refreshData} className="flex items-center space-x-2">
              <RefreshCw className="w-4 h-4" />
              <span>Reintentar</span>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Conteo de alertas críticas para badge
  const criticalAlertsCount = recentAlerts.filter(alert => alert.type === 'critical').length;
  const totalActiveAlerts = recentAlerts.length;

  // Calcular tendencias básicas desde los datos semanales
  const calculateWeeklyChange = () => {
    if (weeklyTrend.length < 2) return { attendanceChange: 0, punctualityChange: 0 };
    
    const recent = weeklyTrend[weeklyTrend.length - 1];
    const previous = weeklyTrend[weeklyTrend.length - 2];
    
    return {
      attendanceChange: recent.attendanceRate - previous.attendanceRate,
      punctualityChange: ((recent.present - recent.late) / recent.total * 100) - 
                        ((previous.present - previous.late) / previous.total * 100)
    };
  };

  const trends = calculateWeeklyChange();

  return (
    <div className="p-6 space-y-6">
      
      {/* Header con navegación y controles */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
            <Activity className="w-8 h-8 text-blue-600" />
            <span>Panel de Analíticas</span>
          </h2>
          <p className="text-gray-600 mt-1">
            Métricas en tiempo real, tendencias y alertas inteligentes
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Navegación de vistas */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <Button
              variant={currentView === 'overview' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('overview')}
              className="flex items-center space-x-2"
            >
              <TrendingUp className="w-4 h-4" />
              <span>KPIs</span>
            </Button>
            <Button
              variant={currentView === 'charts' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('charts')}
              className="flex items-center space-x-2"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Gráficos</span>
            </Button>
            <Button
              variant={currentView === 'alerts' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('alerts')}
              className="flex items-center space-x-2 relative"
            >
              <Bell className="w-4 h-4" />
              <span>Alertas</span>
              {criticalAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {criticalAlertsCount}
                </span>
              )}
            </Button>
          </div>
          
          {/* Botón de actualización */}
          <Button
            onClick={refreshData}
            disabled={loading}
            size="sm"
            variant="outline"
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </Button>
        </div>
      </div>

      {/* Resumen rápido de alertas críticas (siempre visible) */}
      {criticalAlertsCount > 0 && currentView !== 'alerts' && (
        <Card className="bg-red-50 border-red-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  {criticalAlertsCount} alerta{criticalAlertsCount > 1 ? 's' : ''} crítica{criticalAlertsCount > 1 ? 's' : ''} requiere{criticalAlertsCount === 1 ? '' : 'n'} atención
                </p>
                <p className="text-xs text-red-600">
                  {totalActiveAlerts} alertas activas en total
                </p>
              </div>
            </div>
            <Button
              onClick={() => setCurrentView('alerts')}
              size="sm"
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              Ver Alertas
            </Button>
          </div>
        </Card>
      )}

      {/* Contenido principal según la vista seleccionada */}
      <div className="min-h-[600px]">
        {currentView === 'overview' && (
          <div className="space-y-6">
            {/* KPIs principales */}
            <DashboardKPIsComponent 
              kpis={kpis} 
              loading={loading} 
            />
            
            {/* Información adicional */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                  Tendencias Recientes
                </h3>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse flex justify-between items-center">
                        <div className="bg-gray-200 h-4 w-32 rounded"></div>
                        <div className="bg-gray-200 h-4 w-16 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Asistencia vs. semana pasada</span>
                      <span className={`font-semibold ${
                        trends.attendanceChange >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {trends.attendanceChange >= 0 ? '+' : ''}{trends.attendanceChange.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Puntualidad vs. semana pasada</span>
                      <span className={`font-semibold ${
                        trends.punctualityChange >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {trends.punctualityChange >= 0 ? '+' : ''}{trends.punctualityChange.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Mejor departamento</span>
                      <span className="font-semibold text-blue-600">
                        {departmentMetrics.length > 0 ? departmentMetrics[0].department : 'N/A'}
                      </span>
                    </div>
                  </div>
                )}
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <LineChart className="w-5 h-5 mr-2 text-purple-600" />
                  Vista Rápida de Gráficos
                </h3>
                <div className="text-center py-8">
                  <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">
                    Accede a gráficos interactivos detallados
                  </p>
                  <Button
                    onClick={() => setCurrentView('charts')}
                    className="flex items-center space-x-2"
                  >
                    <LineChart className="w-4 h-4" />
                    <span>Ver Gráficos Completos</span>
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        )}

        {currentView === 'charts' && (
          <DashboardCharts 
            weeklyTrend={weeklyTrend}
            monthlyTrend={monthlyTrend}
            departmentMetrics={departmentMetrics}
            loading={loading}
          />
        )}

        {currentView === 'alerts' && (
          <DashboardAlerts 
            alerts={recentAlerts}
            criticalCount={criticalAlertsCount}
            warningCount={recentAlerts.filter(alert => alert.type === 'warning').length}
            loading={loading}
          />
        )}
      </div>

      {/* Sección de Asistencias de Todos los Empleados - Siempre visible debajo del panel principal */}
      <div className="mt-8">
        <AllEmployeeAttendance />
      </div>
    </div>
  );
}
