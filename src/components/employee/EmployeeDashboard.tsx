/**
 * =============================================
 * EMPLOYEE DASHBOARD COMPONENT
 * =============================================
 * 
 * Descripción: Componente principal del dashboard del empleado
 * Implementa Clean Architecture siguiendo el patrón del AdminDashboard
 * 
 * Principios aplicados:
 * - Single Responsibility: Solo maneja la coordinación de pestañas
 * - Open/Closed: Fácil agregar nuevas pestañas sin modificar componente
 * - Dependency Inversion: Recibe funciones como props
 */

'use client';

import React, { useState } from 'react';
import { EmployeeTabs } from './EmployeeTabs';
import { EmployeeHeader } from './EmployeeHeader';
import { AttendanceOverview } from './AttendanceOverview';
import { AttendanceDetails } from './AttendanceDetails';
import { EmployeeProfile } from './EmployeeProfile';
import type { Employee } from '@/types/database';

export type EmployeeTabType = 'attendance' | 'history' | 'profile';

interface EmployeeDashboardProps {
  employee: Employee;
  onLogout: () => void;
}

/**
 * Componente principal del dashboard del empleado
 * Sigue el mismo patrón que AdminDashboard para consistencia
 */
export function EmployeeDashboard({ employee, onLogout }: EmployeeDashboardProps) {
  const [activeTab, setActiveTab] = useState<EmployeeTabType>('attendance');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'attendance':
        return <AttendanceOverview employeeId={employee.id} />;
      case 'history':
        return <AttendanceDetails employeeId={employee.id} />;
      case 'profile':
        return <EmployeeProfile employee={employee} />;
      default:
        return <AttendanceOverview employeeId={employee.id} />;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <EmployeeHeader 
        employee={employee}
        onLogout={onLogout} 
      />
      
      <div className="container-modern py-8">
        <div className="page-header">
          <h1 className="page-title">Mi Dashboard</h1>
          <p className="page-subtitle">
            Bienvenido, {employee.first_name} {employee.last_name}
          </p>
        </div>
        
        <EmployeeTabs 
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
