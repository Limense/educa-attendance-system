/**
 * =============================================
 * SERVICIOS - ÍNDICE PRINCIPAL DE EXPORTACIÓN
 * =============================================
 * 
 * Descripción: Punto central para exportar todos los servicios
 * Implementa patrón Facade para simplificar el acceso a servicios
 * 
 * Principios aplicados:
 * - Facade Pattern - Interfaz simplificada para el sistema
 * - Dependency Injection - Configuración centralizada
 * - Service Locator - Localización de servicios
 */

// Exportar tipos de database
export type { LoginCredentials, AuthResponse, AuthState } from '@/types/database';

// Exportar interfaces de servicios
export type { IAuthService } from './auth.service';
export type {
  IAttendanceService,
  AttendanceResponse,
  AttendanceStats,
  WorkHoursCalculation,
  ValidationResult,
  AttendanceFilters,
  TimePeriod,
  GeolocationData
} from './attendance.service';

// Exportar implementaciones
export { AuthService } from './auth.service';
export { AttendanceService, AttendanceServiceFactory } from './attendance.service';

// Exportar enums
export { BreakType, AttendanceOperation } from './attendance.service';

// Exportar repositorios
export type { IEmployeeRepository } from '@/repositories/employee.repository';
export { EmployeeRepository } from '@/repositories/employee.repository';

/**
 * Factory principal para crear todos los servicios
 * Implementa Service Locator Pattern
 */
export class ServiceFactory {
  private static authService: import('./auth.service').AuthService | null = null;
  private static attendanceService: import('./attendance.service').AttendanceService | null = null;

  /**
   * Obtiene instancia singleton del AuthService
   */
  public static async getAuthService(): Promise<import('./auth.service').AuthService> {
    if (!this.authService) {
      const { AuthService } = await import('./auth.service');
      this.authService = new AuthService();
    }
    return this.authService;
  }

  /**
   * Obtiene instancia del AttendanceService
   * Requiere EmployeeRepository como dependencia
   */
  public static async getAttendanceService(employeeRepository: import('@/repositories/employee.repository').IEmployeeRepository): Promise<import('./attendance.service').AttendanceService> {
    if (!this.attendanceService) {
      const { AttendanceService } = await import('./attendance.service');
      this.attendanceService = new AttendanceService(employeeRepository);
    }
    return this.attendanceService;
  }

  /**
   * Limpia todas las instancias (útil para testing)
   */
  public static reset(): void {
    this.authService = null;
    this.attendanceService = null;
  }
}
