-- =============================================
-- SCRIPT PARA HABILITAR RLS SEGÚN ROLES ESPECÍFICOS
-- =============================================
-- ROLES DEFINIDOS:
-- • super_admin, admin, hr = Acceso completo al panel admin y CRUD
-- • manager, supervisor = Acceso limitado (ver empleados)  
-- • employee = Solo marcar asistencia y ver su perfil

-- Primero, eliminar las políticas públicas inseguras
DROP POLICY IF EXISTS "Public read access" ON organizations;
DROP POLICY IF EXISTS "Public read access" ON departments;
DROP POLICY IF EXISTS "Public read access" ON employees;
DROP POLICY IF EXISTS "Public read access" ON attendances;
DROP POLICY IF EXISTS "Public read access" ON system_settings;
DROP POLICY IF EXISTS "Public read access" ON positions;
DROP POLICY IF EXISTS "Public read access" ON work_policies;

-- También eliminar cualquier política de escritura pública
DROP POLICY IF EXISTS "Public write access" ON organizations;
DROP POLICY IF EXISTS "Public write access" ON departments;
DROP POLICY IF EXISTS "Public write access" ON employees;
DROP POLICY IF EXISTS "Public write access" ON attendances;
DROP POLICY IF EXISTS "Public write access" ON system_settings;
DROP POLICY IF EXISTS "Public write access" ON positions;
DROP POLICY IF EXISTS "Public write access" ON work_policies;

-- =============================================
-- POLÍTICAS PARA EMPLOYEES (ACCESO SEGÚN ROL)
-- =============================================

-- VER EMPLEADOS:
-- • Admins/HR: Ven todos los empleados de la organización
-- • Managers/Supervisors: Ven empleados de la organización  
-- • Employees: Solo ven su propio perfil
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
      -- Admins/HR ven todos
      EXISTS (
        SELECT 1 FROM employees 
        WHERE id = auth.uid() 
        AND role IN ('super_admin', 'admin', 'hr')
      )
      OR
      -- Managers/Supervisors ven todos de la organización (para reportes)
      EXISTS (
        SELECT 1 FROM employees 
        WHERE id = auth.uid() 
        AND role IN ('manager', 'supervisor')
      )
      OR
      -- Employees solo su propio perfil
      (id = auth.uid())
    )
  );

-- CREAR EMPLEADOS: Solo admins y HR
CREATE POLICY "employees_insert_policy" ON employees
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND organization_id = NEW.organization_id
      AND role IN ('super_admin', 'admin', 'hr')
    )
  );

-- ACTUALIZAR EMPLEADOS: 
-- • Admins/HR: Pueden editar cualquier empleado
-- • Todos: Pueden editar su propio perfil básico
CREATE POLICY "employees_update_policy" ON employees
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL 
    AND
    organization_id IN (
      SELECT organization_id FROM employees WHERE id = auth.uid()
    )
    AND
    (
      -- Su propio perfil (info básica)
      id = auth.uid()
      OR
      -- Admins/HR pueden editar cualquiera
      EXISTS (
        SELECT 1 FROM employees 
        WHERE id = auth.uid() 
        AND organization_id = employees.organization_id
        AND role IN ('super_admin', 'admin', 'hr')
      )
    )
  );

-- ELIMINAR EMPLEADOS: Solo super_admin y admin
CREATE POLICY "employees_delete_policy" ON employees
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL 
    AND
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND organization_id = employees.organization_id
      AND role IN ('super_admin', 'admin')
    )
  );

-- =============================================
-- POLÍTICAS PARA ATTENDANCES (ASISTENCIAS)
-- =============================================

