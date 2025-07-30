/**
 * =============================================
 * HOOK PARA GESTIÓN DE EMPLEADOS
 * =============================================
 * 
 * Descripción: Hook personalizado que encapsula toda la lógica de gestión de empleados
 * Utiliza los servicios implementados con arquitectura escalable
 * 
 * Principios aplicados:
 * - Separation of Concerns - Separa lógica de UI
 * - Single Responsibility - Solo maneja estado de empleados
 * - Dependency Injection - Recibe servicios como dependencias
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  EmployeeServiceFactory,
  type IEmployeeService,
  type EmployeeCreationRequest,
  type EmployeeUpdateRequest,
  type EmployeeSearchFilters as ServiceFilters,
  EmployeeRole
} from '@/services/employee.service';
import { 
  EmployeeManagementState,
  EmployeeManagementActions,
  EmployeeFormData,
  EmployeeTableData,
  EmployeeWithRelations,
  EmployeeSearchFilters,
  DEFAULT_PAGE_SIZE,
  EMPLOYEE_ROLES,
  EMPLOYEE_STATUSES
} from '@/types/employee.types';
import { Logger, generateRequestId } from '@/utils/logger';

/**
 * Configuración del hook
 */
interface UseEmployeeManagementConfig {
  organizationId: string;
  autoLoad?: boolean;
  pageSize?: number;
}

/**
 * Resultado del hook
 */
