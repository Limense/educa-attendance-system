// =============================================
// CONSTANTES ESCALABLES DEL SISTEMA
// Descripción: Configuraciones centralizadas y escalables
// Principio: Single Source of Truth para valores constantes
// =============================================

/**
 * Paleta de colores del sistema Educa
 * Basada en la especificación del proyecto
 */
export const COLORS = {
  // Colores principales
  primary: '#EC5971',
  primaryDark: '#D44862',
  secondary: '#64748B',
  
  // Colores de fondo y superficie
  background: '#F8FAFC',
  surface: '#FFFFFF',
  
  // Colores de texto
  text: '#1E293B',
  textSecondary: '#64748B',
  
  // Colores de estado
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Colores de bordes
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  
  // Colores para dark mode (futuro)
  dark: {
    background: '#0F172A',
    surface: '#1E293B',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    border: '#334155',
  }
} as const

/**
 * Configuración de roles y permisos
 * Sistema escalable de autorización
 */
export const ROLES = {
  EMPLOYEE: 'employee',
  MANAGER: 'manager',
  HR: 'hr',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
} as const

/**
 * Jerarquía de roles (para validaciones de permisos)
 */
export const ROLE_HIERARCHY: Record<string, number> = {
  [ROLES.EMPLOYEE]: 1,
  [ROLES.MANAGER]: 2,
  [ROLES.HR]: 3,
  [ROLES.ADMIN]: 4,
  [ROLES.SUPER_ADMIN]: 5,
}

/**
 * Permisos específicos del sistema
 * Escalable para agregar nuevas funcionalidades
 */
export const PERMISSIONS = {
  // Gestión de empleados
  EMPLOYEES_VIEW: 'employees:view',
  EMPLOYEES_CREATE: 'employees:create',
  EMPLOYEES_EDIT: 'employees:edit',
  EMPLOYEES_DELETE: 'employees:delete',
  
  // Gestión de asistencias
  ATTENDANCE_VIEW_OWN: 'attendance:view:own',
  ATTENDANCE_VIEW_ALL: 'attendance:view:all',
  ATTENDANCE_CREATE: 'attendance:create',
  ATTENDANCE_EDIT: 'attendance:edit',
  ATTENDANCE_APPROVE: 'attendance:approve',
  
  // Reportes
  REPORTS_VIEW: 'reports:view',
  REPORTS_EXPORT: 'reports:export',
  REPORTS_ANALYTICS: 'reports:analytics',
  
  // Configuración del sistema
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_EDIT: 'settings:edit',
  SETTINGS_SYSTEM: 'settings:system',
  
  // Auditoría
  AUDIT_VIEW: 'audit:view',
  AUDIT_SYSTEM: 'audit:system',
} as const

/**
 * Mapeo de permisos por rol
 * Define qué puede hacer cada rol
 */
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  [ROLES.EMPLOYEE]: [
    PERMISSIONS.ATTENDANCE_VIEW_OWN,
    PERMISSIONS.ATTENDANCE_CREATE,
  ],
  
  [ROLES.MANAGER]: [
    PERMISSIONS.ATTENDANCE_VIEW_OWN,
    PERMISSIONS.ATTENDANCE_CREATE,
    PERMISSIONS.EMPLOYEES_VIEW,
    PERMISSIONS.ATTENDANCE_VIEW_ALL,
    PERMISSIONS.ATTENDANCE_APPROVE,
    PERMISSIONS.REPORTS_VIEW,
  ],
  
  [ROLES.HR]: [
    PERMISSIONS.ATTENDANCE_VIEW_OWN,
    PERMISSIONS.ATTENDANCE_CREATE,
    PERMISSIONS.EMPLOYEES_VIEW,
    PERMISSIONS.EMPLOYEES_CREATE,
    PERMISSIONS.EMPLOYEES_EDIT,
    PERMISSIONS.ATTENDANCE_VIEW_ALL,
    PERMISSIONS.ATTENDANCE_APPROVE,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.SETTINGS_VIEW,
  ],
  
  [ROLES.ADMIN]: [
    // Incluye todos los permisos de HR más:
    PERMISSIONS.ATTENDANCE_VIEW_OWN,
    PERMISSIONS.ATTENDANCE_CREATE,
    PERMISSIONS.EMPLOYEES_VIEW,
    PERMISSIONS.EMPLOYEES_CREATE,
    PERMISSIONS.EMPLOYEES_EDIT,
    PERMISSIONS.ATTENDANCE_VIEW_ALL,
    PERMISSIONS.ATTENDANCE_APPROVE,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.EMPLOYEES_DELETE,
    PERMISSIONS.REPORTS_ANALYTICS,
    PERMISSIONS.SETTINGS_EDIT,
    PERMISSIONS.AUDIT_VIEW,
  ],
  
  [ROLES.SUPER_ADMIN]: [
    // Incluye todos los permisos
    ...Object.values(PERMISSIONS),
  ],
}

