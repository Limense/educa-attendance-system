/**
 * =============================================
 * LISTA SIMPLIFICADA DE EMPLEADOS
 * =============================================
 * 
 * Descripción: Componente para mostrar la lista de empleados con datos reales
 */

'use client';

import React, { useState } from 'react';
import { EmployeeSimple } from '@/hooks/useEmployeeSimple';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar,
  Edit,
  Trash2,
  Power,
  PowerOff,
  Download,
  Search,
  Filter
} from 'lucide-react';

interface EmployeeListSimpleProps {
  employees: EmployeeSimple[];
  loading: boolean;
  onEdit: (employee: EmployeeSimple) => void;
  onDelete: (id: string) => void;
  onActivate: (id: string) => void;
  onDeactivate: (id: string) => void;
  onExport: () => void;
}

export function EmployeeListSimple({
  employees,
  loading,
  onEdit,
  onDelete,
  onActivate,
  onDeactivate,
  onExport
}: EmployeeListSimpleProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  // Filtrar empleados según término de búsqueda
  const filteredEmployees = employees.filter(emp =>
    emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employee_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectEmployee = (id: string) => {
    setSelectedEmployees(prev => 
      prev.includes(id) 
        ? prev.filter(empId => empId !== id)
        : [...prev, id]
    );
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-red-100 text-red-800';
      case 'hr': return 'bg-blue-100 text-blue-800';
      case 'manager': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Administrador';
      case 'hr': return 'Recursos Humanos';
      case 'manager': return 'Gerente';
      case 'employee': return 'Empleado';
      default: return role;
    }
  };

  if (loading) {
    return (
      <div className="glass-card">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="loading-pulse rounded-full h-12 w-12 border-2 border-[var(--primary)] mx-auto mb-4"></div>
            <p className="text-[var(--secondary)]">Cargando empleados...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <div className="glass-card">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-[var(--primary)]" />
            <span className="font-medium text-[var(--text)]">
              Empleados ({filteredEmployees.length})
            </span>
          </div>

          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            {/* Barra de búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--secondary)] w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar empleados por nombre, email o código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-modern pl-10 w-full md:w-80"
              />
            </div>

            {/* Botones de acción */}
            <div className="flex gap-2">
              <button
                onClick={onExport}
                className="btn-secondary flex items-center gap-2 micro-bounce"
              >
                <Download className="w-4 h-4" />
                Exportar
              </button>
              <button className="btn-secondary flex items-center gap-2 micro-bounce">
                <Filter className="w-4 h-4" />
                Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Acciones masivas cuando hay selección */}
        {selectedEmployees.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[var(--border)]">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--secondary)]">
                {selectedEmployees.length} empleado(s) seleccionado(s)
              </span>
              <div className="flex gap-2">
                <button className="btn-success text-sm">
                  Activar
                </button>
                <button className="btn-secondary text-sm">
                  Desactivar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lista de empleados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredEmployees.map((employee) => (
          <div key={employee.id} className="glass-card group">
            <div className="flex flex-col h-full">
              {/* Header del empleado */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedEmployees.includes(employee.id)}
                    onChange={() => handleSelectEmployee(employee.id)}
                    className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                  />
                  <div className="w-12 h-12 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span 
                    className={`badge ${employee.is_active ? "badge-success" : "badge-secondary"}`}
                  >
                    {employee.is_active ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </div>

              {/* Información del empleado - Área que crece */}
              <div className="flex-1 space-y-3 mb-4">
                <h3 className="font-semibold text-[var(--text)] text-lg">{employee.full_name}</h3>
                <p className="text-sm text-[var(--secondary)] font-mono bg-gray-50 px-2 py-1 rounded">{employee.employee_code}</p>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-[var(--secondary)]">
                    <Mail className="w-4 h-4 text-[var(--primary)]" />
                    <span className="truncate">{employee.email}</span>
                  </div>
                  
                  {employee.phone && (
                    <div className="flex items-center gap-2 text-sm text-[var(--secondary)]">
                      <Phone className="w-4 h-4 text-[var(--primary)]" />
                      {employee.phone}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm text-[var(--secondary)]">
                    <Calendar className="w-4 h-4 text-[var(--primary)]" />
                    {new Date(employee.hire_date).toLocaleDateString()}
                  </div>
                </div>

                {/* Departamento y posición */}
                <div className="flex flex-wrap gap-2">
                  {employee.departments && (
                    <span className="badge badge-secondary text-xs">
                      {employee.departments.name}
                    </span>
                  )}
                  {employee.positions && (
                    <span className="badge badge-secondary text-xs">
                      {employee.positions.title}
                    </span>
                  )}
                  <span className={`badge text-xs ${getRoleBadgeColor(employee.role)}`}>
                    {getRoleLabel(employee.role)}
                  </span>
                </div>
              </div>

              {/* Acciones - Siempre al final */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-[var(--border)] mt-auto">
                <button
                  onClick={() => onEdit(employee)}
                  className="btn-card btn-card-edit micro-bounce"
                >
                  <Edit className="w-3 h-3" />
                  Editar
                </button>
                
                {employee.is_active ? (
                  <button
                    onClick={() => onDeactivate(employee.id)}
                    className="btn-card btn-card-deactivate"
                  >
                    <PowerOff className="w-3 h-3" />
                    Desactivar
                  </button>
                ) : (
                  <button
                    onClick={() => onActivate(employee.id)}
                    className="btn-card btn-card-activate"
                  >
                    <Power className="w-3 h-3" />
                    Activar
                  </button>
                )}
                
                <button
                  onClick={() => onDelete(employee.id)}
                  className="btn-card btn-card-danger"
                  title="Eliminar empleado permanentemente"
                >
                  <Trash2 className="w-3 h-3" />
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Estado vacío */}
      {filteredEmployees.length === 0 && !loading && (
        <div className="glass-card p-12">
          <div className="text-center">
            <User className="w-12 h-12 text-[var(--secondary)] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[var(--text)] mb-2">
              {searchTerm ? 'No se encontraron empleados' : 'No hay empleados registrados'}
            </h3>
            <p className="text-[var(--secondary)]">
              {searchTerm 
                ? 'Prueba con diferentes términos de búsqueda'
                : 'Comienza agregando tu primer empleado'
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
