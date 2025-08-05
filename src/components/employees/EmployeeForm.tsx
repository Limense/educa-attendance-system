'use client'

import React, { useState, useEffect } from 'react';
import { EmployeeFormData, EmployeeWithRelations } from '@/types/employee.types';
import { useFormData } from '@/hooks/useFormData';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  User, 
  Mail, 
  Briefcase, 
  Shield,
  Save,
  X 
} from 'lucide-react';

interface EmployeeFormProps {
  employee?: EmployeeWithRelations;
  onSubmit: (data: EmployeeFormData) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  organizationId: string;
}

export default function EmployeeForm({ 
  employee, 
  onSubmit, 
  onCancel, 
  loading,
  organizationId
}: EmployeeFormProps) {
  // Hook para obtener datos del formulario (departamentos, posiciones, etc.)
  const formDataState = useFormData(organizationId);
  
  const [formData, setFormData] = useState<EmployeeFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    employeeCode: '',
    departmentId: '',
    positionId: '',
    hireDate: '',
    role: 'employee',
    password: '',
    sendWelcomeEmail: true
  });

  const [errors, setErrors] = useState<Partial<Record<keyof EmployeeFormData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof EmployeeFormData, boolean>>>({});
  const [filteredPositions, setFilteredPositions] = useState(formDataState.positions);
  const [submitError, setSubmitError] = useState<string>('');

  // Actualizar posiciones cuando cambie el departamento
  useEffect(() => {
    if (formData.departmentId && !formDataState.loading) {
      formDataState.getPositionsByDepartment(formData.departmentId).then(positions => {
        setFilteredPositions(positions);
      });
    } else {
      setFilteredPositions(formDataState.positions);
    }
  }, [formData.departmentId, formDataState]);

  // Cargar datos del empleado si estamos editando
  useEffect(() => {
    if (employee) {
      const [firstName, ...lastNameParts] = employee.full_name.split(' ');
      const lastName = lastNameParts.join(' ');
      
      setFormData({
        firstName,
        lastName,
        email: employee.email,
        phone: employee.phone || '',
        employeeCode: employee.employee_code,
        departmentId: employee.department_id || '',
        positionId: employee.position_id || '',
        hireDate: employee.hire_date.split('T')[0], // Solo la fecha
        role: employee.role,
        password: '', // No se edita la contraseña en modo edición
        sendWelcomeEmail: false // No enviar email al editar
      });
    }
  }, [employee]);

  const validateField = (name: keyof EmployeeFormData, value: string): string => {
    switch (name) {
      case 'firstName':
        return !value.trim() ? 'El nombre es requerido' : '';
      case 'lastName':
        return !value.trim() ? 'El apellido es requerido' : '';
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !value.trim() ? 'El email es requerido' 
             : !emailRegex.test(value) ? 'Email inválido' : '';
      case 'password':
        if (!employee) { // Solo validar contraseña en modo creación
          return !value ? 'La contraseña es requerida' 
               : value.length < 8 ? 'La contraseña debe tener al menos 8 caracteres'
               : !/[A-Z]/.test(value) ? 'La contraseña debe tener al menos una mayúscula'
               : !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value) ? 'La contraseña debe tener al menos un símbolo' : '';
        }
        return '';
      case 'employeeCode':
        // El código de empleado es opcional, se genera automáticamente si no se proporciona
        return '';
      case 'hireDate':
        return !value ? 'La fecha de contratación es requerida' : '';
      case 'role':
        return !value ? 'El rol es requerido' : '';
      default:
        return '';
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof EmployeeFormData, string>> = {};
    let isValid = true;

    (Object.keys(formData) as Array<keyof EmployeeFormData>).forEach(key => {
      const error = validateField(key, formData[key] as string);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleInputChange = (name: keyof EmployeeFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpiar errores cuando el usuario empieza a escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Limpiar error general al hacer cambios
    if (submitError) {
      setSubmitError('');
    }
  };

  const handleBlur = (name: keyof EmployeeFormData) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, formData[name] as string);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔄 Form: Enviando formulario...', formData);
    
    // Limpiar errores previos
    setSubmitError('');
    
    // Marcar todos los campos como tocados
    const allTouched = Object.keys(formData).reduce((acc, key) => {
      acc[key as keyof EmployeeFormData] = true;
      return acc;
    }, {} as Record<keyof EmployeeFormData, boolean>);
    setTouched(allTouched);

    if (!validateForm()) {
      console.log('❌ Form: Validación fallida');
      return;
    }

    try {
      console.log('📤 Form: Enviando datos válidos al servicio...');
      await onSubmit(formData);
      console.log('✅ Form: Empleado creado exitosamente');
    } catch (error: unknown) {
      console.error('💥 Form: Error al guardar empleado:', error);
      
      // Manejo específico de errores de autenticación y empleado
      let errorMessage = 'Error al guardar empleado. Verifique los datos e intente nuevamente.';
      
      if (error instanceof Error) {
        const message = error.message.toLowerCase();
        
        // Errores específicos de Supabase Auth
        if (message.includes('user already registered') || message.includes('email already exists')) {
          errorMessage = 'Ya existe un usuario registrado con este email. Use un email diferente.';
        } else if (message.includes('invalid email') || message.includes('email not valid')) {
          errorMessage = 'El formato del email no es válido. Verifique e intente nuevamente.';
        // ...eliminado manejo de error de contraseña...
        } else if (message.includes('rate limit') || message.includes('too many requests')) {
          errorMessage = 'Demasiados intentos. Espere unos minutos antes de intentar nuevamente.';
        } else if (message.includes('network') || message.includes('connection')) {
          errorMessage = 'Error de conexión. Verifique su conexión a internet e intente nuevamente.';
        } else if (message.includes('employee_code') || message.includes('duplicate')) {
          errorMessage = 'El código de empleado ya existe. Se generará uno automáticamente.';
        } else {
          // Usar el mensaje original si es descriptivo
          errorMessage = error.message;
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setSubmitError(errorMessage);
    }
  };

  const isEditing = !!employee;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar Empleado' : 'Nuevo Empleado'}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancelar
          </Button>
        </div>

        {/* Mostrar error general si existe */}
        {submitError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <X className="w-5 h-5" />
              <span className="text-sm font-medium">Error</span>
            </div>
            <p className="text-red-700 text-sm mt-1">{submitError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campo de contraseña */}
          {!isEditing && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña *
              </label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={e => handleInputChange('password', e.target.value)}
                onBlur={() => handleBlur('password')}
                className={errors.password && touched.password ? 'border-red-500' : ''}
                placeholder="Mínimo 8 caracteres, una mayúscula y un símbolo"
              />
              {errors.password && touched.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password}</p>
              )}
            </div>
          )}
          {/* Información Personal */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5" />
              Información Personal
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <Input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  onBlur={() => handleBlur('firstName')}
                  className={errors.firstName && touched.firstName ? 'border-red-500' : ''}
                  placeholder="Ingrese el nombre"
                />
                {errors.firstName && touched.firstName && (
                  <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido *
                </label>
                <Input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  onBlur={() => handleBlur('lastName')}
                  className={errors.lastName && touched.lastName ? 'border-red-500' : ''}
                  placeholder="Ingrese el apellido"
                />
                {errors.lastName && touched.lastName && (
                  <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>
                )}
              </div>
            </div>
          </div>

          {/* Información de Contacto */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Información de Contacto
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  className={errors.email && touched.email ? 'border-red-500' : ''}
                  placeholder="email@ejemplo.com"
                />
                {errors.email && touched.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
          </div>

          {/* Información Laboral */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Información Laboral
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="employeeCode" className="block text-sm font-medium text-gray-700 mb-1">
                  Código de Empleado {!isEditing && '(opcional - se genera automáticamente)'}
                </label>
                <Input
                  id="employeeCode"
                  type="text"
                  value={formData.employeeCode}
                  onChange={(e) => handleInputChange('employeeCode', e.target.value)}
                  onBlur={() => handleBlur('employeeCode')}
                  className={errors.employeeCode && touched.employeeCode ? 'border-red-500' : ''}
                  placeholder={isEditing ? formData.employeeCode : "Deje vacío para generar automáticamente"}
                  disabled={isEditing} // No permitir cambiar el código al editar
                />
                {!isEditing && (
                  <p className="mt-1 text-xs text-gray-500">
                    Si se deja vacío, se generará automáticamente (ej: EMP000001)
                  </p>
                )}
                {errors.employeeCode && touched.employeeCode && (
                  <p className="mt-1 text-xs text-red-600">{errors.employeeCode}</p>
                )}
              </div>

              <div>
                <label htmlFor="hireDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Contratación *
                </label>
                <Input
                  id="hireDate"
                  type="date"
                  value={formData.hireDate}
                  onChange={(e) => handleInputChange('hireDate', e.target.value)}
                  onBlur={() => handleBlur('hireDate')}
                  className={errors.hireDate && touched.hireDate ? 'border-red-500' : ''}
                />
                {errors.hireDate && touched.hireDate && (
                  <p className="mt-1 text-xs text-red-600">{errors.hireDate}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="departmentId" className="block text-sm font-medium text-gray-700 mb-1">
                  Departamento
                </label>
                <select
                  id="departmentId"
                  value={formData.departmentId}
                  onChange={(e) => {
                    handleInputChange('departmentId', e.target.value);
                    // Limpiar la posición cuando cambie el departamento
                    if (formData.positionId) {
                      handleInputChange('positionId', '');
                    }
                  }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={formDataState.loading}
                >
                  <option value="">Seleccionar departamento</option>
                  {formDataState.departments.map(dept => (
                    <option key={dept.value} value={dept.value}>
                      {dept.label}
                    </option>
                  ))}
                </select>
                {formDataState.loading && (
                  <p className="mt-1 text-xs text-gray-500">Cargando departamentos...</p>
                )}
              </div>

              <div>
                <label htmlFor="positionId" className="block text-sm font-medium text-gray-700 mb-1">
                  Cargo
                </label>
                <select
                  id="positionId"
                  value={formData.positionId}
                  onChange={(e) => handleInputChange('positionId', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={formDataState.loading || !formData.departmentId}
                >
                  <option value="">
                    {!formData.departmentId ? 'Selecciona un departamento primero' : 'Seleccionar cargo'}
                  </option>
                  {filteredPositions.map(pos => (
                    <option key={pos.value} value={pos.value}>
                      {pos.label}
                    </option>
                  ))}
                </select>
                {formDataState.loading && (
                  <p className="mt-1 text-xs text-gray-500">Cargando cargos...</p>
                )}
              </div>
            </div>
          </div>

          {/* Rol y Permisos */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Rol y Permisos
            </h3>
            
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Rol *
              </label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                onBlur={() => handleBlur('role')}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.role && touched.role ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                {formDataState.roles.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              {errors.role && touched.role && (
                <p className="mt-1 text-xs text-red-600">{errors.role}</p>
              )}
            </div>
          </div>

          {/* Autenticación */}
          {/* ...eliminado campo de contraseña y sección de autenticación... */}

          {/* Opciones adicionales */}
          {!isEditing && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Opciones</h3>
              <div className="flex items-center">
                <input
                  id="sendWelcomeEmail"
                  type="checkbox"
                  checked={formData.sendWelcomeEmail}
                  onChange={(e) => handleInputChange('sendWelcomeEmail', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="sendWelcomeEmail" className="ml-2 block text-sm text-gray-900">
                  Enviar email de bienvenida
                </label>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {loading 
                ? (isEditing ? 'Actualizando...' : 'Creando cuenta y empleado...') 
                : (isEditing ? 'Actualizar Empleado' : 'Crear Empleado y Cuenta')
              }
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
}
