/**
 * HOOK DE GESTIÓN DE EMPLEADOS - VERSIÓN FUNCIONAL Y LIMPIA
 */

'use client';

import { useState, useCallback } from 'react';
import { employeeService } from '@/services/employee.service';
import { EmployeeFormData } from '@/types/employee.types';

export interface UseEmployeeManagementReturn {
  // Estado
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
  
  // Acciones
  createEmployee: (employeeData: EmployeeFormData) => Promise<boolean>;
  updateEmployee: (id: string, updates: Partial<EmployeeFormData>) => Promise<boolean>;
  deleteEmployee: (id: string) => Promise<boolean>;
  clearError: () => void;
}

export function useEmployeeManagement(organizationId: string): UseEmployeeManagementReturn {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const createEmployee = useCallback(async (employeeData: EmployeeFormData): Promise<boolean> => {
    setIsCreating(true);
    setError(null);

    try {
      // Validar datos requeridos
      if (!employeeData.firstName || !employeeData.lastName || !employeeData.email) {
        throw new Error('Nombre, apellido y email son requeridos');
      }

      // Preparar datos para creación con el formato correcto
      const createData: EmployeeFormData & { organizationId: string } = {
        ...employeeData,
        organizationId: organizationId,
      };

      // Crear empleado usando el servicio
      await employeeService.createEmployee(createData);
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear empleado';
      setError(errorMessage);
      console.error('Error creating employee:', err);
      return false;
    } finally {
      setIsCreating(false);
    }
  }, [organizationId]);

  const updateEmployee = useCallback(async (id: string, updates: Partial<EmployeeFormData>): Promise<boolean> => {
    setIsUpdating(true);
    setError(null);

    try {
      // Actualizar empleado usando el servicio
      await employeeService.updateEmployee(id, updates);
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar empleado';
      setError(errorMessage);
      console.error('Error updating employee:', err);
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const deleteEmployee = useCallback(async (id: string): Promise<boolean> => {
    setIsDeleting(true);
    setError(null);

    try {
      // Eliminar empleado usando el servicio
      await employeeService.deleteEmployee(id);
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar empleado';
      setError(errorMessage);
      console.error('Error deleting employee:', err);
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, []);

  return {
    // Estado
    isCreating,
    isUpdating,
    isDeleting,
    error,
    
    // Acciones
    createEmployee,
    updateEmployee,
    deleteEmployee,
    clearError,
  };
}

export default useEmployeeManagement;
