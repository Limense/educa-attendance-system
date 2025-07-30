/**
 * =============================================
 * HOOK SIMPLIFICADO PARA GESTIÓN DE EMPLEADOS
 * =============================================
 * 
 * Descripción: Hook simple que usa el servicio de empleados aplicando principios SOLID
 * 
 * Principios aplicados:
 * - Single Responsibility: Solo maneja estado y lógica de empleados
 * - Open/Closed: Extensible para nuevas funcionalidades sin modificar base
 * - Dependency Inversion: Depende del servicio abstrato, no implementación
 * - Interface Segregation: Interfaces específicas para diferentes necesidades
 */

'use client';

import { useState, useEffect } from 'react';
import { employeeService } from '@/services/employee.service';
import { EmployeeFormData } from '@/types/employee.types';

/**
 * Interfaz para empleado simplificado aplicando Interface Segregation
 */
export interface EmployeeSimple {
  id: string;
  employee_code: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone?: string;
  hire_date: string;
  role: string;
  is_active: boolean;
  departments?: { id: string; name: string };
  positions?: { id: string; title: string };
}

/**
 * Interfaz de resultado del hook aplicando Interface Segregation
 */
export interface UseEmployeeSimpleResult {
  employees: EmployeeSimple[];
  loading: boolean;
  error: string | null;
  createEmployee: (data: EmployeeFormData) => Promise<boolean>;
  updateEmployee: (id: string, data: Partial<EmployeeFormData>) => Promise<boolean>;
  deleteEmployee: (id: string) => Promise<boolean>;
  activateEmployee: (id: string) => Promise<boolean>;
  deactivateEmployee: (id: string) => Promise<boolean>;
  refreshEmployees: () => Promise<void>;
}

export function useEmployeeSimple(organizationId: string): UseEmployeeSimpleResult {
  const [employees, setEmployees] = useState<EmployeeSimple[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Usar el servicio limpio
  const service = employeeService;

  const loadEmployees = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const data = await service.getEmployees(organizationId);
      setEmployees(data);
    } catch (err) {
      console.error('Error cargando empleados:', err);
      setError('Error cargando empleados');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Crear empleado aplicando principio Single Responsibility y error handling robusto
   * 
   * @param data - Datos del formulario validados
   * @returns Promise<boolean> - true si fue exitoso, false si falló
   */
  const createEmployee = async (data: EmployeeFormData): Promise<boolean> => {
    try {
      // Limpiar estados previos aplicando principio de limpieza
      setError(null);
      console.log('🔄 Hook: Iniciando creación de empleado...', { 
        email: data.email,
        name: `${data.firstName} ${data.lastName}` 
      });
      
      // Delegar lógica de negocio al servicio (Dependency Inversion)
      const success = await service.createEmployee({ ...data, organizationId });
      
      if (success) {
        console.log('✅ Hook: Empleado creado exitosamente');
        // Recargar lista para mantener consistencia de estado
        await loadEmployees();
        return true;
      } else {
        // Este caso no debería ocurrir con la nueva implementación
        console.log('❌ Hook: Error inesperado - servicio retornó false');
        setError('Error inesperado al crear empleado');
        return false;
      }
    } catch (err: unknown) {
      console.error('💥 Hook: Error creando empleado:', err);
      
      // Aplicar principio de manejo específico de errores
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);
      return false;
    }
  };

  /**
   * Extraer mensaje de error específico aplicando principio DRY
   * 
   * @param err - Error capturado
   * @returns string - Mensaje de error user-friendly
   */
  const extractErrorMessage = (err: unknown): string => {
    // Manejar errores específicos con mensajes user-friendly
    if (err instanceof Error) {
      const message = err.message.toLowerCase();
      
      // Mapeo de errores técnicos a mensajes de usuario
      if (message.includes('email')) {
        return 'El email ya está registrado. Por favor use un email diferente.';
      }
      if (message.includes('código') || message.includes('employee_code')) {
        return 'El código de empleado ya está en uso. Por favor use uno diferente.';
      }
      if (message.includes('campos requeridos')) {
        return 'Por favor complete todos los campos requeridos.';
      }
      if (message.includes('departamento')) {
        return 'El departamento seleccionado no es válido.';
      }
      if (message.includes('posición') || message.includes('position')) {
        return 'La posición seleccionada no es válida.';
      }
      if (message.includes('organización') || message.includes('organization')) {
        return 'Error de configuración de la organización.';
      }
      
      // Retornar mensaje original si es específico del dominio
      return err.message;
    }
    
    // Mensaje genérico para errores no identificados
    return 'Error al crear empleado. Verifique los datos e intente nuevamente.';
  };

  const updateEmployee = async (id: string, data: Partial<EmployeeFormData>): Promise<boolean> => {
    try {
      setError(null);
      const success = await service.updateEmployee(id, data);
      if (success) {
        await loadEmployees(); // Recargar lista
      }
      return success;
    } catch (err) {
      console.error('Error actualizando empleado:', err);
      setError('Error actualizando empleado');
      return false;
    }
  };

  const deleteEmployee = async (id: string): Promise<boolean> => {
    try {
      setError(null);
      console.log('🎯 Hook: Iniciando eliminación del empleado:', id);
      
      const success = await service.deleteEmployee(id);
      
      if (success) {
        console.log('✅ Hook: Eliminación exitosa, recargando lista...');
        await loadEmployees(); // Recargar lista
        console.log('🔄 Hook: Lista recargada después de eliminación');
      } else {
        console.log('❌ Hook: Error en eliminación');
        setError('Error eliminando empleado');
      }
      
      return success;
    } catch (err) {
      console.error('💥 Hook: Error eliminando empleado:', err);
      setError('Error eliminando empleado');
      return false;
    }
  };

  const activateEmployee = async (id: string): Promise<boolean> => {
    try {
      setError(null);
      const success = await service.activateEmployee(id);
      if (success) {
        await loadEmployees(); // Recargar lista
      }
      return success;
    } catch (err) {
      console.error('Error activando empleado:', err);
      setError('Error activando empleado');
      return false;
    }
  };

  const deactivateEmployee = async (id: string): Promise<boolean> => {
    try {
      setError(null);
      const success = await service.deactivateEmployee(id);
      if (success) {
        await loadEmployees(); // Recargar lista
      }
      return success;
    } catch (err) {
      console.error('Error desactivando empleado:', err);
      setError('Error desactivando empleado');
      return false;
    }
  };

  // Cargar empleados al montar el componente
  useEffect(() => {
    const loadData = async () => {
      if (!organizationId) return;
      
      try {
        setLoading(true);
        setError(null);
        const data = await service.getEmployees(organizationId);
        setEmployees(data);
      } catch (err) {
        console.error('Error cargando empleados:', err);
        setError('Error cargando empleados');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [organizationId, service]);

  return {
    employees,
    loading,
    error,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    activateEmployee,
    deactivateEmployee,
    refreshEmployees: loadEmployees
  };
}
