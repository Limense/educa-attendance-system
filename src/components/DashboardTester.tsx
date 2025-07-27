'use client';

import React, { useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  timestamp?: string;
}

export default function DashboardTester() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Autenticación', status: 'pending', message: 'No ejecutado' },
    { name: 'Carga de Empleado', status: 'pending', message: 'No ejecutado' },
    { name: 'Carga de Asistencia', status: 'pending', message: 'No ejecutado' },
    { name: 'Reloj Tiempo Real', status: 'pending', message: 'No ejecutado' },
  ]);
  const [running, setRunning] = useState(false);

  const updateTest = (index: number, status: TestResult['status'], message: string) => {
    setTests(prev => prev.map((test, i) => 
      i === index 
        ? { ...test, status, message, timestamp: new Date().toLocaleTimeString() }
        : test
    ));
  };

  const runAllTests = async () => {
    setRunning(true);
    const supabase = createSupabaseClient();

    // Test 1: Autenticación
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      
      updateTest(0, 'success', user ? `Usuario: ${user.email}` : 'Sin usuario');
    } catch (error) {
      updateTest(0, 'error', `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }

    // Test 2: Carga de Empleado
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const { data: employeeData, error } = await supabase
        .from('employees')
        .select(`
          *,
          department:departments(name),
          position:positions(title)
        `)
        .eq('email', user.email)
        .single();

      if (error) throw error;
      
      updateTest(1, 'success', 
        `${employeeData.first_name} ${employeeData.last_name} - ${employeeData.department?.name || 'Sin depto'}`
      );
    } catch (error) {
      updateTest(1, 'error', `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }

    // Test 3: Carga de Asistencia
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const { data: employeeData } = await supabase
        .from('employees')
        .select('id')
        .eq('email', user.email)
        .single();

      if (!employeeData) throw new Error('Empleado no encontrado');

      const today = new Date().toISOString().split('T')[0];
      const { data: attendanceData } = await supabase
        .from('attendances')
        .select('*')
        .eq('employee_id', employeeData.id)
        .eq('attendance_date', today)
        .single();

      updateTest(2, 'success', 
        attendanceData 
          ? `Asistencia encontrada: ${attendanceData.check_in_time || 'Sin hora'}` 
          : 'Sin asistencia hoy'
      );
    } catch (error) {
      updateTest(2, 'error', `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }

    // Test 4: Reloj Tiempo Real
    const startTime = Date.now();
    setTimeout(() => {
      const elapsed = Date.now() - startTime;
      updateTest(3, 'success', `Tiempo transcurrido: ${elapsed}ms`);
    }, 1000);

    setRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'pending': return '⏳';
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'pending': return 'text-yellow-600';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
        🧪 Dashboard Tester
      </h1>
      
      <div className="mb-6">
        <button
          onClick={runAllTests}
          disabled={running}
          className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors ${
            running 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {running ? '🔄 Ejecutando Tests...' : '🚀 Ejecutar Todos los Tests'}
        </button>
      </div>

      <div className="space-y-4">
        {tests.map((test, index) => (
          <div 
            key={index}
            className="p-4 border border-gray-200 rounded-lg bg-gray-50"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getStatusIcon(test.status)}</span>
                <span className="font-semibold text-gray-800">{test.name}</span>
              </div>
              {test.timestamp && (
                <span className="text-sm text-gray-500">{test.timestamp}</span>
              )}
            </div>
            <p className={`mt-2 ${getStatusColor(test.status)}`}>
              {test.message}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">📋 Instrucciones de Testing Manual:</h3>
        <ol className="list-decimal list-inside space-y-1 text-blue-700">
          <li>Ejecuta los tests automáticos arriba</li>
          <li>Ve al <a href="/dashboard/employee" className="underline">Dashboard de Empleado</a></li>
          <li>Verifica que el reloj funcione (debe actualizarse cada segundo)</li>
          <li>Prueba hacer Check-In si no lo has hecho hoy</li>
          <li>Prueba hacer Check-Out después del Check-In</li>
          <li>Verifica que los mensajes de confirmación aparezcan</li>
          <li>Prueba el botón de Logout</li>
        </ol>
      </div>

      <div className="mt-6 text-center">
        <a 
          href="/dashboard/employee"
          className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
        >
          🏃‍♂️ Ir al Dashboard de Empleado
        </a>
      </div>
    </div>
  );
}
