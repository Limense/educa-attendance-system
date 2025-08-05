// =============================================
// TIPOS TYPESCRIPT ESCALABLES - BASE DE DATOS
// Descripción: Definiciones de tipos que reflejan el esquema de DB
// Generado para: Educa Attendance System
// Nota: Estos tipos deben mantenerse sincronizados con la DB
// =============================================

/**
 * Tipos base para todas las entidades
 * Implementa patrón de auditoría escalable
 */
export interface BaseEntity {
  id: string
  created_at: string
  updated_at: string
}

// =============================================
// INTERFACES PARA AUTENTICACIÓN Y API
// =============================================

/**
 * Interface para credenciales de login
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Interface para respuesta de autenticación
 */
export interface AuthResponse {
  success: boolean;
  employee?: Employee;
  error?: string;
  redirectUrl?: string;
}

/**
 * Interface para respuestas de API
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

/**
 * Tipos para organizaciones (multi-tenancy)
 */
export interface Organization extends BaseEntity {
  name: string
  slug: string
  domain?: string
  timezone: string
  is_active: boolean
}

/**
 * Tipos para departamentos
 */
export interface Department extends BaseEntity {
  organization_id: string
  name: string
  code: string
  manager_id?: string
  is_active: boolean
  
  // Relaciones (populadas opcionalmente)
  organization?: Organization
  manager?: Employee
  employees?: Employee[]
}

/**
 * Tipos para posiciones/cargos
 */
export interface Position extends BaseEntity {
  organization_id: string
  title: string
  code: string
  department_id?: string
  level: number
  is_active: boolean
  
  // Relaciones
  organization?: Organization
  department?: Department
}

/**
 * Tipos para empleados
 * Incluye información completa y relaciones
 */
export interface Employee extends BaseEntity {
  organization_id: string
  employee_code: string
  email: string
  
  // Información personal
  first_name: string
  last_name: string
  full_name: string // Campo calculado
  phone?: string
  avatar_url?: string
  
  // Información laboral
  department_id?: string
  position_id?: string
  manager_id?: string
  hire_date: string
  termination_date?: string
  
  // Configuración
  work_schedule: WorkScheduleConfig
  salary_info?: Record<string, unknown> // JSONB encriptado
  
  // Estado y permisos
  is_active: boolean
  role: EmployeeRole
  permissions: string[]
  
  // Auditoría
  created_by?: string
  
  // Relaciones (populadas opcionalmente)
  organization?: Organization
  department?: Department
  position?: Position
  manager?: Employee
  subordinates?: Employee[]
  attendances?: Attendance[]
}

/**
 * Roles de empleados con escalabilidad
 */
export type EmployeeRole = 
  | 'employee'      // Empleado básico - solo su asistencia
  | 'admin'        // Administrador - panel completo y CRUD
  | 'super_admin'  // Super administrador - control total
  // Roles futuros (comentados por ahora):
  // | 'supervisor'   // Supervisor de área
  // | 'manager'      // Gerente de equipo
  // | 'hr'          // Recursos humanos

/**
 * Configuración de horario de trabajo
 */
export interface WorkScheduleConfig {
  hours_per_day: number
  days_per_week: number
  flexible_hours?: boolean
  start_time?: string
  end_time?: string
  break_duration?: number
}

// =============================================
// INTERFACES PARA AUTENTICACIÓN
// =============================================

/**
 * Credenciales de login
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Respuesta de autenticación
 */
export interface AuthResponse {
  user: Employee | null;
  token?: string;
  expiresAt?: string;
  refreshToken?: string;
}

/**
 * Estado de autenticación
 */
export interface AuthState {
  isAuthenticated: boolean;
  user: Employee | null;
  token?: string;
  loading: boolean;
  error?: string;
}

/**
 * Configuración de tipos de asistencia
 */
export interface AttendanceTypeConfig extends BaseEntity {
  organization_id: string
  code: string
  name: string
  description?: string
  is_active: boolean
}

/**
 * Políticas de trabajo
 */
export interface WorkPolicy extends BaseEntity {
  organization_id: string
  name: string
  start_time: string
  end_time: string
  break_duration: number
  late_threshold: number
  working_days: number
  allow_remote: boolean
  require_geolocation: boolean
  max_daily_hours: number
  is_active: boolean
}

/**
 * Registros de asistencia
 * Tabla principal del sistema
 */
export interface Attendance extends BaseEntity {
  organization_id: string
  employee_id: string
  attendance_date: string
  date: string // Alias para consultas
  check_in_time?: string
  check_out_time?: string
  
  // Cálculos automáticos
  work_hours?: number
  total_hours?: number
  regular_hours?: number
  break_duration: number
  overtime_hours: number
  
  // Estado y clasificación
  status: AttendanceStatus
  type: AttendanceType
  attendance_type_id?: string
  
  // Descansos durante la jornada
  breaks?: BreakRecord[]
  
  // Ubicación de registro
  check_in_location?: string
  check_out_location?: string
  
  // Ubicación y seguridad
  ip_address?: string
  user_agent?: string
  location_data?: LocationData
  
  // Aprobación y revisión
  is_approved?: boolean
  approved_by?: string
  approved_at?: string
  rejected_by?: string
  rejected_at?: string
  rejection_reason?: string
  
  // Notas
  employee_notes?: string
  manager_notes?: string
  
  // Relaciones (populadas opcionalmente)
  organization?: Organization
  employee?: Employee
  attendance_type?: AttendanceTypeConfig
  approved_by_user?: Employee
}

