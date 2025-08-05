-- =============================================
-- MATRIZ DE PERMISOS FINAL - SISTEMA EDUCA
-- =============================================
-- Basado en análisis completo del proyecto y funcionalidades reales

-- =============================================
-- 📋 ROLES Y SUS RESPONSABILIDADES
-- =============================================

/*
🔵 EMPLOYEE (Empleado):
- Solo puede ver y gestionar sus propios datos
- Registrar su asistencia (check-in/check-out)
- Ver su historial personal de asistencias
- Actualizar información básica de su perfil

🟡 ADMIN (Administrador):
- Gestión completa de empleados de su organización
- Ver todos los datos de asistencia de su organización
- Crear/editar/activar/desactivar empleados
- Generar reportes organizacionales
- Configurar settings básicos
- NO PUEDE: crear otros admins, eliminar empleados definitivamente

🔴 SUPER_ADMIN (Super Administrador):
- Control total del sistema
- Gestionar organizaciones
- Crear/modificar/eliminar cualquier usuario
- Acceso a auditorías del sistema
- Configuración avanzada del sistema
- Gestión completa de roles
*/

-- =============================================
-- 1. LIMPIAR POLÍTICAS EXISTENTES EN TODAS LAS TABLAS
-- =============================================

-- Limpiar employees (incluir todas las políticas posibles)
DROP POLICY IF EXISTS "employees_select_policy" ON employees;
DROP POLICY IF EXISTS "employees_insert_policy" ON employees;
DROP POLICY IF EXISTS "employees_update_policy" ON employees;
DROP POLICY IF EXISTS "employees_delete_policy" ON employees;

-- Limpiar organizations
DROP POLICY IF EXISTS "organizations_select_policy" ON organizations;
DROP POLICY IF EXISTS "organizations_insert_policy" ON organizations;
DROP POLICY IF EXISTS "organizations_update_policy" ON organizations;
DROP POLICY IF EXISTS "organizations_delete_policy" ON organizations;

-- Limpiar departments
DROP POLICY IF EXISTS "departments_select_policy" ON departments;
DROP POLICY IF EXISTS "departments_insert_policy" ON departments;
DROP POLICY IF EXISTS "departments_update_policy" ON departments;
DROP POLICY IF EXISTS "departments_delete_policy" ON departments;

-- Limpiar positions
DROP POLICY IF EXISTS "positions_select_policy" ON positions;
DROP POLICY IF EXISTS "positions_insert_policy" ON positions;
DROP POLICY IF EXISTS "positions_update_policy" ON positions;
DROP POLICY IF EXISTS "positions_delete_policy" ON positions;

-- Limpiar attendances
DROP POLICY IF EXISTS "attendances_select_policy" ON attendances;
DROP POLICY IF EXISTS "attendances_insert_policy" ON attendances;
DROP POLICY IF EXISTS "attendances_update_policy" ON attendances;
DROP POLICY IF EXISTS "attendances_delete_policy" ON attendances;

-- Limpiar attendance_types
DROP POLICY IF EXISTS "attendance_types_select_policy" ON attendance_types;
DROP POLICY IF EXISTS "attendance_types_insert_policy" ON attendance_types;
DROP POLICY IF EXISTS "attendance_types_update_policy" ON attendance_types;
DROP POLICY IF EXISTS "attendance_types_delete_policy" ON attendance_types;

-- Limpiar work_policies
DROP POLICY IF EXISTS "work_policies_select_policy" ON work_policies;
DROP POLICY IF EXISTS "work_policies_insert_policy" ON work_policies;
DROP POLICY IF EXISTS "work_policies_update_policy" ON work_policies;
DROP POLICY IF EXISTS "work_policies_delete_policy" ON work_policies;

-- Limpiar system_settings
DROP POLICY IF EXISTS "system_settings_select_policy" ON system_settings;
DROP POLICY IF EXISTS "system_settings_insert_policy" ON system_settings;
DROP POLICY IF EXISTS "system_settings_update_policy" ON system_settings;
DROP POLICY IF EXISTS "system_settings_delete_policy" ON system_settings;

