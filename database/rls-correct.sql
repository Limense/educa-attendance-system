-- =============================================
-- RLS CORRECTO BASADO EN LA ESTRUCTURA REAL
-- =============================================
-- ROLES ACTIVOS:
-- • super_admin = Control total
-- • admin = Panel administrativo y CRUD
-- • employee = Solo su información

-- =============================================
-- 1. HABILITAR RLS EN TABLAS FALTANTES
-- =============================================

-- Las tablas organizations, departments, employees, attendances, system_settings
-- ya tienen RLS habilitado desde supabase_init_complete.sql

-- Habilitar RLS en las que faltan
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE setting_audit_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 2. ELIMINAR POLÍTICAS PÚBLICAS TEMPORALES
-- =============================================

-- Eliminar las políticas "Public read access" temporales
DROP POLICY IF EXISTS "Public read access" ON organizations;
DROP POLICY IF EXISTS "Public read access" ON departments;
DROP POLICY IF EXISTS "Public read access" ON employees;
DROP POLICY IF EXISTS "Public read access" ON attendances;
DROP POLICY IF EXISTS "Public read access" ON system_settings;

-- =============================================
-- 3. POLÍTICAS PARA ORGANIZATIONS
-- =============================================

CREATE POLICY "organizations_select_policy" ON organizations
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND
    id IN (
      SELECT organization_id FROM employees WHERE id = auth.uid()
    )
  );

-- Solo super_admin puede crear/modificar organizaciones
CREATE POLICY "organizations_insert_policy" ON organizations
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
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

-- =============================================
-- 4. POLÍTICAS PARA DEPARTMENTS
-- =============================================

CREATE POLICY "departments_select_policy" ON departments
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND
    organization_id IN (
      SELECT organization_id FROM employees WHERE id = auth.uid()
    )
  );

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

-- =============================================
-- 5. POLÍTICAS PARA POSITIONS
-- =============================================

CREATE POLICY "positions_select_policy" ON positions
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND
    organization_id IN (
      SELECT organization_id FROM employees WHERE id = auth.uid()
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
-- 6. POLÍTICAS PARA EMPLOYEES (YA EXISTÍAN EN rls-3-roles-simple.sql)
-- =============================================

-- VER EMPLEADOS: Admins ven todos de su org, employees solo a sí mismos
CREATE POLICY "employees_select_policy" ON employees
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND
    (
      -- Ver su propio perfil
      id = auth.uid()
      OR
      -- Admins ven todos de su organización
      (
        EXISTS (
          SELECT 1 FROM employees admin_emp
          WHERE admin_emp.id = auth.uid() 
          AND admin_emp.role IN ('super_admin', 'admin')
          AND admin_emp.organization_id = employees.organization_id
        )
      )
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

-- ACTUALIZAR EMPLEADOS: Admins cualquiera, employees solo su perfil
CREATE POLICY "employees_update_policy" ON employees
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL 
    AND
    (
      -- Su propio perfil (campos limitados)
      id = auth.uid()
      OR
      -- Admins pueden actualizar cualquiera de su organización
      EXISTS (
        SELECT 1 FROM employees admin_emp
        WHERE admin_emp.id = auth.uid() 
        AND admin_emp.role IN ('super_admin', 'admin')
        AND admin_emp.organization_id = employees.organization_id
      )
    )
  );

-- =============================================
-- 7. POLÍTICAS PARA ATTENDANCES (YA EXISTÍAN)
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
        AND role IN ('super_admin', 'admin')
        AND organization_id = attendances.organization_id
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
      -- Admins pueden actualizar cualquiera de su organización
      EXISTS (
        SELECT 1 FROM employees 
        WHERE id = auth.uid() 
        AND role IN ('super_admin', 'admin')
        AND organization_id = attendances.organization_id
      )
    )
  );

-- =============================================
-- 8. POLÍTICAS PARA ATTENDANCE_TYPES (Sin employee_id)
-- =============================================

-- Los tipos de asistencia son configuración organizacional
CREATE POLICY "attendance_types_select_policy" ON attendance_types
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND
    organization_id IN (
      SELECT organization_id FROM employees WHERE id = auth.uid()
    )
  );

-- Solo admins pueden crear/modificar tipos
CREATE POLICY "attendance_types_insert_policy" ON attendance_types
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

CREATE POLICY "attendance_types_update_policy" ON attendance_types
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL 
    AND
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND organization_id = attendance_types.organization_id
      AND role IN ('super_admin', 'admin')
    )
  );

-- =============================================
-- 9. POLÍTICAS PARA WORK_POLICIES
-- =============================================

CREATE POLICY "work_policies_select_policy" ON work_policies
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND
    organization_id IN (
      SELECT organization_id FROM employees WHERE id = auth.uid()
    )
  );

CREATE POLICY "work_policies_insert_policy" ON work_policies
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

CREATE POLICY "work_policies_update_policy" ON work_policies
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL 
    AND
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND organization_id = work_policies.organization_id
      AND role IN ('super_admin', 'admin')
    )
  );

-- =============================================
-- 10. POLÍTICAS PARA SYSTEM_SETTINGS
-- =============================================

CREATE POLICY "system_settings_select_policy" ON system_settings
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND
    (
      -- Configuraciones públicas las ven todos
      is_public = true
      OR
      -- Configuraciones privadas solo admins
      EXISTS (
        SELECT 1 FROM employees 
        WHERE id = auth.uid() 
        AND organization_id = system_settings.organization_id
        AND role IN ('super_admin', 'admin')
      )
    )
  );

CREATE POLICY "system_settings_insert_policy" ON system_settings
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
-- 11. POLÍTICAS PARA AUDIT LOGS
-- =============================================

-- Solo super_admin puede ver logs de auditoría
CREATE POLICY "setting_audit_logs_select_policy" ON setting_audit_logs
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND organization_id = setting_audit_logs.organization_id
      AND role = 'super_admin'
    )
  );

-- Los logs se crean automáticamente via triggers
CREATE POLICY "setting_audit_logs_insert_policy" ON setting_audit_logs
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

-- =============================================
-- 12. VERIFICAR ESTADO RLS
-- =============================================

SELECT 
    tablename as "Tabla",
    CASE 
        WHEN rowsecurity THEN '✅ RLS HABILITADO'
        ELSE '❌ RLS DESHABILITADO'
    END as "Estado RLS"
FROM pg_tables t
LEFT JOIN pg_class c ON c.relname = t.tablename
WHERE t.schemaname = 'public'
AND t.tablename NOT LIKE 'pg_%'
ORDER BY tablename;

SELECT '🎉 RLS CONFIGURADO CORRECTAMENTE' as resultado;
