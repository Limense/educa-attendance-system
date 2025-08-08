/**
 * HOOK PARA OBTENER LISTA DE EMPLEADOS
 */

'use client';

import { useState, useEffect } from 'react';
import { employeeService } from '@/services/employee.service';

export interface Employee {
  id: string;
  employee_code?: string;
  email: string;
  full_name: string;
  phone?: string;
  hire_date: string;
  role: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  work_schedule?: {
    hours_per_day: number;
    days_per_week: number;
    start_time?: string;
    end_time?: string;
    break_duration?: number;
    flexible_hours?: boolean;
  };
  departments?: {
    id: string;
    name: string;
  };
  positions?: {
    id: string;
    title: string;
  };
}

export function useEmployees(organizationId: string) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      if (!organizationId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const data = await employeeService.getEmployees(organizationId);
        setEmployees(data || []);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al cargar empleados';
        setError(errorMessage);
        console.error('Error fetching employees:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [organizationId]);

  const refetch = async () => {
    if (!organizationId) return;
    
    try {
      setError(null);
      const data = await employeeService.getEmployees(organizationId);
      setEmployees(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar empleados';
      setError(errorMessage);
      console.error('Error refetching employees:', err);
    }
  };

  return {
    employees,
    loading,
    error,
    refetch
  };
}

export default useEmployees;
