/**
 * =============================================
 * SERVICIO DE EXPORTACIÓN DE REPORTES
 * =============================================
 * 
 * Servicio centralizado para exportar reportes a PDF y Excel
 */

import type { AttendanceRecord, ReportFilters, ReportStats } from '@/types/reports.types';

// Tipos para exportación
export interface ExportOptions {
  format: 'pdf' | 'excel';
  template?: 'professional' | 'simple' | 'detailed';
  includeCharts?: boolean;
  includeStats?: boolean;
  organizationInfo?: {
    name: string;
    logo?: string;
    address?: string;
    phone?: string;
  };
}

export interface ExportData {
  data: AttendanceRecord[];
  stats?: ReportStats;  // Cambiado a opcional
  filters: ReportFilters;
  metadata: {
    generatedAt: string;
    generatedBy: string;
    reportTitle: string;
    period: string;
  };
}

export class ReportExportService {
  
  /**
   * Exportar reporte según el formato especificado
   */
  static async exportReport(
    exportData: ExportData, 
    options: ExportOptions
  ): Promise<void> {
    console.log('🚀 Iniciando exportación:', { format: options.format, template: options.template });
    
    try {
      switch (options.format) {
        case 'pdf':
          await this.exportToPDF(exportData, options);
          break;
        case 'excel':
          await this.exportToExcel(exportData, options);
          break;
        default:
          throw new Error(`Formato no soportado: ${options.format}`);
      }
    } catch (error) {
      console.error('❌ Error en exportación:', error);
      throw error;
    }
  }

  /**
   * Exportar a PDF usando plantillas HTML
   */
  private static async exportToPDF(
    exportData: ExportData, 
    options: ExportOptions
  ): Promise<void> {
    console.log('📄 Generando PDF...');
    
    // Generar HTML desde plantilla
    const htmlContent = await this.generateHTMLTemplate(exportData, options);
    
    // Convertir HTML a PDF (implementaremos esto)
    await this.convertHTMLToPDF(htmlContent, exportData.metadata.reportTitle);
  }

  /**
   * Exportar a Excel con datos estructurados
   */
  private static async exportToExcel(
    exportData: ExportData, 
    options: ExportOptions
  ): Promise<void> {
    console.log('📊 Generando Excel...');
    
    // Generar archivo Excel (implementaremos esto)
    await this.generateExcelFile(exportData, options);
  }

  /**
   * Generar HTML desde plantillas
   */
  private static async generateHTMLTemplate(
    exportData: ExportData,
    options: ExportOptions
  ): Promise<string> {
    const template = options.template || 'professional';
    
    switch (template) {
      case 'professional':
        return this.generateProfessionalTemplate(exportData, options);
      case 'simple':
        return this.generateSimpleTemplate(exportData, options);
      case 'detailed':
        return this.generateDetailedTemplate(exportData, options);
      default:
        return this.generateProfessionalTemplate(exportData, options);
    }
  }

