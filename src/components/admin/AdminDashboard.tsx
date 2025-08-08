'use client'

import React, { useState } from 'react';
import { AdminTabs } from './AdminTabs';
import { AdminHeader } from './AdminHeader';
import { DashboardOverview } from './DashboardOverview';
import { EmployeeManagement } from './EmployeeManagement';
import { SystemSettings } from './SystemSettings';
import { AdvancedReports } from './reports/AdvancedReports';
import { AdvancedAnalytics } from './AdvancedAnalytics';

export type AdminTabType = 'overview' | 'employees' | 'analytics' | 'reports' | 'settings';

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
      case 'analytics':
        return (
          <AdvancedAnalytics 
            dateRange={{
              startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              endDate: new Date().toISOString().split('T')[0]
            }}
          />
        );
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
