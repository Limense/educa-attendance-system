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
   * Crear empleado usando Supabase Auth + trigger automático
   * 
   * Principios aplicados:
   * - Single Responsibility: Auth maneja usuarios, trigger maneja empleados
   * - Open/Closed: Extensible para nuevos campos sin modificar lógica base
   * - Dependency Inversion: Delega creación a Supabase Auth
   * 
   * @param data - Datos del formulario validados
   * @returns Promise<boolean> - true si fue exitoso, lanza error si falla
   */
  async createEmployee(data: EmployeeFormData & { organizationId: string }): Promise<boolean> {
    try {
      // Validación básica en frontend
      this.validateEmployeeData(data);

      // Llamar al API route seguro para crear empleado
      const response = await fetch('/api/employee/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Error creando usuario');
      }

      // Esperar trigger si es necesario (opcional)
      // await this.waitForTriggerExecution(result.user.id);

      // Actualizar campos específicos si lo requieres
      // await this.updateEmployeeSpecificFields(...)

      console.log('✅ Empleado creado exitosamente vía API route');
      return true;
    } catch (error) {
      console.error('💥 Error en createEmployee:', error);
      throw error;
    }
  }

  /**
   * Verificar duplicados en auth.users aplicando principio DRY
   * 
   * @private
   * @param supabase - Cliente de Supabase tipado
   * @param data - Datos del empleado
   * @throws Error si encuentra duplicados
   */
  private async checkAuthUserDuplicates(
    supabase: ReturnType<typeof createSupabaseClient>, 
    data: EmployeeFormData & { organizationId: string }
  ): Promise<void> {
    // Verificar en auth.users directamente
    const { data: existingUsers, error: checkError } = await supabase.auth.admin.listUsers();

    if (checkError) {
      console.error('❌ Error verificando usuarios existentes:', checkError);
      throw new Error('Error verificando duplicados de usuario');
    }

    const emailExists = existingUsers.users.some(
      user => user.email?.toLowerCase() === data.email.toLowerCase()
    );

    if (emailExists) {
      console.error('❌ Email ya existe en Auth:', data.email);
      throw new Error('El email ya está registrado en el sistema');
    }
  }

  /**
   * Esperar a que el trigger procese la creación del empleado
   * 
   * @private
   * @param userId - ID del usuario creado
   */
  private async waitForTriggerExecution(userId: string): Promise<void> {
    const supabase = createSupabaseClient();
    let attempts = 0;
    const maxAttempts = 10;
    const delayMs = 500;

    while (attempts < maxAttempts) {
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('id', userId)
        .single();

      if (employee) {
        console.log('✅ Trigger ejecutado correctamente');
        return;
      }

      attempts++;
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    console.warn('⚠️ Trigger tardó más de lo esperado, continuando...');
  }

  /**
   * Actualizar campos específicos del empleado que el trigger no maneja
   * 
   * @private
   * @param supabase - Cliente de Supabase
   * @param userId - ID del usuario/empleado
   * @param data - Datos del formulario
   */
  private async updateEmployeeSpecificFields(
    supabase: ReturnType<typeof createSupabaseClient>,
    userId: string,
    data: EmployeeFormData & { organizationId: string }
  ): Promise<void> {
    const updateData: Record<string, string | null> = {};

    if (data.employeeCode) updateData.employee_code = data.employeeCode;
    if (data.departmentId) updateData.department_id = data.departmentId;
    if (data.positionId) updateData.position_id = data.positionId;
    if (data.phone) updateData.phone = data.phone.trim();

    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase
        .from('employees')
        .update(updateData)
        .eq('id', userId);

      if (error) {
        console.warn('⚠️ Error actualizando campos específicos:', error);
        // No fallar por esto, el empleado ya fue creado
      }
    }
  }

  /**
   * Manejar errores específicos de Supabase Auth aplicando principio Open/Closed
   * 
   * @private
   * @param error - Error de Supabase Auth
   * @throws Error con mensaje específico según el tipo de error
   */
  private handleAuthError(error: { message: string; status?: number }): never {
    const message = error.message.toLowerCase();

    if (message.includes('already registered') || message.includes('already exists')) {
      throw new Error('El email ya está registrado en el sistema');
    }
    
    if (message.includes('invalid email')) {
      throw new Error('El formato del email no es válido');
    }
    
    if (message.includes('password') && message.includes('weak')) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }
    
    if (message.includes('rate limit')) {
      throw new Error('Demasiados intentos. Intente nuevamente en unos minutos');
    }

    throw new Error(`Error de autenticación: ${error.message}`);
  }

  /**
   * Validar datos del empleado aplicando principio Single Responsibility
   * 
   * @private
   * @param data - Datos a validar
   * @throws Error si faltan campos requeridos
   */
  private validateEmployeeData(data: EmployeeFormData & { organizationId: string }): void {
    const requiredFields = {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      hireDate: data.hireDate,
      role: data.role,
      organizationId: data.organizationId
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      console.error('❌ Campos requeridos faltantes:', missingFields);
      throw new Error(`Faltan campos requeridos: ${missingFields.join(', ')}`);
    }
  }

  /**
   * Verificar duplicados aplicando principio DRY (Don't Repeat Yourself)
   * 
   * @private
   * @param supabase - Cliente de Supabase tipado
   * @param data - Datos del empleado
   * @throws Error si encuentra duplicados
   */
  private async checkForDuplicates(
    supabase: ReturnType<typeof createSupabaseClient>, 
    data: EmployeeFormData & { organizationId: string }
  ): Promise<void> {
    // Verificar email duplicado en la misma organización
    const { data: existingEmployee, error: checkError } = await supabase
      .from('employees')
      .select('email')
      .eq('organization_id', data.organizationId)
      .eq('email', data.email.toLowerCase())
      .eq('is_active', true)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('❌ Error verificando email existente:', checkError);
      throw new Error('Error verificando duplicados de email');
    }

    if (existingEmployee) {
      console.error('❌ Email ya existe:', data.email);
      throw new Error('El email ya está en uso por otro empleado activo');
    }
  }

  /**
   * Manejar errores específicos de base de datos aplicando principio Open/Closed
   * 
   * @private
   * @param error - Error de Supabase tipado
   * @throws Error con mensaje específico según el tipo de error
   */
  private handleDatabaseError(error: { code: string; message: string }): never {
    // Manejar errores específicos de PostgreSQL
    switch (error.code) {
      case '23505': // Violación de restricción única
        if (error.message.includes('email')) {
          throw new Error('El email ya está registrado en el sistema');
        }
        if (error.message.includes('employee_code')) {
          throw new Error('El código de empleado ya está en uso');
        }
        throw new Error('Ya existe un empleado con esos datos');
      
      case '23503': // Violación de clave foránea
        if (error.message.includes('department_id')) {
          throw new Error('El departamento seleccionado no existe');
        }
        if (error.message.includes('position_id')) {
          throw new Error('La posición seleccionada no existe');
        }
        if (error.message.includes('organization_id')) {
          throw new Error('La organización no existe');
        }
        throw new Error('Error de referencia en los datos');
      
      case '23514': // Violación de restricción check
        if (error.message.includes('role')) {
          throw new Error('El rol especificado no es válido');
        }
        throw new Error('Los datos no cumplen con las restricciones del sistema');
      
      default:
        throw new Error(`Error de base de datos: ${error.message}`);
    }
  }

  /**
   * Actualizar empleado aplicando principios SOLID
   * 
   * Principios aplicados:
   * - Single Responsibility: Función específica para actualizar empleados
   * - Open/Closed: Extensible para nuevos campos sin modificar lógica base
   * - Liskov Substitution: Maneja datos parciales correctamente
   * 
   * @param id - ID del empleado a actualizar
   * @param data - Datos parciales a actualizar
   * @returns Promise<boolean> - true si fue exitoso, lanza error si falla
   */
  async updateEmployee(id: string, data: Partial<EmployeeFormData>): Promise<boolean> {
    try {
      const supabase = createSupabaseClient();
      
      console.log('🔄 Actualizando empleado con validaciones:', { id, fieldsToUpdate: Object.keys(data) });
      
      // Preparar datos de actualización (sin full_name ya que es generada automáticamente)
      const updateData: Record<string, string | null | boolean> = {};
      
      // Mapear campos individuales respetando la estructura de BD
      if (data.employeeCode !== undefined) updateData.employee_code = data.employeeCode || null;
      if (data.email) updateData.email = data.email.toLowerCase().trim();
      if (data.firstName) updateData.first_name = data.firstName.trim(); // Campo individual
      if (data.lastName) updateData.last_name = data.lastName.trim();   // Campo individual
      if (data.phone !== undefined) updateData.phone = data.phone?.trim() || null;
      if (data.departmentId !== undefined) updateData.department_id = data.departmentId || null;
      if (data.positionId !== undefined) updateData.position_id = data.positionId || null;
      if (data.hireDate) updateData.hire_date = data.hireDate;
      if (data.role) updateData.role = data.role;

      // Aplicar principio de early return si no hay cambios
      if (Object.keys(updateData).length === 0) {
        console.log('ℹ️ No hay campos para actualizar');
        return true;
      }

      const { error } = await supabase
        .from('employees')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('❌ Error actualizando empleado:', error);
        this.handleDatabaseError(error);
      }

      console.log('✅ Empleado actualizado exitosamente');
      return true;
    } catch (error) {
      console.error('💥 Error en updateEmployee:', error);
      throw error; // Re-lanzar para manejo en capas superiores
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