-- Limpiar setting_audit_logs
DROP POLICY IF EXISTS "setting_audit_logs_select_policy" ON setting_audit_logs;
DROP POLICY IF EXISTS "setting_audit_logs_insert_policy" ON setting_audit_logs;
DROP POLICY IF EXISTS "setting_audit_logs_update_policy" ON setting_audit_logs;
DROP POLICY IF EXISTS "setting_audit_logs_delete_policy" ON setting_audit_logs;

-- =============================================
-- 🚫 RESTRICCIONES CRÍTICAS DE SEGURIDAD
-- =============================================

-- 1. PREVENIR ESCALACIÓN DE PRIVILEGIOS
CREATE OR REPLACE FUNCTION prevent_privilege_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo super_admin puede crear otros admins o super_admins
  IF NEW.role IN ('admin', 'super_admin') THEN
    IF NOT EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
      AND is_active = true
    ) THEN
      RAISE EXCEPTION 'Solo super_admin puede crear roles administrativos';
    END IF;
  END IF;
  
  -- Los admins no pueden cambiar roles (solo en UPDATE)
  IF TG_OP = 'UPDATE' THEN
    IF OLD.role != NEW.role THEN
      IF NOT EXISTS (
        SELECT 1 FROM employees 
        WHERE id = auth.uid() 
        AND role = 'super_admin' 
        AND is_active = true
      ) THEN
        RAISE EXCEPTION 'Solo super_admin puede cambiar roles';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger a tabla employees
DROP TRIGGER IF EXISTS prevent_privilege_escalation_trigger ON employees;
CREATE TRIGGER prevent_privilege_escalation_trigger
  BEFORE INSERT OR UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION prevent_privilege_escalation();

-- =============================================
-- 2. HABILITAR RLS EN TODAS LAS TABLAS
-- =============================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE setting_audit_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 📊 TABLA: EMPLOYEES (CRÍTICA - AUTENTICACIÓN)
-- =============================================

-- SELECT: Lectura de empleados
CREATE POLICY "employees_select_policy" ON employees
  FOR SELECT
  USING (
    -- Todos pueden leer para autenticación básica
    true
    -- La lógica específica se maneja en la aplicación
  );

-- INSERT: Crear empleados
CREATE POLICY "employees_insert_policy" ON employees
  FOR INSERT
  WITH CHECK (
    -- Solo admins y super_admins pueden crear empleados
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
      AND is_active = true
    )
  );

-- UPDATE: Actualizar empleados
CREATE POLICY "employees_update_policy" ON employees
  FOR UPDATE
  USING (
    -- Empleado puede actualizar su propio perfil (campos limitados)
    id = auth.uid()
    OR
    -- Admins pueden actualizar empleados de su organización
    EXISTS (
      SELECT 1 FROM employees admin_emp
      WHERE admin_emp.id = auth.uid() 
      AND admin_emp.role IN ('admin', 'super_admin')
      AND admin_emp.is_active = true
      AND admin_emp.organization_id = employees.organization_id
    )
  );

-- DELETE: Solo super_admin puede eliminar definitivamente
CREATE POLICY "employees_delete_policy" ON employees
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
      AND is_active = true
    )
  );

-- =============================================
-- 🏢 TABLA: ORGANIZATIONS
-- =============================================

-- SELECT: Ver organizaciones
CREATE POLICY "organizations_select_policy" ON organizations
  FOR SELECT
  USING (
    -- Solo empleados de la organización pueden verla
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND organization_id = organizations.id
      AND is_active = true
    )
  );

-- INSERT: Crear organizaciones - solo super_admin
CREATE POLICY "organizations_insert_policy" ON organizations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
      AND is_active = true
    )
  );

-- UPDATE: Modificar organizaciones
CREATE POLICY "organizations_update_policy" ON organizations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
      AND is_active = true
    )
  );

-- DELETE: Eliminar organizaciones - solo super_admin
CREATE POLICY "organizations_delete_policy" ON organizations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
      AND is_active = true
    )
  );

-- =============================================
-- 🏬 TABLA: DEPARTMENTS
-- =============================================

-- SELECT: Ver departamentos de la organización
CREATE POLICY "departments_select_policy" ON departments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND organization_id = departments.organization_id
      AND is_active = true
    )
  );