  /**
   * Plantilla profesional con diseño corporativo
   */
  private static generateProfessionalTemplate(
    exportData: ExportData,
    options: ExportOptions
  ): string {
    const { data, stats, filters, metadata } = exportData;
    const orgInfo = options.organizationInfo;

    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${metadata.reportTitle}</title>
      <style>
        ${this.getProfessionalCSS()}
      </style>
    </head>
    <body>
      <!-- Header Corporativo -->
      <div class="header">
        <div class="header-left">
          ${orgInfo?.logo ? `<img src="${orgInfo.logo}" alt="Logo" class="logo">` : ''}
          <div class="org-info">
            <h1>${orgInfo?.name || 'Sistema de Asistencia'}</h1>
            ${orgInfo?.address ? `<p>${orgInfo.address}</p>` : ''}
            ${orgInfo?.phone ? `<p>Tel: ${orgInfo.phone}</p>` : ''}
          </div>
        </div>
        <div class="header-right">
          <div class="report-info">
            <h2>${metadata.reportTitle}</h2>
            <p><strong>Período:</strong> ${metadata.period}</p>
            <p><strong>Generado:</strong> ${new Date(metadata.generatedAt).toLocaleString('es-ES')}</p>
            <p><strong>Por:</strong> ${metadata.generatedBy}</p>
          </div>
        </div>
      </div>

      <!-- Estadísticas Resumen -->
      ${stats ? this.generateStatsSection(stats) : ''}

      <!-- Filtros Aplicados -->
      <div class="filters-section">
        <h3>🔍 Filtros Aplicados</h3>
        <div class="filters-grid">
          <div class="filter-item">
            <strong>Fecha Inicio:</strong> ${new Date(filters.startDate).toLocaleDateString('es-ES')}
          </div>
          <div class="filter-item">
            <strong>Fecha Fin:</strong> ${new Date(filters.endDate).toLocaleDateString('es-ES')}
          </div>
          <div class="filter-item">
            <strong>Tipo de Reporte:</strong> ${this.getReportTypeLabel(filters.reportType)}
          </div>
          ${filters.status ? `
          <div class="filter-item">
            <strong>Estado:</strong> ${this.getStatusLabel(filters.status)}
          </div>
          ` : ''}
        </div>
      </div>

      <!-- Tabla de Datos -->
      <div class="data-section">
        <h3>📊 Registros de Asistencia</h3>
        ${this.generateDataTable(data)}
      </div>

      <!-- Footer -->
      <div class="footer">
        <p>Este reporte fue generado automáticamente por el Sistema de Asistencia Educa-Crea</p>
        <p>Página generada el ${new Date().toLocaleString('es-ES')}</p>
      </div>
    </body>
    </html>
    `;
  }

  /**
   * Plantilla simple para reportes rápidos
   */
  private static generateSimpleTemplate(
    exportData: ExportData,
    options: ExportOptions
  ): string {
    const { data, metadata } = exportData;
    // Se conserva 'options' para futuras expansiones
    const useOptions = options;

    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>${metadata.reportTitle}</title>
      <style>
        ${this.getSimpleCSS()}
      </style>
    </head>
    <body>
      <h1>${metadata.reportTitle}</h1>
      <p><strong>Generado:</strong> ${new Date(metadata.generatedAt).toLocaleString('es-ES')}</p>
      
      ${this.generateDataTable(data)}
      
      <footer>
        <p>Total de registros: ${data.length}</p>
      </footer>
    </body>
    </html>
    `;
  }

  /**
   * Plantilla detallada con análisis completo
   */
  private static generateDetailedTemplate(
    exportData: ExportData,
    options: ExportOptions
  ): string {
    // Similar a professional pero con más secciones de análisis
    return this.generateProfessionalTemplate(exportData, options);
  }

  /**
   * Generar sección de estadísticas
   */
  private static generateStatsSection(stats: ReportStats): string {
    return `
    <div class="stats-section">
      <h3>📈 Estadísticas del Período</h3>
      <div class="stats-grid">
        <div class="stat-card primary">
          <div class="stat-number">${stats.totalEmployees}</div>
          <div class="stat-label">Total Empleados</div>
        </div>
        <div class="stat-card success">
          <div class="stat-number">${stats.presentDays}</div>
          <div class="stat-label">Días Presentes</div>
        </div>
        <div class="stat-card warning">
          <div class="stat-number">${stats.incompleteDays}</div>
          <div class="stat-label">Registros Incompletos</div>
        </div>
        <div class="stat-card danger">
          <div class="stat-number">${stats.absentDays}</div>
          <div class="stat-label">Días Ausentes</div>
        </div>
        <div class="stat-card info">
          <div class="stat-number">${stats.attendanceRate.toFixed(1)}%</div>
          <div class="stat-label">Tasa de Asistencia</div>
        </div>
        <div class="stat-card info">
          <div class="stat-number">${stats.punctualityRate.toFixed(1)}%</div>
          <div class="stat-label">Tasa de Puntualidad</div>
        </div>
        <div class="stat-card secondary">
          <div class="stat-number">${stats.totalHours.toFixed(1)}h</div>
          <div class="stat-label">Horas Totales</div>
        </div>
        <div class="stat-card secondary">
          <div class="stat-number">${stats.averageHours.toFixed(1)}h</div>
          <div class="stat-label">Promedio por Día</div>
        </div>
      </div>
    </div>
    `;
  }

