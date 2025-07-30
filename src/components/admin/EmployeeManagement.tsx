'use client'

import React from 'react';
import EmployeePageSimple from '@/components/employees/EmployeePageSimple';

/**
 * Componente wrapper para gestión de empleados en el panel de admin
 * 
 * Principios aplicados:
 * - Single Responsibility: Solo envuelve el componente de empleados
 * - Composition over Inheritance: Reutiliza componente existente
 */
export function EmployeeManagement() {
  return (
    <div className="p-0"> {/* Sin padding adicional ya que EmployeePageSimple maneja su propio layout */}
      <EmployeePageSimple />
    </div>
  );
}
