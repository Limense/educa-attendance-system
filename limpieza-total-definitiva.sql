-- =============================================
-- LIMPIEZA TOTAL Y CONFIGURACIÓN DEFINITIVA
-- =============================================
-- Ejecutar TODO este archivo de una vez en Supabase SQL Editor

-- =============================================
-- PASO 1: BORRAR TODA LA COMPLEJIDAD ANTERIOR
-- =============================================

-- Borrar todas las políticas problemáticas
DROP POLICY IF EXISTS "employees_org_select" ON employees;
DROP POLICY IF EXISTS "employees_org_insert" ON employees;
DROP POLICY IF EXISTS "employees_org_update" ON employees;
DROP POLICY IF EXISTS "employees_admin_delete" ON employees;
DROP POLICY IF EXISTS "employees_read_own_org" ON employees;
DROP POLICY IF EXISTS "employees_insert_admin" ON employees;
DROP POLICY IF EXISTS "employees_update_admin" ON employees;
DROP POLICY IF EXISTS "employees_delete_admin" ON employees;

-- Borrar funciones complejas problemáticas
DROP FUNCTION IF EXISTS can_manage_employees();
DROP FUNCTION IF EXISTS can_view_employees();

-- =============================================
-- PASO 2: FUNCIONES SIMPLES Y CONFIABLES
-- =============================================

-- Función simple para obtener organización del usuario
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS uuid
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN (
    SELECT organization_id 
    FROM employees 
    WHERE id = auth.uid()
    LIMIT 1
  );
END;
$$;

-- Función simple para obtener rol del usuario
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM employees 
    WHERE id = auth.uid()
    LIMIT 1
  );
END;
$$;

-- Función simple para verificar si es admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(role = 'admin', false)
    FROM employees 
    WHERE id = auth.uid()
    LIMIT 1
  );
END;
$$;

-- =============================================
-- PASO 3: POLÍTICAS RLS SIMPLES Y EFECTIVAS
-- =============================================

-- Política SELECT: Solo ver empleados de tu organización
CREATE POLICY "employees_select_same_org" ON employees
FOR SELECT TO authenticated
USING (
  organization_id = get_user_organization_id()
);

-- Política INSERT: Solo admins pueden crear empleados
CREATE POLICY "employees_insert_admin_only" ON employees
FOR INSERT TO authenticated
WITH CHECK (
  is_admin() = true
  AND organization_id = get_user_organization_id()
);

-- Política UPDATE: Solo admins pueden actualizar empleados de su org
CREATE POLICY "employees_update_admin_only" ON employees
FOR UPDATE TO authenticated
USING (
  is_admin() = true
  AND organization_id = get_user_organization_id()
)
WITH CHECK (
  is_admin() = true
  AND organization_id = get_user_organization_id()
);

-- Política DELETE: Solo admins pueden eliminar empleados (excepto a sí mismos)
CREATE POLICY "employees_delete_admin_only" ON employees
FOR DELETE TO authenticated
USING (
  is_admin() = true
  AND organization_id = get_user_organization_id()
  AND id != auth.uid()  -- No pueden eliminarse a sí mismos
);

-- =============================================
-- PASO 4: VERIFICACIÓN COMPLETA
-- =============================================

-- Verificar que las funciones funcionan
SELECT 
  'FUNCIONES RLS' as test,
  auth.uid() as user_id,
  get_user_organization_id() as org_id,
  get_user_role() as user_role,
  is_admin() as is_admin_check;

-- Verificar políticas aplicadas
SELECT 
  'POLÍTICAS APLICADAS' as test,
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE tablename = 'employees'
ORDER BY cmd;

-- Contar empleados visibles (debería mostrar todos los de tu org)
SELECT 
  'EMPLEADOS VISIBLES' as test,
  COUNT(*) as total_visible
FROM employees;

-- Verificar que el admin puede ver al empleado específico
SELECT 
  'EMPLEADO ESPECÍFICO' as test,
  id,
  email,
  role,
  organization_id
FROM employees 
WHERE id = 'dcab660d-03bc-423a-046f-6c6be5527c87';

-- =============================================
-- PASO 5: MENSAJE DE ÉXITO
-- =============================================
SELECT '🎉 LIMPIEZA COMPLETA EXITOSA - RLS SIMPLIFICADO Y FUNCIONAL' as resultado;
