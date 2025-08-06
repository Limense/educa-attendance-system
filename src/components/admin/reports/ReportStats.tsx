/**
 * =============================================
 * ESTADÍSTICAS DE REPORTES
 * =============================================
 * 
 * Componente para mostrar estadísticas resumidas
 */

'use client';

import React from 'react';
import type { ReportStats } from '@/types/reports.types';

interface ReportStatsProps {
  stats: ReportStats;
}

export function ReportStats({ stats }: ReportStatsProps) {
  const statCards = [
    {
      title: 'Total Empleados',
      value: stats.totalEmployees,
      icon: '👥',
      color: 'blue',
      suffix: 'empleados'
    },
    {
      title: 'Días Presentes',
      value: stats.presentDays,
      icon: '✅',
      color: 'green',
      suffix: 'días'
    },
    {
      title: 'Tasa de Asistencia',
      value: stats.attendanceRate.toFixed(1),
      icon: '📊',
      color: stats.attendanceRate >= 80 ? 'green' : stats.attendanceRate >= 60 ? 'yellow' : 'red',
      suffix: '%'
    },
    {
      title: 'Tasa de Puntualidad',
      value: stats.punctualityRate.toFixed(1),
      icon: '⏰',
      color: stats.punctualityRate >= 80 ? 'green' : stats.punctualityRate >= 60 ? 'yellow' : 'red',
      suffix: '%'
    },
    {
      title: 'Horas Totales',
      value: stats.totalHours.toFixed(0),
      icon: '🕐',
      color: 'purple',
      suffix: 'h'
    },
    {
      title: 'Promedio Diario',
      value: stats.averageHours.toFixed(1),
      icon: '📈',
      color: 'indigo',
      suffix: 'h/día'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 border-blue-200 text-blue-800',
      green: 'bg-green-50 border-green-200 text-green-800',
      yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      red: 'bg-red-50 border-red-200 text-red-800',
      purple: 'bg-purple-50 border-purple-200 text-purple-800',
      indigo: 'bg-indigo-50 border-indigo-200 text-indigo-800'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statCards.map((stat) => (
        <div
          key={stat.title}
          className={`rounded-xl border-2 p-6 ${getColorClasses(stat.color)} transition-all duration-200 hover:shadow-lg hover:scale-105`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="text-3xl">{stat.icon}</div>
            <div className="text-right">
              <div className="text-3xl font-bold">
                {stat.value}
                <span className="text-lg font-normal ml-1">{stat.suffix}</span>
              </div>
            </div>
          </div>
          <h3 className="font-semibold text-sm">{stat.title}</h3>
        </div>
      ))}

      {/* Estadísticas adicionales */}
      <div className="md:col-span-2 lg:col-span-3 mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-700 mb-3">📊 Detalles Adicionales</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="font-semibold text-gray-900">{stats.absentDays}</div>
            <div className="text-gray-600">Días Ausentes</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-gray-900">{stats.incompleteDays}</div>
            <div className="text-gray-600">Días Incompletos</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-gray-900">{stats.overtimeHours.toFixed(1)}h</div>
            <div className="text-gray-600">Horas Extra</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-gray-900">{stats.totalAttendances}</div>
            <div className="text-gray-600">Total Registros</div>
          </div>
        </div>
      </div>
    </div>
  );
}
