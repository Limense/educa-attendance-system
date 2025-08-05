/**
 * =============================================
 * SERVICIO PARA DATOS DE FORMULARIOS
 * =============================================
 * 
 * Descripción: Servicio para obtener datos necesarios en formularios
 * Como departamentos, posiciones, roles, etc.
 */

import { createSupabaseClient } from '@/lib/supabase/client';

export interface FormDataOption {
  value: string;
  label: string;
}

export interface FormDataService {
  getDepartments(organizationId: string): Promise<FormDataOption[]>;
  getPositions(organizationId: string): Promise<FormDataOption[]>;
  getPositionsByDepartment(organizationId: string, departmentId: string): Promise<FormDataOption[]>;
  getRoles(): FormDataOption[];
  getEmployeeStatuses(): FormDataOption[];
}

export class FormDataServiceImpl implements FormDataService {
  
  /**
   * Obtener departamentos de la organización
   */
  async getDepartments(organizationId: string): Promise<FormDataOption[]> {
    try {
      const supabase = createSupabaseClient();
      
      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error obteniendo departamentos:', error);
        return [];
      }

      return data?.map((dept: { id: string; name: string }) => ({
        value: dept.id,
        label: dept.name
      })) || [];
    } catch (error) {
      console.error('Error en getDepartments:', error);
      return [];
    }
  }

  /**
   * Obtener posiciones de la organización
   */
  async getPositions(organizationId: string): Promise<FormDataOption[]> {
    try {
      const supabase = createSupabaseClient();
      
      const { data, error } = await supabase
        .from('positions')
        .select('id, title')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('title');

      if (error) {
        console.error('Error obteniendo posiciones:', error);
        return [];
      }

      return data?.map((pos: { id: string; title: string }) => ({
        value: pos.id,
        label: pos.title
      })) || [];
    } catch (error) {
      console.error('Error en getPositions:', error);
      return [];
    }
  }

  /**
   * Obtener posiciones por departamento
   */
  async getPositionsByDepartment(organizationId: string, departmentId: string): Promise<FormDataOption[]> {
    try {
      const supabase = createSupabaseClient();
      
      const { data, error } = await supabase
        .from('positions')
        .select('id, title')
        .eq('organization_id', organizationId)
        .eq('department_id', departmentId)
        .eq('is_active', true)
        .order('title');

      if (error) {
        console.error('Error obteniendo posiciones por departamento:', error);
        return [];
      }

      return data?.map((pos: { id: string; title: string }) => ({
        value: pos.id,
        label: pos.title
      })) || [];
    } catch (error) {
      console.error('Error en getPositionsByDepartment:', error);
      return [];
    }
  }

  /**
   * Obtener roles disponibles
   */
  getRoles(): FormDataOption[] {
    return [
      { value: 'employee', label: 'Empleado' },
      { value: 'admin', label: 'Administrador' },
      { value: 'super_admin', label: 'Super Administrador' }
      // Roles futuros (comentados por ahora):
      // { value: 'supervisor', label: 'Supervisor' },
      // { value: 'manager', label: 'Gerente' },
      // { value: 'hr', label: 'Recursos Humanos' }
    ];
  }

  /**
   * Obtener estados de empleado disponibles - SOLO LOS QUE USAMOS
   */
  getEmployeeStatuses(): FormDataOption[] {
    return [
      { value: 'active', label: 'Activo' },
      { value: 'inactive', label: 'Inactivo' }
      // Estados futuros (comentados por ahora):
      // { value: 'suspended', label: 'Suspendido' },
      // { value: 'terminated', label: 'Terminado' },
      // { value: 'on_leave', label: 'En Licencia' }
    ];
  }
}

// Función factory para crear instancia del servicio
export function createFormDataService(): FormDataService {
  return new FormDataServiceImpl();
}

// Instancia única del servicio
export const formDataService = new FormDataServiceImpl();
