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
  private addHeader(data: ReportData): void {
    // Fondo del header con gradiente simulado
    this.pdf.setFillColor(59, 130, 246); // blue-500
    this.pdf.rect(0, 0, this.pageWidth, 60, 'F');
    
    this.pdf.setFillColor(79, 143, 246); // blue-400
    this.pdf.rect(0, 40, this.pageWidth, 20, 'F');
    
    // Logo/Título principal en blanco
    this.pdf.setFontSize(28);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(255, 255, 255); // white
    this.pdf.text('📊 REPORTE DE ASISTENCIA', this.pageWidth / 2, 25, { align: 'center' });
    
    // Subtítulo
    this.pdf.setFontSize(14);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setTextColor(219, 234, 254); // blue-100
    this.pdf.text('Sistema de Control de Asistencias Educa', this.pageWidth / 2, 40, { align: 'center' });
    
    // Información del empleado en el header
    this.pdf.setFontSize(12);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(255, 255, 255);
    const employeeName = `${data.employee.first_name} ${data.employee.last_name}`;
    const employeeCode = `Código: ${data.employee.employee_code}`;
    this.pdf.text(employeeName, this.pageWidth / 2, 52, { align: 'center' });
    
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text(employeeCode, this.pageWidth / 2, 58, { align: 'center' });
    
    this.currentY = 80;
  }

  /**
   * Añade información del empleado con diseño mejorado
   */
  private addEmployeeInfo(employee: Employee): void {
    // Card con sombra simulada
    this.pdf.setFillColor(248, 250, 252); // gray-50
    this.pdf.roundedRect(this.margin, this.currentY, this.pageWidth - (this.margin * 2), 35, 3, 3, 'F');
    
    // Borde sutil
    this.pdf.setDrawColor(226, 232, 240); // gray-300
    this.pdf.setLineWidth(0.5);
    this.pdf.roundedRect(this.margin, this.currentY, this.pageWidth - (this.margin * 2), 35, 3, 3, 'S');
    
    this.currentY += 8;
    
    // Título con icono
    this.pdf.setFontSize(14);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(30, 64, 175); // blue-800
    this.pdf.text('👤 INFORMACIÓN DEL EMPLEADO', this.margin + 5, this.currentY);
    
    this.currentY += 8;
    
    // Grid de información en 2 columnas
    const leftColumn = [
      `📧 Email: ${employee.email}`,
      `🏢 Departamento: ${employee.department?.name || 'No asignado'}`
    ];
    
    const rightColumn = [
      `🆔 Código: ${employee.employee_code}`,
      `💼 Posición: ${employee.position?.title || 'No asignada'}`
    ];
    
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setTextColor(55, 65, 81); // gray-700
    
    const startY = this.currentY;
    const columnWidth = (this.pageWidth - (this.margin * 2)) / 2;
    
    // Columna izquierda
    leftColumn.forEach((info, index) => {
      this.pdf.text(info, this.margin + 8, startY + (index * 6));
    });
    
    // Columna derecha
    rightColumn.forEach((info, index) => {
      this.pdf.text(info, this.margin + columnWidth, startY + (index * 6));
    });
    
    this.currentY += 25;
  }

  /**
   * Añade información del período con diseño atractivo
   */
  private addPeriodInfo(period: { startDate: string; endDate: string }): void {
    // Card destacada para el período
    this.pdf.setFillColor(239, 246, 255); // blue-50
    this.pdf.roundedRect(this.margin, this.currentY, this.pageWidth - (this.margin * 2), 25, 3, 3, 'F');
    
    this.pdf.setDrawColor(147, 197, 253); // blue-300
    this.pdf.setLineWidth(1);
    this.pdf.roundedRect(this.margin, this.currentY, this.pageWidth - (this.margin * 2), 25, 3, 3, 'S');
    
    this.currentY += 8;
    
    this.pdf.setFontSize(12);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(30, 64, 175); // blue-800
    this.pdf.text('📅 PERÍODO DEL REPORTE', this.margin + 5, this.currentY);
    
    this.currentY += 8;
    
    const startDate = format(parseISO(period.startDate), 'dd/MM/yyyy', { locale: es });
    const endDate = format(parseISO(period.endDate), 'dd/MM/yyyy', { locale: es });
    
    this.pdf.setFontSize(11);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(29, 78, 216); // blue-700
    
    const periodText = `📍 Desde: ${startDate}    🏁 Hasta: ${endDate}`;
    this.pdf.text(periodText, this.pageWidth / 2, this.currentY, { align: 'center' });
    
    this.currentY += 15;
  }

  /**
   * Añade el resumen de estadísticas con diseño tipo dashboard
   */
  private addStatsSummary(stats: ReportData['stats']): void {
    // Título de sección
    this.pdf.setFontSize(16);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(17, 24, 39); // gray-900
    this.pdf.text('📊 RESUMEN ESTADÍSTICO', this.margin, this.currentY);
    
    this.currentY += 15;
    
    // Crear tarjetas de estadísticas en grid 2x3
    const statsCards = [
      { 
        title: 'Asistencia', 
        value: `${stats.attendanceRate.toFixed(1)}%`, 
        subtitle: `${stats.presentDays}/${stats.workDays} días`,
        color: stats.attendanceRate >= 80 ? [34, 197, 94] : [239, 68, 68], // green-500 o red-500
        icon: '✅'
      },
      { 
        title: 'Puntualidad', 
        value: `${stats.punctualityRate.toFixed(1)}%`, 
        subtitle: `${stats.presentDays - stats.incompleteDays}/${stats.presentDays}`,
        color: stats.punctualityRate >= 80 ? [34, 197, 94] : [245, 158, 11], // green-500 o amber-500
        icon: '⏰'
      },
      { 
        title: 'Horas Totales', 
        value: `${stats.totalHours.toFixed(0)}h`, 
        subtitle: `Promedio: ${stats.averageHours.toFixed(1)}h/día`,
        color: [59, 130, 246], // blue-500
        icon: '🕐'
      },
      { 
        title: 'Días Ausentes', 
        value: `${stats.absentDays}`, 
        subtitle: `de ${stats.workDays} laborables`,
        color: stats.absentDays === 0 ? [34, 197, 94] : [239, 68, 68], // green-500 o red-500
        icon: '❌'
      },
      { 
        title: 'Horas Extra', 
        value: `${stats.overtimeHours.toFixed(1)}h`, 
        subtitle: 'Tiempo adicional',
        color: [147, 51, 234], // purple-500
        icon: '⏱️'
      },
      { 
        title: 'Incompletos', 
        value: `${stats.incompleteDays}`, 
        subtitle: 'días sin salida',
        color: [245, 158, 11], // amber-500
        icon: '⚠️'
      }
    ];
    
    const cardWidth = 60;
    const cardHeight = 30;
    const cols = 3;
    const spacing = 5;
    const startX = this.margin;
    
    statsCards.forEach((card, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      const x = startX + (col * (cardWidth + spacing));
      const y = this.currentY + (row * (cardHeight + spacing));
      
      // Fondo de la tarjeta
      this.pdf.setFillColor(255, 255, 255);
      this.pdf.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'F');
      
      // Borde con color del indicador
      this.pdf.setDrawColor(card.color[0], card.color[1], card.color[2]);
      this.pdf.setLineWidth(1.5);
      this.pdf.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'S');
      
      // Banda de color superior
      this.pdf.setFillColor(card.color[0], card.color[1], card.color[2]);
      this.pdf.rect(x + 1, y + 1, cardWidth - 2, 3, 'F');
      
      // Icono y título
      this.pdf.setFontSize(8);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setTextColor(75, 85, 99); // gray-600
      this.pdf.text(`${card.icon} ${card.title}`, x + 3, y + 8);
      
      // Valor principal
      this.pdf.setFontSize(14);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setTextColor(card.color[0], card.color[1], card.color[2]);
      this.pdf.text(card.value, x + 3, y + 16);
      
      // Subtítulo
      this.pdf.setFontSize(7);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setTextColor(107, 114, 128); // gray-500
      this.pdf.text(card.subtitle, x + 3, y + 22);
    });
    
    this.currentY += (cardHeight * 2) + spacing + 20;
  }

  /**
   * Añade la tabla de asistencias con diseño mejorado
   */
  private addAttendanceTable(attendances: Attendance[]): void {
    // Verificar si necesitamos nueva página
    if (this.currentY > this.pageHeight - 100) {
      this.addNewPage();
    }
    
    // Título de sección con icono
    this.pdf.setFontSize(16);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(17, 24, 39);
    this.pdf.text('📋 DETALLE DE ASISTENCIAS', this.margin, this.currentY);
    
    this.currentY += 12;
    
    // Subtítulo con total de registros
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setTextColor(107, 114, 128);
    this.pdf.text(`Total de registros: ${attendances.length}`, this.margin, this.currentY);
    
    this.currentY += 8;
    
    // Preparar datos de la tabla
    const tableData = [
      ['📅 Fecha', '🕐 Entrada', '🕐 Salida', '⏱️ Horas', '📊 Estado']
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
        ? '✅ Completo'
        : attendance.check_in_time
        ? '⚠️ Incompleto'
        : '❌ Ausente';
      
      tableData.push([date, checkIn, checkOut, hours, status]);
    });
    
    this.addTable(tableData);
  }

  /**
   * Añade una tabla moderna con mejor diseño
   */
  private addModernTable(data: string[][]): void {
    const colWidths = [38, 28, 28, 22, 32]; // Anchos de columnas ajustados
    const rowHeight = 10;
    const headerHeight = 12;
    
    // Header con gradiente
    this.pdf.setFillColor(59, 130, 246); // blue-500
    this.pdf.setTextColor(255, 255, 255); // white
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(9);
    
    let xPos = this.margin;
    data[0].forEach((header, i) => {
      this.pdf.roundedRect(xPos, this.currentY, colWidths[i], headerHeight, 1, 1, 'F');
      
      // Texto del header centrado
      const textWidth = this.pdf.getTextWidth(header);
      const centerX = xPos + (colWidths[i] / 2) - (textWidth / 2);
      this.pdf.text(header, centerX, this.currentY + 8);
      xPos += colWidths[i];
    });
    
    this.currentY += headerHeight;
    
    // Filas de datos con colores alternados
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(8);
    
    for (let i = 1; i < data.length; i++) {
      // Verificar si necesitamos nueva página
      if (this.currentY + rowHeight > this.pageHeight - this.margin) {
        this.addNewPage();
        // Re-dibujar header en nueva página
        this.pdf.setFillColor(59, 130, 246);
        this.pdf.setTextColor(255, 255, 255);
        this.pdf.setFont('helvetica', 'bold');
        this.pdf.setFontSize(9);
        
        let headerXPos = this.margin;
        data[0].forEach((header, j) => {
          this.pdf.roundedRect(headerXPos, this.currentY, colWidths[j], headerHeight, 1, 1, 'F');
          const textWidth = this.pdf.getTextWidth(header);
          const centerX = headerXPos + (colWidths[j] / 2) - (textWidth / 2);
          this.pdf.text(header, centerX, this.currentY + 8);
          headerXPos += colWidths[j];
        });
        
        this.currentY += headerHeight;
        this.pdf.setFont('helvetica', 'normal');
        this.pdf.setFontSize(8);
      }
      
      xPos = this.margin;
      
      // Color de fila alternado
      if (i % 2 === 0) {
        this.pdf.setFillColor(248, 250, 252); // gray-50
      } else {
        this.pdf.setFillColor(255, 255, 255); // white
      }
      
      // Color de texto basado en el estado (última columna)
      const status = data[i][4];
      if (status.includes('Completo')) {
        this.pdf.setTextColor(21, 128, 61); // green-700
      } else if (status.includes('Incompleto')) {
        this.pdf.setTextColor(180, 83, 9); // amber-700
      } else if (status.includes('Ausente')) {
        this.pdf.setTextColor(185, 28, 28); // red-700
      } else {
        this.pdf.setTextColor(55, 65, 81); // gray-700
      }
      
      data[i].forEach((cell, j) => {
        // Fondo de celda
        this.pdf.rect(xPos, this.currentY, colWidths[j], rowHeight, 'F');
        
        // Borde sutil
        this.pdf.setDrawColor(226, 232, 240); // gray-300
        this.pdf.setLineWidth(0.2);
        this.pdf.rect(xPos, this.currentY, colWidths[j], rowHeight, 'S');
        
        // Texto de la celda
        if (j === 4) {
          // Para la columna de estado, mantener el color específico
          // (ya establecido arriba)
        } else {
          this.pdf.setTextColor(55, 65, 81); // gray-700 para otras columnas
        }
        
        this.pdf.text(cell, xPos + 2, this.currentY + 6);
        xPos += colWidths[j];
      });
      
      this.currentY += rowHeight;
    }
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
   * Añade un footer moderno con diseño profesional
   */
  private addFooter(): void {
    const footerY = this.pageHeight - 25;
    
    // Línea separadora
    this.pdf.setDrawColor(226, 232, 240); // gray-300
    this.pdf.setLineWidth(0.5);
    this.pdf.line(this.margin, footerY - 5, this.pageWidth - this.margin, footerY - 5);
    
    // Fondo del footer
    this.pdf.setFillColor(248, 250, 252); // gray-50
    this.pdf.rect(0, footerY, this.pageWidth, 25, 'F');
    
    // Información de generación (izquierda)
    this.pdf.setFontSize(8);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setTextColor(107, 114, 128); // gray-500
    
    const generatedText = `📄 Generado el ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`;
    this.pdf.text(generatedText, this.margin, footerY + 8);
    
    // Logo/marca (centro)
    this.pdf.setFontSize(9);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(59, 130, 246); // blue-500
    const brandText = '🎓 Sistema Educa - Control de Asistencias';
    this.pdf.text(brandText, this.pageWidth / 2, footerY + 8, { align: 'center' });
    
    // URL o contacto (derecha)
    this.pdf.setFontSize(8);
    this.pdf.setFont('helvetica', 'italic');
    this.pdf.setTextColor(107, 114, 128);
    const contactText = '📧 soporte@sistemaeduca.com';
    this.pdf.text(contactText, this.pageWidth - this.margin, footerY + 8, { align: 'right' });
    
    // Información adicional (segunda línea)
    this.pdf.setFontSize(7);
    this.pdf.setTextColor(156, 163, 175); // gray-400
    const confidentialText = '🔒 Documento confidencial - Solo para uso interno';
    this.pdf.text(confidentialText, this.pageWidth / 2, footerY + 15, { align: 'center' });
  }
}

/**
 * Función helper para generar reporte PDF
 */
export async function generateAttendanceReport(data: ReportData): Promise<void> {
  const pdfService = new PDFReportService();
  await pdfService.generateReport(data);
}
