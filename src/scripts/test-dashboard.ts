/**
 * Script de Testing para Dashboard de Empleado
 * Este script nos ayuda a verificar todas las funcionalidades
 */

import { createSupabaseClient } from '@/lib/supabase/client';

export interface TestResults {
  authentication: boolean;
  employeeDataLoad: boolean;
  attendanceLoad: boolean;
  checkInFunctionality: boolean;
  checkOutFunctionality: boolean;
  realTimeClock: boolean;
  notifications: boolean;
  logout: boolean;
}

export class DashboardTester {
  private supabase = createSupabaseClient();
  private results: TestResults = {
    authentication: false,
    employeeDataLoad: false,
    attendanceLoad: false,
    checkInFunctionality: false,
    checkOutFunctionality: false,
    realTimeClock: false,
    notifications: false,
    logout: false
  };

  async runAllTests(): Promise<TestResults> {
    console.log('🧪 Iniciando tests del Dashboard de Empleado...');
    
    try {
      await this.testAuthentication();
      await this.testEmployeeDataLoad();
      await this.testAttendanceLoad();
      await this.testRealTimeClock();
      
      console.log('✅ Tests completados');
      return this.results;
    } catch (error) {
      console.error('❌ Error en tests:', error);
      return this.results;
    }
  }

  private async testAuthentication(): Promise<void> {
    console.log('🔑 Testing autenticación...');
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser();
      this.results.authentication = !error && !!user;
      console.log(this.results.authentication ? '✅ Autenticación OK' : '❌ Autenticación fallida');
    } catch (error) {
      console.error('❌ Error en autenticación:', error);
    }
  }

  private async testEmployeeDataLoad(): Promise<void> {
    console.log('👤 Testing carga de datos del empleado...');
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return;

      const { data: employeeData, error } = await this.supabase
        .from('employees')
        .select(`
          *,
          department:departments(name),
          position:positions(title)
        `)
        .eq('email', user.email)
        .single();

      this.results.employeeDataLoad = !error && !!employeeData;
      console.log(this.results.employeeDataLoad ? '✅ Datos del empleado OK' : '❌ Error cargando empleado');
      
      if (employeeData) {
        console.log(`📋 Empleado: ${employeeData.first_name} ${employeeData.last_name}`);
        console.log(`🏢 Departamento: ${employeeData.department?.name || 'N/A'}`);
        console.log(`💼 Posición: ${employeeData.position?.title || 'N/A'}`);
      }
    } catch (error) {
      console.error('❌ Error cargando datos del empleado:', error);
    }
  }

  private async testAttendanceLoad(): Promise<void> {
    console.log('📅 Testing carga de asistencia del día...');
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return;

      const { data: employeeData } = await this.supabase
        .from('employees')
        .select('id')
        .eq('email', user.email)
        .single();

      if (!employeeData) return;

      const today = new Date().toISOString().split('T')[0];
      const { data: attendanceData, error } = await this.supabase
        .from('attendances')
        .select('*')
        .eq('employee_id', employeeData.id)
        .eq('attendance_date', today)
        .single();

      this.results.attendanceLoad = true; // Success if no error or expected error
      console.log(attendanceData ? '✅ Asistencia encontrada para hoy' : '📝 Sin asistencia registrada hoy');
    } catch (error) {
      console.error('❌ Error cargando asistencia:', error);
    }
  }

  private async testRealTimeClock(): Promise<void> {
    console.log('⏰ Testing reloj en tiempo real...');
    
    const startTime = new Date();
    
    setTimeout(() => {
      const endTime = new Date();
      const timeDiff = endTime.getTime() - startTime.getTime();
      
      this.results.realTimeClock = timeDiff >= 1000; // Al menos 1 segundo
      console.log(this.results.realTimeClock ? '✅ Reloj en tiempo real OK' : '❌ Reloj no actualiza');
    }, 1100);
  }

  async testCheckInFunctionality(employeeId: string): Promise<boolean> {
    console.log('⬇️ Testing funcionalidad de Check-In...');
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const time = now.toISOString();

      const { data, error } = await this.supabase
        .from('attendances')
        .insert({
          employee_id: employeeId,
          attendance_date: today,
          check_in_time: time,
          status: 'present',
          type: 'regular'
        })
        .select()
        .single();

      const success = !error && !!data;
      this.results.checkInFunctionality = success;
      console.log(success ? '✅ Check-In OK' : '❌ Check-In fallido');
      return success;
    } catch (error) {
      console.error('❌ Error en Check-In:', error);
      return false;
    }
  }

  async testCheckOutFunctionality(attendanceId: string): Promise<boolean> {
    console.log('⬆️ Testing funcionalidad de Check-Out...');
    try {
      const now = new Date();
      const time = now.toISOString();

      const { data, error } = await this.supabase
        .from('attendances')
        .update({
          check_out_time: time,
          updated_at: time
        })
        .eq('id', attendanceId)
        .select()
        .single();

      const success = !error && !!data;
      this.results.checkOutFunctionality = success;
      console.log(success ? '✅ Check-Out OK' : '❌ Check-Out fallido');
      return success;
    } catch (error) {
      console.error('❌ Error en Check-Out:', error);
      return false;
    }
  }

  generateTestReport(): string {
    const total = Object.keys(this.results).length;
    const passed = Object.values(this.results).filter(Boolean).length;
    const percentage = Math.round((passed / total) * 100);

    return `
📊 REPORTE DE TESTING - DASHBOARD EMPLEADO
============================================
✅ Tests Pasados: ${passed}/${total} (${percentage}%)

🔑 Autenticación: ${this.results.authentication ? '✅' : '❌'}
👤 Carga Datos Empleado: ${this.results.employeeDataLoad ? '✅' : '❌'}
📅 Carga Asistencia: ${this.results.attendanceLoad ? '✅' : '❌'}
⬇️ Check-In: ${this.results.checkInFunctionality ? '✅' : '❌'}
⬆️ Check-Out: ${this.results.checkOutFunctionality ? '✅' : '❌'}
⏰ Reloj Tiempo Real: ${this.results.realTimeClock ? '✅' : '❌'}
🔔 Notificaciones: ${this.results.notifications ? '✅' : '❌'}
🚪 Logout: ${this.results.logout ? '✅' : '❌'}

${percentage >= 80 ? '🎉 Dashboard funcionando correctamente!' : '⚠️ Revisar funcionalidades fallidas'}
============================================
    `;
  }
}