  /**
   * Generar tabla de datos
   */
  private static generateDataTable(data: AttendanceRecord[]): string {
    if (data.length === 0) {
      return '<p class="no-data">No hay registros para mostrar en el período seleccionado.</p>';
    }

    const tableRows = data.map(record => {
      const statusClass = this.getStatusClass(record.status);
      const statusLabel = this.getStatusLabel(record.status);
      
      return `
      <tr>
        <td>${new Date(record.attendance_date).toLocaleDateString('es-ES')}</td>
        <td>
          <div class="employee-info">
            <strong>${record.employee_name}</strong>
            <small>${record.employee_code}</small>
          </div>
        </td>
        <td>${record.department_name || 'Sin Depto.'}</td>
        <td class="time">${record.clock_in || '-'}</td>
        <td class="time">${record.clock_out || '-'}</td>
        <td class="hours">${record.total_hours ? record.total_hours.toFixed(1) + 'h' : '-'}</td>
        <td><span class="status ${statusClass}">${statusLabel}</span></td>
      </tr>
      `;
    }).join('');

    return `
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Empleado</th>
            <th>Departamento</th>
            <th>Entrada</th>
            <th>Salida</th>
            <th>Horas</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </div>
    `;
  }

  /**
   * CSS para plantilla profesional
   */
  private static getProfessionalCSS(): string {
    return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #fff;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 30px;
      border-bottom: 3px solid #EC5971;
      margin-bottom: 30px;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    }
    
    .header-left {
      display: flex;
      align-items: center;
      gap: 20px;
    }
    
    .logo {
      max-height: 80px;
      width: auto;
    }
    
    .org-info h1 {
      color: #EC5971;
      font-size: 28px;
      margin-bottom: 8px;
    }
    
    .org-info p {
      color: #666;
      font-size: 14px;
      margin: 2px 0;
    }
    
    .header-right .report-info {
      text-align: right;
    }
    
    .report-info h2 {
      color: #333;
      font-size: 24px;
      margin-bottom: 10px;
    }
    
    .report-info p {
      color: #666;
      font-size: 14px;
      margin: 3px 0;
    }
    
