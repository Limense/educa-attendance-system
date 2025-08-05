/**
 * LISTA DE EMPLEADOS - DISEÑO MEJORADO Y MODERNO
 */

'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Employee } from '@/hooks/useEmployees';
import { 
  Edit, 
  Trash2, 
  Plus, 
  Search, 
  Filter,
  Users,
  Mail,
  Phone,
  Building,
  Briefcase,
  Calendar,
  UserCheck,
  UserX,
  Grid3X3,
  List
} from 'lucide-react';

interface EmployeeListProps {
  employees: Employee[];
  loading: boolean;
  error: string | null;
  onEmployeeCreate?: () => void;
  onEmployeeEdit?: (employee: Employee) => void;
  onEmployeeDelete?: (employeeId: string) => void;
  onEmployeeToggleStatus?: (employeeId: string, isActive: boolean) => void;
}

export default function EmployeeList({ 
  employees,
  loading,
  error,
  onEmployeeCreate,
  onEmployeeEdit,
  onEmployeeDelete,
  onEmployeeToggleStatus
}: EmployeeListProps) {
  // Ya no necesitamos el hook aquí porque los datos vienen como props
  // const { employees, loading, error } = useEmployees(organizationId);
  
  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filtrar empleados basado en búsqueda y filtros
  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => {
      const matchesSearch = 
        employee.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.departments?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.positions?.title.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = 
        filterStatus === 'all' || 
        (filterStatus === 'active' && employee.is_active) ||
        (filterStatus === 'inactive' && !employee.is_active);
      
      return matchesSearch && matchesStatus;
    });
  }, [employees, searchTerm, filterStatus]);

  // Estadísticas
  const stats = useMemo(() => {
    const active = employees.filter(emp => emp.is_active).length;
    const inactive = employees.length - active;
    const departments = new Set(employees.map(emp => emp.departments?.name).filter(Boolean)).size;
    
    return { total: employees.length, active, inactive, departments };
  }, [employees]);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <Card className="p-6">
          <div className="flex justify-between items-center">
            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
        </Card>
        
        {/* Stats skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-4">
              <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
            </Card>
          ))}
        </div>
        
        {/* Content skeleton */}
        <Card className="p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 font-medium">Cargando empleados...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserX className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar empleados</h3>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con título y botón principal */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600" />
              Gestión de Empleados
            </h1>
            <p className="text-gray-600 mt-1">Administra el equipo de tu organización</p>
          </div>
          {onEmployeeCreate && (
            <Button onClick={onEmployeeCreate} className="flex items-center gap-2 shadow-lg">
              <Plus className="w-4 h-4" />
              Nuevo Empleado
            </Button>
          )}
        </div>
      </Card>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Empleados</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        
        <Card className="p-4 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Empleados Activos</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <UserCheck className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        
        <Card className="p-4 border-l-4 border-l-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Empleados Inactivos</p>
              <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
            </div>
            <UserX className="w-8 h-8 text-red-500" />
          </div>
        </Card>
        
        <Card className="p-4 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Departamentos</p>
              <p className="text-2xl font-bold text-purple-600">{stats.departments}</p>
            </div>
            <Building className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Controles de búsqueda y filtros */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Barra de búsqueda */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre, email, departamento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filtro de estado */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Solo activos</option>
                <option value="inactive">Solo inactivos</option>
              </select>
            </div>
          </div>
          
          {/* Controles de vista */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="px-3 py-1"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="px-3 py-1"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Resultados de búsqueda */}
        {searchTerm && (
          <div className="mt-3 text-sm text-gray-600">
            Mostrando {filteredEmployees.length} de {employees.length} empleados
          </div>
        )}
      </Card>

      {/* Lista/Grid de empleados */}
      {filteredEmployees.length === 0 ? (
        <Card className="p-8">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No se encontraron empleados' : 'No hay empleados registrados'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? 'Intenta con otros términos de búsqueda'
                : 'Comienza agregando empleados a tu organización'
              }
            </p>
            {onEmployeeCreate && !searchTerm && (
              <Button onClick={onEmployeeCreate} variant="outline" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Crear primer empleado
              </Button>
            )}
          </div>
        </Card>
      ) : viewMode === 'grid' ? (
        /* Vista de Grid - Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredEmployees.map((employee) => (
            <Card key={employee.id} className="p-6 hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg text-gray-900">{employee.full_name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      employee.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {employee.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{employee.employee_code}</p>
                </div>
                
                <div className="flex items-center gap-1">
                  {onEmployeeEdit && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onEmployeeEdit(employee)}
                      className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                      title="Editar empleado"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                  {onEmployeeToggleStatus && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onEmployeeToggleStatus(employee.id, !employee.is_active)}
                      className={`h-8 w-8 p-0 ${
                        employee.is_active 
                          ? 'hover:bg-red-50 hover:text-red-600' 
                          : 'hover:bg-green-50 hover:text-green-600'
                      }`}
                      title={employee.is_active ? 'Desactivar empleado' : 'Activar empleado'}
                    >
                      {employee.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                    </Button>
                  )}
                  {onEmployeeDelete && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onEmployeeDelete(employee.id)}
                      className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                      title="Eliminar empleado"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="truncate">{employee.email}</span>
                </div>
                
                {employee.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{employee.phone}</span>
                  </div>
                )}
                
                {employee.departments && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building className="w-4 h-4 text-gray-400" />
                    <span>{employee.departments.name}</span>
                  </div>
                )}
                
                {employee.positions && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Briefcase className="w-4 h-4 text-gray-400" />
                    <span>{employee.positions.title}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>Ingreso: {new Date(employee.hire_date).toLocaleDateString('es-ES')}</span>
                </div>
                
                <div className="pt-2 border-t">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    employee.role === 'admin' || employee.role === 'super_admin'
                      ? 'bg-purple-100 text-purple-800'
                      : employee.role === 'manager'
                      ? 'bg-blue-100 text-blue-800'
                      : employee.role === 'supervisor'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {employee.role}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* Vista de Lista - Tabla */
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empleado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Departamento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{employee.full_name}</div>
                        <div className="text-sm text-gray-500">{employee.employee_code}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{employee.email}</div>
                      {employee.phone && (
                        <div className="text-sm text-gray-500">{employee.phone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{employee.departments?.name || '-'}</div>
                      <div className="text-sm text-gray-500">{employee.positions?.title || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        employee.role === 'admin' || employee.role === 'super_admin'
                          ? 'bg-purple-100 text-purple-800'
                          : employee.role === 'manager'
                          ? 'bg-blue-100 text-blue-800'
                          : employee.role === 'supervisor'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {employee.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        employee.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {employee.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {onEmployeeEdit && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onEmployeeEdit(employee)}
                            className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                            title="Editar empleado"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {onEmployeeToggleStatus && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onEmployeeToggleStatus(employee.id, !employee.is_active)}
                            className={`h-8 w-8 p-0 ${
                              employee.is_active 
                                ? 'hover:bg-red-50 hover:text-red-600' 
                                : 'hover:bg-green-50 hover:text-green-600'
                            }`}
                            title={employee.is_active ? 'Desactivar empleado' : 'Activar empleado'}
                          >
                            {employee.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </Button>
                        )}
                        {onEmployeeDelete && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onEmployeeDelete(employee.id)}
                            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                            title="Eliminar empleado"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
