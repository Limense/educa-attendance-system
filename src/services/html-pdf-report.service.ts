/**
 * =============================================
 * HTML PDF REPORT SERVICE
 * =============================================
 * 
 * Descripción: Servicio mejorado para generar PDFs profesionales usando HTML/CSS
 * Características: Plantillas HTML, CSS moderno, gráficos, diseño responsive
 */

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
 * Servicio HTML para generar PDFs modernos
 */
export class HTMLPDFReportService {
  /**
   * Genera el HTML completo del reporte
   */
  generateReportHTML(data: ReportData): string {
    const css = this.getReportCSS();
    const htmlContent = this.getReportHTML(data);
    
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reporte de Asistencia - ${data.employee.first_name} ${data.employee.last_name}</title>
        <style>${css}</style>
      </head>
      <body>
        ${htmlContent}
      </body>
      </html>
    `;
  }

  /**
   * CSS moderno y profesional para el reporte
   */
  private getReportCSS(): string {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        color: #1f2937;
        background: #ffffff;
      }
      
      .report-container {
        max-width: 210mm;
        margin: 0 auto;
        background: white;
        min-height: 297mm;
      }
      
      /* HEADER STYLES */
      .report-header {
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        color: white;
        padding: 40px 30px;
        text-align: center;
        position: relative;
        overflow: hidden;
      }
      
      .report-header::before {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
        animation: shimmer 3s ease-in-out infinite;
      }
      
      @keyframes shimmer {
        0%, 100% { transform: translateX(-100px) translateY(-100px); }
        50% { transform: translateX(100px) translateY(100px); }
      }
      
      .report-title {
        font-size: 32px;
        font-weight: 800;
        margin-bottom: 8px;
        text-shadow: 0 2px 4px rgba(0,0,0,0.3);
      }
      
      .report-subtitle {
        font-size: 16px;
        opacity: 0.9;
        margin-bottom: 20px;
      }
      
      .employee-info-header {
        background: rgba(255,255,255,0.2);
        border-radius: 12px;
        padding: 15px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.3);
      }
      
      .employee-name {
        font-size: 20px;
        font-weight: 600;
        margin-bottom: 5px;
      }
      
      .employee-code {
        font-size: 14px;
        opacity: 0.9;
      }
      
      /* CONTENT STYLES */
      .report-content {
        padding: 30px;
        display: grid;
        gap: 25px;
      }
      
      .section-card {
        background: white;
        border-radius: 16px;
        padding: 25px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        border: 1px solid #e5e7eb;
      }
      
      .section-title {
        font-size: 18px;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 15px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      /* EMPLOYEE INFO CARD */
      .employee-details {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
      }
      
      .detail-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 0;
      }
      
      .detail-icon {
        font-size: 16px;
        width: 24px;
        text-align: center;
      }
      
      /* PERIOD CARD */
      .period-card {
        background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
        border: 2px solid #93c5fd;
        text-align: center;
      }
      
      .period-dates {
        font-size: 18px;
        font-weight: 600;
        color: #1d4ed8;
        margin-top: 10px;
      }
      
      /* STATS DASHBOARD */
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
        margin-top: 15px;
      }
      
      .stat-card {
        background: white;
        border-radius: 12px;
        padding: 20px;
        text-align: center;
        position: relative;
        border: 2px solid;
        transition: transform 0.2s ease;
      }
      
      .stat-card:hover {
        transform: translateY(-2px);
      }
      
      .stat-card.excellent { border-color: #10b981; }
      .stat-card.good { border-color: #3b82f6; }
      .stat-card.warning { border-color: #f59e0b; }
      .stat-card.danger { border-color: #ef4444; }
      
      .stat-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        border-radius: 12px 12px 0 0;
        background: inherit;
      }
      
      .stat-icon {
        font-size: 24px;
        margin-bottom: 8px;
      }
      
      .stat-value {
        font-size: 28px;
        font-weight: 800;
        margin-bottom: 4px;
      }
      
      .stat-card.excellent .stat-value { color: #10b981; }
      .stat-card.good .stat-value { color: #3b82f6; }
      .stat-card.warning .stat-value { color: #f59e0b; }
      .stat-card.danger .stat-value { color: #ef4444; }
      
      .stat-label {
        font-size: 12px;
        font-weight: 600;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .stat-subtitle {
        font-size: 11px;
        color: #9ca3af;
        margin-top: 4px;
      }
      
      /* TABLE STYLES */
      .attendance-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 15px;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      
      .attendance-table th {
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        color: white;
        padding: 15px 12px;
        text-align: left;
        font-weight: 600;
        font-size: 14px;
      }
      
      .attendance-table td {
        padding: 12px;
        border-bottom: 1px solid #e5e7eb;
        font-size: 13px;
      }
      
      .attendance-table tr:nth-child(even) {
        background-color: #f9fafb;
      }
      
      .attendance-table tr:hover {
        background-color: #f3f4f6;
      }
      
      .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .status-complete {
        background: #d1fae5;
        color: #065f46;
      }
      
      .status-incomplete {
        background: #fef3c7;
        color: #92400e;
      }
      
      .status-absent {
        background: #fee2e2;
        color: #991b1b;
      }
      
      /* FOOTER */
      .report-footer {
        margin-top: 30px;
        padding: 20px 30px;
        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        text-align: center;
        font-size: 12px;
        color: #64748b;
        border-top: 3px solid #3b82f6;
      }
      
      .footer-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      
      .footer-brand {
        font-weight: 600;
        color: #3b82f6;
      }
      
      .footer-confidential {
        color: #94a3b8;
        font-style: italic;
      }
      
      /* PRINT STYLES */
      @media print {
        .report-container {
          max-width: none;
          margin: 0;
        }
        
        .section-card {
          box-shadow: none;
          border: 1px solid #e5e7eb;
        }
        
        .stat-card:hover {
          transform: none;
        }
        
        .report-header::before {
          animation: none;
        }
      }
      
      /* RESPONSIVE */
      @media (max-width: 768px) {
        .stats-grid {
          grid-template-columns: repeat(2, 1fr);
        }
        
        .employee-details {
          grid-template-columns: 1fr;
        }
        
        .footer-info {
          flex-direction: column;
          gap: 8px;
        }
      }
    `;
  }