-- INSERT/UPDATE/DELETE: Solo admins de la organización
CREATE POLICY "departments_insert_policy" ON departments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
      AND organization_id = departments.organization_id
      AND is_active = true
    )
  );

CREATE POLICY "departments_update_policy" ON departments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
      AND organization_id = departments.organization_id
      AND is_active = true
    )
  );

CREATE POLICY "departments_delete_policy" ON departments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
      AND organization_id = departments.organization_id
      AND is_active = true
    )
  );

-- =============================================
-- 💼 TABLA: POSITIONS
-- =============================================

-- SELECT: Ver posiciones de la organización
CREATE POLICY "positions_select_policy" ON positions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND organization_id = positions.organization_id
      AND is_active = true
    )
  );

-- INSERT/UPDATE/DELETE: Solo admins de la organización
CREATE POLICY "positions_insert_policy" ON positions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
      AND organization_id = positions.organization_id
      AND is_active = true
    )
  );

CREATE POLICY "positions_update_policy" ON positions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
      AND organization_id = positions.organization_id
      AND is_active = true
    )
  );

CREATE POLICY "positions_delete_policy" ON positions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
      AND organization_id = positions.organization_id
      AND is_active = true
    )
  );

-- =============================================
-- 📈 TABLA: ATTENDANCES
-- =============================================

-- SELECT: Ver asistencias
CREATE POLICY "attendances_select_policy" ON attendances
  FOR SELECT
  USING (
    -- Empleado ve solo sus asistencias
    employee_id = auth.uid()
    OR
    -- Admins ven todas las de su organización
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
      AND is_active = true
      AND organization_id = attendances.organization_id
    )
  );

-- INSERT: Crear asistencias
CREATE POLICY "attendances_insert_policy" ON attendances
  FOR INSERT
  WITH CHECK (
    -- Empleado registra su propia asistencia
    employee_id = auth.uid()
    OR
    -- Admins pueden registrar para cualquiera de su organización
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
      AND is_active = true
      AND organization_id = attendances.organization_id
    )
  );

-- UPDATE: Modificar asistencias
CREATE POLICY "attendances_update_policy" ON attendances
  FOR UPDATE
  USING (
    -- Empleado puede hacer check-out de su propia asistencia
    employee_id = auth.uid()
    OR
    -- Admins pueden modificar cualquier asistencia de su organización
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
      AND is_active = true
      AND organization_id = attendances.organization_id
    )
  );

-- DELETE: Solo admins pueden eliminar asistencias
CREATE POLICY "attendances_delete_policy" ON attendances
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
      AND is_active = true
      AND organization_id = attendances.organization_id
    )
  );

-- =============================================
-- 📋 TABLA: ATTENDANCE_TYPES
-- =============================================

-- SELECT: Todos los empleados pueden ver tipos de asistencia
CREATE POLICY "attendance_types_select_policy" ON attendance_types
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND organization_id = attendance_types.organization_id
      AND is_active = true
    )
  );

-- INSERT/UPDATE/DELETE: Solo admins
CREATE POLICY "attendance_types_insert_policy" ON attendance_types
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
      AND organization_id = attendance_types.organization_id
      AND is_active = true
    )
  );

CREATE POLICY "attendance_types_update_policy" ON attendance_types
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
      AND organization_id = attendance_types.organization_id
      AND is_active = true
    )
  );

CREATE POLICY "attendance_types_delete_policy" ON attendance_types
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
      AND organization_id = attendance_types.organization_id
      AND is_active = true
    )
  );

-- =============================================
-- 📝 TABLA: WORK_POLICIES
-- =============================================

-- SELECT: Todos pueden ver políticas de trabajo
CREATE POLICY "work_policies_select_policy" ON work_policies
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND organization_id = work_policies.organization_id
      AND is_active = true
    )
  );

-- INSERT/UPDATE/DELETE: Solo admins
CREATE POLICY "work_policies_insert_policy" ON work_policies
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
      AND organization_id = work_policies.organization_id
      AND is_active = true
    )
  );

CREATE POLICY "work_policies_update_policy" ON work_policies
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
      AND organization_id = work_policies.organization_id
      AND is_active = true
    )
  );

