/**
 * =============================================
 * EMPLOYEE TABS COMPONENT
 * =============================================
 * 
 * Descripción: Navegación por pestañas del dashboard del empleado
 * Permite cambiar entre diferentes vistas del dashboard
 */

'use client';

import React from 'react';

// Definir el tipo aquí para evitar dependencias circulares
export type EmployeeTabType = 'attendance' | 'history' | 'profile';

interface EmployeeTabsProps {
  activeTab: EmployeeTabType;
  onTabChange: (tab: EmployeeTabType) => void;
}

/**
 * Configuración de las pestañas del empleado
 */
const EMPLOYEE_TABS = [
  {
    id: 'attendance' as EmployeeTabType,
    label: 'Mi Asistencia',
    icon: '🕐',
    description: 'Control de entrada y salida'
  },
  {
    id: 'history' as EmployeeTabType,
    label: 'Historial',
    icon: '📊',
    description: 'Registro de asistencias'
  },
  {
    id: 'profile' as EmployeeTabType,
    label: 'Mi Perfil',
    icon: '👤',
    description: 'Información personal'
  }
] as const;

/**
 * Componente de pestañas para el dashboard del empleado
 * Sigue el patrón de AdminTabs para consistencia
 */
export function EmployeeTabs({ activeTab, onTabChange }: EmployeeTabsProps) {
  return (
    <div className="border-b border-gray-200 bg-white rounded-t-lg">
      <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
        {EMPLOYEE_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                ${isActive
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="text-lg mr-2">{tab.icon}</span>
              <span className="font-medium">{tab.label}</span>
              
              {/* Tooltip/descripción */}
              <div className="absolute invisible group-hover:visible bg-gray-900 text-white text-xs rounded py-1 px-2 -mt-8 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                {tab.description}
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
