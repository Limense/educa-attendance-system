/**
 * =============================================
 * REPOSITORY PATTERN - EMPLOYEE REPOSITORY
 * =============================================
 * 
 * Descripción: Implementa el patrón Repository para operaciones CRUD de empleados
 * 
 * Principios SOLID aplicados:
 * - S: Single Responsibility - Solo maneja operaciones de empleados
 * - O: Open/Closed - Extensible para nuevas operaciones
 * - L: Liskov Substitution - Implementa BaseRepository
 * - I: Interface Segregation - Interface específica para empleados
 * - D: Dependency Inversion - Depende de abstracciones
 * 
 * Patrones de diseño:
 * - Repository Pattern - Abstrae acceso a datos
 * - Query Object Pattern - Para filtros complejos
 * - Specification Pattern - Para criterios de búsqueda
 */

import { createSupabaseClient } from '@/lib/supabase/client';
import { Employee, Organization, Department, Position } from '@/types/database';
import { Logger } from '@/utils/logger';

/**
 * Interface que define las operaciones disponibles para empleados
 * Implementa Interface Segregation Principle
 */
export interface IEmployeeRepository {
  // Operaciones básicas CRUD
  findById(id: string): Promise<Employee | null>;
  findByEmail(email: string): Promise<Employee | null>;
  findAll(filters?: EmployeeFilters): Promise<Employee[]>;
  create(employeeData: CreateEmployeeData): Promise<Employee>;
  update(id: string, data: UpdateEmployeeData): Promise<Employee>;
  delete(id: string): Promise<boolean>;
  
  // Operaciones específicas del dominio
  findByDepartment(departmentId: string): Promise<Employee[]>;
  findByRole(role: string): Promise<Employee[]>;
  findActiveEmployees(organizationId: string): Promise<Employee[]>;
  searchByName(name: string, organizationId: string): Promise<Employee[]>;
  
  // Operaciones con relaciones
  findWithDepartment(id: string): Promise<EmployeeWithRelations | null>;
  findWithAllRelations(id: string): Promise<EmployeeWithRelations | null>;
  
  // Operaciones de validación
  isEmailUnique(email: string, excludeId?: string): Promise<boolean>;
  isEmployeeCodeUnique(code: string, organizationId: string, excludeId?: string): Promise<boolean>;
}

/**
 * Filtros para consultas de empleados
 * Implementa Query Object Pattern
 */
export interface EmployeeFilters {
  organizationId?: string;
  departmentId?: string;
  positionId?: string;
  role?: string;
  status?: string;
  isActive?: boolean;
  searchTerm?: string;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

/**
 * Datos para crear un nuevo empleado
 */
export interface CreateEmployeeData {
  organization_id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  department_id?: string;
  position_id?: string;
  hire_date: string;
  role: string;
  status: string;
}

/**
 * Datos para actualizar un empleado existente
 */
export interface UpdateEmployeeData {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  department_id?: string;
  position_id?: string;
  status?: string;
  role?: string;
  is_active?: boolean;
}

/**
 * Empleado con relaciones incluidas
 */
export interface EmployeeWithRelations extends Employee {
  organization?: Organization;
  department?: Department;
  position?: Position;
}

/**
 * Implementación concreta del repositorio de empleados
 * Utiliza Supabase como fuente de datos
 */
export class EmployeeRepository implements IEmployeeRepository {
  private logger: Logger;
  private readonly tableName = 'employees';

  constructor(logger: Logger = new Logger('EmployeeRepository')) {
    this.logger = logger;
  }