    .stats-section,
    .filters-section,
    .data-section {
      margin: 30px;
      padding: 25px;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    .stats-section h3,
    .filters-section h3,
    .data-section h3 {
      color: #333;
      font-size: 20px;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #f0f0f0;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    
    .stat-card {
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      color: white;
    }
    
    .stat-card.primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    .stat-card.success { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
    .stat-card.warning { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
    .stat-card.danger { background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%); }
    .stat-card.info { background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); }
    .stat-card.secondary { background: linear-gradient(135deg, #d299c2 0%, #fef9d7 100%); }
    
    .stat-number {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 8px;
    }
    
    .stat-label {
      font-size: 14px;
      opacity: 0.9;
    }
    
    .filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 15px;
      margin-top: 15px;
    }
    
    .filter-item {
      padding: 12px;
      background: #f8f9fa;
      border-radius: 6px;
      border-left: 4px solid #EC5971;
    }
    
    .table-container {
      overflow-x: auto;
      margin-top: 20px;
    }
    
    .data-table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    
    .data-table th {
      background: #EC5971;
      color: white;
      padding: 15px 12px;
      text-align: left;
      font-weight: 600;
      font-size: 14px;
    }
    
    .data-table td {
      padding: 12px;
      border-bottom: 1px solid #eee;
      font-size: 14px;
    }
    
    .data-table tr:nth-child(even) {
      background: #f9f9f9;
    }
    
    .data-table tr:hover {
      background: #f0f8ff;
    }
    
    .employee-info strong {
      display: block;
      color: #333;
    }
    
    .employee-info small {
      color: #666;
      font-size: 12px;
    }
    
    .time {
      font-family: 'Courier New', monospace;
      font-weight: bold;
    }
    
    .hours {
      text-align: center;
      font-weight: bold;
      color: #EC5971;
    }
    
    .status {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
    }
    
    .status.present { background: #d4edda; color: #155724; }
    .status.absent { background: #f8d7da; color: #721c24; }
    .status.incomplete { background: #fff3cd; color: #856404; }
    .status.late { background: #f0ad4e; color: #fff; }
    
    .footer {
      margin-top: 50px;
      padding: 20px 30px;
      background: #f8f9fa;
      border-top: 1px solid #ddd;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
    
    .no-data {
      text-align: center;
      padding: 40px;
      color: #666;
      font-style: italic;
    }
    
    @media print {
      .header {
        page-break-inside: avoid;
      }
      
      .stats-section,
      .filters-section,
      .data-section {
        page-break-inside: avoid;
        box-shadow: none;
        border: 1px solid #ddd;
      }
    }
    `;
  }

  /**
   * CSS para plantilla simple
   */
  private static getSimpleCSS(): string {
    return `
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
      line-height: 1.6;
    }
    
    h1 {
      color: #333;
      border-bottom: 2px solid #EC5971;
      padding-bottom: 10px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    
    th, td {
      padding: 8px 12px;
      border: 1px solid #ddd;
      text-align: left;
    }
    
    th {
      background: #f5f5f5;
      font-weight: bold;
    }
    
    tr:nth-child(even) {
      background: #f9f9f9;
    }
    `;
  }

  /**
   * Convertir HTML a PDF (placeholder para implementación)
   */
  private static async convertHTMLToPDF(htmlContent: string, filename: string): Promise<void> {
    // Por ahora, abrimos el HTML en una nueva ventana para impresión
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Esperar a que cargue y luego abrir diálogo de impresión
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
    }
  }

  /**
   * Generar archivo Excel (placeholder para implementación)
   */
  private static async generateExcelFile(
    exportData: ExportData, 
    options: ExportOptions
  ): Promise<void> {
    // Por ahora, generamos CSV
    const csvContent = this.generateCSVContent(exportData.data);
    this.downloadCSV(csvContent, `${exportData.metadata.reportTitle}.csv`);
  }

  /**
   * Generar contenido CSV
   */
  private static generateCSVContent(data: AttendanceRecord[]): string {
    const headers = ['Fecha', 'Empleado', 'Código', 'Departamento', 'Entrada', 'Salida', 'Horas', 'Estado'];
    
    const rows = data.map(record => [
      record.attendance_date,
      record.employee_name,
      record.employee_code || '',
      record.department_name || '',
      record.clock_in || '',
      record.clock_out || '',
      record.total_hours?.toString() || '',
      record.status
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return csvContent;
  }

  /**
   * Descargar archivo CSV
   */
  private static downloadCSV(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Obtener etiqueta del tipo de reporte
   */
  private static getReportTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'general': 'Reporte General',
      'individual': 'Reporte Individual',
      'department': 'Por Departamento',
      'attendance': 'Solo Asistencias',
      'punctuality': 'Análisis de Puntualidad'
    };
    return labels[type] || type;
  }

  /**
   * Obtener etiqueta del estado
   */
  private static getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'present': 'Presente',
      'absent': 'Ausente',
      'incomplete': 'Incompleto',
      'late': 'Tardío'
    };
    return labels[status] || status;
  }

  /**
   * Obtener clase CSS del estado
   */
  private static getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'present': 'present',
      'absent': 'absent',
      'incomplete': 'incomplete',
      'late': 'late'
    };
    return classes[status] || 'present';
  }
}
