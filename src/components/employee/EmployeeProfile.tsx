/**
 * =============================================
 * EMPLOYEE PROFILE COMPONENT
 * =============================================
 * 
 * Descripción: Vista del perfil del empleado
 * Muestra información personal y laboral
 */

'use client';

import React from 'react';
import type { Employee } from '@/types/database';

interface EmployeeProfileProps {
  employee: Employee;
}

/**
 * Componente para mostrar un campo de información
 */
function InfoField({ label, value, icon }: { label: string; value: string | null | undefined; icon: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center mb-2">
        <span className="text-lg mr-2">{icon}</span>
        <span className="text-sm font-medium text-gray-600">{label}</span>
      </div>
      <p className="text-lg font-semibold text-gray-900">
        {value || 'No especificado'}
      </p>
    </div>
  );
}

/**
 * Componente principal del perfil del empleado
 */
export function EmployeeProfile({ employee }: EmployeeProfileProps) {
  return (
    <div className="p-6 space-y-6">
      {/* Información básica */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-4 shadow-lg">
            <span className="text-white font-bold text-2xl">
              {employee.first_name?.charAt(0) || 'E'}
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {employee.first_name} {employee.last_name}
            </h2>
            <p className="text-gray-600">{employee.position?.title || 'Sin posición asignada'}</p>
            <p className="text-sm text-gray-500">{employee.department?.name || 'Sin departamento'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <InfoField
            label="Código de Empleado"
            value={employee.employee_code}
            icon="🆔"
          />
          
          <InfoField
            label="Email Corporativo"
            value={employee.email}
            icon="📧"
          />
          
          <InfoField
            label="Teléfono"
            value={employee.phone}
            icon="📱"
          />
          
          <InfoField
            label="Fecha de Ingreso"
            value={employee.hire_date ? new Date(employee.hire_date).toLocaleDateString('es-ES') : null}
            icon="📅"
          />
          
          <InfoField
            label="Estado"
            value={employee.is_active ? 'Activo' : 'Inactivo'}
            icon={employee.is_active ? '✅' : '❌'}
          />
          
          <InfoField
            label="Rol"
            value={employee.role === 'employee' ? 'Empleado' : employee.role === 'admin' ? 'Administrador' : 'Super Admin'}
            icon="👤"
          />
        </div>
      </div>

      {/* Información laboral */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="text-xl mr-2">💼</span>
          Información Laboral
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoField
            label="Departamento"
            value={employee.department?.name}
            icon="🏢"
          />
          
          <InfoField
            label="Posición"
            value={employee.position?.title}
            icon="💼"
          />
          
          <InfoField
            label="Organización"
            value={employee.organization?.name}
            icon="🏛️"
          />
          
          <InfoField
            label="Supervisor"
            value="Sin supervisor"
            icon="👨‍💼"
          />
        </div>
      </div>

      {/* Información de contacto adicional */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="text-xl mr-2">📞</span>
          Información de Contacto
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoField
            label="Email Principal"
            value={employee.email}
            icon="📧"
          />
          
          <InfoField
            label="Teléfono"
            value={employee.phone}
            icon="📱"
          />
          
          <InfoField
            label="Dirección"
            value="No especificada"
            icon="🏠"
          />
          
          <InfoField
            label="Ciudad"
            value="No especificada"
            icon="🏙️"
          />
        </div>
      </div>

      {/* Configuración de cuenta */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="text-xl mr-2">⚙️</span>
          Configuración de Cuenta
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div>
              <h4 className="font-medium text-blue-900">Notificaciones</h4>
              <p className="text-sm text-blue-700">Recibir notificaciones de asistencia</p>
            </div>
            <div className="text-2xl">🔔</div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div>
              <h4 className="font-medium text-green-900">Geolocalización</h4>
              <p className="text-sm text-green-700">
                {navigator.geolocation ? 'Disponible en tu dispositivo' : 'No disponible'}
              </p>
            </div>
            <div className="text-2xl">📍</div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
            <div>
              <h4 className="font-medium text-purple-900">Zona Horaria</h4>
              <p className="text-sm text-purple-700">
                {Intl.DateTimeFormat().resolvedOptions().timeZone}
              </p>
            </div>
            <div className="text-2xl">🕐</div>
          </div>
        </div>
      </div>

      {/* Acciones del perfil */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="text-xl mr-2">🛠️</span>
          Acciones
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-center hover:bg-blue-100 transition-colors duration-200">
            <div className="text-3xl mb-2">📊</div>
            <p className="text-sm font-medium text-blue-900">Ver Reportes</p>
            <p className="text-xs text-blue-700">Mis estadísticas de asistencia</p>
          </button>
          
          <button className="bg-green-50 border border-green-200 p-4 rounded-lg text-center hover:bg-green-100 transition-colors duration-200">
            <div className="text-3xl mb-2">📥</div>
            <p className="text-sm font-medium text-green-900">Exportar Datos</p>
            <p className="text-xs text-green-700">Descargar mi información</p>
          </button>
        </div>
      </div>
    </div>
  );
}