-- VER ASISTENCIAS:
-- • Admins/HR/Managers: Ven todas las asistencias
-- • Supervisors: Ven asistencias de su área (por ahora todas)
-- • Employees: Solo sus propias asistencias
CREATE POLICY "attendances_select_policy" ON attendances
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND
    organization_id IN (
      SELECT organization_id FROM employees WHERE id = auth.uid()
    )
    AND
    (
      -- Sus propias asistencias
      employee_id = auth.uid()
      OR
      -- Admins/HR/Managers/Supervisors ven todas
      EXISTS (
        SELECT 1 FROM employees 
        WHERE id = auth.uid() 
        AND organization_id = attendances.organization_id
        AND role IN ('super_admin', 'admin', 'hr', 'manager', 'supervisor')
      )
    )
  );

-- CREAR ASISTENCIAS: 
-- • Employees: Sus propias asistencias (check-in/check-out)
-- • Admins/HR: Pueden crear para cualquiera
CREATE POLICY "attendances_insert_policy" ON attendances
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND
    organization_id IN (
      SELECT organization_id FROM employees WHERE id = auth.uid()
    )
    AND
    (
      -- Su propia asistencia
      employee_id = auth.uid()
      OR
      -- Admins/HR pueden crear para cualquiera
      EXISTS (
        SELECT 1 FROM employees 
        WHERE id = auth.uid() 
        AND organization_id = NEW.organization_id
        AND role IN ('super_admin', 'admin', 'hr')
      )
    )
  );

-- ACTUALIZAR ASISTENCIAS:
-- • Employees: Sus propias asistencias (para check-out)
-- • Admins/HR: Pueden actualizar cualquiera
CREATE POLICY "attendances_update_policy" ON attendances
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL 
    AND
    organization_id IN (
      SELECT organization_id FROM employees WHERE id = auth.uid()
    )
    AND
    (
      -- Su propia asistencia
      employee_id = auth.uid()
      OR
      -- Admins/HR pueden actualizar cualquiera
      EXISTS (
        SELECT 1 FROM employees 
        WHERE id = auth.uid() 
        AND organization_id = attendances.organization_id
        AND role IN ('super_admin', 'admin', 'hr')
      )
    )
  );

-- =============================================
-- POLÍTICAS PARA DEPARTMENTS Y POSITIONS
-- =============================================

-- VER DEPARTAMENTOS/POSICIONES: Todos los empleados (para formularios)
CREATE POLICY "departments_select_policy" ON departments
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND
    organization_id IN (
      SELECT organization_id FROM employees WHERE id = auth.uid()
    )
  );

CREATE POLICY "positions_select_policy" ON positions
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND
    organization_id IN (
      SELECT organization_id FROM employees WHERE id = auth.uid()
    )
  );

-- CREAR/MODIFICAR DEPARTAMENTOS/POSICIONES: Solo admins
CREATE POLICY "departments_insert_policy" ON departments
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND organization_id = NEW.organization_id
      AND role IN ('super_admin', 'admin')
    )
  );

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

CREATE POLICY "positions_insert_policy" ON positions
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND organization_id = NEW.organization_id
      AND role IN ('super_admin', 'admin')
    )
  );

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

-- =============================================
-- POLÍTICAS PARA ORGANIZATIONS
-- =============================================

-- VER ORGANIZACIONES: Todos ven su propia organización
CREATE POLICY "organizations_select_policy" ON organizations
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND
    id IN (
      SELECT organization_id FROM employees WHERE id = auth.uid()
    )
  );

-- MODIFICAR ORGANIZACIONES: Solo super_admin
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

-- VER CONFIGURACIONES: Todos pueden ver (para funcionalidad)
CREATE POLICY "system_settings_select_policy" ON system_settings
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND
    organization_id IN (
      SELECT organization_id FROM employees WHERE id = auth.uid()
    )
  );

-- MODIFICAR CONFIGURACIONES: Solo admins
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
-- VERIFICACIÓN DE POLÍTICAS
-- =============================================

-- Mostrar todas las políticas creadas
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd,
  CASE 
    WHEN cmd = 'SELECT' THEN 'Ver/Leer'
    WHEN cmd = 'INSERT' THEN 'Crear'
    WHEN cmd = 'UPDATE' THEN 'Actualizar'
    WHEN cmd = 'DELETE' THEN 'Eliminar'
    ELSE cmd
  END as accion
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, cmd, policyname;

