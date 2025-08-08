'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Settings, MapPin, Save, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { systemConfigService } from '@/services/system-config.service';

interface EmployeeScheduleData {
  id: string;
  full_name: string;
  email: string;
  work_schedule?: {
    hours_per_day: number;
    days_per_week: number;
    start_time?: string;
    end_time?: string;
    break_duration?: number;
    flexible_hours?: boolean;
  };
}

interface EmployeeScheduleConfigProps {
  employees: EmployeeScheduleData[];
  onUpdate?: () => void;
  systemWorkingHours?: {
    startTime: string;
    endTime: string;
    lunchStart: string;
    lunchEnd: string;
  };
}

export function EmployeeScheduleConfig({ 
  employees, 
  onUpdate,
  systemWorkingHours 
}: EmployeeScheduleConfigProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [schedule, setSchedule] = useState({
    hours_per_day: 8,
    days_per_week: 5,
    start_time: '09:00',
    end_time: '17:00',
    break_duration: 60,
    flexible_hours: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Función para mostrar mensajes
  const showMessage = React.useCallback((type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }, []);

  // Función para cargar horario del empleado
  const loadEmployeeSchedule = React.useCallback(async (employeeId: string) => {
    try {
      const employeeSchedule = await systemConfigService.getEmployeeWorkSchedule(employeeId);
      
      // Asegurar que todos los campos tengan valores por defecto
      setSchedule({
        hours_per_day: employeeSchedule.hours_per_day || 8,
        days_per_week: employeeSchedule.days_per_week || 5,
        start_time: employeeSchedule.start_time || '09:00',
        end_time: employeeSchedule.end_time || '17:00',
        break_duration: employeeSchedule.break_duration || 60,
        flexible_hours: employeeSchedule.flexible_hours || false
      });
    } catch (error) {
      console.error('Error loading employee schedule:', error);
      showMessage('error', 'Error al cargar horario del empleado');
    }
  }, [showMessage]);

  // Cargar horario del empleado seleccionado
  useEffect(() => {
    if (selectedEmployee) {
      loadEmployeeSchedule(selectedEmployee);
    }
  }, [selectedEmployee, loadEmployeeSchedule]);

  const handleSaveSchedule = async () => {
    if (!selectedEmployee) {
      showMessage('error', 'Selecciona un empleado');
      return;
    }

    setIsLoading(true);
    try {
      await systemConfigService.setEmployeeWorkSchedule(selectedEmployee, schedule);
      showMessage('success', 'Horario configurado exitosamente');
      onUpdate?.();
    } catch (error) {
      console.error('Error saving schedule:', error);
      showMessage('error', 'Error al guardar horario');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetToDefault = () => {
    setSchedule({
      hours_per_day: 8,
      days_per_week: 5,
      start_time: '09:00',
      end_time: '17:00',
      break_duration: 60,
      flexible_hours: false
    });
  };

  const handleRemovePersonalSchedule = async () => {
    if (!selectedEmployee) {
      showMessage('error', 'Selecciona un empleado');
      return;
    }

    if (!confirm('¿Estás seguro de que quieres eliminar el horario personalizado? El empleado volverá a usar el horario general del sistema.')) {
      return;
    }

    setIsLoading(true);
    try {
      // Limpiar el horario personalizado dejando solo los valores básicos
      await systemConfigService.setEmployeeWorkSchedule(selectedEmployee, {
        hours_per_day: 8,
        days_per_week: 5
        // Sin start_time ni end_time para que use el horario general
      });
      
      // Resetear el formulario
      handleResetToDefault();
      showMessage('success', 'Horario personalizado eliminado. El empleado usará el horario general.');
      onUpdate?.();
    } catch (error) {
      console.error('Error removing personal schedule:', error);
      showMessage('error', 'Error al eliminar horario personalizado');
    } finally {
      setIsLoading(false);
    }
  };

  const getEmployeeCurrentSchedule = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    const schedule = employee?.work_schedule;
    
    // Considerar como horario personalizado solo si tiene start_time y end_time
    if (schedule && schedule.start_time && schedule.end_time) {
      return schedule;
    }
    
    return null; // Usar horario general del sistema
  };

  const hasPersonalizedSchedule = (employee: EmployeeScheduleData) => {
    const schedule = employee?.work_schedule;
    // Solo es personalizado si tiene horarios específicos configurados
    return schedule && schedule.start_time && schedule.end_time;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Clock className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Configuración de Horarios Individuales</h3>
      </div>

      {/* Selección de Empleado */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="h-4 w-4" />
          <h4 className="font-medium">Seleccionar Empleado</h4>
        </div>
        
        <select
          value={selectedEmployee}
          onChange={(e) => setSelectedEmployee(e.target.value)}
          className="w-full p-2 border rounded-lg bg-white"
        >
          <option value="">-- Seleccionar empleado --</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.full_name} ({employee.email})
            </option>
          ))}
        </select>

        {selectedEmployee && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <p className="text-blue-800 font-medium mb-1">
              <strong>Estado actual del empleado:</strong>
            </p>
            <div className="text-sm space-y-1">
              {getEmployeeCurrentSchedule(selectedEmployee) ? (
                <>
                  <p className="text-green-700 font-semibold">
                    🎯 Horario Personalizado Configurado
                  </p>
                  <p className="text-blue-700">
                    Horario: {getEmployeeCurrentSchedule(selectedEmployee)?.start_time} - {getEmployeeCurrentSchedule(selectedEmployee)?.end_time}
                  </p>
                  <p className="text-blue-700">
                    Modalidad: {getEmployeeCurrentSchedule(selectedEmployee)?.flexible_hours ? 'Flexible' : 'Fijo'}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-orange-700 font-semibold">
                    📋 Usando Horario General del Sistema
                  </p>
                  <p className="text-orange-600">
                    {systemWorkingHours ? 
                      `Horario: ${systemWorkingHours.startTime} - ${systemWorkingHours.endTime}` :
                      'Este empleado sigue el horario estándar de la organización'
                    }
                  </p>
                  <p className="text-orange-600 text-xs">
                    Configure un horario específico para personalizar
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Configuración de Horario */}
      {selectedEmployee && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-4 w-4" />
            <h4 className="font-medium">Configurar Horario</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Horas por día */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Horas por día
              </label>
              <input
                type="number"
                min="1"
                max="12"
                value={schedule.hours_per_day}
                onChange={(e) => setSchedule(prev => ({
                  ...prev,
                  hours_per_day: parseInt(e.target.value) || 8
                }))}
                className="w-full p-2 border rounded"
              />
            </div>

            {/* Días por semana */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Días por semana
              </label>
              <input
                type="number"
                min="1"
                max="7"
                value={schedule.days_per_week}
                onChange={(e) => setSchedule(prev => ({
                  ...prev,
                  days_per_week: parseInt(e.target.value) || 5
                }))}
                className="w-full p-2 border rounded"
              />
            </div>

            {/* Hora de inicio */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Hora de inicio
              </label>
              <input
                type="time"
                value={schedule.start_time}
                onChange={(e) => setSchedule(prev => ({
                  ...prev,
                  start_time: e.target.value
                }))}
                className="w-full p-2 border rounded"
              />
            </div>

            {/* Hora de fin */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Hora de fin
              </label>
              <input
                type="time"
                value={schedule.end_time}
                onChange={(e) => setSchedule(prev => ({
                  ...prev,
                  end_time: e.target.value
                }))}
                className="w-full p-2 border rounded"
              />
            </div>

            {/* Duración del descanso */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Descanso (minutos)
              </label>
              <input
                type="number"
                min="0"
                max="180"
                value={schedule.break_duration}
                onChange={(e) => setSchedule(prev => ({
                  ...prev,
                  break_duration: parseInt(e.target.value) || 60
                }))}
                className="w-full p-2 border rounded"
              />
            </div>

            {/* Horario flexible */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="flexible"
                checked={schedule.flexible_hours}
                onChange={(e) => setSchedule(prev => ({
                  ...prev,
                  flexible_hours: e.target.checked
                }))}
                className="rounded"
              />
              <label htmlFor="flexible" className="text-sm font-medium">
                Horario flexible
              </label>
            </div>
          </div>

          {/* Resumen de horario */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h5 className="font-medium mb-2">Resumen del Horario:</h5>
            <div className="text-sm space-y-1">
              <p><strong>Horario:</strong> {schedule.start_time} - {schedule.end_time}</p>
              <p><strong>Horas diarias:</strong> {schedule.hours_per_day} horas</p>
              <p><strong>Días laborales:</strong> {schedule.days_per_week} días/semana</p>
              <p><strong>Descanso:</strong> {schedule.break_duration} minutos</p>
              <p><strong>Modalidad:</strong> {schedule.flexible_hours ? 'Flexible' : 'Fijo'}</p>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-2 mt-4">
            <Button
              onClick={handleSaveSchedule}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isLoading ? 'Guardando...' : 'Guardar Horario'}
            </Button>
            
            <Button
              variant="outline"
              onClick={handleResetToDefault}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Restaurar por Defecto
            </Button>

            {getEmployeeCurrentSchedule(selectedEmployee) && (
              <Button
                variant="destructive"
                onClick={handleRemovePersonalSchedule}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Usar Horario General
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Mensaje de estado */}
      {message && (
        <div className={`p-3 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Lista de empleados con horarios */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="h-4 w-4" />
          <h4 className="font-medium">Estado de Horarios por Empleado</h4>
        </div>

        <div className="space-y-2">
          {employees.map((employee) => (
            <div 
              key={employee.id} 
              className="flex justify-between items-center p-2 border rounded"
            >
              <div>
                <p className="font-medium">{employee.full_name}</p>
                <p className="text-sm text-gray-600">{employee.email}</p>
              </div>
              <div className="text-right">
                {hasPersonalizedSchedule(employee) ? (
                  <div className="text-sm">
                    <p className="text-green-600 font-medium flex items-center gap-1">
                      🎯 Horario Personalizado
                    </p>
                    <p className="text-gray-600">
                      {employee.work_schedule?.start_time} - {employee.work_schedule?.end_time}
                    </p>
                    <p className="text-xs text-gray-500">
                      {employee.work_schedule?.flexible_hours ? 'Flexible' : 'Fijo'} • {employee.work_schedule?.hours_per_day}h/día
                    </p>
                  </div>
                ) : (
                  <div className="text-sm">
                    <p className="text-orange-600 font-medium flex items-center gap-1">
                      📋 Horario General
                    </p>
                    <p className="text-xs text-gray-500">
                      {systemWorkingHours ? 
                        `${systemWorkingHours.startTime} - ${systemWorkingHours.endTime}` :
                        'Usa configuración del sistema'
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
