'use client'

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { 
  Users, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  Calendar,
  Building
} from 'lucide-react';
import { dashboardService, DashboardStats, TodayAttendance, MonthlyTrends } from '@/services/dashboard.service';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  loading?: boolean;
}

function StatCard({ title, value, icon, change, changeType = 'neutral', loading = false }: StatCardProps) {
  const changeColor = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600'
  }[changeType];

  return (
    <Card className="p-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 text-blue-600">
            {icon}
          </div>
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">
              {title}
            </dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">
                {loading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                ) : (
                  value
                )}
              </div>
              {change && !loading && (
                <div className={`ml-2 flex items-baseline text-sm font-semibold ${changeColor}`}>
                  {change}
                </div>
              )}
            </dd>
          </dl>
        </div>
      </div>
    </Card>
  );
}

/**
 * Componente del dashboard general con estadísticas reales de Supabase
 * 
 * Principios aplicados:
 * - Single Responsibility: Solo muestra estadísticas generales
 * - DRY: Reutiliza componente StatCard
 * - Data Fetching: Consume datos reales de la base de datos
 */
export function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<TodayAttendance | null>(null);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrends | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // TODO: Obtener organizationId del contexto de autenticación
  const organizationId = '550e8400-e29b-41d4-a716-446655440000';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsData, todayData, trendsData] = await Promise.all([
          dashboardService.getDashboardStats(organizationId),
          dashboardService.getTodayAttendance(organizationId),
          dashboardService.getMonthlyTrends(organizationId)
        ]);

        setStats(statsData);
        setTodayAttendance(todayData);
        setMonthlyTrends(trendsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Error al cargar datos del dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [organizationId]);

  if (error) {
    return (
      <div className="p-6">
        <Card className="p-6">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error al cargar datos</h3>
            <p className="text-gray-600">{error}</p>
          </div>
        </Card>
      </div>
    );
  }

  const attendanceRateColor = (stats?.attendanceRate || 0) >= 90 ? 'positive' : 
                             (stats?.attendanceRate || 0) >= 75 ? 'neutral' : 'negative';

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Resumen General
        </h2>
        <p className="text-gray-600">
          Vista general del estado actual del sistema de asistencia
        </p>
      </div>

      {/* Tarjetas de estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total de Empleados"
          value={stats?.totalEmployees || 0}
          icon={<Users className="w-8 h-8" />}
          loading={loading}
        />
        <StatCard
          title="Presentes Hoy"
          value={stats?.presentToday || 0}
          icon={<Clock className="w-8 h-8" />}
          change={`${stats?.attendanceRate || 0}%`}
          changeType={attendanceRateColor}
          loading={loading}
        />
        <StatCard
          title="Tardanzas del Día"
          value={stats?.lateToday || 0}
          icon={<AlertCircle className="w-8 h-8" />}
          changeType="negative"
          loading={loading}
        />
        <StatCard
          title="Departamentos"
          value={stats?.totalDepartments || 0}
          icon={<Building className="w-8 h-8" />}
          loading={loading}
        />
      </div>

      {/* Sección de detalles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Asistencias de Hoy
          </h3>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex justify-between items-center">
                  <div className="bg-gray-200 h-4 w-32 rounded"></div>
                  <div className="bg-gray-200 h-4 w-12 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Entradas registradas</span>
                <span className="font-semibold">{todayAttendance?.checkInsToday || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Salidas registradas</span>
                <span className="font-semibold">{todayAttendance?.checkOutsToday || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Empleados ausentes</span>
                <span className="font-semibold text-red-600">{stats?.absentToday || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Horas extra hoy</span>
                <span className="font-semibold text-blue-600">{stats?.overtimeHours || 0}h</span>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Tendencias del Mes
          </h3>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse flex justify-between items-center">
                  <div className="bg-gray-200 h-4 w-32 rounded"></div>
                  <div className="bg-gray-200 h-4 w-16 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Puntualidad promedio</span>
                <span className={`font-semibold ${
                  (monthlyTrends?.punctualityRate || 0) >= 90 ? 'text-green-600' : 
                  (monthlyTrends?.punctualityRate || 0) >= 75 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {monthlyTrends?.punctualityRate || 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Ausentismo</span>
                <span className={`font-semibold ${
                  (monthlyTrends?.absenteeismRate || 0) <= 5 ? 'text-green-600' : 
                  (monthlyTrends?.absenteeismRate || 0) <= 10 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {monthlyTrends?.absenteeismRate || 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Horas extra del mes</span>
                <span className="font-semibold">{monthlyTrends?.overtimeHours || 0}h</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Promedio horas diarias</span>
                <span className="font-semibold">{monthlyTrends?.averageWorkHours || 0}h</span>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