-- =============================================
-- POLÍTICAS SEGURAS PARA ATTENDANCES
-- =============================================

-- Los empleados pueden ver sus propias asistencias + admins pueden ver todas
CREATE POLICY "attendances_select_policy" ON attendances
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND
    (
      -- Sus propias asistencias
      employee_id = auth.uid()
      OR
      -- O es admin/manager de la misma organización
      EXISTS (
        SELECT 1 FROM employees 
        WHERE id = auth.uid() 
        AND organization_id = attendances.organization_id
        AND role IN ('admin', 'super_admin', 'hr', 'manager')
      )
    )
  );

-- Los empleados pueden crear sus propias asistencias
CREATE POLICY "attendances_insert_policy" ON attendances
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND
    (
      -- Su propia asistencia
      employee_id = auth.uid()
      OR
      -- O es admin/manager
      EXISTS (
        SELECT 1 FROM employees 
        WHERE id = auth.uid() 
        AND organization_id = NEW.organization_id
        AND role IN ('admin', 'super_admin', 'hr', 'manager')
      )
    )
  );

-- Los empleados pueden actualizar sus propias asistencias (para check-out)
CREATE POLICY "attendances_update_policy" ON attendances
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL 
    AND
    (
      -- Su propia asistencia
      employee_id = auth.uid()
      OR
      -- O es admin/manager
      EXISTS (
        SELECT 1 FROM employees 
        WHERE id = auth.uid() 
        AND organization_id = attendances.organization_id
        AND role IN ('admin', 'super_admin', 'hr', 'manager')
      )
    )
  );

-- =============================================
-- POLÍTICAS SEGURAS PARA DEPARTMENTS
-- =============================================

-- Los empleados pueden ver departamentos de su organización
CREATE POLICY "departments_select_policy" ON departments
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND
    organization_id IN (
      SELECT organization_id 
      FROM employees 
      WHERE id = auth.uid()
    )
  );

-- Solo admins pueden crear/modificar departamentos
CREATE POLICY "departments_insert_policy" ON departments
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND organization_id = NEW.organization_id
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "departments_update_policy" ON departments
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL 
    AND
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND organization_id = departments.organization_id
      AND role IN ('admin', 'super_admin')
    )
  );

-- =============================================
-- POLÍTICAS SEGURAS PARA POSITIONS
-- =============================================

-- Los empleados pueden ver posiciones de su organización
CREATE POLICY "positions_select_policy" ON positions
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND
    organization_id IN (
      SELECT organization_id 
      FROM employees 
      WHERE id = auth.uid()
    )
  );

-- Solo admins pueden crear/modificar posiciones
CREATE POLICY "positions_insert_policy" ON positions
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND organization_id = NEW.organization_id
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "positions_update_policy" ON positions
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL 
    AND
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND organization_id = positions.organization_id
      AND role IN ('admin', 'super_admin')
    )
  );

-- =============================================
-- POLÍTICAS SEGURAS PARA ORGANIZATIONS
-- =============================================

-- Los empleados solo pueden ver su propia organización
CREATE POLICY "organizations_select_policy" ON organizations
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND
    id IN (
      SELECT organization_id 
      FROM employees 
      WHERE id = auth.uid()
    )
  );

-- Solo super_admins pueden modificar organizaciones
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

-- Los empleados pueden ver configuraciones de su organización
CREATE POLICY "system_settings_select_policy" ON system_settings
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND
    organization_id IN (
      SELECT organization_id 
      FROM employees 
      WHERE id = auth.uid()
    )
  );

-- Solo admins pueden modificar configuraciones
CREATE POLICY "system_settings_update_policy" ON system_settings
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL 
    AND
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND organization_id = system_settings.organization_id
      AND role IN ('admin', 'super_admin')
    )
  );

-- =============================================
-- VERIFICACIÓN DE POLÍTICAS
-- =============================================

-- Mostrar todas las políticas creadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
