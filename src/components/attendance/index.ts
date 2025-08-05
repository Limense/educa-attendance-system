/**
 * =============================================
 * ATTENDANCE COMPONENTS INDEX
 * =============================================
 * 
 * Descripción: Exportaciones centralizadas de componentes de asistencias
 * Facilita las importaciones y mantiene consistencia
 */

// Componentes principales
export { AttendanceClock } from './AttendanceClock';
export { AttendanceStatusCard } from './AttendanceStatusCard';
export { AttendanceHistory } from './AttendanceHistory';

// Re-exportar tipos si es necesario
export type { default as AttendanceClockProps } from './AttendanceClock';
export type { default as AttendanceStatusCardProps } from './AttendanceStatusCard';
export type { default as AttendanceHistoryProps } from './AttendanceHistory';