/**
 * Estados de asistencia actualizados
 */
export type AttendanceStatus = 
  | 'present'        // Presente
  | 'absent'         // Ausente
  | 'late'           // Tarde
  | 'early_leave'    // Salida temprana
  | 'sick_leave'     // Incapacidad
  | 'vacation'       // Vacaciones
  | 'remote'         // Trabajo remoto
  | 'overtime'       // Tiempo extra
  | 'on_time'        // A tiempo (nuevo)
  | 'early_departure' // Salida temprana (nuevo)
  | 'complete'       // Completo (nuevo)
  | 'pending'        // Pendiente (nuevo)
  | 'approved'       // Aprobado (nuevo)
  | 'rejected'       // Rechazado (nuevo)

/**
 * Tipos de asistencia disponibles
 */
export type AttendanceType = 
  | 'regular'        // Regular
  | 'overtime'       // Tiempo extra
  | 'remote'         // Remoto
  | 'holiday'        // Feriado
  | 'vacation'       // Vacaciones
  | 'sick_leave'     // Incapacidad

/**
 * Interface para descansos durante la jornada
 */
export interface BreakRecord {
  type: 'lunch' | 'short_break' | 'personal' | 'medical';
  start_time: string;
  end_time?: string;
}

/**
 * Datos de ubicación geográfica
 */
export interface LocationData {
  lat: number
  lng: number
  accuracy?: number
  address?: string
  timestamp?: string
}

/**
 * Configuraciones del sistema
 */
export interface SystemSetting extends BaseEntity {
  organization_id: string
  category: string
  key: string
  value: Record<string, unknown> // JSONB
  data_type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  version: number
  previous_value?: Record<string, unknown>
  is_public: boolean
  is_encrypted: boolean
  description?: string
  validation_schema?: Record<string, unknown>
  updated_by?: string
  
  // Relaciones
  organization?: Organization
  updated_by_user?: Employee
}

/**
 * Logs de auditoría para configuraciones
 */
export interface SettingAuditLog extends BaseEntity {
  setting_id: string
  organization_id: string
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  old_value?: Record<string, unknown>
  new_value?: Record<string, unknown>
  changed_by?: string
  change_reason?: string
  ip_address?: string
  user_agent?: string
  
  // Relaciones
  setting?: SystemSetting
  changed_by_user?: Employee
}

/**
 * Estadísticas del dashboard (vista materializada)
 */
export interface EmployeeDashboardStats {
  employee_id: string
  organization_id: string
  full_name: string
  department_id?: string
  department_name?: string
  
  // Estadísticas del mes actual
  days_present_month: number
  avg_hours_month: number
  total_hours_month: number
  overtime_month: number
  
  // Estadísticas del año actual
  days_present_year: number
  total_hours_year: number
  
  // Puntualidad
  late_days_month: number
  
  // Última actividad
  last_attendance?: string
  updated_at: string
}

/**
 * Resumen de asistencia por departamento
 */
export interface DepartmentAttendanceSummary {
  organization_id: string
  department_id: string
  department_name: string
  month: string
  unique_employees: number
  present_days: number
  absent_days: number
  late_days: number
  remote_days: number
  avg_daily_hours: number
  total_work_hours: number
  total_overtime_hours: number
  attendance_rate: number
}

// =============================================
// TIPOS PARA RESPUESTAS DE API
// =============================================

/**
 * Respuesta estándar de API con manejo de errores
 */
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: string
}

/**
 * Respuesta paginada para listas grandes
 */
export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

/**
 * Opciones de paginación para consultas
 */
export interface PaginationOptions {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * Filtros para consultas de asistencia
 */
export interface AttendanceFilters extends PaginationOptions {
  employee_id?: string
  department_id?: string
  date_from?: string
  date_to?: string
  status?: AttendanceStatus[]
  is_approved?: boolean
}

/**
 * Filtros para consultas de empleados
 */
export interface EmployeeFilters extends PaginationOptions {
  department_id?: string
  role?: EmployeeRole[]
  is_active?: boolean
  search?: string // Búsqueda por nombre o email
}

// =============================================
// TIPOS PARA FORMULARIOS Y VALIDACIÓN
// =============================================

/**
 * Datos para crear/editar empleado
 */
export interface EmployeeFormData {
  email: string
  first_name: string
  last_name: string
  phone?: string
  department_id?: string
  position_id?: string
  manager_id?: string
  hire_date: string
  role: EmployeeRole
  work_schedule: WorkScheduleConfig
}

/**
 * Datos para marcar asistencia
 */
export interface AttendanceCheckData {
  type: 'check_in' | 'check_out'
  timestamp: string
  location_data?: LocationData
  notes?: string
}

/**
 * Datos para configuración del sistema
 */
export interface SettingFormData {
  category: string
  key: string
  value: Record<string, unknown>
  description?: string
  is_public: boolean
}

// =============================================
// TIPOS PARA AUTENTICACIÓN Y SESIÓN
// =============================================

/**
 * Información del usuario autenticado
 */
export interface AuthUser {
  id: string
  email: string
  employee?: Employee
  permissions: string[]
  organization_id: string
}

/**
 * Datos de sesión completos
 */
export interface UserSession {
  user: AuthUser
  expires_at: string
  refresh_token?: string
}

/**
 * Resultado de validación de permisos
 */
export interface PermissionCheck {
  hasPermission: boolean
  userRole?: EmployeeRole
  error?: string
}

// =============================================
// EXPORTAR TIPOS PARA USO GLOBAL
// =============================================

// ...existing code...
