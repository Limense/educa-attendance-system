/**
 * =============================================
 * EMPLOYEE HEADER COMPONENT
 * =============================================
 * 
 * Descripción: Header del dashboard del empleado
 * Muestra información básica y botones de acción
 */

'use client';

import React from 'react';
import type { Employee } from '@/types/database';

interface EmployeeHeaderProps {
  employee: Employee;
  onLogout: () => void;
}

/**
 * Componente del header para el dashboard del empleado
 * Sigue el patrón de AdminHeader para consistencia
 */
export function EmployeeHeader({ employee, onLogout }: EmployeeHeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="container-modern">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            {/* Avatar del empleado */}
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
              <span className="text-white font-bold text-lg">
                {employee.first_name?.charAt(0) || 'E'}
              </span>
            </div>
            
            {/* Información del empleado */}
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Dashboard de Empleado
              </h1>
              <div className="flex items-center text-sm text-gray-600">
                <span>{employee.first_name} {employee.last_name}</span>
                <span className="mx-2">•</span>
                <span>{employee.employee_code}</span>
                {employee.department?.name && (
                  <>
                    <span className="mx-2">•</span>
                    <span>{employee.department.name}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Acciones del header */}
          <div className="flex items-center space-x-3">
            {/* Estado de conexión */}
            <div className="flex items-center text-sm text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              <span>En línea</span>
            </div>

            {/* Botón de logout */}
            <button
              onClick={onLogout}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              title="Cerrar sesión"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
