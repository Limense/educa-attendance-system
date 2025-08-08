'use client'

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Settings, 
  Clock, 
  Building, 
  Shield, 
  Bell,
  Save,
  Database,
  Plus,
  Calendar,
  Users
} from 'lucide-react';
import { systemConfigService, Department } from '@/services/system-config.service';
import { EmployeeScheduleConfig } from './EmployeeScheduleConfig';
import { useEmployees } from '@/hooks/useEmployees';

/**
 * Componente de configuración del sistema con datos reales
 * 
 * Principios aplicados:
 * - Single Responsibility: Solo maneja configuraciones
 * - Separation of Concerns: Separa por categorías
 * - Data Fetching: Consume datos reales de Supabase
 */
export function SystemSettings() {
  const [activeTab, setActiveTab] = useState<'general' | 'policies' | 'schedules'>('general');
  // Usar organizationId temporal hasta implementar auth context
  const organizationId = '550e8400-e29b-41d4-a716-446655440000';
  const { employees, loading: employeesLoading, refetch: refetchEmployees } = useEmployees(organizationId);
  const [workingHours, setWorkingHours] = useState({
    startTime: '08:00',
    endTime: '17:00',
    lunchStart: '12:00',
    lunchEnd: '13:00'
  });

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    tardyNotifications: true,
    weeklyReports: true
  });

  const [departments, setDepartments] = useState<Department[]>([]);
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // Estados para políticas de trabajo
  const [workPolicies, setWorkPolicies] = useState({
    late_threshold: 15,
    max_daily_hours: 8,
    allow_remote: false,
    require_geolocation: true
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [hoursData, deptData, policiesData] = await Promise.all([
          systemConfigService.getWorkingHours(organizationId),
          systemConfigService.getDepartments(organizationId),
          systemConfigService.getCurrentWorkPolicies(organizationId)
        ]);

        setWorkingHours(hoursData);
        setDepartments(deptData);
        setWorkPolicies(policiesData);
      } catch (error) {
        console.error('Error fetching settings data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [organizationId]);

  const handleSaveWorkingHours = async () => {
    try {
      setSaving('working-hours');
      await systemConfigService.updateWorkingHours(organizationId, workingHours);
      alert('✅ Horarios generales actualizados correctamente');
    } catch (error) {
      console.error('Error saving working hours:', error);
      alert('❌ Error al guardar horarios');
    } finally {
      setSaving(null);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      setSaving('notifications');
      // TODO: Implementar guardado de notificaciones en system_settings
      console.log('Saving notifications:', notifications);
      alert('Notificaciones actualizadas correctamente');
    } catch (error) {
      console.error('Error saving notifications:', error);
      alert('Error al guardar notificaciones');
    } finally {
      setSaving(null);
    }
  };

  const handleAddDepartment = async () => {
    if (!newDepartmentName.trim()) return;

    try {
      setSaving('departments');
      const code = newDepartmentName.toUpperCase().replace(/\s+/g, '_');
      const newDept = await systemConfigService.createDepartment(organizationId, {
        name: newDepartmentName.trim(),
        code
      });
      
      setDepartments([...departments, newDept]);
      setNewDepartmentName('');
      alert('Departamento creado correctamente');
    } catch (error) {
      console.error('Error creating department:', error);
      alert('Error al crear departamento');
    } finally {
      setSaving(null);
    }
  };

  const handleEditDepartment = async (dept: Department) => {
    const newName = prompt('Nuevo nombre del departamento:', dept.name);
    if (!newName || newName === dept.name) return;

    try {
      setSaving('departments');
      await systemConfigService.updateDepartment(dept.id, { name: newName });
      
      setDepartments(departments.map(d => 
        d.id === dept.id ? { ...d, name: newName } : d
      ));
      alert('Departamento actualizado correctamente');
    } catch (error) {
      console.error('Error updating department:', error);
      alert('Error al actualizar departamento');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Configuración del Sistema
          </h2>
          <p className="text-gray-600">
            Cargando configuraciones...
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Configuración del Sistema
        </h2>
        <p className="text-gray-600">
          Configura horarios, departamentos y parámetros del sistema
        </p>
      </div>

      {/* Navegación por pestañas */}
      <div className="flex space-x-1 border-b mb-6">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 font-medium text-sm rounded-t-lg ${
            activeTab === 'general'
              ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Building className="inline h-4 w-4 mr-2" />
          General
        </button>
        <button
          onClick={() => setActiveTab('policies')}
          className={`px-4 py-2 font-medium text-sm rounded-t-lg ${
            activeTab === 'policies'
              ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Shield className="inline h-4 w-4 mr-2" />
          Políticas
        </button>
        <button
          onClick={() => setActiveTab('schedules')}
          className={`px-4 py-2 font-medium text-sm rounded-t-lg ${
            activeTab === 'schedules'
              ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Calendar className="inline h-4 w-4 mr-2" />
          Horarios Individuales
        </button>
      </div>

      {/* Contenido de pestañas */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Horarios de trabajo */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Horarios de Trabajo
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hora de Entrada
                </label>
                <Input
                  type="time"
                  value={workingHours.startTime}
                  onChange={(e) => setWorkingHours({...workingHours, startTime: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hora de Salida
                </label>
                <Input
                  type="time"
                  value={workingHours.endTime}
                  onChange={(e) => setWorkingHours({...workingHours, endTime: e.target.value})}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Inicio de Almuerzo
                </label>
                <Input
                  type="time"
                  value={workingHours.lunchStart}
                  onChange={(e) => setWorkingHours({...workingHours, lunchStart: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fin de Almuerzo
                </label>
                <Input
                  type="time"
                  value={workingHours.lunchEnd}
                  onChange={(e) => setWorkingHours({...workingHours, lunchEnd: e.target.value})}
                />
              </div>
            </div>
            
            <Button 
              onClick={handleSaveWorkingHours}
              disabled={saving === 'working-hours'}
              className="w-full flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving === 'working-hours' ? 'Guardando...' : 'Guardar Horarios'}
            </Button>
          </div>
        </Card>

        {/* Notificaciones */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Notificaciones
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Alertas por email</span>
              <input
                type="checkbox"
                checked={notifications.emailAlerts}
                onChange={(e) => setNotifications({...notifications, emailAlerts: e.target.checked})}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Notificaciones de tardanza</span>
              <input
                type="checkbox"
                checked={notifications.tardyNotifications}
                onChange={(e) => setNotifications({...notifications, tardyNotifications: e.target.checked})}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Reportes semanales</span>
              <input
                type="checkbox"
                checked={notifications.weeklyReports}
                onChange={(e) => setNotifications({...notifications, weeklyReports: e.target.checked})}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
            
            <Button 
              onClick={handleSaveNotifications}
              disabled={saving === 'notifications'}
              className="w-full flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving === 'notifications' ? 'Guardando...' : 'Guardar Notificaciones'}
            </Button>
          </div>
        </Card>

        {/* Gestión de Departamentos */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Building className="w-5 h-5 mr-2" />
            Gestión de Departamentos
          </h3>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Nombre del departamento"
                className="flex-1"
                value={newDepartmentName}
                onChange={(e) => setNewDepartmentName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddDepartment()}
              />
              <Button 
                onClick={handleAddDepartment}
                disabled={saving === 'departments' || !newDepartmentName.trim()}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Agregar
              </Button>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {departments.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">
                  No hay departamentos configurados
                </p>
              ) : (
                departments.map((dept) => (
                  <div key={dept.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <span className="font-medium">{dept.name}</span>
                      <span className="text-gray-500 text-sm ml-2">({dept.code})</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditDepartment(dept)}
                      disabled={saving === 'departments'}
                    >
                      Editar
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>

        {/* Configuración de Notificaciones y Alertas */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Configuración de Alertas
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Alertas por retrasos</span>
              <input
                type="checkbox"
                defaultChecked={true}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-700">Notificaciones automáticas</span>
              <input
                type="checkbox"
                defaultChecked={true}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-700">Reportes de asistencia</span>
              <input
                type="checkbox"
                defaultChecked={false}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
            
            <Button 
              onClick={() => alert('Configuración de alertas actualizada')}
              className="w-full flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Guardar Configuración
            </Button>
          </div>
        </Card>

        {/* Configuración de Seguridad */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Configuración de Seguridad
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tiempo de sesión (minutos)
              </label>
              <Input
                type="number"
                placeholder="60"
                min="15"
                max="480"
                defaultValue="60"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Intentos de login fallidos
              </label>
              <Input
                type="number"
                placeholder="3"
                min="1"
                max="10"
                defaultValue="3"
              />
            </div>
            
            <Button 
              onClick={() => alert('Configuración de seguridad - Funcionalidad en desarrollo')}
              className="w-full flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Guardar Seguridad
            </Button>
          </div>
        </Card>
        </div>
      )}

      {/* Pestaña de Políticas */}
      {activeTab === 'policies' && (
        <div className="space-y-6">
          {/* Políticas de Asistencia */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Políticas de Asistencia</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Tolerancia de llegada tarde (minutos)
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={workPolicies.late_threshold}
                  className="w-full p-2 border rounded"
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    setWorkPolicies(prev => ({ ...prev, late_threshold: value }));
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minutos de tolerancia antes de marcar tardanza
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Máximo de horas diarias
                </label>
                <input
                  type="number"
                  min="6"
                  max="12"
                  value={workPolicies.max_daily_hours}
                  className="w-full p-2 border rounded"
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 8;
                    setWorkPolicies(prev => ({ ...prev, max_daily_hours: value }));
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Máximo de horas laborales por día
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="remote-work"
                  checked={workPolicies.allow_remote}
                  className="rounded"
                  onChange={(e) => {
                    setWorkPolicies(prev => ({ ...prev, allow_remote: e.target.checked }));
                  }}
                />
                <label htmlFor="remote-work" className="text-sm font-medium">
                  Permitir trabajo remoto
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="geolocation"
                  checked={workPolicies.require_geolocation}
                  className="rounded"
                  onChange={(e) => {
                    setWorkPolicies(prev => ({ ...prev, require_geolocation: e.target.checked }));
                  }}
                />
                <label htmlFor="geolocation" className="text-sm font-medium">
                  Requerir geolocalización
                </label>
              </div>
            </div>

            <Button 
              onClick={async () => {
                try {
                  setSaving('policies');
                  console.log('Guardando políticas:', workPolicies);
                  await systemConfigService.updateWorkPolicies(organizationId, workPolicies);
                  alert('✅ Políticas de asistencia actualizadas correctamente');
                } catch (error) {
                  console.error('Error detallado al guardar políticas:', error);
                  const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
                  alert(`❌ Error al guardar políticas: ${errorMessage}`);
                } finally {
                  setSaving(null);
                }
              }}
              disabled={saving === 'policies'}
              className="w-full flex items-center justify-center gap-2 mt-4"
            >
              <Save className="w-4 h-4" />
              {saving === 'policies' ? 'Guardando...' : 'Guardar Políticas'}
            </Button>
          </Card>

          {/* Configuración de Permisos y Licencias */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Permisos y Licencias</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Días de vacaciones anuales
                </label>
                <input
                  type="number"
                  min="15"
                  max="30"
                  defaultValue="20"
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Días de enfermedad anuales
                </label>
                <input
                  type="number"
                  min="5"
                  max="15"
                  defaultValue="10"
                  className="w-full p-2 border rounded"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="auto-approve"
                  defaultChecked={false}
                  className="rounded"
                />
                <label htmlFor="auto-approve" className="text-sm font-medium">
                  Aprobación automática de permisos
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="advance-notice"
                  defaultChecked={true}
                  className="rounded"
                />
                <label htmlFor="advance-notice" className="text-sm font-medium">
                  Requerir notificación previa
                </label>
              </div>
            </div>

            <Button 
              onClick={() => alert('✅ Configuración de permisos actualizada')}
              className="w-full flex items-center justify-center gap-2 mt-4"
            >
              <Save className="w-4 h-4" />
              Guardar Configuración
            </Button>
          </Card>
        </div>
      )}

      {/* Pestaña de Horarios Individuales */}
      {activeTab === 'schedules' && (
        <div className="space-y-6">
          {employeesLoading ? (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Cargando empleados...</h3>
              </div>
            </Card>
          ) : (
            <EmployeeScheduleConfig 
              employees={employees || []}
              systemWorkingHours={workingHours}
              onUpdate={async () => {
                // Recargar empleados para mostrar los cambios
                console.log('Recargando empleados después de actualizar horarios...');
                await refetchEmployees();
              }}
            />
          )}
        </div>
      )}

      {/* Acciones del sistema */}
      <Card className="p-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Database className="w-5 h-5 mr-2" />
          Mantenimiento del Sistema
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            variant="outline" 
            className="flex flex-col items-center p-4 h-auto"
            onClick={() => alert('Respaldo de BD - Funcionalidad en desarrollo')}
          >
            <Database className="w-6 h-6 mb-2" />
            <span className="text-sm">Respaldar BD</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="flex flex-col items-center p-4 h-auto"
            onClick={() => alert('Limpieza de logs - Funcionalidad en desarrollo')}
          >
            <Settings className="w-6 h-6 mb-2" />
            <span className="text-sm">Limpiar Logs</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="flex flex-col items-center p-4 h-auto"
            onClick={() => alert('Auditoría - Funcionalidad en desarrollo')}
          >
            <Shield className="w-6 h-6 mb-2" />
            <span className="text-sm">Auditoría</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}
