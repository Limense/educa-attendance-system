/**
 * =============================================
 * SERVICIO DE CONFIGURACIONES DEL SISTEMA
 * =============================================
 * 
 * Descripción: Servicio para gestionar configuraciones reales desde Supabase
 */

import { createSupabaseClient } from '@/lib/supabase/client';

export interface Department {
  id: string;
  name: string;
  code: string;
  manager_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Position {
  id: string;
  title: string;
  code: string;
  department_id: string | null;
  level: number;
  is_active: boolean;
}

export interface WorkPolicy {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  break_duration: number;
  late_threshold: number;
  working_days: number;
  allow_remote: boolean;
  require_geolocation: boolean;
  max_daily_hours: number;
  is_active: boolean;
}

export interface SystemSetting {
  id: string;
  category: string;
  key: string;
  value: string;
  description: string | null;
  is_active: boolean;
}

export class SystemConfigService {
  private supabase = createSupabaseClient();

  /**
   * Obtener todos los departamentos activos
   */
  async getDepartments(organizationId: string): Promise<Department[]> {
    try {
      const { data, error } = await this.supabase
        .from('departments')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw new Error('Error al obtener departamentos');
    }
  }

  /**
   * Crear nuevo departamento
   */
  async createDepartment(organizationId: string, data: {
    name: string;
    code: string;
    manager_id?: string;
  }): Promise<Department> {
    try {
      const { data: newDept, error } = await this.supabase
        .from('departments')
        .insert({
          organization_id: organizationId,
          ...data
        })
        .select()
        .single();

      if (error) throw error;
      return newDept;
    } catch (error) {
      console.error('Error creating department:', error);
      throw new Error('Error al crear departamento');
    }
  }