interface UseEmployeeManagementResult {
  state: EmployeeManagementState;
  actions: EmployeeManagementActions;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook principal para gestión de empleados
 * 
 * @param config - Configuración del hook
 * @returns Estado y acciones para gestión de empleados
 * 
 * @example
 * ```typescript
 * const { state, actions, isLoading, error } = useEmployeeManagement({
 *   organizationId: '550e8400-e29b-41d4-a716-446655440000',
 *   autoLoad: true
 * });
 * ```
 */
export function useEmployeeManagement(config: UseEmployeeManagementConfig): UseEmployeeManagementResult {
  const { organizationId, autoLoad = true, pageSize = DEFAULT_PAGE_SIZE } = config;
  
  // Logger para debugging
  const logger = useMemo(() => {
    const requestId = generateRequestId();
    return new Logger('useEmployeeManagement').withRequest(requestId, undefined, organizationId);
  }, [organizationId]);

  // Estado principal
  const [state, setState] = useState<EmployeeManagementState>({
    employees: [],
    selectedEmployee: null,
    loading: false,
    error: null,
    filters: {},
    pagination: {
      page: 1,
      pageSize,
      total: 0,
      hasMore: false
    },
    filterOptions: {
      departments: [],
      positions: [],
      roles: EMPLOYEE_ROLES.map(r => ({ value: r.value, label: r.label })),
      statuses: EMPLOYEE_STATUSES.map(s => ({ value: s.value, label: s.label }))
    }
  });

  // Servicio de empleados
  const [employeeService, setEmployeeService] = useState<IEmployeeService | null>(null);

  /**
   * Inicializar el servicio de empleados
   */
  useEffect(() => {
    const initializeService = async () => {
      try {
        logger.debug('Inicializando servicio de empleados');
        const service = await EmployeeServiceFactory.create();
        setEmployeeService(service);
        
        if (autoLoad) {
          logger.debug('Carga automática habilitada, cargando empleados');
          // Usar función local para evitar dependencias
          await loadEmployeesInternal(service, {}, 1, pageSize);
        }
      } catch (error) {
        logger.error('Error inicializando servicio de empleados', error as Error);
        setState(prev => ({
          ...prev,
          error: 'Error inicializando el sistema de empleados',
          loading: false
        }));
      }
    };

    initializeService();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, autoLoad, pageSize]);

  /**
   * Cargar empleados desde el servicio
   */
  const loadEmployeesInternal = useCallback(async (
    service: IEmployeeService,
    filters: EmployeeSearchFilters,
    page: number,
    size: number
  ) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      logger.debug('Cargando empleados', { filters, page, size });

      // Convertir filtros del hook a filtros del servicio
      const serviceFilters: ServiceFilters = {
        organizationId,
        searchTerm: filters.search,
        departmentId: filters.departmentId,
        positionId: filters.positionId,
        role: filters.role,
        status: filters.status,
        isActive: filters.isActive,
        limit: size,
        offset: (page - 1) * size,
        orderBy: 'created_at',
        orderDirection: 'desc'
      };

      const result = await service.getEmployeesList(serviceFilters);
      
      // Convertir empleados del servicio a formato de tabla
      const tableEmployees: EmployeeTableData[] = result.employees.map(emp => ({
        id: emp.id,
        fullName: emp.full_name,
        email: emp.email,
        employeeCode: emp.employee_code,
        department: emp.department?.name,
        position: emp.position?.title,
        role: emp.role,
        status: emp.status,
        hireDate: emp.hire_date,
        isActive: emp.is_active
      }));

      setState(prev => ({
        ...prev,
        employees: tableEmployees,
        pagination: {
          page: result.page,
          pageSize: result.pageSize,
          total: result.total,
          hasMore: result.hasMore
        },
        loading: false
      }));

      logger.info('Empleados cargados exitosamente', {
        count: tableEmployees.length,
        total: result.total
      });

    } catch (error) {
      logger.error('Error cargando empleados', error as Error);
      setState(prev => ({
        ...prev,
        error: 'Error cargando la lista de empleados',
        loading: false
      }));
    }
  }, [organizationId, logger]);

  /**
   * Cargar empleados (acción pública)
   */
  const loadEmployees = useCallback(async () => {
    if (!employeeService) {
      logger.warn('Servicio de empleados no inicializado');
      return;
    }

    await loadEmployeesInternal(
      employeeService,
      state.filters,
      state.pagination.page,
      state.pagination.pageSize
    );
  }, [employeeService, state.filters, state.pagination.page, state.pagination.pageSize, logger, loadEmployeesInternal]);

  /**
   * Crear un nuevo empleado
   */
  const createEmployee = useCallback(async (data: EmployeeFormData): Promise<boolean> => {
    if (!employeeService) {
      logger.error('Servicio de empleados no disponible');
      return false;
    }

    try {
      logger.info('Creando nuevo empleado', { email: data.email });

      const request: EmployeeCreationRequest = {
        organizationId,
        employeeCode: data.employeeCode,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        departmentId: data.departmentId,
        positionId: data.positionId,
        hireDate: data.hireDate,
        role: data.role as EmployeeRole,
        sendWelcomeEmail: data.sendWelcomeEmail
      };

      const result = await employeeService.createEmployee(request);

      if (result.success) {
        logger.info('Empleado creado exitosamente', { employeeId: result.employee?.id });
        // Recargar la lista
        await loadEmployees();
        return true;
      } else {
        logger.warn('Error creando empleado', { error: result.error });
        setState(prev => ({
          ...prev,
          error: result.error || 'Error creando empleado'
        }));
        return false;
      }

    } catch (error) {
      logger.error('Error creando empleado', error as Error);
      setState(prev => ({
        ...prev,
        error: 'Error interno creando empleado'
      }));
      return false;
    }
  }, [employeeService, organizationId, loadEmployees, logger]);

  /**
   * Actualizar un empleado existente
   */
  const updateEmployee = useCallback(async (id: string, data: Partial<EmployeeFormData>): Promise<boolean> => {
    if (!employeeService) {
      logger.error('Servicio de empleados no disponible');
      return false;
    }

    try {
      logger.info('Actualizando empleado', { employeeId: id });

      const request: EmployeeUpdateRequest = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        departmentId: data.departmentId,
        positionId: data.positionId,
        role: data.role as EmployeeRole
      };

      const result = await employeeService.updateEmployee(id, request);

      if (result.success) {
        logger.info('Empleado actualizado exitosamente', { employeeId: id });
        // Recargar la lista
        await loadEmployees();
        return true;
      } else {
        logger.warn('Error actualizando empleado', { error: result.error });
        setState(prev => ({
          ...prev,
          error: result.error || 'Error actualizando empleado'
        }));
        return false;
      }

    } catch (error) {
      logger.error('Error actualizando empleado', error as Error);
      setState(prev => ({
        ...prev,
        error: 'Error interno actualizando empleado'
      }));
      return false;
    }
  }, [employeeService, loadEmployees, logger]);

  /**
   * Eliminar un empleado
   */
  const deleteEmployee = useCallback(async (id: string): Promise<boolean> => {
    if (!employeeService) {
      logger.error('Servicio de empleados no disponible');
      return false;
    }

    try {
      logger.info('Eliminando empleado', { employeeId: id });

      const result = await employeeService.deleteEmployee(id);

      if (result.success) {
        logger.info('Empleado eliminado exitosamente', { employeeId: id });
        // Recargar la lista
        await loadEmployees();
        return true;
      } else {
        logger.warn('Error eliminando empleado', { error: result.error });
        setState(prev => ({
          ...prev,
          error: result.error || 'Error eliminando empleado'
        }));
        return false;
      }

    } catch (error) {
      logger.error('Error eliminando empleado', error as Error);
      setState(prev => ({
        ...prev,
        error: 'Error interno eliminando empleado'
      }));
      return false;
    }
  }, [employeeService, loadEmployees, logger]);

  /**
   * Activar un empleado
   */
  const activateEmployee = useCallback(async (id: string): Promise<boolean> => {
    if (!employeeService) return false;

    try {
      const result = await employeeService.activateEmployee(id);
      if (result.success) {
        await loadEmployees();
        return true;
      } else {
        setState(prev => ({ ...prev, error: result.error || 'Error activando empleado' }));
        return false;
      }
    } catch (error) {
      logger.error('Error activando empleado', error as Error);
      return false;
    }
  }, [employeeService, loadEmployees, logger]);

  /**
   * Desactivar un empleado
   */
  const deactivateEmployee = useCallback(async (id: string): Promise<boolean> => {
    if (!employeeService) return false;

    try {
      const result = await employeeService.deactivateEmployee(id);
      if (result.success) {
        await loadEmployees();
        return true;
      } else {
        setState(prev => ({ ...prev, error: result.error || 'Error desactivando empleado' }));
        return false;
      }
    } catch (error) {
      logger.error('Error desactivando empleado', error as Error);
      return false;
    }
  }, [employeeService, loadEmployees, logger]);

  /**
   * Seleccionar un empleado
   */
  const selectEmployee = useCallback((employee: EmployeeWithRelations | null) => {
    setState(prev => ({ ...prev, selectedEmployee: employee }));
  }, []);

  /**
   * Actualizar filtros
   */
  const updateFilters = useCallback((filters: Partial<EmployeeSearchFilters>) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...filters },
      pagination: { ...prev.pagination, page: 1 } // Reset a página 1
    }));
  }, []);

  /**
   * Cambiar página
   */
  const changePage = useCallback((page: number) => {
    setState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, page }
    }));
  }, []);

  /**
   * Resetear filtros
   */
  const resetFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      filters: {},
      pagination: { ...prev.pagination, page: 1 }
    }));
  }, []);

  // Efecto para recargar cuando cambien filtros o página
  useEffect(() => {
    if (employeeService) {
      loadEmployees();
    }
  }, [state.filters, state.pagination.page, employeeService, loadEmployees]);

  // Acciones memoizadas
  const actions = useMemo<EmployeeManagementActions>(() => ({
    loadEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    activateEmployee,
    deactivateEmployee,
    selectEmployee,
    updateFilters,
    changePage,
    resetFilters
  }), [
    loadEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    activateEmployee,
    deactivateEmployee,
    selectEmployee,
    updateFilters,
    changePage,
    resetFilters
  ]);

  return {
    state,
    actions,
    isLoading: state.loading,
    error: state.error
  };
}

/**
 * Hook simplificado para casos básicos
 */
export function useEmployeeList(organizationId: string) {
  const { state, actions, isLoading, error } = useEmployeeManagement({
    organizationId,
    autoLoad: true
  });

  return {
    employees: state.employees,
    loading: isLoading,
    error,
    loadEmployees: actions.loadEmployees,
    deleteEmployee: actions.deleteEmployee,
    toggleEmployeeStatus: async (id: string, isActive: boolean) => {
      return isActive ? actions.activateEmployee(id) : actions.deactivateEmployee(id);
    }
  };
}

/**
 * Hook para formulario de empleado
 */
export function useEmployeeForm(organizationId: string, employeeId?: string) {
  const { actions } = useEmployeeManagement({
    organizationId,
    autoLoad: false
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitEmployee = async (data: EmployeeFormData): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      let success: boolean;

      if (employeeId) {
        // Actualizar empleado existente
        success = await actions.updateEmployee(employeeId, data);
      } else {
        // Crear nuevo empleado
        success = await actions.createEmployee(data);
      }

      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    submitEmployee,
    loading,
    error,
    clearError: () => setError(null)
  };
}

export default useEmployeeManagement;
