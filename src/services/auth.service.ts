/**
 * =============================================
 * SERVICIOS DE AUTENTICACIÓN
 * =============================================
 * 
 * Descripción: Servicio que maneja toda la lógica de autenticación
 * utilizando el patrón Repository y Service Layer
 * 
 * Principios SOLID aplicados:
 * - S: Single Responsibility - Solo maneja autenticación
 * - O: Open/Closed - Extensible para nuevos métodos de auth
 * - L: Liskov Substitution - Implementa AuthServiceInterface
 * - I: Interface Segregation - Interfaces específicas por función
 * - D: Dependency Inversion - Depende de abstracciones, no concreciones
 * 
 * Patrones de diseño:
 * - Repository Pattern - Para acceso a datos
 * - Service Layer - Para lógica de negocio
 * - Factory Pattern - Para creación de clientes Supabase
 */


import { createSupabaseClient } from '@/lib/supabase/client';
import { Employee, AuthResponse, LoginCredentials } from '@/types/database';
import { EmployeeRepository } from '@/repositories/employee.repository';
import { Logger } from '@/utils/logger';

/**
 * Interface que define el contrato del servicio de autenticación
 * Implementa Interface Segregation Principle
 */
export interface IAuthService {
  signIn(credentials: LoginCredentials): Promise<AuthResponse>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<Employee | null>;
  refreshSession(): Promise<boolean>;
}

/**
 * Implementación concreta del servicio de autenticación
 * Utiliza Dependency Injection para sus dependencias
 */
export class AuthService implements IAuthService {
  private employeeRepository: EmployeeRepository;
  private logger: Logger;

  constructor(
    employeeRepository: EmployeeRepository = new EmployeeRepository(),
    logger: Logger = new Logger('AuthService')
  ) {
    this.employeeRepository = employeeRepository;
    this.logger = logger;
  }

  /**
   * Autentica un usuario con email y contraseña
   * 
   * @param credentials - Credenciales de login del usuario
   * @returns Promise<AuthResponse> - Respuesta con usuario autenticado o error
   * 
   * @example
   * ```typescript
   * const authService = new AuthService();
   * const result = await authService.signIn({
   *   email: 'admin@educa-demo.com',
   *   password: 'admin123'
   * });
   * 
   * if (result.success) {
   *   console.log('Usuario autenticado:', result.employee);
   * } else {
   *   console.error('Error:', result.error);
   * }
   * ```
   */
  async signIn(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      this.logger.info('Iniciando proceso de autenticación', { email: credentials.email });

      // Validar entrada
      if (!this.validateCredentials(credentials)) {
        throw new Error('Credenciales inválidas');
      }

      const supabase = createSupabaseClient();

      // 1. Autenticar con Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (authError) {
        this.logger.warn('Error de autenticación en Supabase', { error: authError.message });
        throw new Error(this.translateAuthError(authError.message));
      }

      if (!authData.user) {
        throw new Error('No se pudo obtener información del usuario');
      }

      // 2. Buscar empleado en la base de datos
      const employee = await this.employeeRepository.findByEmail(authData.user.email!);

      if (!employee) {
        // Si no existe el empleado, cerrar sesión automáticamente
        await supabase.auth.signOut();
        throw new Error('Usuario no encontrado o inactivo en el sistema');
      }

      // 3. Validar que el empleado esté activo
      if (!employee.is_active) {
        await supabase.auth.signOut();
        throw new Error('Cuenta de usuario desactivada');
      }

      // 4. Configurar contexto de organización (para RLS)
      await this.setOrganizationContext(employee.organization_id);

      // 5. Almacenar información en cache local
      this.cacheEmployeeData(employee);

      this.logger.info('Autenticación exitosa', { 
        employeeId: employee.id, 
        role: employee.role 
      });

