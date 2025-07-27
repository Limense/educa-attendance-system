-- =============================================
-- SCRIPT: ARREGLAR RLS PARA EDUCA ATTENDANCE SYSTEM
-- Basado en supabase_init_complete.sql
-- =============================================

-- PASO 1: Eliminar políticas existentes que solo permiten SELECT
DROP POLICY IF EXISTS "Public read access" ON attendances;
DROP POLICY IF EXISTS "Public read access" ON employees;
DROP POLICY IF EXISTS "Public read access" ON organizations;
DROP POLICY IF EXISTS "Public read access" ON departments;
DROP POLICY IF EXISTS "Public read access" ON system_settings;

-- PASO 2: Crear políticas completas para operaciones CRUD

-- ORGANIZATIONS - Lectura pública
CREATE POLICY "organizations_select_policy" ON organizations
FOR SELECT USING (true);

-- DEPARTMENTS - Lectura pública
CREATE POLICY "departments_select_policy" ON departments  
FOR SELECT USING (true);

-- POSITIONS - Lectura pública  
CREATE POLICY "positions_select_policy" ON positions
FOR SELECT USING (true);

-- EMPLOYEES - Usuarios autenticados pueden leer y actualizar
CREATE POLICY "employees_select_policy" ON employees
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "employees_update_policy" ON employees  
FOR UPDATE USING (auth.role() = 'authenticated');

-- ATTENDANCES - Usuarios autenticados pueden hacer todo
CREATE POLICY "attendances_select_policy" ON attendances
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "attendances_insert_policy" ON attendances
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "attendances_update_policy" ON attendances
FOR UPDATE USING (auth.role() = 'authenticated');

-- SYSTEM_SETTINGS - Lectura para autenticados
CREATE POLICY "system_settings_select_policy" ON system_settings
FOR SELECT USING (auth.role() = 'authenticated');

-- PASO 3: Verificar que todas las particiones de attendances tengan las políticas
-- (Las particiones heredan las políticas de la tabla padre, pero por si acaso)

-- PASO 4: Verificar datos del empleado que está fallando
SELECT 
  e.id,
  e.email, 
  e.first_name, 
  e.last_name, 
  e.organization_id,
  e.department_id,
  o.name as organization_name,
  d.name as department_name
FROM employees e
LEFT JOIN organizations o ON e.organization_id = o.id  
LEFT JOIN departments d ON e.department_id = d.id
WHERE e.email = 'empleado2@educa-demo.com';

-- PASO 5: Si el empleado no tiene organization_id, asignarlo
UPDATE employees 
SET organization_id = '550e8400-e29b-41d4-a716-446655440000'
WHERE email = 'empleado2@educa-demo.com' 
  AND (organization_id IS NULL OR organization_id != '550e8400-e29b-41d4-a716-446655440000');

-- PASO 6: Test de inserción directa en attendances
-- Este debería funcionar después de aplicar las políticas
/*
INSERT INTO attendances (
  organization_id,
  employee_id, 
  attendance_date,
  check_in_time,
  status
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  (SELECT id FROM employees WHERE email = 'empleado2@educa-demo.com'),
  '2025-07-27',
  NOW(),
  'present'
);
*/

-- PASO 7: Verificar las políticas aplicadas
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('employees', 'attendances', 'organizations', 'departments')
ORDER BY tablename, policyname;
