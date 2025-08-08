/**
 * =============================================
 * COMPONENTE ASISTENCIAS DE TODOS LOS EMPLEADOS
 * =============================================
 * 
 * Muestra una tabla completa con las asistencias de todos los empleados
 * Incluye filtros por fecha, estado y departamento
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Calendar, 
  Download, 
  RefreshCw,
  Search,
  Clock,
  MapPin
} from 'lucide-react';
import { createSupabaseClient } from '@/lib/supabase/client';
import { inspectAttendancesTable, inspectEmployeesTable, countRecords } from '@/utils/database-inspector';

// Tipos para las asistencias
interface AttendanceRecord {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_code: string;
  department_name: string;
  attendance_date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  work_hours: number | null;
  overtime_hours: number | null;
  status: string;
  location_info: string | null;
}

// Tipo para datos de asistencia de la base de datos
interface LocationData {
  address?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  [key: string]: unknown;
}

interface AttendanceData {
  id: string;
  employee_id: string;
  attendance_date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  work_hours: number | null;
  overtime_hours: number | null;
  status: string;
  location_data: LocationData | null;
}

// Tipo para consultas generales de attendances (con todas las columnas)
interface AttendanceRaw {
  id: string;
  employee_id: string;
  attendance_date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  work_hours: number | null;
  overtime_hours: number | null;
  status: string;
  location_data: LocationData | null;
  [key: string]: unknown; // Para otras columnas que puedan existir
}

export function AllEmployeeAttendance() {
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [filteredAttendances, setFilteredAttendances] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para filtros
  const [filters, setFilters] = useState({
    dateFrom: (() => {
      const date = new Date();
      date.setDate(date.getDate() - 7); // 7 días atrás
      return date.toISOString().split('T')[0];
    })(),
    dateTo: new Date().toISOString().split('T')[0], // Hoy
    search: '',
    status: '',
    department: ''
  });

  const [departments, setDepartments] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const supabase = createSupabaseClient();

  // Función para cargar asistencias
  const loadAttendances = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📊 Cargando asistencias de todos los empleados...');
      console.log('📅 Filtros de fecha:', {
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        dateFromISO: new Date(filters.dateFrom).toISOString(),
        dateToISO: new Date(filters.dateTo).toISOString()
      });

      // INSPECCIONAR ESTRUCTURA DE LA BASE DE DATOS
      console.log('🔍 === INSPECCIÓN DE BASE DE DATOS ===');
      await inspectAttendancesTable();
      await inspectEmployeesTable();
      await countRecords();
      console.log('🔍 === FIN INSPECCIÓN ===');

      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendances')
        .select(`
          id,
          employee_id,
          attendance_date,
          check_in_time,
          check_out_time,
          work_hours,
          overtime_hours,
          status,
          location_data
        `)
        .gte('attendance_date', filters.dateFrom)
        .lte('attendance_date', filters.dateTo)
        .order('attendance_date', { ascending: false })
        .order('check_in_time', { ascending: false });

      if (attendanceError) {
        throw new Error(`Error cargando asistencias: ${attendanceError.message}`);
      }

      console.log('✅ Asistencias cargadas:', attendanceData?.length || 0);
      
      if (attendanceData && attendanceData.length > 0) {
        console.log('📅 Muestra de fechas cargadas:', attendanceData.slice(0, 3).map((att: AttendanceData) => ({
          id: att.id,
          attendance_date: att.attendance_date,
          parsed_date: new Date(att.attendance_date).toISOString(),
          local_date: new Date(att.attendance_date).toLocaleDateString('es-ES')
        })));
      }

      if (!attendanceData || attendanceData.length === 0) {
        setAttendances([]);
        return;
      }

      // Obtener IDs únicos de empleados
      const employeeIds = [...new Set(attendanceData.map((att: AttendanceData) => att.employee_id))];

      // Cargar datos de empleados
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select(`
          id,
          full_name,
          employee_code,
          department_id,
          departments (
            name
          )
        `)
        .in('id', employeeIds);

      if (employeeError) {
        console.error('Error cargando empleados:', employeeError);
      }

      // Crear mapa de empleados
      const employeeMap = new Map();
      employeeData?.forEach((emp: {
        id: string;
        full_name: string;
        employee_code: string;
        departments?: { name: string };
      }) => {
        employeeMap.set(emp.id, {
          full_name: emp.full_name,
          employee_code: emp.employee_code,
          department_name: emp.departments?.name || 'Sin Departamento'
        });
      });

      // Combinar datos
      const combinedData: AttendanceRecord[] = attendanceData.map((att: AttendanceData) => {
        const employee = employeeMap.get(att.employee_id);
        
        // Procesar información de ubicación
        let locationInfo = null;
        if (att.location_data) {
          try {
            const locationData = typeof att.location_data === 'string' 
              ? JSON.parse(att.location_data) as LocationData
              : att.location_data;
            
            if (locationData.address) {
              locationInfo = locationData.address;
            } else if (locationData.city && locationData.country) {
              locationInfo = `${locationData.city}, ${locationData.country}`;
            } else if (locationData.latitude && locationData.longitude) {
              locationInfo = `${locationData.latitude}, ${locationData.longitude}`;
            }
          } catch (error) {
            console.warn('Error procesando location_data:', error);
          }
        }
        
        return {
          id: att.id,
          employee_id: att.employee_id,
          employee_name: employee?.full_name || 'Empleado Desconocido',
          employee_code: employee?.employee_code || 'N/A',
          department_name: employee?.department_name || 'Sin Departamento',
          attendance_date: att.attendance_date,
          check_in_time: att.check_in_time,
          check_out_time: att.check_out_time,
          work_hours: att.work_hours,
          overtime_hours: att.overtime_hours,
          status: att.status,
          location_info: locationInfo
        };
      });

      setAttendances(combinedData);
      console.log('✅ Datos combinados listos:', combinedData.length);

    } catch (error) {
      console.error('❌ Error cargando asistencias:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [filters.dateFrom, filters.dateTo, supabase]);

  // Función para cargar departamentos
  const loadDepartments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('name')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error cargando departamentos:', error);
        return;
      }

      const deptNames = data?.map((dept: { name: string }) => dept.name) || [];
      setDepartments(deptNames);
    } catch (error) {
      console.error('Error cargando departamentos:', error);
    }
  }, [supabase]);

  // Aplicar filtros
  const applyFilters = useCallback(() => {
    let filtered = [...attendances];

    // Filtro por búsqueda (nombre o código)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(att => 
        att.employee_name.toLowerCase().includes(searchLower) ||
        att.employee_code.toLowerCase().includes(searchLower)
      );
    }

    // Filtro por estado
    if (filters.status) {
      filtered = filtered.filter(att => att.status === filters.status);
    }

    // Filtro por departamento
    if (filters.department) {
      filtered = filtered.filter(att => att.department_name === filters.department);
    }

    setFilteredAttendances(filtered);
    setCurrentPage(1); // Resetear página
  }, [attendances, filters.search, filters.status, filters.department]);

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      await loadAttendances();
      await loadDepartments();
    };
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo cargar una vez al montar el componente

  // Aplicar filtros cuando cambien
  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attendances, filters.search, filters.status, filters.department]); // Dependencias específicas

  // Manejar cambios en filtros
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Función para inspeccionar base de datos
  const inspectDatabase = async () => {
    console.log('🔍 === INSPECCIÓN MANUAL DE BASE DE DATOS ===');
    const attendanceStructure = await inspectAttendancesTable();
    const employeeStructure = await inspectEmployeesTable();
    const counts = await countRecords();
    
    // Consulta específica para ver datos recientes
    try {
      const { data: recentAttendances, error } = await supabase
        .from('attendances')
        .select('*')
        .order('attendance_date', { ascending: false })
        .limit(5);
      
      if (error) {
        console.error('❌ Error consultando attendances recientes:', error);
      } else {
        console.log('📅 Últimas 5 asistencias:', recentAttendances);
        if (recentAttendances && recentAttendances.length > 0) {
          console.log('🗓️ Fechas encontradas:', recentAttendances.map((att: AttendanceRaw) => ({
            id: att.id,
            fecha_original: att.attendance_date,
            fecha_parsed: new Date(att.attendance_date).toISOString(),
            fecha_local: new Date(att.attendance_date).toLocaleDateString('es-ES'),
            employee_id: att.employee_id
          })));
        }
      }
    } catch (err) {
      console.error('❌ Error en consulta específica:', err);
    }
    
    console.log('📋 Resumen de inspección:');
    console.log('- Attendances estructura:', attendanceStructure ? Object.keys(attendanceStructure) : 'No data');
    console.log('- Employees estructura:', employeeStructure ? Object.keys(employeeStructure) : 'No data');
    console.log('- Conteos:', counts);
    console.log('🔍 === FIN INSPECCIÓN MANUAL ===');
  };

  // Recargar datos cuando cambien las fechas
  const handleDateChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    // Recargar datos automáticamente después de un pequeño delay
    setTimeout(() => {
      loadAttendances();
    }, 500);
  };

  // Exportar a CSV
  const exportToCSV = () => {
    if (filteredAttendances.length === 0) return;

    const csvContent = [
      // Headers
      ['Empleado', 'Código', 'Departamento', 'Fecha', 'Entrada', 'Salida', 'Horas Trabajadas', 'Horas Extra', 'Estado', 'Ubicación'].join(','),
      // Data
      ...filteredAttendances.map(att => [
        att.employee_name,
        att.employee_code,
        att.department_name,
        att.attendance_date,
        att.check_in_time || '',
        att.check_out_time || '',
        (att.work_hours || 0).toFixed(1),
        (att.overtime_hours || 0).toFixed(1),
        att.status,
        att.location_info || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asistencias-general-${filters.dateFrom}-${filters.dateTo}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Obtener color del estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'remote': return 'bg-blue-100 text-blue-800';
      case 'overtime': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Traducir estado
  const translateStatus = (status: string) => {
    const translations: Record<string, string> = {
      'present': 'Presente',
      'late': 'Tarde',
      'absent': 'Ausente',
      'remote': 'Remoto',
      'overtime': 'Tiempo Extra',
      'sick_leave': 'Incapacidad',
      'vacation': 'Vacaciones'
    };
    return translations[status] || status;
  };

  // Paginación
  const totalPages = Math.ceil(filteredAttendances.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAttendances = filteredAttendances.slice(startIndex, endIndex);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Asistencias de Todos los Empleados
          </h3>
          <p className="text-gray-600 mt-1">
            Registro completo de asistencias del {filters.dateFrom} al {filters.dateTo}
          </p>
        </div>
        
        <div className="flex items-center gap-2 mt-4 lg:mt-0">
          <Button onClick={inspectDatabase} size="sm" variant="outline">
            🔍 Inspeccionar DB
          </Button>
          <Button onClick={loadAttendances} disabled={loading} size="sm" variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button onClick={exportToCSV} disabled={filteredAttendances.length === 0} size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        {/* Fecha desde */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleDateChange('dateFrom', e.target.value)}
            className="w-full"
          />
        </div>

        {/* Fecha hasta */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleDateChange('dateTo', e.target.value)}
            className="w-full"
          />
        </div>

        {/* Búsqueda */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Nombre o código..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Estado */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Todos</option>
            <option value="present">Presente</option>
            <option value="late">Tarde</option>
            <option value="absent">Ausente</option>
            <option value="remote">Remoto</option>
            <option value="overtime">Tiempo Extra</option>
          </select>
        </div>

        {/* Departamento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
          <select
            value={filters.department}
            onChange={(e) => handleFilterChange('department', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Todos</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Resumen */}
      <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
        <span>
          Mostrando {startIndex + 1}-{Math.min(endIndex, filteredAttendances.length)} de {filteredAttendances.length} registros
        </span>
        <span>
          Total asistencias: {attendances.length}
        </span>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Empleado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Departamento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Entrada
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Salida
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Horas
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ubicación
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentAttendances.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay registros</h3>
                  <p className="text-gray-500">
                    No se encontraron asistencias con los filtros aplicados
                  </p>
                </td>
              </tr>
            ) : (
              currentAttendances.map((attendance, index) => (
                <tr key={attendance.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {attendance.employee_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {attendance.employee_code}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{attendance.department_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 flex items-center">
                      <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                      {new Date(attendance.attendance_date + 'T00:00:00').toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 flex items-center">
                      <Clock className="w-4 h-4 mr-1 text-green-400" />
                      {attendance.check_in_time || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 flex items-center">
                      <Clock className="w-4 h-4 mr-1 text-red-400" />
                      {attendance.check_out_time || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div>{(attendance.work_hours || 0).toFixed(1)}h</div>
                      {(attendance.overtime_hours || 0) > 0 && (
                        <div className="text-xs text-purple-600">
                          +{(attendance.overtime_hours || 0).toFixed(1)}h extra
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(attendance.status)}`}>
                      {translateStatus(attendance.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {attendance.location_info && (
                      <div className="text-sm text-gray-500 flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span className="truncate max-w-32" title={attendance.location_info}>
                          {attendance.location_info}
                        </span>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              size="sm"
              variant="outline"
            >
              Anterior
            </Button>
            <span className="text-sm text-gray-600">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              size="sm"
              variant="outline"
            >
              Siguiente
            </Button>
          </div>
          
          <div className="text-sm text-gray-500">
            {itemsPerPage} registros por página
          </div>
        </div>
      )}
    </Card>
  );
}