      return {
        user: employee,
        success: true,
        employee,
        redirectUrl: this.getRedirectUrl(employee.role)
      };

    } catch (error) {
      this.logger.error('Error en autenticación', { error: error instanceof Error ? error.message : 'Error desconocido' });
      
      return {
        user: null,
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al iniciar sesión'
      };
    }
  }

  /**
   * Cierra la sesión del usuario actual
   * Limpia cache y contexto de la aplicación
   */
  async signOut(): Promise<void> {
    try {
      this.logger.info('Cerrando sesión de usuario');

      const supabase = createSupabaseClient();
      await supabase.auth.signOut();
      
      // Limpiar cache local
      this.clearCache();
      
      this.logger.info('Sesión cerrada exitosamente');
    } catch (error) {
      this.logger.error('Error cerrando sesión', { error });
      throw error;
    }
  }

  /**
   * Obtiene el usuario actualmente autenticado
   * 
   * @returns Promise<Employee | null> - Empleado autenticado o null
   */
  async getCurrentUser(): Promise<Employee | null> {
    try {
      const supabase = createSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return null;
      }

      // Intentar obtener desde cache primero
      const cachedEmployee = this.getCachedEmployee();
      if (cachedEmployee && cachedEmployee.email === user.email) {
        return cachedEmployee;
      }

      // Si no hay cache, consultar base de datos
      const employee = await this.employeeRepository.findByEmail(user.email!);
      
      if (employee) {
        this.cacheEmployeeData(employee);
      }

      return employee;
    } catch (error) {
      this.logger.error('Error obteniendo usuario actual', { error });
      return null;
    }
  }

  /**
   * Refresca la sesión actual del usuario
   * 
   * @returns Promise<boolean> - true si la sesión es válida, false si no
   */
  async refreshSession(): Promise<boolean> {
    try {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error || !data.session) {
        this.logger.warn('Sesión expirada o inválida');
        return false;
      }

      this.logger.info('Sesión refrescada exitosamente');
      return true;
    } catch (error) {
      this.logger.error('Error refrescando sesión', { error });
      return false;
    }
  }

  // =============================================
  // MÉTODOS PRIVADOS - LÓGICA INTERNA
  // =============================================

  /**
   * Valida las credenciales de entrada
   * Aplica el principio de validación temprana
   */
  private validateCredentials(credentials: LoginCredentials): boolean {
    if (!credentials.email || !credentials.password) {
      return false;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(credentials.email)) {
      return false;
    }

    // Validar longitud mínima de contraseña
    if (credentials.password.length < 6) {
      return false;
    }

    return true;
  }

  /**
   * Traduce errores de Supabase a mensajes amigables
   * Mejora la experiencia del usuario
   */
  private translateAuthError(errorMessage: string): string {
    const errorMap: Record<string, string> = {
      'Invalid login credentials': 'Email o contraseña incorrectos',
      'Email not confirmed': 'Email no confirmado. Revisa tu bandeja de entrada',
      'Too many requests': 'Demasiados intentos. Intenta más tarde',
      'User not found': 'Usuario no encontrado',
    };

    return errorMap[errorMessage] || 'Error de autenticación. Intenta nuevamente';
  }

  /**
   * Determina la URL de redirección según el rol del usuario
   * Implementa el patrón Strategy para routing
   */
  private getRedirectUrl(role: string): string {
    const routeMap: Record<string, string> = {
      'super_admin': '/dashboard/admin',
      'admin': '/dashboard/admin',
      'manager': '/dashboard/manager',
      'employee': '/dashboard/employee',
    };

    return routeMap[role] || '/dashboard/employee';
  }

  /**
   * Configura el contexto de organización para Row Level Security
   */
  private async setOrganizationContext(organizationId: string): Promise<void> {
    try {
      const supabase = createSupabaseClient();
      
      // Configurar variable de sesión para RLS
      await supabase.rpc('set_current_organization_id', { 
        org_id: organizationId 
      });
      
    } catch (error) {
      this.logger.warn('No se pudo configurar contexto de organización', { error });
      // No lanzar error ya que no es crítico
    }
  }

  /**
   * Almacena datos del empleado en localStorage para acceso rápido
   */
  private cacheEmployeeData(employee: Employee): void {
    try {
      localStorage.setItem('currentEmployee', JSON.stringify(employee));
      localStorage.setItem('lastLogin', new Date().toISOString());
    } catch (error) {
      this.logger.warn('No se pudo cachear datos del empleado', { error });
    }
  }

  /**
   * Obtiene datos del empleado desde cache local
   */
  private getCachedEmployee(): Employee | null {
    try {
      const cached = localStorage.getItem('currentEmployee');
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      this.logger.warn('Error leyendo cache del empleado', { error });
      return null;
    }
  }

  /**
   * Limpia cache local del usuario
   */
  private clearCache(): void {
    try {
      localStorage.removeItem('currentEmployee');
      localStorage.removeItem('lastLogin');
    } catch (error) {
      this.logger.warn('Error limpiando cache', { error });
    }
  }
}