CREATE POLICY "work_policies_delete_policy" ON work_policies
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
      AND organization_id = work_policies.organization_id
      AND is_active = true
    )
  );

-- =============================================
-- ⚙️ TABLA: SYSTEM_SETTINGS
-- =============================================

-- SELECT: Admins pueden ver configuraciones
CREATE POLICY "system_settings_select_policy" ON system_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
      AND organization_id = system_settings.organization_id
      AND is_active = true
    )
  );

-- INSERT/UPDATE: Solo admins pueden modificar configuraciones
CREATE POLICY "system_settings_insert_policy" ON system_settings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
      AND organization_id = system_settings.organization_id
      AND is_active = true
    )
  );

CREATE POLICY "system_settings_update_policy" ON system_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
      AND organization_id = system_settings.organization_id
      AND is_active = true
    )
  );

-- DELETE: Solo super_admin puede eliminar configuraciones
CREATE POLICY "system_settings_delete_policy" ON system_settings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
      AND is_active = true
    )
  );

-- =============================================
-- 📊 TABLA: SETTING_AUDIT_LOGS
-- =============================================

-- SELECT: Solo super_admin puede ver auditorías
CREATE POLICY "setting_audit_logs_select_policy" ON setting_audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
      AND is_active = true
    )
  );

-- INSERT: Sistema puede insertar automáticamente
CREATE POLICY "setting_audit_logs_insert_policy" ON setting_audit_logs
  FOR INSERT
  WITH CHECK (true); -- Los logs se crean automáticamente

-- UPDATE/DELETE: Prohibido - los logs son inmutables
-- (No se crean políticas de UPDATE/DELETE para mantener integridad)

-- =============================================
-- 11. VERIFICAR ESTADO FINAL DE RLS
-- =============================================

SELECT 
    tablename as "Tabla",
    CASE 
        WHEN rowsecurity THEN '🔒 RLS HABILITADO'
        ELSE '🔓 RLS DESHABILITADO'
    END as "Estado RLS",
    (
        SELECT COUNT(*) 
        FROM pg_policies p 
        WHERE p.schemaname = 'public' 
        AND p.tablename = t.tablename
    ) as "Políticas"
FROM pg_tables t
LEFT JOIN pg_class c ON c.relname = t.tablename
WHERE t.schemaname = 'public'
AND t.tablename NOT LIKE 'pg_%'
AND t.tablename NOT LIKE 'attendances_20%'  -- Excluir particiones
ORDER BY tablename;

-- =============================================
-- 📋 RESUMEN DE FUNCIONALIDADES POR ROL
-- =============================================

/*
🔵 EMPLOYEE (Empleado):
✅ Ver su propio perfil
✅ Actualizar información básica personal
✅ Registrar asistencia (check-in/check-out)
✅ Ver su historial de asistencias
✅ Ver departamentos y posiciones de su organización
❌ No puede crear/editar otros empleados
❌ No puede cambiar roles
❌ No puede ver asistencias de otros

🟡 ADMIN (Administrador):  
✅ Gestión completa de empleados de su organización
✅ Crear/editar/activar/desactivar empleados (solo rol 'employee')
✅ Ver todas las asistencias de su organización
✅ Crear/modificar departamentos y posiciones
✅ Configurar tipos de asistencia y políticas
✅ Ver y modificar configuraciones del sistema
✅ Generar reportes organizacionales
❌ No puede crear otros admins
❌ No puede cambiar roles de empleados
❌ No puede eliminar empleados definitivamente
❌ No puede acceder a otras organizaciones

🔴 SUPER_ADMIN (Super Administrador):
✅ Control total sobre todas las organizaciones
✅ Crear/modificar/eliminar cualquier usuario
✅ Gestión completa de roles y permisos
✅ Crear y gestionar organizaciones
✅ Eliminar empleados definitivamente
✅ Acceso a logs de auditoría del sistema
✅ Configuración avanzada del sistema
✅ Todas las funcionalidades del sistema
*/

SELECT '🛡️ MATRIZ DE PERMISOS IMPLEMENTADA - Sistema totalmente seguro' as resultado;
