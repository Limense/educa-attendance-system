/**
 * =============================================
 * PÁGINA SIMPLIFICADA DE EMPLEADOS
 * =============================================
 * 
 * Descripción: Componente principal para gestión de empleados con datos reales
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useEmployeeSimple, EmployeeSimple } from '@/hooks/useEmployeeSimple';
import { EmployeeFormData } from '@/types/employee.types';
import { EmployeeListSimple } from './EmployeeListSimple';
import EmployeeForm from './EmployeeForm';
import { Plus, ArrowLeft } from 'lucide-react';

type ViewMode = 'list' | 'create' | 'edit';

interface EmployeePageState {
  view: ViewMode;
  selectedEmployee?: EmployeeSimple;
}

export default function EmployeePageSimple() {
  const organizationId = '550e8400-e29b-41d4-a716-446655440000'; // TODO: Obtener de contexto
  
  const {
    employees,
    loading,
    error,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    activateEmployee,
    deactivateEmployee,
    refreshEmployees
  } = useEmployeeSimple(organizationId);

  const [pageState, setPageState] = useState<EmployeePageState>({
    view: 'list'
  });

  // Verificar modo desarrollo
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Modo desarrollo - Empleados cargados:', employees.length);
    }
  }, [employees.length]);

  const handleCreateEmployee = async (formData: EmployeeFormData): Promise<void> => {
    try {
      const success = await createEmployee(formData);
      if (success) {
        setPageState({ view: 'list' });
      } else {
        // El error específico ya está en el estado del hook
        throw new Error(error || 'Error al crear empleado. Verifique los datos e intente nuevamente.');
      }
    } catch (err: unknown) {
      console.error('Error en handleCreateEmployee:', err);
      // Re-lanzar el error para que EmployeeForm pueda mostrarlo al usuario
      throw err;
    }
  };

  const handleUpdateEmployee = async (formData: EmployeeFormData): Promise<void> => {
    if (!pageState.selectedEmployee) return;
    
    const success = await updateEmployee(pageState.selectedEmployee.id, formData);
    if (success) {
      setPageState({ view: 'list' });
    } else {
      throw new Error('Error al actualizar empleado');
    }
  };

  const handleEditEmployee = (employee: EmployeeSimple) => {
    setPageState({ 
      view: 'edit', 
      selectedEmployee: employee 
    });
  };

  const handleDeleteEmployee = async (id: string) => {
    const employee = employees.find(emp => emp.id === id);
    const employeeName = employee ? `${employee.first_name} ${employee.last_name}` : 'este empleado';
    
    console.log('🎯 Componente: Iniciando eliminación de:', employeeName, 'ID:', id);
    console.log('📊 Empleados antes de eliminar:', employees.length);
    
    if (window.confirm(`¿Está seguro de que desea eliminar a ${employeeName}?\n\nEsta acción eliminará permanentemente el registro del empleado de la base de datos.`)) {
      try {
        console.log('✅ Usuario confirmó eliminación');
        const success = await deleteEmployee(id);
        
        if (success) {
          console.log('🎉 Componente: Eliminación completada exitosamente');
          console.log('📊 Empleados después de eliminar:', employees.length);
        } else {
          console.log('❌ Componente: Eliminación falló');
          alert('Error al eliminar el empleado. Por favor, intente nuevamente.');
        }
      } catch (error) {
        console.error('💥 Componente: Error eliminando empleado:', error);
        alert('Error al eliminar el empleado. Por favor, intente nuevamente.');
      }
    } else {
      console.log('❌ Usuario canceló eliminación');
    }
  };

  const handleActivateEmployee = async (id: string) => {
    await activateEmployee(id);
  };

  const handleDeactivateEmployee = async (id: string) => {
    if (window.confirm('¿Está seguro de que desea desactivar este empleado?')) {
      await deactivateEmployee(id);
    }
  };

  const handleExportEmployees = () => {
    // TODO: Implementar exportación
    console.log('Exportar empleados');
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
              <button
                onClick={handleBackToList}
                className="btn-secondary flex items-center gap-2 micro-bounce"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver
              </button>
              <h1 className="page-title">Nuevo Empleado</h1>
            </div>
          </div>
        );
      
      case 'edit':
        return (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBackToList}
                className="btn-secondary flex items-center gap-2 micro-bounce"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver
              </button>
              <h1 className="page-title">
                Editar Empleado: {pageState.selectedEmployee?.full_name}
              </h1>
            </div>
          </div>
        );
      
      default: // 'list'
        return (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="page-title">Gestión de Empleados</h1>
              <p className="page-subtitle">Crear, editar y gestionar empleados</p>
            </div>
            <button
              onClick={() => setPageState({ view: 'create' })}
              className="btn-primary flex items-center gap-2 micro-bounce"
            >
              <Plus className="w-4 h-4" />
              Nuevo Empleado
            </button>
          </div>
        );
    }
  };

  const renderContent = () => {
    // Solo mostrar error en la vista de lista, no bloquear crear/editar
    if (error && pageState.view === 'list') {
      return (
        <div className="glass-card">
          <div className="text-center">
            <div className="text-[var(--error)] mb-4">
              <p className="text-lg font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
            <button onClick={refreshEmployees} className="btn-primary">
              Reintentar
            </button>
          </div>
        </div>
      );
    }

    switch (pageState.view) {
      case 'create':
        return (
          <EmployeeForm
            onSubmit={handleCreateEmployee}
            onCancel={handleBackToList}
            loading={loading}
            organizationId={organizationId}
          />
        );
      
      case 'edit':
        if (!pageState.selectedEmployee) {
          return (
            <div className="glass-card">
              <p className="text-center text-[var(--secondary)]">Empleado no encontrado</p>
            </div>
          );
        }
        
        // Convertir EmployeeSimple a EmployeeWithRelations para el formulario
        const employeeForForm = {
          id: pageState.selectedEmployee.id,
          organization_id: organizationId,
          employee_code: pageState.selectedEmployee.employee_code,
          email: pageState.selectedEmployee.email,
          full_name: pageState.selectedEmployee.full_name,
          phone: pageState.selectedEmployee.phone || '',
          department_id: pageState.selectedEmployee.departments?.id || '',
          position_id: pageState.selectedEmployee.positions?.id || '',
          hire_date: pageState.selectedEmployee.hire_date,
          role: pageState.selectedEmployee.role,
          status: pageState.selectedEmployee.is_active ? 'active' : 'inactive',
          is_active: pageState.selectedEmployee.is_active,
          created_at: '',
          updated_at: ''
        };
        
        return (
          <EmployeeForm
            employee={employeeForForm}
            onSubmit={handleUpdateEmployee}
            onCancel={handleBackToList}
            loading={loading}
            organizationId={organizationId}
          />
        );
      
      default: // 'list'
        return (
          <EmployeeListSimple
            employees={employees}
            loading={loading}
            onEdit={handleEditEmployee}
            onDelete={handleDeleteEmployee}
            onActivate={handleActivateEmployee}
            onDeactivate={handleDeactivateEmployee}
            onExport={handleExportEmployees}
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      {renderHeader()}
      {renderContent()}
    </div>
  );
}
