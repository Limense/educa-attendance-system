'use client'

import React from 'react';
import { AdminTabType } from './AdminDashboard';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings 
} from 'lucide-react';

interface AdminTabsProps {
  activeTab: AdminTabType;
  onTabChange: (tab: AdminTabType) => void;
}

interface TabConfig {
  id: AdminTabType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const tabs: TabConfig[] = [
  {
    id: 'overview',
    label: 'Panel General',
    icon: <LayoutDashboard className="w-5 h-5" />,
    description: 'Vista general y estadísticas'
  },
  {
    id: 'employees',
    label: 'Gestión de Empleados',
    icon: <Users className="w-5 h-5" />,
    description: 'Crear, editar y gestionar empleados'
  },
  {
    id: 'reports',
    label: 'Reportes',
    icon: <FileText className="w-5 h-5" />,
    description: 'Reportes de asistencia y análisis'
  },
  {
    id: 'settings',
    label: 'Configuración',
    icon: <Settings className="w-5 h-5" />,
    description: 'Configuración del sistema'
  }
];

/**
 * Componente de navegación por pestañas del panel de administración
 * 
 * Principios aplicados:
 * - Single Responsibility: Solo maneja la navegación
 * - Interface Segregation: Props específicas para su función
 */
export function AdminTabs({ activeTab, onTabChange }: AdminTabsProps) {
  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "ghost"}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm
              ${activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            {tab.icon}
            {tab.label}
          </Button>
        ))}
      </nav>
      
      {/* Descripción de la pestaña activa */}
      <div className="mt-4 mb-6">
        <p className="text-gray-600">
          {tabs.find(tab => tab.id === activeTab)?.description}
        </p>
      </div>
    </div>
  );
}
