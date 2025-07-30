/**
 * =============================================
 * COMPONENTE: LISTA DE EMPLEADOS
 * =============================================
 * 
 * Descripción: Componente principal para mostrar y gestionar empleados
 * Utiliza el hook useEmployeeManagement para estado y lógica
 * 
 * Principios aplicados:
 * - Separation of Concerns - UI separada de lógica de negocio
 * - Single Responsibility - Solo renderiza lista de empleados
 * - Composition over Inheritance - Compuesto de componentes menores
 */

'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEmployeeManagement } from '@/hooks/useEmployeeManagement';
import { EmployeeTableData } from '@/types/employee.types';
import { Badge } from '../ui/badge';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Mail,
  Phone
} from 'lucide-react';

interface EmployeeListProps {
  organizationId: string;
  onEmployeeCreate?: () => void;
  onEmployeeEdit?: (employee: EmployeeTableData) => void;
  onEmployeeDelete?: (employeeId: string) => void;
}

/**
 * Componente principal de lista de empleados
 */
export function EmployeeList({ 
  organizationId, 
  onEmployeeCreate,
  onEmployeeEdit,
  onEmployeeDelete 
}: EmployeeListProps) {
  const { state, actions, isLoading, error } = useEmployeeManagement({
    organizationId,
    autoLoad: true
  });

  // Estados locales para UI
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  /**
   * Manejar búsqueda en tiempo real
   */
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    actions.updateFilters({ search: term });
  };

  /**
   * Manejar selección de empleados
   */
  const handleEmployeeSelect = (employeeId: string, selected: boolean) => {
    if (selected) {
      setSelectedEmployees(prev => [...prev, employeeId]);
    } else {
      setSelectedEmployees(prev => prev.filter(id => id !== employeeId));
    }
  };

  /**
   * Manejar seleccionar todos
   */
  const handleSelectAll = () => {
    if (selectedEmployees.length === state.employees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(state.employees.map(emp => emp.id));
    }
  };

  /**
   * Manejar cambio de estado de empleado
   */
  const handleToggleEmployeeStatus = async (employeeId: string, currentStatus: boolean) => {
    const success = currentStatus 
      ? await actions.deactivateEmployee(employeeId)
      : await actions.activateEmployee(employeeId);
    
    if (!success) {
      // TODO: Mostrar notificación de error
      console.error('Error cambiando estado del empleado');
    }
  };

  /**
   * Obtener badge de estado
   */
  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive) {
      return <Badge variant="secondary">Inactivo</Badge>;
    }
    
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Activo</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactivo</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  /**
   * Obtener badge de rol
   */
  const getRoleBadge = (role: string) => {
    const roleColors = {
      'super_admin': 'bg-purple-100 text-purple-800',
      'admin': 'bg-red-100 text-red-800',
      'hr': 'bg-blue-100 text-blue-800',
      'manager': 'bg-orange-100 text-orange-800',
      'employee': 'bg-gray-100 text-gray-800'
    };

    const roleLabels = {
      'super_admin': 'Super Admin',
      'admin': 'Administrador',
      'hr': 'RRHH',
      'manager': 'Gerente',
      'employee': 'Empleado'
    };

    return (
      <Badge 
        variant="outline" 
        className={roleColors[role as keyof typeof roleColors] || 'bg-gray-100 text-gray-800'}
      >
        {roleLabels[role as keyof typeof roleLabels] || role}
      </Badge>
    );
  };

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="text-red-500 mb-2">❌ Error</div>
          <p className="text-gray-600">{error}</p>
          <Button 
            onClick={() => actions.loadEmployees()} 
            className="mt-4"
            variant="outline"
          >
            Reintentar
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con título y acciones */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Users className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Empleados</h1>
            <p className="text-gray-600">
              {state.pagination.total} empleados registrados
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            onClick={onEmployeeCreate}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Empleado
          </Button>
        </div>
      </div>

      {/* Barra de búsqueda y filtros */}
      <Card className="p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar empleados por nombre, email o código..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span>Filtros</span>
          </Button>
        </div>

        {/* Panel de filtros expandible */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Departamento
                </label>
                <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                  <option value="">Todos los departamentos</option>
                  {state.filterOptions.departments.map(dept => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cargo
                </label>
                <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                  <option value="">Todos los cargos</option>
                  {state.filterOptions.positions.map(pos => (
                    <option key={pos.id} value={pos.id}>
                      {pos.title}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                  <option value="">Todos los estados</option>
                  <option value="active">Activos</option>
                  <option value="inactive">Inactivos</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Lista de empleados */}
      <Card>
        <div className="p-6">
          {/* Acciones masivas */}
          {selectedEmployees.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
              <span className="text-sm text-blue-800">
                {selectedEmployees.length} empleado(s) seleccionado(s)
              </span>
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="outline">
                  Activar
                </Button>
                <Button size="sm" variant="outline">
                  Desactivar
                </Button>
                <Button size="sm" variant="outline">
                  Exportar
                </Button>
              </div>
            </div>
          )}

          {/* Tabla de empleados */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 w-12">
                    <input
                      type="checkbox"
                      checked={selectedEmployees.length === state.employees.length && state.employees.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="text-left p-3">Empleado</th>
                  <th className="text-left p-3">Contacto</th>
                  <th className="text-left p-3">Departamento</th>
                  <th className="text-left p-3">Cargo</th>
                  <th className="text-left p-3">Rol</th>
                  <th className="text-left p-3">Estado</th>
                  <th className="text-left p-3">Última Asistencia</th>
                  <th className="text-right p-3 w-20">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="text-center p-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-gray-600">Cargando empleados...</span>
                      </div>
                    </td>
                  </tr>
                ) : state.employees.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center p-8">
                      <div className="text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">No hay empleados registrados</p>
                        <p className="text-sm">Comienza agregando tu primer empleado</p>
                        <Button 
                          onClick={onEmployeeCreate}
                          className="mt-4"
                          variant="outline"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Agregar Empleado
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  state.employees.map((employee) => (
                    <tr key={employee.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedEmployees.includes(employee.id)}
                          onChange={(e) => handleEmployeeSelect(employee.id, e.target.checked)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      
                      {/* Información del empleado */}
                      <td className="p-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium text-sm">
                              {employee.fullName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{employee.fullName}</div>
                            <div className="text-sm text-gray-500">#{employee.employeeCode}</div>
                          </div>
                        </div>
                      </td>
                      
                      {/* Contacto */}
                      <td className="p-3">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="h-3 w-3 mr-1" />
                            {employee.email}
                          </div>
                          {employee.phone && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="h-3 w-3 mr-1" />
                              {employee.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      
                      {/* Departamento */}
                      <td className="p-3">
                        <span className="text-sm text-gray-900">
                          {employee.department || 'Sin asignar'}
                        </span>
                      </td>
                      
                      {/* Cargo */}
                      <td className="p-3">
                        <span className="text-sm text-gray-900">
                          {employee.position || 'Sin asignar'}
                        </span>
                      </td>
                      
                      {/* Rol */}
                      <td className="p-3">
                        {getRoleBadge(employee.role)}
                      </td>
                      
                      {/* Estado */}
                      <td className="p-3">
                        {getStatusBadge(employee.status, employee.isActive)}
                      </td>
                      
                      {/* Última asistencia */}
                      <td className="p-3">
                        <span className="text-sm text-gray-600">
                          {employee.lastAttendance 
                            ? new Date(employee.lastAttendance).toLocaleDateString()
                            : 'Sin registros'
                          }
                        </span>
                      </td>
                      
                      {/* Acciones */}
                      <td className="p-3">
                        <div className="flex items-center justify-end space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onEmployeeEdit?.(employee)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleEmployeeStatus(employee.id, employee.isActive)}
                            className="h-8 w-8 p-0"
                          >
                            {employee.isActive ? (
                              <UserX className="h-4 w-4 text-red-500" />
                            ) : (
                              <UserCheck className="h-4 w-4 text-green-500" />
                            )}
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onEmployeeDelete?.(employee.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {state.pagination.total > state.pagination.pageSize && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Mostrando {Math.min(state.pagination.pageSize, state.employees.length)} de {state.pagination.total} empleados
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => actions.changePage(state.pagination.page - 1)}
                  disabled={state.pagination.page <= 1}
                >
                  Anterior
                </Button>
                
                <span className="text-sm text-gray-600">
                  Página {state.pagination.page}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => actions.changePage(state.pagination.page + 1)}
                  disabled={!state.pagination.hasMore}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

export default EmployeeList;