/**
 * Estados de asistencia con configuración
 */
export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  EARLY_LEAVE: 'early_leave',
  SICK_LEAVE: 'sick_leave',
  VACATION: 'vacation',
  REMOTE: 'remote',
  OVERTIME: 'overtime',
} as const

/**
 * Configuración visual para estados de asistencia
 */
export const ATTENDANCE_STATUS_CONFIG = {
  [ATTENDANCE_STATUS.PRESENT]: {
    label: 'Presente',
    color: COLORS.success,
    icon: 'check-circle',
    bgColor: '#ECFDF5',
  },
  [ATTENDANCE_STATUS.ABSENT]: {
    label: 'Ausente',
    color: COLORS.error,
    icon: 'x-circle',
    bgColor: '#FEF2F2',
  },
  [ATTENDANCE_STATUS.LATE]: {
    label: 'Tarde',
    color: COLORS.warning,
    icon: 'clock',
    bgColor: '#FFFBEB',
  },
  [ATTENDANCE_STATUS.EARLY_LEAVE]: {
    label: 'Salida Temprana',
    color: COLORS.warning,
    icon: 'log-out',
    bgColor: '#FFFBEB',
  },
  [ATTENDANCE_STATUS.SICK_LEAVE]: {
    label: 'Incapacidad',
    color: COLORS.info,
    icon: 'heart',
    bgColor: '#EFF6FF',
  },
  [ATTENDANCE_STATUS.VACATION]: {
    label: 'Vacaciones',
    color: COLORS.secondary,
    icon: 'sun',
    bgColor: '#F8FAFC',
  },
  [ATTENDANCE_STATUS.REMOTE]: {
    label: 'Remoto',
    color: COLORS.info,
    icon: 'home',
    bgColor: '#EFF6FF',
  },
  [ATTENDANCE_STATUS.OVERTIME]: {
    label: 'Tiempo Extra',
    color: COLORS.primary,
    icon: 'plus-circle',
    bgColor: '#FDF2F8',
  },
} as const

/**
 * Configuración de paginación
 * Valores por defecto escalables
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
} as const

/**
 * Configuración de formatos de fecha y hora
 * Localización y consistencia
 */
export const DATE_FORMATS = {
  DATE: 'yyyy-MM-dd',
  TIME: 'HH:mm',
  DATETIME: 'yyyy-MM-dd HH:mm',
  DISPLAY_DATE: 'dd/MM/yyyy',
  DISPLAY_TIME: 'HH:mm',
  DISPLAY_DATETIME: 'dd/MM/yyyy HH:mm',
  MONTH_YEAR: 'MMMM yyyy',
} as const

/**
 * Configuración de validación
 * Reglas de negocio centralizadas
 */
export const VALIDATION = {
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL: true,
  },
  EMPLOYEE_CODE: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 20,
    PATTERN: /^[A-Z]{2,4}\d{4}\d{3}$/, // Ej: IT2025001
  },
  FILE_UPLOAD: {
    MAX_SIZE_MB: 5,
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  },
  WORK_HOURS: {
    MIN_DAILY: 0,
    MAX_DAILY: 24,
    MAX_WEEKLY: 60,
  },
} as const

