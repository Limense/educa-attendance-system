/**
 * =============================================
 * HOOK PARA DATOS DE FORMULARIOS - SIMPLIFICADO 
 * =============================================
 * 
 * Descripción: Hook simplificado para datos básicos de formularios
 * Versión funcional que no depende de servicios complejos
 */

'use client';

import { useState, useEffect } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';

export interface FormDataOption {
  value: string;
  label: string;
}

export interface UseFormDataResult {
  departments: FormDataOption[];
  positions: FormDataOption[];
  roles: FormDataOption[];
  statuses: FormDataOption[];
  loading: boolean;
  error: string | null;
  refreshDepartments: () => Promise<void>;
  refreshPositions: () => Promise<void>;
  getPositionsByDepartment: (departmentId: string) => Promise<FormDataOption[]>;
}

export function useFormData(organizationId: string): UseFormDataResult {
  const [departments, setDepartments] = useState<FormDataOption[]>([]);
  const [positions, setPositions] = useState<FormDataOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Datos estáticos para roles y estados ACTUALES
  const roles: FormDataOption[] = [
    { value: 'employee', label: 'Empleado' },
    { value: 'admin', label: 'Administrador' },
    { value: 'super_admin', label: 'Super Administrador' }
  ];

  const statuses: FormDataOption[] = [
    { value: 'active', label: 'Activo' },
    { value: 'inactive', label: 'Inactivo' }
  ];

  const loadDepartments = async (): Promise<void> => {
    try {
      setError(null);
      const supabase = createSupabaseClient();
      
      const { data, error: supabaseError } = await supabase
        .from('departments')
        .select('id, name')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('name');

      if (supabaseError) throw supabaseError;

      const depts = data?.map((dept: { id: string; name: string }) => ({
        value: dept.id,
        label: dept.name
      })) || [];
      
      setDepartments(depts);
    } catch (err) {
      console.error('Error cargando departamentos:', err);
      setError('Error cargando departamentos');
    }
  };

  const loadPositions = async (): Promise<void> => {
    try {
      setError(null);
      const supabase = createSupabaseClient();
      
      const { data, error: supabaseError } = await supabase
        .from('positions')
        .select('id, title')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('title');

      if (supabaseError) throw supabaseError;

      const pos = data?.map((position: { id: string; title: string }) => ({
        value: position.id,
        label: position.title
      })) || [];
      
      setPositions(pos);
    } catch (err) {
      console.error('Error cargando posiciones:', err);
      setError('Error cargando posiciones');
    }
  };

  const getPositionsByDepartment = async (departmentId: string): Promise<FormDataOption[]> => {
    try {
      const supabase = createSupabaseClient();
      
      const { data, error: supabaseError } = await supabase
        .from('positions')
        .select('id, title')
        .eq('organization_id', organizationId)
        .eq('department_id', departmentId)
        .eq('is_active', true)
        .order('title');

      if (supabaseError) throw supabaseError;

      return data?.map((position: { id: string; title: string }) => ({
        value: position.id,
        label: position.title
      })) || [];
    } catch (err) {
      console.error('Error cargando posiciones por departamento:', err);
      return [];
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      if (!organizationId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const supabase = createSupabaseClient();
        
        // Cargar departamentos y posiciones en paralelo
        const [deptResult, posResult] = await Promise.all([
          supabase
            .from('departments')
            .select('id, name')
            .eq('organization_id', organizationId)
            .eq('is_active', true)
            .order('name'),
          supabase
            .from('positions')
            .select('id, title')
            .eq('organization_id', organizationId)
            .eq('is_active', true)
            .order('title')
        ]);

        if (deptResult.error) throw deptResult.error;
        if (posResult.error) throw posResult.error;

        const depts = deptResult.data?.map((dept: { id: string; name: string }) => ({
          value: dept.id,
          label: dept.name
        })) || [];

        const pos = posResult.data?.map((position: { id: string; title: string }) => ({
          value: position.id,
          label: position.title
        })) || [];

        setDepartments(depts);
        setPositions(pos);
        
      } catch (err) {
        console.error('Error cargando datos:', err);
        setError('Error cargando datos del formulario');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [organizationId]);

  return {
    departments,
    positions,
    roles,
    statuses,
    loading,
    error,
    refreshDepartments: loadDepartments,
    refreshPositions: loadPositions,
    getPositionsByDepartment
  };
}
