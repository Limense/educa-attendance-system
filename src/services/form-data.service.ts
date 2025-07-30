/**
 * =============================================
 * SERVICIO DE DATOS PARA FORMULARIOS
 * =============================================
 * 
 * Descripción: Servicio para obtener datos necesarios para formularios
 * Como departamentos, posiciones, roles, etc.
 * 
 * Principios aplicados:
 * - Single Responsibility: Solo maneja datos de formularios
 * - Dependency Injection: Usa servicios existentes
 * - Service Layer: Abstrae la lógica de obtención de datos
 */

import { SystemConfigService } from './system-config.service';
import { createSupabaseClient } from '@/lib/supabase/client';

export interface FormDataOption {
  value: string;
  label: string;
}

export interface Position {
  id: string;
  title: string;
  code: string;
  department_id?: string;
  level: number;
  is_active: boolean;
}

export interface FormDataService {
  getDepartments(organizationId: string): Promise<FormDataOption[]>;
  getPositions(organizationId: string): Promise<FormDataOption[]>;
  getPositionsByDepartment(organizationId: string, departmentId: string): Promise<FormDataOption[]>;
  getRoles(): FormDataOption[];
  getEmployeeStatuses(): FormDataOption[];
}

export class FormDataServiceImpl implements FormDataService {
  private systemConfigService: SystemConfigService;

  constructor() {
    this.systemConfigService = new SystemConfigService();
  }

  /**
   * Obtiene la lista de departamentos para formularios
   */
  async getDepartments(organizationId: string): Promise<FormDataOption[]> {
    try {
      const departments = await this.systemConfigService.getDepartments(organizationId);
      
      return departments.map(dept => ({
        value: dept.id,
        label: dept.name
      }));
    } catch (error) {
      console.error('Error obteniendo departamentos:', error);
      return [];
    }
  }

  /**
   * Obtiene la lista de posiciones/cargos para formularios
   */
  async getPositions(organizationId: string): Promise<FormDataOption[]> {
    try {
      const supabase = createSupabaseClient();
      
      const { data: positions, error } = await supabase
        .from('positions')
        .select('id, title, code, level')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('level', { ascending: false })
        .order('title', { ascending: true });

      if (error) {
        console.error('Error obteniendo posiciones:', error);
        return [];
      }

      return positions.map((position: { id: string; title: string; code: string }) => ({
        value: position.id,
        label: `${position.title} (${position.code})`
      }));
    } catch (error) {
      console.error('Error obteniendo posiciones:', error);
      return [];
    }
  }

  /**
   * Obtiene posiciones filtradas por departamento
   */
  async getPositionsByDepartment(organizationId: string, departmentId: string): Promise<FormDataOption[]> {
    try {
      const supabase = createSupabaseClient();
      
      const { data: positions, error } = await supabase
        .from('positions')
        .select('id, title, code, level')
        .eq('organization_id', organizationId)
        .eq('department_id', departmentId)
        .eq('is_active', true)
        .order('level', { ascending: false })
        .order('title', { ascending: true });

      if (error) {
        console.error('Error obteniendo posiciones por departamento:', error);
        return [];
      }

      return positions.map((position: { id: string; title: string; code: string }) => ({
        value: position.id,
        label: `${position.title} (${position.code})`
      }));
    } catch (error) {
      console.error('Error obteniendo posiciones por departamento:', error);
      return [];
    }
  }

  /**
   * Obtiene los roles disponibles
   */
  getRoles(): FormDataOption[] {
    return [
      { value: 'employee', label: 'Empleado' },
      { value: 'manager', label: 'Gerente' },
      { value: 'hr', label: 'Recursos Humanos' },
      { value: 'admin', label: 'Administrador' },
      { value: 'super_admin', label: 'Super Administrador' }
    ];
  }

  /**
   * Obtiene los estados de empleado disponibles
   */
  getEmployeeStatuses(): FormDataOption[] {
    return [
      { value: 'active', label: 'Activo' },
      { value: 'inactive', label: 'Inactivo' },
      { value: 'on_leave', label: 'De Baja' },
      { value: 'terminated', label: 'Terminado' }
    ];
  }
}

// Factory para el servicio
export const createFormDataService = (): FormDataService => {
  return new FormDataServiceImpl();
};
