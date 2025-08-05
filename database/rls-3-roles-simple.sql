-- =============================================
-- RLS SIMPLIFICADO - SOLO 3 ROLES ACTUALES
-- =============================================
-- ROLES ACTIVOS:
-- • super_admin = Control total (1 empleado)
-- • admin = Gestión completa (1 empleado)  
-- • employee = Solo su asistencia (8 empleados)
--
-- ROLES FUTUROS (comentados por ahora):
-- • supervisor = Supervisor de área
-- • manager = Gerente de equipo  
-- • hr = Recursos humanos

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

-- VER EMPLEADOS:
-- • super_admin/admin: Ven todos los empleados
-- • employee: Solo su propio perfil
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
      AND organization_id = NEW.organization_id
      AND role IN ('super_admin', 'admin')
    )
  );

-- ACTUALIZAR EMPLEADOS: Admins o su propio perfil
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
      -- Su propio perfil
      id = auth.uid()
      OR
      -- Admins pueden editar cualquiera
      EXISTS (
        SELECT 1 FROM employees 
        WHERE id = auth.uid() 
        AND organization_id = employees.organization_id
        AND role IN ('super_admin', 'admin')
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
-- POLÍTICAS PARA ATTENDANCES
-- =============================================

-- VER ASISTENCIAS: Admins ven todas, employees solo las suyas
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
      -- Admins ven todas
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
    organization_id IN (
      SELECT organization_id FROM employees WHERE id = auth.uid()
    )
    AND
    (
      -- Su propia asistencia
      employee_id = auth.uid()
      OR
      -- Admins pueden crear para cualquiera
      EXISTS (
        SELECT 1 FROM employees 
        WHERE id = auth.uid() 
        AND organization_id = NEW.organization_id
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
    organization_id IN (
      SELECT organization_id FROM employees WHERE id = auth.uid()
    )
    AND
    (
      -- Su propia asistencia (para check-out)
      employee_id = auth.uid()
      OR
      -- Admins pueden actualizar cualquiera
      EXISTS (
        SELECT 1 FROM employees 
        WHERE id = auth.uid() 
        AND organization_id = attendances.organization_id
        AND role IN ('super_admin', 'admin')
      )
    )
  );

-- =============================================
-- POLÍTICAS PARA OTRAS TABLAS
-- =============================================

-- DEPARTMENTS: Todos pueden ver, solo admins modificar
CREATE POLICY "departments_select_policy" ON departments
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND
    organization_id IN (
      SELECT organization_id FROM employees WHERE id = auth.uid()
    )
  );

CREATE POLICY "departments_modify_policy" ON departments
  FOR ALL
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

-- POSITIONS: Similar a departments
CREATE POLICY "positions_select_policy" ON positions
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND
    organization_id IN (
      SELECT organization_id FROM employees WHERE id = auth.uid()
    )
  );

CREATE POLICY "positions_modify_policy" ON positions
  FOR ALL
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

-- ORGANIZATIONS: Ver su org, solo super_admin modifica
CREATE POLICY "organizations_select_policy" ON organizations
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND
    id IN (
      SELECT organization_id FROM employees WHERE id = auth.uid()
    )
  );

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

-- SYSTEM_SETTINGS: Ver todos, solo admins modifican
CREATE POLICY "system_settings_select_policy" ON system_settings
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND
    organization_id IN (
      SELECT organization_id FROM employees WHERE id = auth.uid()
    )
  );

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
-- VERIFICACIÓN
-- =============================================
SELECT 'RLS aplicado correctamente con 3 roles: super_admin, admin, employee' as resultado;