/**
 * Configuración de notificaciones
 * Tipos y configuraciones escalables
 */
export const NOTIFICATIONS = {
  TYPES: {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info',
  },
  DURATION: {
    SHORT: 3000,   // 3 segundos
    MEDIUM: 5000,  // 5 segundos
    LONG: 8000,    // 8 segundos
    PERSISTENT: 0, // No se auto-cierra
  },
} as const

/**
 * Configuración de localStorage
 * Keys consistentes para persistencia
 */
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'educa_user_preferences',
  THEME: 'educa_theme',
  LANGUAGE: 'educa_language',
  RECENT_SEARCHES: 'educa_recent_searches',
  DASHBOARD_LAYOUT: 'educa_dashboard_layout',
} as const

/**
 * Configuración de API
 * Timeouts y límites
 */
export const API_CONFIG = {
  TIMEOUT: 30000, // 30 segundos
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 segundo
  BATCH_SIZE: 100,
} as const

/**
 * Configuración de URLs de la aplicación
 * Rutas escalables y organizadas
 */
export const ROUTES = {
  // Públicas
  HOME: '/',
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  
  // Dashboard
  DASHBOARD: '/dashboard',
  PROFILE: '/dashboard/profile',
  
  // Asistencias
  ATTENDANCE: '/dashboard/attendance',
  ATTENDANCE_HISTORY: '/dashboard/attendance/history',
  ATTENDANCE_CALENDAR: '/dashboard/attendance/calendar',
  
  // Administración
  ADMIN: '/admin',
  ADMIN_EMPLOYEES: '/admin/employees',
  ADMIN_DEPARTMENTS: '/admin/departments',
  ADMIN_REPORTS: '/admin/reports',
  ADMIN_SETTINGS: '/admin/settings',
  
  // API
  API: {
    AUTH: '/api/auth',
    EMPLOYEES: '/api/employees',
    ATTENDANCE: '/api/attendance',
    REPORTS: '/api/reports',
    SETTINGS: '/api/settings',
  },
} as const

/**
 * Mensajes del sistema
 * Centralizados para consistencia y i18n futuro
 */
export const MESSAGES = {
  SUCCESS: {
    ATTENDANCE_CHECKED_IN: 'Entrada registrada exitosamente',
    ATTENDANCE_CHECKED_OUT: 'Salida registrada exitosamente',
    EMPLOYEE_CREATED: 'Empleado creado exitosamente',
    SETTINGS_UPDATED: 'Configuración actualizada',
  },
  ERROR: {
    GENERIC: 'Ha ocurrido un error inesperado',
    NETWORK: 'Error de conexión. Intenta nuevamente',
    UNAUTHORIZED: 'No tienes permisos para esta acción',
    VALIDATION: 'Por favor verifica los datos ingresados',
    ALREADY_CHECKED_IN: 'Ya registraste tu entrada hoy',
    ALREADY_CHECKED_OUT: 'Ya registraste tu salida hoy',
  },
  CONFIRM: {
    DELETE_EMPLOYEE: '¿Estás seguro de eliminar este empleado?',
    LOGOUT: '¿Cerrar sesión?',
  },
} as const

/**
 * Configuración de métricas y analytics
 * Para futuras implementaciones
 */
export const METRICS = {
  EVENTS: {
    LOGIN: 'user_login',
    LOGOUT: 'user_logout',
    ATTENDANCE_CHECK_IN: 'attendance_check_in',
    ATTENDANCE_CHECK_OUT: 'attendance_check_out',
    REPORT_GENERATED: 'report_generated',
    SETTINGS_CHANGED: 'settings_changed',
  },
} as const

// Exportar tipos para uso en TypeScript
export type ColorKey = keyof typeof COLORS
export type RoleType = typeof ROLES[keyof typeof ROLES]
export type PermissionType = typeof PERMISSIONS[keyof typeof PERMISSIONS]
export type AttendanceStatusType = typeof ATTENDANCE_STATUS[keyof typeof ATTENDANCE_STATUS]
export type RouteKey = keyof typeof ROUTES
