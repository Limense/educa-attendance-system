/**
 * =============================================
 * SISTEMA DE ALERTAS DEL DASHBOARD
 * =============================================
 * 
 * Componente para mostrar alertas automáticas y notificaciones
 */

'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle,
  X,
  Bell,
  Clock,
  Users
} from 'lucide-react';
import type { AlertItem } from '@/hooks/useDashboardAnalytics';

interface DashboardAlertsProps {
  alerts: AlertItem[];
  criticalCount: number;
  warningCount: number;
  loading: boolean;
}

export function DashboardAlerts({ 
  alerts, 
  criticalCount, 
  warningCount, 
  loading 
}: DashboardAlertsProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // Filtrar alertas no descartadas
  const activeAlerts = alerts.filter(alert => !dismissed.has(alert.id));

  // Función para descartar alerta
  const dismissAlert = (alertId: string) => {
    setDismissed(prev => new Set([...prev, alertId]));
  };

  // Función para obtener el ícono según el tipo
  const getAlertIcon = (type: AlertItem['type']) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5" />;
      case 'info':
        return <Info className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  // Función para obtener los colores según el tipo
  const getAlertStyles = (type: AlertItem['type']) => {
    switch (type) {
      case 'critical':
        return {
          container: 'bg-red-50 border-red-200',
          icon: 'text-red-600 bg-red-100',
          title: 'text-red-800',
          description: 'text-red-700',
          button: 'text-red-600 hover:text-red-800'
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-200',
          icon: 'text-yellow-600 bg-yellow-100',
          title: 'text-yellow-800',
          description: 'text-yellow-700',
          button: 'text-yellow-600 hover:text-yellow-800'
        };
      case 'info':
        return {
          container: 'bg-blue-50 border-blue-200',
          icon: 'text-blue-600 bg-blue-100',
          title: 'text-blue-800',
          description: 'text-blue-700',
          button: 'text-blue-600 hover:text-blue-800'
        };
      default:
        return {
          container: 'bg-gray-50 border-gray-200',
          icon: 'text-gray-600 bg-gray-100',
          title: 'text-gray-800',
          description: 'text-gray-700',
          button: 'text-gray-600 hover:text-gray-800'
        };
    }
  };

  // Función para formatear tiempo relativo
  const getRelativeTime = (timestamp: string): string => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - alertTime.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Ahora mismo';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)} h`;
    return `Hace ${Math.floor(diffInMinutes / 1440)} días`;
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-gray-200 rounded"></div>
            <div className="w-32 h-5 bg-gray-200 rounded"></div>
          </div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start space-x-3 p-3 mb-3 rounded-lg bg-gray-50">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="w-40 h-4 bg-gray-200 rounded mb-2"></div>
                <div className="w-full h-3 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      {/* Header de Alertas */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Bell className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Centro de Alertas
            </h3>
            <p className="text-sm text-gray-600">
              Notificaciones automáticas del sistema
            </p>
          </div>
        </div>
        
        {/* Contadores de alertas */}
        <div className="flex items-center space-x-4">
          {criticalCount > 0 && (
            <div className="flex items-center space-x-1 bg-red-100 px-3 py-1 rounded-full">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-700">{criticalCount}</span>
            </div>
          )}
          {warningCount > 0 && (
            <div className="flex items-center space-x-1 bg-yellow-100 px-3 py-1 rounded-full">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-700">{warningCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* Lista de Alertas */}
      <div className="space-y-3">
        {activeAlerts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              ¡Todo en orden!
            </h4>
            <p className="text-gray-600">
              No hay alertas activas en este momento
            </p>
          </div>
        ) : (
          activeAlerts.map((alert) => {
            const styles = getAlertStyles(alert.type);
            
            return (
              <div
                key={alert.id}
                className={`flex items-start space-x-3 p-4 rounded-lg border transition-all duration-200 hover:shadow-sm ${styles.container}`}
              >
                {/* Ícono de la alerta */}
                <div className={`p-2 rounded-full ${styles.icon}`}>
                  {getAlertIcon(alert.type)}
                </div>
                
                {/* Contenido de la alerta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className={`text-sm font-medium ${styles.title}`}>
                        {alert.title}
                      </h4>
                      <p className={`text-sm mt-1 ${styles.description}`}>
                        {alert.description}
                      </p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-xs text-gray-500 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {getRelativeTime(alert.timestamp)}
                        </span>
                        {alert.employeeId && (
                          <span className="text-xs text-gray-500 flex items-center">
                            <Users className="w-3 h-3 mr-1" />
                            Empleado: {alert.employeeId}
                          </span>
                        )}
                        {alert.departmentId && (
                          <span className="text-xs text-gray-500">
                            Depto: {alert.departmentId}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Botón para descartar */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dismissAlert(alert.id)}
                      className={`ml-2 ${styles.button} p-1 h-auto`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Acciones adicionales */}
      {activeAlerts.length > 0 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            {activeAlerts.length} alerta{activeAlerts.length !== 1 ? 's' : ''} activa{activeAlerts.length !== 1 ? 's' : ''}
          </p>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDismissed(new Set(alerts.map(a => a.id)))}
              className="text-xs"
            >
              Descartar Todas
            </Button>
            <Button
              variant="outline" 
              size="sm"
              className="text-xs"
            >
              Ver Historial
            </Button>
          </div>
        </div>
      )}

      {/* Estadísticas rápidas si no hay alertas críticas */}
      {criticalCount === 0 && warningCount === 0 && activeAlerts.length === 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">✓</div>
              <p className="text-xs text-gray-600 mt-1">Sistema Estable</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">📊</div>
              <p className="text-xs text-gray-600 mt-1">Métricas Normales</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">🎯</div>
              <p className="text-xs text-gray-600 mt-1">Objetivos en Meta</p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
