'use client'

import React, { useState } from 'react';
import { AdminTabs } from './AdminTabs';
import { AdminHeader } from './AdminHeader';
import { DashboardOverview } from './DashboardOverview';
import { EmployeeManagement } from './EmployeeManagement';
import { SystemSettings } from './SystemSettings';
import { AdvancedReports } from './reports/AdvancedReports';

export type AdminTabType = 'overview' | 'employees' | 'reports' | 'settings';

interface AdminDashboardProps {
  userEmail?: string;
  onLogout: () => void;
}

/**
 * Componente principal del panel de administración
 * 
 * Principios aplicados:
 * - Single Responsibility: Solo maneja la coordinación de pestañas
 * - Open/Closed: Fácil agregar nuevas pestañas sin modificar componente
 * - Dependency Inversion: Recibe funciones como props
 */
export function AdminDashboard({ userEmail, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTabType>('overview');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <DashboardOverview />;
      case 'employees':
        return <EmployeeManagement />;
      case 'reports':
        return <AdvancedReports />;
      case 'settings':
        return <SystemSettings />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <AdminHeader 
        userEmail={userEmail} 
        onLogout={onLogout} 
      />
      
      <div className="container-modern py-8">
        <div className="page-header">
          <h1 className="page-title">Panel de Administración</h1>
          <p className="page-subtitle">Gestiona empleados, reportes y configuración del sistema</p>
        </div>
        
        <AdminTabs 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />
        
        <div className="mt-8">
          <div className="glass-card min-h-[600px]">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
