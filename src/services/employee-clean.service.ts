/**
 * =============================================
 * SERVICIO DE EMPLEADOS LIMPIO Y SIMPLE
 * =============================================
 * 
 * SIN service_role, SIN complejidad, SOLO lo esencial
 */

import { createSupabaseClient } from '@/lib/supabase/client';
import { EmployeeFormData } from '@/types/employee.types';
import { EmployeeSimple } from '@/hooks/useEmployeeSimple';

export interface EmployeeService {
  createEmployee(data: EmployeeFormData & { organizationId: string }): Promise<boolean>;
  updateEmployee(id: string, data: Partial<EmployeeFormData>): Promise<boolean>;
  deleteEmployee(id: string): Promise<boolean>;
  activateEmployee(id: string): Promise<boolean>;
  deactivateEmployee(id: string): Promise<boolean>;
  getEmployees(organizationId: string): Promise<EmployeeSimple[]>;
}

export class EmployeeServiceImpl implements EmployeeService {
  
  /**
   * Obtener todos los empleados (RLS se encarga de filtrar por organización)
   */
  async getEmployees(organizationId: string): Promise<EmployeeSimple[]> {
    try {
      const supabase = createSupabaseClient();
      
      console.log('📋 Obteniendo empleados...');
      
      const { data, error } = await supabase
        .from('employees')
        .select(`
          id,
          employee_code,
          email,
          full_name,
          phone,
          hire_date,
          role,
          is_active,
          created_at,
          updated_at,
          departments:department_id (
            id,
            name
          ),
          positions:position_id (
            id,
            title
          )
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error obteniendo empleados:', error);
        throw error;
      }

      console.log('✅ Empleados obtenidos:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('💥 Error en getEmployees:', error);
      throw error;
    }
  }

  /**
   * Crear empleado (solo insertar en tabla employees, sin auth complicado)
   */
  async createEmployee(data: EmployeeFormData & { organizationId: string }): Promise<boolean> {
    try {
      const supabase = createSupabaseClient();
      
      console.log('🔄 Creando empleado simple:', { 
        email: data.email, 
        firstName: data.firstName, 
        lastName: data.lastName 
      });
      
      const { error } = await supabase
        .from('employees')
        .insert({
          organization_id: data.organizationId,
          employee_code: data.employeeCode,
          email: data.email,
          full_name: `${data.firstName} ${data.lastName}`,
          phone: data.phone || null,
          department_id: data.departmentId || null,
          position_id: data.positionId || null,
          hire_date: data.hireDate,
          role: data.role,
          is_active: true
        });

      if (error) {
        console.error('❌ Error creando empleado:', error);
        return false;
      }

      console.log('✅ Empleado creado exitosamente');
      return true;
    } catch (error) {
      console.error('💥 Error en createEmployee:', error);
      return false;
    }
  }

  /**
   * Actualizar empleado
   */
  async updateEmployee(id: string, data: Partial<EmployeeFormData>): Promise<boolean> {
    try {
      const supabase = createSupabaseClient();
      
      console.log('🔄 Actualizando empleado:', id);
      
      const updateData: Record<string, string | null | boolean> = {};
      
      if (data.employeeCode) updateData.employee_code = data.employeeCode;
      if (data.email) updateData.email = data.email;
      if (data.firstName || data.lastName) {
        updateData.full_name = `${data.firstName || ''} ${data.lastName || ''}`.trim();
      }
      if (data.phone !== undefined) updateData.phone = data.phone || null;
      if (data.departmentId !== undefined) updateData.department_id = data.departmentId || null;
      if (data.positionId !== undefined) updateData.position_id = data.positionId || null;
      if (data.hireDate) updateData.hire_date = data.hireDate;
      if (data.role) updateData.role = data.role;

      const { error } = await supabase
        .from('employees')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('❌ Error actualizando empleado:', error);
        return false;
      }

      console.log('✅ Empleado actualizado exitosamente');
      return true;
    } catch (error) {
      console.error('💥 Error en updateEmployee:', error);
      return false;
    }
  }

  /**
   * ELIMINAR EMPLEADO - LIMPIO Y SIMPLE
   */
  async deleteEmployee(id: string): Promise<boolean> {
    try {
      const supabase = createSupabaseClient();
      
      console.log('🗑️ Eliminando empleado:', id);
      
      // Eliminar directamente (RLS se encarga de los permisos)
      const { error, data } = await supabase
        .from('employees')
        .delete()
        .eq('id', id)
        .select();

      if (error) {
        console.error('❌ Error eliminando empleado:', error);
        return false;
      }

      if (!data || data.length === 0) {
        console.error('❌ No se eliminó ningún empleado (posible problema de permisos)');
        return false;
      }

      console.log('✅ Empleado eliminado exitosamente:', data);
      return true;
    } catch (error) {
      console.error('💥 Error en deleteEmployee:', error);
      return false;
    }
  }

  /**
   * Activar empleado
   */
  async activateEmployee(id: string): Promise<boolean> {
    try {
      const supabase = createSupabaseClient();
      
      const { error } = await supabase
        .from('employees')
        .update({ is_active: true })
        .eq('id', id);

      if (error) {
        console.error('❌ Error activando empleado:', error);
        return false;
      }

      console.log('✅ Empleado activado exitosamente');
      return true;
    } catch (error) {
      console.error('💥 Error en activateEmployee:', error);
      return false;
    }
  }

  /**
   * Desactivar empleado
   */
  async deactivateEmployee(id: string): Promise<boolean> {
    try {
      const supabase = createSupabaseClient();
      
      const { error } = await supabase
        .from('employees')
        .update({ is_active: false })
        .eq('id', id);

      if (error) {
        console.error('❌ Error desactivando empleado:', error);
        return false;
      }

      console.log('✅ Empleado desactivado exitosamente');
      return true;
    } catch (error) {
      console.error('💥 Error en deactivateEmployee:', error);
      return false;
    }
  }
}

// Instancia única del servicio
export const employeeService = new EmployeeServiceImpl();
