-- =============================================
-- RLS CORREGIDO - POLÍTICAS SEPARADAS
-- =============================================
-- ROLES ACTIVOS:
-- • super_admin = Control total (1 empleado)
-- • admin = Gestión completa (1 empleado)  
-- • employee = Solo su asistencia (8 empleados)

-- Eliminar políticas públicas inseguras
DROP POLICY IF EXISTS "Public read access" ON organizations;
DROP POLICY IF EXISTS "Public read access" ON departments;
DROP POLICY IF EXISTS "Public read access" ON employees;
DROP POLICY IF EXISTS "Public read access" ON attendances;
DROP POLICY IF EXISTS "Public read access" ON system_settings;
DROP POLICY IF EXISTS "Public read access" ON positions;

-- =============================================
-- POLÍTICAS PARA EMPLOYEES
-- =============================================

-- VER EMPLEADOS: Admins ven todos, employees solo su perfil
CREATE POLICY "employees_select_policy" ON employees
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND
    organization_id IN (
      SELECT organization_id FROM employees WHERE id = auth.uid()
    )
    AND
    (
      -- Admins ven todos
      EXISTS (
        SELECT 1 FROM employees 
        WHERE id = auth.uid() 
        AND role IN ('super_admin', 'admin')
      )
      OR
      -- Employees solo su propio perfil
      (id = auth.uid())
    )
  );

-- CREAR EMPLEADOS: Solo admins
CREATE POLICY "employees_insert_policy" ON employees
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'admin')
    )
  );

-- ACTUALIZAR EMPLEADOS: Admins o su propio perfil
CREATE POLICY "employees_update_policy" ON employees
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL 
    AND
    (
      -- Su propio perfil
      id = auth.uid()
      OR
      -- Admins pueden editar cualquiera
      EXISTS (
        SELECT 1 FROM employees 
        WHERE id = auth.uid() 
        AND role IN ('super_admin', 'admin')
      )
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND
    (
      -- Su propio perfil
      id = auth.uid()
      OR
      -- Admins pueden editar cualquiera
      EXISTS (
        SELECT 1 FROM employees 
        WHERE id = auth.uid() 
        AND role IN ('super_admin', 'admin')
      )
    )
  );

-- ELIMINAR EMPLEADOS: Solo admins
CREATE POLICY "employees_delete_policy" ON employees
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL 
    AND
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'admin')
    )
  );

-- =============================================
-- POLÍTICAS PARA ATTENDANCES
-- =============================================

-- VER ASISTENCIAS: Admins ven todas, employees solo las suyas
CREATE POLICY "attendances_select_policy" ON attendances
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND
    (
      -- Sus propias asistencias
      employee_id = auth.uid()
      OR
      -- Admins ven todas de su organización
      EXISTS (
        SELECT 1 FROM employees 
        WHERE id = auth.uid() 
        AND organization_id = attendances.organization_id
        AND role IN ('super_admin', 'admin')
      )
    )
  );

-- CREAR ASISTENCIAS: Employees sus propias, admins cualquiera
CREATE POLICY "attendances_insert_policy" ON attendances
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND
    (
      -- Su propia asistencia
      employee_id = auth.uid()
      OR
      -- Admins pueden crear para cualquiera
      EXISTS (
        SELECT 1 FROM employees 
        WHERE id = auth.uid() 
        AND role IN ('super_admin', 'admin')
      )
    )
  );

-- ACTUALIZAR ASISTENCIAS: Similar a crear
CREATE POLICY "attendances_update_policy" ON attendances
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL 
    AND
    (
      -- Su propia asistencia
      employee_id = auth.uid()
      OR
      -- Admins pueden actualizar cualquiera
      EXISTS (
        SELECT 1 FROM employees 
        WHERE id = auth.uid() 
        AND role IN ('super_admin', 'admin')
      )
    )
  );

-- =============================================
-- POLÍTICAS PARA DEPARTMENTS
-- =============================================

-- VER DEPARTAMENTOS: Todos pueden ver
CREATE POLICY "departments_select_policy" ON departments
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND
    organization_id IN (
      SELECT organization_id FROM employees WHERE id = auth.uid()
    )
  );

-- CREAR DEPARTAMENTOS: Solo admins
CREATE POLICY "departments_insert_policy" ON departments
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'admin')
    )
  );

-- ACTUALIZAR DEPARTAMENTOS: Solo admins
CREATE POLICY "departments_update_policy" ON departments
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL 
    AND
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND organization_id = departments.organization_id
      AND role IN ('super_admin', 'admin')
    )
  );

-- ELIMINAR DEPARTAMENTOS: Solo admins
CREATE POLICY "departments_delete_policy" ON departments
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL 
    AND
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND organization_id = departments.organization_id
      AND role IN ('super_admin', 'admin')
    )
  );

-- =============================================
-- POLÍTICAS PARA POSITIONS
-- =============================================

-- VER POSICIONES: Todos pueden ver
CREATE POLICY "positions_select_policy" ON positions
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND
    organization_id IN (
      SELECT organization_id FROM employees WHERE id = auth.uid()
    )
  );

-- CREAR POSICIONES: Solo admins
CREATE POLICY "positions_insert_policy" ON positions
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'admin')
    )
  );

-- ACTUALIZAR POSICIONES: Solo admins
CREATE POLICY "positions_update_policy" ON positions
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL 
    AND
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND organization_id = positions.organization_id
      AND role IN ('super_admin', 'admin')
    )
  );

-- ELIMINAR POSICIONES: Solo admins
CREATE POLICY "positions_delete_policy" ON positions
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL 
    AND
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND organization_id = positions.organization_id
      AND role IN ('super_admin', 'admin')
    )
  );

-- =============================================
-- POLÍTICAS PARA ORGANIZATIONS
-- =============================================

-- VER ORGANIZACIONES: Solo su propia organización
CREATE POLICY "organizations_select_policy" ON organizations
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND
    id IN (
      SELECT organization_id FROM employees WHERE id = auth.uid()
    )
  );

-- ACTUALIZAR ORGANIZACIONES: Solo super_admin
CREATE POLICY "organizations_update_policy" ON organizations
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL 
    AND
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND organization_id = organizations.id
      AND role = 'super_admin'
    )
  );

-- =============================================
-- POLÍTICAS PARA SYSTEM_SETTINGS
-- =============================================

-- VER CONFIGURACIONES: Todos pueden ver
CREATE POLICY "system_settings_select_policy" ON system_settings
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND
    organization_id IN (
      SELECT organization_id FROM employees WHERE id = auth.uid()
    )
  );

-- ACTUALIZAR CONFIGURACIONES: Solo admins
CREATE POLICY "system_settings_update_policy" ON system_settings
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL 
    AND
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND organization_id = system_settings.organization_id
      AND role IN ('super_admin', 'admin')
    )
  );

-- =============================================
-- HABILITAR RLS EN TODAS LAS TABLAS
-- =============================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;  
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- VERIFICACIÓN
-- =============================================
SELECT 'RLS aplicado correctamente con políticas separadas para cada operación' as resultado;
