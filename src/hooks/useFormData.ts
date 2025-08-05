/**
 * =============================================
 * HOOK PARA DATOS DE FORMULARIOS
 * =============================================
 * 
 * Descripción: Hook para obtener datos necesarios en formularios
 * Como departamentos, posiciones, roles, etc.
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { createFormDataService, FormDataOption } from '@/services/form-data.service';

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
  
  const service = useMemo(() => createFormDataService(), []);
  
  const [roles] = useState<FormDataOption[]>(() => service.getRoles());
  const [statuses] = useState<FormDataOption[]>(() => service.getEmployeeStatuses());
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDepartments = async (): Promise<void> => {
    try {
      setError(null);
      const depts = await service.getDepartments(organizationId);
      setDepartments(depts);
    } catch (err) {
      console.error('Error cargando departamentos:', err);
      setError('Error cargando departamentos');
    }
  };

  const loadPositions = async (): Promise<void> => {
    try {
      setError(null);
      const pos = await service.getPositions(organizationId);
      setPositions(pos);
    } catch (err) {
      console.error('Error cargando posiciones:', err);
      setError('Error cargando posiciones');
    }
  };

  const getPositionsByDepartment = async (departmentId: string): Promise<FormDataOption[]> => {
    try {
      return await service.getPositionsByDepartment(organizationId, departmentId);
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
      try {
        setError(null);
        const [depts, pos] = await Promise.all([
          service.getDepartments(organizationId),
          service.getPositions(organizationId)
        ]);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
