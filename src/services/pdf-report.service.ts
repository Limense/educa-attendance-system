/**
 * =============================================
 * PDF REPORT SERVICE
 * =============================================
 * 
 * Descripción: Servicio para generar reportes PDF profesionales
 * Características: Plantillas personalizadas, gráficos, estadísticas
 */

import jsPDF from 'jspdf';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Attendance, Employee } from '@/types/database';

export interface ReportData {
  employee: Employee;
  attendances: Attendance[];
  period: {
    startDate: string;
    endDate: string;
  };
  stats: {
    totalDays: number;
    workDays: number;
    presentDays: number;
    absentDays: number;
    incompleteDays: number;
    totalHours: number;
    averageHours: number;
    punctualityRate: number;
    attendanceRate: number;
    overtimeHours: number;
  };
}

/**
 * Servicio principal para generar PDFs
 */
export class PDFReportService {
  private pdf: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  private currentY: number;

  constructor() {
    this.pdf = new jsPDF();
    this.pageWidth = this.pdf.internal.pageSize.width;
    this.pageHeight = this.pdf.internal.pageSize.height;
    this.margin = 20;
    this.currentY = this.margin;
  }

  /**
   * Genera el reporte completo en PDF
   */
  async generateReport(data: ReportData): Promise<void> {
    try {
      this.addHeader(data);
      this.addEmployeeInfo(data.employee);
      this.addPeriodInfo(data.period);
      this.addStatsSummary(data.stats);
      this.addAttendanceTable(data.attendances);
      this.addFooter();
      
      // Descargar el PDF
      this.pdf.save(`reporte-asistencia-${data.employee.employee_code}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error('Error generando PDF:', error);
      throw error;
    }
  }

  /**
   * Añade el header del reporte
   */
  private addHeader(_data: ReportData): void {
    // Logo/Título principal
    this.pdf.setFontSize(24);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(30, 64, 175); // blue-800
    this.pdf.text('REPORTE DE ASISTENCIA', this.pageWidth / 2, this.currentY, { align: 'center' });
    
    this.currentY += 15;
    
    // Subtítulo
    this.pdf.setFontSize(12);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setTextColor(75, 85, 99); // gray-600
    this.pdf.text('Sistema de Control de Asistencias Educa', this.pageWidth / 2, this.currentY, { align: 'center' });
    
    this.currentY += 20;
    
    // Línea separadora
    this.pdf.setDrawColor(229, 231, 235); // gray-200
    this.pdf.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    
    this.currentY += 15;
  }

  /**
   * Añade información del empleado
   */
  private addEmployeeInfo(employee: Employee): void {
    this.pdf.setFontSize(14);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(17, 24, 39); // gray-900
    this.pdf.text('INFORMACIÓN DEL EMPLEADO', this.margin, this.currentY);
    
    this.currentY += 10;
    
    const employeeInfo = [
      `Nombre: ${employee.first_name} ${employee.last_name}`,
      `Código: ${employee.employee_code}`,
      `Email: ${employee.email}`,
      `Departamento: ${employee.department?.name || 'No asignado'}`,
      `Posición: ${employee.position?.title || 'No asignada'}`
    ];
    
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setTextColor(55, 65, 81); // gray-700
    
    employeeInfo.forEach(info => {
      this.pdf.text(info, this.margin + 5, this.currentY);
      this.currentY += 6;
    });
    
    this.currentY += 10;
  }

  /**
   * Añade información del período
   */
  private addPeriodInfo(period: { startDate: string; endDate: string }): void {
    this.pdf.setFontSize(14);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(17, 24, 39);
    this.pdf.text('PERÍODO DEL REPORTE', this.margin, this.currentY);
    
    this.currentY += 10;
    
    const startDate = format(parseISO(period.startDate), 'dd/MM/yyyy', { locale: es });
    const endDate = format(parseISO(period.endDate), 'dd/MM/yyyy', { locale: es });
    
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setTextColor(55, 65, 81);
    this.pdf.text(`Desde: ${startDate} hasta: ${endDate}`, this.margin + 5, this.currentY);
    
    this.currentY += 15;
  }

  /**
   * Añade el resumen de estadísticas
   */
  private addStatsSummary(stats: ReportData['stats']): void {
    this.pdf.setFontSize(14);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(17, 24, 39);
    this.pdf.text('RESUMEN ESTADÍSTICO', this.margin, this.currentY);
    
    this.currentY += 15;
    
    // Crear tabla de estadísticas
    const statsData = [
      ['Métrica', 'Valor'],
      ['Días laborables', `${stats.workDays} días`],
      ['Días presentes', `${stats.presentDays} días`],
      ['Días ausentes', `${stats.absentDays} días`],
      ['Días incompletos', `${stats.incompleteDays} días`],
      ['Tasa de asistencia', `${stats.attendanceRate.toFixed(1)}%`],
      ['Tasa de puntualidad', `${stats.punctualityRate.toFixed(1)}%`],
      ['Total horas trabajadas', `${stats.totalHours.toFixed(1)} horas`],
      ['Promedio horas/día', `${stats.averageHours.toFixed(1)} horas`],
      ['Horas extras', `${stats.overtimeHours.toFixed(1)} horas`]
    ];
    
    this.addTable(statsData);
    this.currentY += 20;
  }

  /**
   * Añade la tabla de asistencias
   */
  private addAttendanceTable(attendances: Attendance[]): void {
    this.pdf.setFontSize(14);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(17, 24, 39);
    this.pdf.text('DETALLE DE ASISTENCIAS', this.margin, this.currentY);
    
    this.currentY += 15;
    
    // Preparar datos de la tabla
    const tableData = [
      ['Fecha', 'Entrada', 'Salida', 'Horas', 'Estado']
    ];
    
    attendances.forEach(attendance => {
      const date = format(parseISO(attendance.attendance_date), 'dd/MM/yyyy', { locale: es });
      const checkIn = attendance.check_in_time || '-';
      const checkOut = attendance.check_out_time || '-';
      
      let hours = '-';
      if (attendance.check_in_time && attendance.check_out_time) {
        const checkInDate = new Date(`${attendance.attendance_date}T${attendance.check_in_time}`);
        const checkOutDate = new Date(`${attendance.attendance_date}T${attendance.check_out_time}`);
        const diffMs = checkOutDate.getTime() - checkInDate.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        hours = `${diffHours.toFixed(1)}h`;
      }
      
      const status = attendance.check_in_time && attendance.check_out_time
        ? 'Completo'
        : attendance.check_in_time
        ? 'Incompleto'
        : 'Ausente';
      
      tableData.push([date, checkIn, checkOut, hours, status]);
    });
    
    this.addTable(tableData);
  }

  /**
   * Añade una tabla al PDF
   */
  private addTable(data: string[][]): void {
    const colWidths = [35, 25, 25, 25, 30]; // Anchos de columnas
    const rowHeight = 8;
    const headerHeight = 10;
    
    // Header
    this.pdf.setFillColor(243, 244, 246); // gray-100
    this.pdf.setTextColor(17, 24, 39); // gray-900
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(9);
    
    let xPos = this.margin;
    data[0].forEach((header, i) => {
      this.pdf.rect(xPos, this.currentY, colWidths[i], headerHeight, 'F');
      this.pdf.text(header, xPos + 2, this.currentY + 6);
      xPos += colWidths[i];
    });
    
    this.currentY += headerHeight;
    
    // Filas de datos
    this.pdf.setFillColor(255, 255, 255); // white
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(8);
    
    for (let i = 1; i < data.length; i++) {
      // Verificar si necesitamos nueva página
      if (this.currentY + rowHeight > this.pageHeight - this.margin) {
        this.addNewPage();
      }
      
      xPos = this.margin;
      data[i].forEach((cell, j) => {
        // Alternar colores de fila
        if (i % 2 === 0) {
          this.pdf.setFillColor(249, 250, 251); // gray-50
        } else {
          this.pdf.setFillColor(255, 255, 255); // white
        }
        
        this.pdf.rect(xPos, this.currentY, colWidths[j], rowHeight, 'F');
        this.pdf.text(cell, xPos + 2, this.currentY + 5);
        xPos += colWidths[j];
      });
      
      this.currentY += rowHeight;
    }
  }

  /**
   * Añade una nueva página
   */
  private addNewPage(): void {
    this.pdf.addPage();
    this.currentY = this.margin;
  }

  /**
   * Añade el footer
   */
  private addFooter(): void {
    // Footer simple en la página actual
    this.pdf.setFontSize(8);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setTextColor(107, 114, 128); // gray-500
    
    const footerText = `Generado el ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`;
    this.pdf.text(footerText, this.margin, this.pageHeight - 10);
    
    // Línea de marca de agua
    const watermark = 'Sistema Educa - Reporte de Asistencias';
    this.pdf.text(watermark, this.pageWidth - this.margin, this.pageHeight - 10, { align: 'right' });
  }
}

/**
 * Función helper para generar reporte PDF
 */
export async function generateAttendanceReport(data: ReportData): Promise<void> {
  const pdfService = new PDFReportService();
  await pdfService.generateReport(data);
}
