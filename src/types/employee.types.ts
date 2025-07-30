/**
 * =============================================
 * TIPOS ESPECÍFICOS PARA EMPLEADOS
 * =============================================
 * 
 * Descripción: Tipos TypeScript específicos para el módulo de empleados
 * Complementa los tipos base de database.ts
 */

/**
 * Empleado con relaciones completas para mostrar en UI
 */
export interface EmployeeWithRelations {
  id: string;
  organization_id: string;
  employee_code: string;
  full_name: string;
  email: string;
  phone?: string;
  department_id?: string;
  position_id?: string;
  hire_date: string;
  role: string;
  status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Relaciones expandidas
  department?: {
    id: string;
    name: string;
    description?: string;
  };
  position?: {
    id: string;
    title: string;
    description?: string;
    department_id: string;
  };
  organization?: {
    id: string;
    name: string;
  };
}

/**
 * Formulario para crear empleado
 */
export interface EmployeeFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  employeeCode: string;
  departmentId: string;
  positionId: string;
  hireDate: string;
  role: string;
  password: string;
  sendWelcomeEmail: boolean;
}

/**
 * Datos para tabla de empleados
 */
export interface EmployeeTableData {
  id: string;
  fullName: string; // Campo calculado de la DB
  email: string;
  phone?: string;
  employeeCode: string;
  department?: string;
  position?: string;
  role: string;
  status: string;
  hireDate: string;
  isActive: boolean;
  lastAttendance?: string;
}

/**
 * Opciones de filtro para empleados
 */
export interface EmployeeFilterOptions {
  departments: Array<{ id: string; name: string }>;
  positions: Array<{ id: string; title: string }>;
  roles: Array<{ value: string; label: string }>;
  statuses: Array<{ value: string; label: string }>;
}

/**
 * Estado del hook de empleados
 */
export interface EmployeeManagementState {
  employees: EmployeeTableData[];
  selectedEmployee: EmployeeWithRelations | null;
  loading: boolean;
  error: string | null;
  filters: EmployeeSearchFilters;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
  filterOptions: EmployeeFilterOptions;
}

/**
 * Filtros de búsqueda para empleados
 */
export interface EmployeeSearchFilters {
  search?: string;
  departmentId?: string;
  positionId?: string;
  role?: string;
  status?: string;
  isActive?: boolean;
  hiredAfter?: string;
  hiredBefore?: string;
}

/**
 * Acciones para gestión de empleados
 */
export interface EmployeeManagementActions {
  loadEmployees: () => Promise<void>;
  createEmployee: (data: EmployeeFormData) => Promise<boolean>;
  updateEmployee: (id: string, data: Partial<EmployeeFormData>) => Promise<boolean>;
  deleteEmployee: (id: string) => Promise<boolean>;
  activateEmployee: (id: string) => Promise<boolean>;
  deactivateEmployee: (id: string) => Promise<boolean>;
  selectEmployee: (employee: EmployeeWithRelations | null) => void;
  updateFilters: (filters: Partial<EmployeeSearchFilters>) => void;
  changePage: (page: number) => void;
  resetFilters: () => void;
}

/**
 * Props para componentes de empleados
 */
export interface EmployeeListProps {
  employees: EmployeeTableData[];
  loading: boolean;
  onEdit: (employee: EmployeeTableData) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, isActive: boolean) => void;
  onView: (employee: EmployeeTableData) => void;
}

export interface EmployeeFormProps {
  employee?: EmployeeWithRelations;
  onSubmit: (data: EmployeeFormData) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  filterOptions: EmployeeFilterOptions;
}

export interface EmployeeFiltersProps {
  filters: EmployeeSearchFilters;
  filterOptions: EmployeeFilterOptions;
  onFiltersChange: (filters: Partial<EmployeeSearchFilters>) => void;
  onReset: () => void;
}

export interface EmployeeCardProps {
  employee: EmployeeWithRelations;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
}

/**
 * Tipos para modales y diálogos
 */
export interface EmployeeModalState {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'view';
  employee?: EmployeeWithRelations;
}

export interface EmployeeDeleteDialogState {
  isOpen: boolean;
  employee?: EmployeeTableData;
}

/**
 * Constantes para empleados
 */
export const EMPLOYEE_ROLES = [
  { value: 'employee', label: 'Empleado' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'manager', label: 'Gerente' },
  { value: 'admin', label: 'Administrador' },
  { value: 'super_admin', label: 'Super Administrador' }
] as const;

export const EMPLOYEE_STATUSES = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
  { value: 'suspended', label: 'Suspendido' },
  { value: 'terminated', label: 'Terminado' },
  { value: 'on_leave', label: 'En Licencia' }
] as const;

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;