  /**
   * Genera el HTML del contenido del reporte
   */
  private getReportHTML(data: ReportData): string {
    const startDate = format(parseISO(data.period.startDate), 'dd/MM/yyyy', { locale: es });
    const endDate = format(parseISO(data.period.endDate), 'dd/MM/yyyy', { locale: es });
    const generatedDate = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es });
    
    return `
      <div class="report-container">
        <!-- Header -->
        <header class="report-header">
          <h1 class="report-title">📊 REPORTE DE ASISTENCIA</h1>
          <p class="report-subtitle">Sistema de Control de Asistencias Educa</p>
          
          <div class="employee-info-header">
            <div class="employee-name">${data.employee.first_name} ${data.employee.last_name}</div>
            <div class="employee-code">Código: ${data.employee.employee_code}</div>
          </div>
        </header>

        <!-- Content -->
        <main class="report-content">
          
          <!-- Employee Information -->
          <section class="section-card">
            <h2 class="section-title">
              <span>👤</span> Información del Empleado
            </h2>
            <div class="employee-details">
              <div class="detail-item">
                <span class="detail-icon">📧</span>
                <span><strong>Email:</strong> ${data.employee.email}</span>
              </div>
              <div class="detail-item">
                <span class="detail-icon">🆔</span>
                <span><strong>Código:</strong> ${data.employee.employee_code}</span>
              </div>
              <div class="detail-item">
                <span class="detail-icon">🏢</span>
                <span><strong>Departamento:</strong> ${data.employee.department?.name || 'No asignado'}</span>
              </div>
              <div class="detail-item">
                <span class="detail-icon">💼</span>
                <span><strong>Posición:</strong> ${data.employee.position?.title || 'No asignada'}</span>
              </div>
            </div>
          </section>

          <!-- Period -->
          <section class="section-card period-card">
            <h2 class="section-title">
              <span>📅</span> Período del Reporte
            </h2>
            <div class="period-dates">
              📍 ${startDate} &nbsp;&nbsp;&nbsp; 🏁 ${endDate}
            </div>
          </section>

          <!-- Statistics -->
          <section class="section-card">
            <h2 class="section-title">
              <span>📊</span> Resumen Estadístico
            </h2>
            
            <div class="stats-grid">
              ${this.generateStatsCards(data.stats)}
            </div>
          </section>

          <!-- Attendance Table -->
          <section class="section-card">
            <h2 class="section-title">
              <span>📋</span> Detalle de Asistencias
            </h2>
            <p style="color: #6b7280; margin-bottom: 15px;">
              Total de registros: ${data.attendances.length}
            </p>
            
            <table class="attendance-table">
              <thead>
                <tr>
                  <th>📅 Fecha</th>
                  <th>🕐 Entrada</th>
                  <th>🕐 Salida</th>
                  <th>⏱️ Horas</th>
                  <th>📊 Estado</th>
                </tr>
              </thead>
              <tbody>
                ${this.generateAttendanceRows(data.attendances)}
              </tbody>
            </table>
          </section>
        </main>

        <!-- Footer -->
        <footer class="report-footer">
          <div class="footer-info">
            <span>📄 Generado el ${generatedDate}</span>
            <span class="footer-brand">🎓 Sistema Educa</span>
            <span>📧 soporte@sistemaeduca.com</span>
          </div>
          <div class="footer-confidential">
            🔒 Documento confidencial - Solo para uso interno
          </div>
        </footer>
      </div>
    `;
  }

  /**
   * Genera las tarjetas de estadísticas
   */
  private generateStatsCards(stats: ReportData['stats']): string {
    const cards = [
      {
        icon: '✅',
        label: 'Asistencia',
        value: `${stats.attendanceRate.toFixed(1)}%`,
        subtitle: `${stats.presentDays}/${stats.workDays} días`,
        type: stats.attendanceRate >= 90 ? 'excellent' : stats.attendanceRate >= 80 ? 'good' : stats.attendanceRate >= 70 ? 'warning' : 'danger'
      },
      {
        icon: '⏰',
        label: 'Puntualidad',
        value: `${stats.punctualityRate.toFixed(1)}%`,
        subtitle: `${stats.presentDays - stats.incompleteDays}/${stats.presentDays} días`,
        type: stats.punctualityRate >= 90 ? 'excellent' : stats.punctualityRate >= 80 ? 'good' : stats.punctualityRate >= 70 ? 'warning' : 'danger'
      },
      {
        icon: '🕐',
        label: 'Horas Totales',
        value: `${stats.totalHours.toFixed(0)}h`,
        subtitle: `Promedio: ${stats.averageHours.toFixed(1)}h/día`,
        type: 'good'
      },
      {
        icon: '❌',
        label: 'Ausencias',
        value: stats.absentDays.toString(),
        subtitle: `de ${stats.workDays} laborables`,
        type: stats.absentDays === 0 ? 'excellent' : stats.absentDays <= 2 ? 'good' : stats.absentDays <= 5 ? 'warning' : 'danger'
      },
      {
        icon: '⏱️',
        label: 'Horas Extra',
        value: `${stats.overtimeHours.toFixed(1)}h`,
        subtitle: 'Tiempo adicional',
        type: 'good'
      },
      {
        icon: '⚠️',
        label: 'Incompletos',
        value: stats.incompleteDays.toString(),
        subtitle: 'días sin salida',
        type: stats.incompleteDays === 0 ? 'excellent' : stats.incompleteDays <= 2 ? 'good' : stats.incompleteDays <= 5 ? 'warning' : 'danger'
      }
    ];

    return cards.map(card => `
      <div class="stat-card ${card.type}">
        <div class="stat-icon">${card.icon}</div>
        <div class="stat-value">${card.value}</div>
        <div class="stat-label">${card.label}</div>
        <div class="stat-subtitle">${card.subtitle}</div>
      </div>
    `).join('');
  }

  /**
   * Genera las filas de la tabla de asistencias
   */
  private generateAttendanceRows(attendances: Attendance[]): string {
    return attendances.map(attendance => {
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
      
      const statusInfo = attendance.check_in_time && attendance.check_out_time
        ? { text: 'Completo', class: 'status-complete', icon: '✅' }
        : attendance.check_in_time
        ? { text: 'Incompleto', class: 'status-incomplete', icon: '⚠️' }
        : { text: 'Ausente', class: 'status-absent', icon: '❌' };
      
      return `
        <tr>
          <td>${date}</td>
          <td>${checkIn}</td>
          <td>${checkOut}</td>
          <td>${hours}</td>
          <td>
            <span class="status-badge ${statusInfo.class}">
              ${statusInfo.icon} ${statusInfo.text}
            </span>
          </td>
        </tr>
      `;
    }).join('');
  }
}

/**
 * Función para generar y descargar el PDF usando HTML
 */
export async function generateHTMLAttendanceReport(data: ReportData): Promise<void> {
  const service = new HTMLPDFReportService();
  const htmlContent = service.generateReportHTML(data);
  
  // Crear una ventana temporal para mostrar el HTML
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Esperar a que cargue el CSS y luego imprimir
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }
}
