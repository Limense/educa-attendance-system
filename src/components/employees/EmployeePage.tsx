/**
 * PÁGINA DE EMPLEADOS - VERSIÓN FUNCIONAL Y COMPLETA
 */

'use client';

import React, { useState } from 'react';
import { useEmployees, Employee } from '@/hooks/useEmployees';
import EmployeeList from '@/components/employees/EmployeeList';
import EmployeeForm from '@/components/employees/EmployeeForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { employeeService } from '@/services/employee.service';
import { EmployeeFormData, EmployeeWithRelations } from '@/types/employee.types';

type ViewMode = 'list' | 'create' | 'edit';

export default function EmployeePage() {
  const organizationId = '550e8400-e29b-41d4-a716-446655440000'; // TODO: Obtener de contexto
  const { employees, loading, error, refetch } = useEmployees(organizationId);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithRelations | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Función para convertir Employee a EmployeeWithRelations
  const convertToEmployeeWithRelations = (employee: Employee): EmployeeWithRelations => {
    return {
      id: employee.id,
      organization_id: organizationId, // Usamos el organizationId actual
      employee_code: employee.employee_code || '', // Proporcionar valor por defecto
      full_name: employee.full_name,
      email: employee.email,
      phone: employee.phone,
      department_id: employee.departments?.id,
      position_id: employee.positions?.id,
      hire_date: employee.hire_date,
      role: employee.role,
      status: employee.is_active ? 'active' : 'inactive', // Convertir boolean a string
      is_active: employee.is_active,
      created_at: employee.created_at || new Date().toISOString(), // Valor por defecto
      updated_at: employee.updated_at || new Date().toISOString(), // Valor por defecto
      department: employee.departments ? {
        id: employee.departments.id,
        name: employee.departments.name,
      } : undefined,
      position: employee.positions ? {
        id: employee.positions.id,
        title: employee.positions.title,
        description: undefined,
        department_id: employee.departments?.id || ''
      } : undefined
    };
  };

  const handleCreateEmployee = () => {
    setSelectedEmployee(null);
    setViewMode('create');
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(convertToEmployeeWithRelations(employee));
    setViewMode('edit');
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este empleado? Esta acción no se puede deshacer.')) {
      try {
        await employeeService.deleteEmployee(employeeId);
        await refetch();
        alert('Empleado eliminado correctamente');
      } catch (error) {
        console.error('Error eliminando empleado:', error);
        alert('Error al eliminar el empleado');
      }
    }
  };

  const handleToggleEmployeeStatus = async (employeeId: string, newStatus: boolean) => {
    const action = newStatus ? 'activar' : 'desactivar';
    const actionPast = newStatus ? 'activado' : 'desactivado';
    
    if (confirm(`¿Estás seguro de que quieres ${action} este empleado?`)) {
      try {
        if (newStatus) {
          await employeeService.activateEmployee(employeeId);
        } else {
          await employeeService.deactivateEmployee(employeeId);
        }
        
        await refetch();
        alert(`Empleado ${actionPast} correctamente`);
      } catch (error) {
        console.error(`Error al ${action} empleado:`, error);
        alert(`Error al ${action} el empleado`);
      }
    }
  };

  const handleFormSubmit = async (data: EmployeeFormData) => {
    setFormLoading(true);
    try {
      if (selectedEmployee) {
        // Actualizar empleado existente
        await employeeService.updateEmployee(selectedEmployee.id, data);
        alert('Empleado actualizado correctamente');
      } else {
        // Crear nuevo empleado
        await employeeService.createEmployee({
          ...data,
          organizationId
        });
        alert('Empleado creado correctamente');
      }
      
      await refetch();
      setViewMode('list');
      setSelectedEmployee(null);
    } catch (error) {
      console.error('Error en formulario:', error);
      throw error; // Dejar que el formulario maneje el error
    } finally {
      setFormLoading(false);
    }
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedEmployee(null);
  };

  // Vista de creación
  if (viewMode === 'create') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto py-8 px-4 max-w-4xl">
          <div className="mb-6">
            <Button variant="outline" onClick={handleBackToList} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a la lista
            </Button>
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Crear Nuevo Empleado</h1>
              <p className="text-gray-600">Completa la información para agregar un nuevo miembro al equipo</p>
            </div>
          </div>
          
          <EmployeeForm
            onSubmit={handleFormSubmit}
            onCancel={handleBackToList}
            loading={formLoading}
            organizationId={organizationId}
          />
        </div>
      </div>
    );
  }

  // Vista de edición
  if (viewMode === 'edit' && selectedEmployee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto py-8 px-4 max-w-4xl">
          <div className="mb-6">
            <Button variant="outline" onClick={handleBackToList} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a la lista
            </Button>
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Editar Empleado
              </h1>
              <p className="text-gray-600">
                Modificando información de <span className="font-medium">{selectedEmployee.full_name}</span>
              </p>
            </div>
          </div>
          
          <EmployeeForm
            employee={selectedEmployee}
            onSubmit={handleFormSubmit}
            onCancel={handleBackToList}
            loading={formLoading}
            organizationId={organizationId}
          />
        </div>
      </div>
    );
  }

  // Vista principal (lista)
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <EmployeeList 
          employees={employees}
          loading={loading}
          error={error}
          onEmployeeCreate={handleCreateEmployee}
          onEmployeeEdit={handleEditEmployee}
          onEmployeeDelete={handleDeleteEmployee}
          onEmployeeToggleStatus={handleToggleEmployeeStatus}
        />
      </div>
    </div>
  );
}
