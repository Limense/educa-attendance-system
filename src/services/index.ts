/**
 * =============================================
 * SERVICIOS - ÍNDICE SIMPLIFICADO
 * =============================================
 * 
 * Exportaciones simplificadas para la funcionalidad restaurada
 */

// Exportar tipos principales
export type { AttendanceResponse } from './attendance.service';
export type { Department, Position, WorkPolicy, SystemSetting } from './system-config.service';

// Exportar servicios
export { AttendanceService } from './attendance.service';
export { SystemConfigService, systemConfigService } from './system-config.service';

// Instancia del servicio de asistencia
import { AttendanceService } from './attendance.service';
export const attendanceService = new AttendanceService();
