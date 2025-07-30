-- =============================================
-- CONFIGURACIÓN FINAL - SIMPLE Y FUNCIONAL
-- =============================================
-- Ejecuta esto en Supabase SQL Editor logueado como admin

-- Paso 1: Limpiar políticas anteriores
DROP POLICY IF EXISTS "employees_org_select" ON employees;
DROP POLICY IF EXISTS "employees_org_insert" ON employees;
DROP POLICY IF EXISTS "employees_org_update" ON employees;
DROP POLICY IF EXISTS "employees_admin_delete" ON employees;
DROP POLICY IF EXISTS "employees_read_own_org" ON employees;
DROP POLICY IF EXISTS "employees_insert_admin" ON employees;
DROP POLICY IF EXISTS "employees_update_admin" ON employees;
DROP POLICY IF EXISTS "employees_delete_admin" ON employees;
DROP POLICY IF EXISTS "employees_select_same_org" ON employees;
DROP POLICY IF EXISTS "employees_insert_admin_only" ON employees;
DROP POLICY IF EXISTS "employees_update_admin_only" ON employees;
DROP POLICY IF EXISTS "employees_delete_admin_only" ON employees;

-- Paso 2: Funciones RLS simples
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

-- Paso 3: Políticas RLS finales
CREATE POLICY "employees_select" ON employees
FOR SELECT TO authenticated
USING (organization_id = get_user_organization_id());

CREATE POLICY "employees_insert" ON employees
FOR INSERT TO authenticated
WITH CHECK (is_admin() = true AND organization_id = get_user_organization_id());

CREATE POLICY "employees_update" ON employees
FOR UPDATE TO authenticated
USING (is_admin() = true AND organization_id = get_user_organization_id())
WITH CHECK (is_admin() = true AND organization_id = get_user_organization_id());

CREATE POLICY "employees_delete" ON employees
FOR DELETE TO authenticated
USING (is_admin() = true AND organization_id = get_user_organization_id() AND id != auth.uid());

-- Paso 4: Verificación
SELECT 
  'VERIFICACIÓN FINAL' as test,
  auth.uid() as user_id,
  get_user_organization_id() as org_id,
  get_user_role() as user_role,
  is_admin() as is_admin_result;

-- Si is_admin_result es false, ejecuta esto:
-- UPDATE employees SET role = 'admin' WHERE email = 'admin@educa-demo.com';

SELECT '✅ CONFIGURACIÓN COMPLETADA' as resultado;