  /**
   * Busca un empleado por su ID
   * 
   * @param id - ID único del empleado
   * @returns Promise<Employee | null> - Empleado encontrado o null
   * 
   * @example
   * ```typescript
   * const repository = new EmployeeRepository();
   * const employee = await repository.findById('123e4567-e89b-12d3-a456-426614174000');
   * ```
   */
  async findById(id: string): Promise<Employee | null> {
    try {
      this.logger.debug('Buscando empleado por ID', { id });

      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        throw error;
      }

      this.logger.debug('Empleado encontrado', { id, name: data.full_name });
      return data as Employee;

    } catch (error) {
      this.logger.error('Error buscando empleado por ID', { id, error });
      throw new Error(`Error buscando empleado: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Busca un empleado por su email
   * 
   * @param email - Email del empleado
   * @returns Promise<Employee | null> - Empleado encontrado o null
   */
  async findByEmail(email: string): Promise<Employee | null> {
    try {
      this.logger.debug('Buscando empleado por email', { email });

      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      this.logger.debug('Empleado encontrado por email', { email, id: data.id });
      return data as Employee;

    } catch (error) {
      this.logger.error('Error buscando empleado por email', { email, error });
      throw new Error(`Error buscando empleado: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Obtiene todos los empleados con filtros opcionales
   * 
   * @param filters - Filtros para la consulta
   * @returns Promise<Employee[]> - Lista de empleados
   */
  async findAll(filters: EmployeeFilters = {}): Promise<Employee[]> {
    try {
      this.logger.debug('Obteniendo empleados con filtros', { filters });

      const supabase = createSupabaseClient();
      let query = supabase.from(this.tableName).select('*');

      // Aplicar filtros
      if (filters.organizationId) {
        query = query.eq('organization_id', filters.organizationId);
      }

      if (filters.departmentId) {
        query = query.eq('department_id', filters.departmentId);
      }

      if (filters.positionId) {
        query = query.eq('position_id', filters.positionId);
      }

      if (filters.role) {
        query = query.eq('role', filters.role);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }

      if (filters.searchTerm) {
        query = query.or(`full_name.ilike.%${filters.searchTerm}%,email.ilike.%${filters.searchTerm}%`);
      }

      // Ordenamiento
      const orderBy = filters.orderBy || 'full_name';
      const orderDirection = filters.orderDirection || 'asc';
      query = query.order(orderBy, { ascending: orderDirection === 'asc' });

      // Paginación
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 100) - 1);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      this.logger.debug('Empleados obtenidos', { count: data?.length || 0 });
      return (data as Employee[]) || [];

    } catch (error) {
      this.logger.error('Error obteniendo empleados', { filters, error });
      throw new Error(`Error obteniendo empleados: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Crea un nuevo empleado
   * 
   * @param employeeData - Datos del nuevo empleado
   * @returns Promise<Employee> - Empleado creado
   */
  async create(employeeData: CreateEmployeeData): Promise<Employee> {
    try {
      this.logger.info('Creando nuevo empleado', { email: employeeData.email });

      // Validaciones previas
      await this.validateCreateData(employeeData);

      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from(this.tableName)
        .insert({
          ...employeeData,
          email: employeeData.email.toLowerCase(),
          is_active: true
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      this.logger.info('Empleado creado exitosamente', { id: data.id, email: data.email });
      return data as Employee;

    } catch (error) {
      this.logger.error('Error creando empleado', { email: employeeData.email, error });
      throw new Error(`Error creando empleado: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Actualiza un empleado existente
   * 
   * @param id - ID del empleado a actualizar
   * @param data - Datos a actualizar
   * @returns Promise<Employee> - Empleado actualizado
   */
  async update(id: string, data: UpdateEmployeeData): Promise<Employee> {
    try {
      this.logger.info('Actualizando empleado', { id });

      const supabase = createSupabaseClient();
      const updateData = {
        ...data,
        ...(data.email && { email: data.email.toLowerCase() }),
        updated_at: new Date().toISOString()
      };

      const { data: updatedData, error } = await supabase
        .from(this.tableName)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      this.logger.info('Empleado actualizado exitosamente', { id });
      return updatedData as Employee;

    } catch (error) {
      this.logger.error('Error actualizando empleado', { id, error });
      throw new Error(`Error actualizando empleado: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Elimina un empleado (soft delete)
   * 
   * @param id - ID del empleado a eliminar
   * @returns Promise<boolean> - true si se eliminó correctamente
   */
  async delete(id: string): Promise<boolean> {
    try {
      this.logger.info('Eliminando empleado', { id });

      const supabase = createSupabaseClient();
      const { error } = await supabase
        .from(this.tableName)
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        throw error;
      }

      this.logger.info('Empleado eliminado exitosamente', { id });
      return true;

    } catch (error) {
      this.logger.error('Error eliminando empleado', { id, error });
      return false;
    }
  }

  /**
   * Busca empleados por departamento
   */
  async findByDepartment(departmentId: string): Promise<Employee[]> {
    return this.findAll({ departmentId, isActive: true });
  }

  /**
   * Busca empleados por rol
   */
  async findByRole(role: string): Promise<Employee[]> {
    return this.findAll({ role, isActive: true });
  }

  /**
   * Busca empleados activos de una organización
   */
  async findActiveEmployees(organizationId: string): Promise<Employee[]> {
    return this.findAll({ organizationId, isActive: true, status: 'active' });
  }

  /**
   * Busca empleados por nombre
   */
  async searchByName(name: string, organizationId: string): Promise<Employee[]> {
    return this.findAll({ 
      searchTerm: name, 
      organizationId, 
      isActive: true 
    });
  }

  /**
   * Busca empleado con información del departamento
   */
  async findWithDepartment(id: string): Promise<EmployeeWithRelations | null> {
    try {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from(this.tableName)
        .select(`
          *,
          department:departments(*)
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data as EmployeeWithRelations;
    } catch (error) {
      this.logger.error('Error obteniendo empleado con departamento', { id, error });
      throw error;
    }
  }

  /**
   * Busca empleado con todas las relaciones
   */
  async findWithAllRelations(id: string): Promise<EmployeeWithRelations | null> {
    try {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from(this.tableName)
        .select(`
          *,
          department:departments(*),
          position:positions(*),
          organization:organizations(*)
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data as EmployeeWithRelations;
    } catch (error) {
      this.logger.error('Error obteniendo empleado con relaciones', { id, error });
      throw error;
    }
  }

  /**
   * Verifica si un email es único
   */
  async isEmailUnique(email: string, excludeId?: string): Promise<boolean> {
    try {
      const supabase = createSupabaseClient();
      let query = supabase
        .from(this.tableName)
        .select('id')
        .eq('email', email.toLowerCase())
        .eq('is_active', true);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return !data || data.length === 0;
    } catch (error) {
      this.logger.error('Error verificando unicidad de email', { email, error });
      return false;
    }
  }

  /**
   * Verifica si un código de empleado es único
   */
  async isEmployeeCodeUnique(code: string, organizationId: string, excludeId?: string): Promise<boolean> {
    try {
      const supabase = createSupabaseClient();
      let query = supabase
        .from(this.tableName)
        .select('id')
        .eq('employee_code', code)
        .eq('organization_id', organizationId)
        .eq('is_active', true);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return !data || data.length === 0;
    } catch (error) {
      this.logger.error('Error verificando unicidad de código', { code, error });
      return false;
    }
  }

  // =============================================
  // MÉTODOS PRIVADOS - VALIDACIONES
  // =============================================

  /**
   * Valida los datos antes de crear un empleado
   */
  private async validateCreateData(data: CreateEmployeeData): Promise<void> {
    // Validar email único
    const isEmailUnique = await this.isEmailUnique(data.email);
    if (!isEmailUnique) {
      throw new Error('El email ya está en uso por otro empleado');
    }

    // Validar código único
    const isCodeUnique = await this.isEmployeeCodeUnique(data.employee_code, data.organization_id);
    if (!isCodeUnique) {
      throw new Error('El código de empleado ya está en uso');
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new Error('Formato de email inválido');
    }

    // Validar que los nombres no estén vacíos
    if (!data.first_name.trim()) {
      throw new Error('El nombre es requerido');
    }
    if (!data.last_name.trim()) {
      throw new Error('El apellido es requerido');
    }
  }
}