  /**
   * Actualizar departamento
   */
  async updateDepartment(id: string, data: Partial<Pick<Department, 'name' | 'code' | 'manager_id'>>): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('departments')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating department:', error);
      throw new Error('Error al actualizar departamento');
    }
  }

  /**
   * Obtener todas las posiciones activas
   */
  async getPositions(organizationId: string): Promise<Position[]> {
    try {
      const { data, error } = await this.supabase
        .from('positions')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('title');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching positions:', error);
      throw new Error('Error al obtener posiciones');
    }
  }

  /**
   * Obtener políticas de trabajo
   */
  async getWorkPolicies(organizationId: string): Promise<WorkPolicy[]> {
    try {
      const { data, error } = await this.supabase
        .from('work_policies')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching work policies:', error);
      throw new Error('Error al obtener políticas de trabajo');
    }
  }

  /**
   * Actualizar política de trabajo
   */
  async updateWorkPolicy(id: string, data: Partial<Omit<WorkPolicy, 'id' | 'created_at'>>): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('work_policies')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating work policy:', error);
      throw new Error('Error al actualizar política de trabajo');
    }
  }

  /**
   * Obtener configuraciones del sistema por categoría
   */
  async getSystemSettings(organizationId: string, category?: string): Promise<SystemSetting[]> {
    try {
      let query = this.supabase
        .from('system_settings')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true);

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query.order('category', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching system settings:', error);
      throw new Error('Error al obtener configuraciones del sistema');
    }
  }

  /**
   * Actualizar configuración del sistema
   */
  async updateSystemSetting(id: string, value: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('system_settings')
        .update({ value })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating system setting:', error);
      throw new Error('Error al actualizar configuración');
    }
  }

  /**
   * Obtener horarios de trabajo configurados
   */
  async getWorkingHours(organizationId: string): Promise<{
    startTime: string;
    endTime: string;
    lunchStart: string;
    lunchEnd: string;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('work_policies')
        .select('start_time, end_time, break_duration')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .limit(1)
        .single();

      if (error || !data) {
        // Valores por defecto si no hay configuración
        return {
          startTime: '08:00',
          endTime: '17:00',
          lunchStart: '12:00',
          lunchEnd: '13:00'
        };
      }

      // Calcular horario de almuerzo basado en break_duration
      const lunchStart = '12:00';
      const lunchDuration = data.break_duration || 60;
      const lunchEndHour = 12 + Math.floor(lunchDuration / 60);
      const lunchEndMinute = lunchDuration % 60;
      const lunchEnd = `${lunchEndHour.toString().padStart(2, '0')}:${lunchEndMinute.toString().padStart(2, '0')}`;

      return {
        startTime: data.start_time || '08:00',
        endTime: data.end_time || '17:00',
        lunchStart,
        lunchEnd
      };
    } catch (error) {
      console.error('Error fetching working hours:', error);
      return {
        startTime: '08:00',
        endTime: '17:00',
        lunchStart: '12:00',
        lunchEnd: '13:00'
      };
    }
  }

  /**
   * Configurar horario individual para un empleado
   */
  async setEmployeeWorkSchedule(
    employeeId: string, 
    schedule: {
      hours_per_day: number;
      days_per_week: number;
      start_time?: string;
      end_time?: string;
      break_duration?: number;
      flexible_hours?: boolean;
    }
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('employees')
        .update({
          work_schedule: schedule,
          updated_at: new Date().toISOString()
        })
        .eq('id', employeeId);

      if (error) throw error;
    } catch (error) {
      console.error('Error setting employee work schedule:', error);
      throw new Error('Error al configurar horario del empleado');
    }
  }

  /**
   * Obtener horario individual de un empleado
   */
  async getEmployeeWorkSchedule(employeeId: string): Promise<{
    hours_per_day: number;
    days_per_week: number;
    start_time?: string;
    end_time?: string;
    break_duration?: number;
    flexible_hours?: boolean;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('employees')
        .select('work_schedule')
        .eq('id', employeeId)
        .single();

      if (error) throw error;

      return data?.work_schedule || {
        hours_per_day: 8,
        days_per_week: 5,
        start_time: '09:00',
        end_time: '17:00',
        break_duration: 60,
        flexible_hours: false
      };
    } catch (error) {
      console.error('Error getting employee work schedule:', error);
      return {
        hours_per_day: 8,
        days_per_week: 5,
        start_time: '09:00',
        end_time: '17:00',
        break_duration: 60,
        flexible_hours: false
      };
    }
  }

  /**
   * Actualizar horarios de trabajo generales
   */
  async updateWorkingHours(
    organizationId: string,
    hours: {
      startTime: string;
      endTime: string;
      lunchStart: string;
      lunchEnd: string;
    }
  ): Promise<void> {
    try {
      // Calcular duración del almuerzo
      const lunchStart = new Date(`2000-01-01 ${hours.lunchStart}`);
      const lunchEnd = new Date(`2000-01-01 ${hours.lunchEnd}`);
      const breakDuration = (lunchEnd.getTime() - lunchStart.getTime()) / (1000 * 60); // en minutos

      // Verificar si existe una política activa
      const { data: existingPolicy, error: fetchError } = await this.supabase
        .from('work_policies')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .limit(1)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingPolicy) {
        // Actualizar política existente
        const { error } = await this.supabase
          .from('work_policies')
          .update({
            start_time: hours.startTime,
            end_time: hours.endTime,
            break_duration: breakDuration
          })
          .eq('id', existingPolicy.id);

        if (error) throw error;
      } else {
        // Crear nueva política
        const { error } = await this.supabase
          .from('work_policies')
          .insert({
            organization_id: organizationId,
            name: 'Horario General',
            start_time: hours.startTime,
            end_time: hours.endTime,
            break_duration: breakDuration,
            late_threshold: 15,
            working_days: 5,
            is_active: true
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error updating working hours:', error);
      throw new Error('Error al actualizar horarios de trabajo');
    }
  }
  async updateWorkPolicies(
    organizationId: string,
    policies: {
      late_threshold?: number;
      max_daily_hours?: number;
      allow_remote?: boolean;
      require_geolocation?: boolean;
      working_days?: number;
    }
  ): Promise<void> {
    try {
      // Verificar si existe una política activa
      const { data: existingPolicy, error: fetchError } = await this.supabase
        .from('work_policies')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .limit(1)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingPolicy) {
        // Actualizar política existente
        const { error } = await this.supabase
          .from('work_policies')
          .update(policies)
          .eq('id', existingPolicy.id);

        if (error) throw error;
      } else {
        // Crear nueva política
        const { error } = await this.supabase
          .from('work_policies')
          .insert({
            organization_id: organizationId,
            name: 'Política Principal',
            start_time: '08:00',
            end_time: '17:00',
            break_duration: 60,
            working_days: 5,
            is_active: true,
            ...policies
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error updating work policies:', error);
      // Proporcionar información más específica del error
      if (error && typeof error === 'object' && 'message' in error) {
        throw new Error(`Error al actualizar políticas de trabajo: ${error.message}`);
      }
      throw new Error('Error al actualizar políticas de trabajo');
    }
  }

  /**
   * Obtener políticas de trabajo actuales
   */
  async getCurrentWorkPolicies(organizationId: string): Promise<{
    late_threshold: number;
    max_daily_hours: number;
    allow_remote: boolean;
    require_geolocation: boolean;
    working_days: number;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('work_policies')
        .select('late_threshold, max_daily_hours, allow_remote, require_geolocation, working_days')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .limit(1)
        .single();

      if (error || !data) {
        // Valores por defecto si no hay configuración
        return {
          late_threshold: 15,
          max_daily_hours: 8,
          allow_remote: false,
          require_geolocation: true,
          working_days: 5
        };
      }

      return {
        late_threshold: data.late_threshold || 15,
        max_daily_hours: data.max_daily_hours || 8,
        allow_remote: data.allow_remote || false,
        require_geolocation: data.require_geolocation || true,
        working_days: data.working_days || 5
      };
    } catch (error) {
      console.error('Error fetching current work policies:', error);
      return {
        late_threshold: 15,
        max_daily_hours: 8,
        allow_remote: false,
        require_geolocation: true,
        working_days: 5
      };
    }
  }
}

export const systemConfigService = new SystemConfigService();
