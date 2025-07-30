'use client'

import React, { useState } from 'react';
import { useEmployeeManagement } from '@/hooks/useEmployeeManagement';
import { EmployeeTableData, EmployeeWithRelations, EmployeeFormData } from '@/types/employee.types';
import EmployeeList from '@/components/employees/EmployeeList';
import EmployeeForm from '@/components/employees/EmployeeForm';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft } from 'lucide-react';

type ViewMode = 'list' | 'create' | 'edit' | 'view';

interface EmployeePageState {
  view: ViewMode;
  selectedEmployee?: EmployeeWithRelations;
}

export default function EmployeePage() {
  const {
    state,
    actions
  } = useEmployeeManagement({
    organizationId: '550e8400-e29b-41d4-a716-446655440000', // TODO: Obtener de contexto
    autoLoad: true
  });

  const [pageState, setPageState] = useState<EmployeePageState>({
    view: 'list'
  });

  // No necesitamos cargar empleados manualmente ya que el hook lo hace automáticamente

  const handleCreateEmployee = async (formData: EmployeeFormData): Promise<void> => {
    const success = await actions.createEmployee(formData);
    if (success) {
      setPageState({ view: 'list' });
      await actions.loadEmployees(); // Recargar lista
    }
  };

  const handleUpdateEmployee = async (formData: EmployeeFormData): Promise<void> => {
    if (!pageState.selectedEmployee) return;
    
    const success = await actions.updateEmployee(pageState.selectedEmployee.id, formData);
    if (success) {
      setPageState({ view: 'list' });
      await actions.loadEmployees(); // Recargar lista
    }
  };

  const handleEditEmployee = (employee: EmployeeTableData) => {
    // Necesitamos obtener el empleado completo para editarlo
    // Por ahora simulamos la conversión - en un caso real haríamos una consulta adicional
    const fullEmployee: EmployeeWithRelations = {
      id: employee.id,
      organization_id: '', // Se obtendría de la consulta
      employee_code: employee.employeeCode,
      full_name: employee.fullName,
      email: employee.email,
      phone: employee.phone,
      department_id: '', // Se mapearía del departamento
      position_id: '', // Se mapearía del cargo
      hire_date: employee.hireDate,
      role: employee.role,
      status: employee.status,
      is_active: employee.isActive,
      created_at: '',
      updated_at: ''
    };

    setPageState({ 
      view: 'edit', 
      selectedEmployee: fullEmployee 
    });
  };

  const handleDeleteEmployee = async (id: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar este empleado?')) {
      const success = await actions.deleteEmployee(id);
      if (success) {
        await actions.loadEmployees(); // Recargar lista
      }
    }
  };

  const handleBackToList = () => {
    setPageState({ view: 'list' });
  };

  const renderHeader = () => {
    switch (pageState.view) {
      case 'create':
        return (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackToList}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">Nuevo Empleado</h1>
            </div>
          </div>
        );
      
      case 'edit':
        return (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackToList}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">
                Editar Empleado - {pageState.selectedEmployee?.full_name}
              </h1>
            </div>
          </div>
        );
      
      case 'view':
        return (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackToList}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">
                Ver Empleado - {pageState.selectedEmployee?.full_name}
              </h1>
            </div>
            <Button
              onClick={() => pageState.selectedEmployee && handleEditEmployee({
                id: pageState.selectedEmployee.id,
                fullName: pageState.selectedEmployee.full_name,
                email: pageState.selectedEmployee.email,
                phone: pageState.selectedEmployee.phone,
                employeeCode: pageState.selectedEmployee.employee_code,
                role: pageState.selectedEmployee.role,
                status: pageState.selectedEmployee.status,
                hireDate: pageState.selectedEmployee.hire_date,
                isActive: pageState.selectedEmployee.is_active
              })}
            >
              Editar
            </Button>
          </div>
        );
      
      default: // 'list'
        return (
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Empleados</h1>
            <Button
              onClick={() => setPageState({ view: 'create' })}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nuevo Empleado
            </Button>
          </div>
        );
    }
  };

  const renderContent = () => {
    const organizationId = '550e8400-e29b-41d4-a716-446655440000'; // TODO: Obtener de contexto
    
    switch (pageState.view) {
      case 'create':
        return (
          <EmployeeForm
            onSubmit={handleCreateEmployee}
            onCancel={handleBackToList}
            loading={state.loading}
            organizationId={organizationId}
          />
        );
      
      case 'edit':
        return (
          <EmployeeForm
            employee={pageState.selectedEmployee}
            onSubmit={handleUpdateEmployee}
            onCancel={handleBackToList}
            loading={state.loading}
            organizationId={organizationId}
          />
        );
      
      case 'view':
        // En un caso real, crearíamos un componente EmployeeDetails separado
        return (
          <Card className="w-full max-w-2xl mx-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6">Detalles del Empleado</h2>
              {pageState.selectedEmployee && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                      <p className="mt-1 text-sm text-gray-900">{pageState.selectedEmployee.full_name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Código de Empleado</label>
                      <p className="mt-1 text-sm text-gray-900">{pageState.selectedEmployee.employee_code}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="mt-1 text-sm text-gray-900">{pageState.selectedEmployee.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                      <p className="mt-1 text-sm text-gray-900">{pageState.selectedEmployee.phone || 'No especificado'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Rol</label>
                      <p className="mt-1 text-sm text-gray-900">{pageState.selectedEmployee.role}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Estado</label>
                      <p className="mt-1 text-sm text-gray-900">{pageState.selectedEmployee.status}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Fecha de Contratación</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {new Date(pageState.selectedEmployee.hire_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Estado Activo</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {pageState.selectedEmployee.is_active ? 'Sí' : 'No'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        );
      
      default: // 'list'
        return (
          <EmployeeList
            organizationId="550e8400-e29b-41d4-a716-446655440000"
            onEmployeeCreate={() => setPageState({ view: 'create' })}
            onEmployeeEdit={handleEditEmployee}
            onEmployeeDelete={handleDeleteEmployee}
          />
        );
    }
  };

  if (state.error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
              <p className="text-gray-600">{state.error}</p>
              <Button 
                onClick={() => actions.loadEmployees()} 
                className="mt-4"
              >
                Reintentar
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          {renderHeader()}
        </div>
        
        <div className="space-y-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
