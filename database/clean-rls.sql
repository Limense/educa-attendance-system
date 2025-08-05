-- =============================================
-- LIMPIAR TODAS LAS POLÍTICAS RLS EXISTENTES
-- =============================================
-- Este script elimina todas las políticas existentes para empezar limpio

-- =============================================
-- ELIMINAR POLÍTICAS DE ORGANIZATIONS
-- =============================================
DROP POLICY IF EXISTS "organizations_select_policy" ON organizations;
DROP POLICY IF EXISTS "organizations_insert_policy" ON organizations;
DROP POLICY IF EXISTS "organizations_update_policy" ON organizations;
DROP POLICY IF EXISTS "organizations_delete_policy" ON organizations;
DROP POLICY IF EXISTS "Public read access" ON organizations;

-- =============================================
-- ELIMINAR POLÍTICAS DE DEPARTMENTS
-- =============================================
DROP POLICY IF EXISTS "departments_select_policy" ON departments;
DROP POLICY IF EXISTS "departments_insert_policy" ON departments;
DROP POLICY IF EXISTS "departments_update_policy" ON departments;
DROP POLICY IF EXISTS "departments_delete_policy" ON departments;
DROP POLICY IF EXISTS "Public read access" ON departments;

-- =============================================
-- ELIMINAR POLÍTICAS DE POSITIONS
-- =============================================
DROP POLICY IF EXISTS "positions_select_policy" ON positions;
DROP POLICY IF EXISTS "positions_insert_policy" ON positions;
DROP POLICY IF EXISTS "positions_update_policy" ON positions;
DROP POLICY IF EXISTS "positions_delete_policy" ON positions;

-- =============================================
-- ELIMINAR POLÍTICAS DE EMPLOYEES
-- =============================================
DROP POLICY IF EXISTS "employees_select_policy" ON employees;
DROP POLICY IF EXISTS "employees_insert_policy" ON employees;
DROP POLICY IF EXISTS "employees_update_policy" ON employees;
DROP POLICY IF EXISTS "employees_delete_policy" ON employees;
DROP POLICY IF EXISTS "Public read access" ON employees;

-- =============================================
-- ELIMINAR POLÍTICAS DE ATTENDANCES
-- =============================================
DROP POLICY IF EXISTS "attendances_select_policy" ON attendances;
DROP POLICY IF EXISTS "attendances_insert_policy" ON attendances;
DROP POLICY IF EXISTS "attendances_update_policy" ON attendances;
DROP POLICY IF EXISTS "attendances_delete_policy" ON attendances;
DROP POLICY IF EXISTS "Public read access" ON attendances;

-- =============================================
-- ELIMINAR POLÍTICAS DE ATTENDANCE_TYPES
-- =============================================
DROP POLICY IF EXISTS "attendance_types_select_policy" ON attendance_types;
DROP POLICY IF EXISTS "attendance_types_insert_policy" ON attendance_types;
DROP POLICY IF EXISTS "attendance_types_update_policy" ON attendance_types;
DROP POLICY IF EXISTS "attendance_types_delete_policy" ON attendance_types;

-- =============================================
-- ELIMINAR POLÍTICAS DE WORK_POLICIES
-- =============================================
DROP POLICY IF EXISTS "work_policies_select_policy" ON work_policies;
DROP POLICY IF EXISTS "work_policies_insert_policy" ON work_policies;
DROP POLICY IF EXISTS "work_policies_update_policy" ON work_policies;
DROP POLICY IF EXISTS "work_policies_delete_policy" ON work_policies;

-- =============================================
-- ELIMINAR POLÍTICAS DE SYSTEM_SETTINGS
-- =============================================
DROP POLICY IF EXISTS "system_settings_select_policy" ON system_settings;
DROP POLICY IF EXISTS "system_settings_insert_policy" ON system_settings;
DROP POLICY IF EXISTS "system_settings_update_policy" ON system_settings;
DROP POLICY IF EXISTS "system_settings_delete_policy" ON system_settings;
DROP POLICY IF EXISTS "Public read access" ON system_settings;

-- =============================================
-- ELIMINAR POLÍTICAS DE SETTING_AUDIT_LOGS
-- =============================================
DROP POLICY IF EXISTS "setting_audit_logs_select_policy" ON setting_audit_logs;
DROP POLICY IF EXISTS "setting_audit_logs_insert_policy" ON setting_audit_logs;
DROP POLICY IF EXISTS "setting_audit_logs_update_policy" ON setting_audit_logs;
DROP POLICY IF EXISTS "setting_audit_logs_delete_policy" ON setting_audit_logs;

-- =============================================
-- VERIFICAR LIMPIEZA
-- =============================================
-- Mostrar las políticas que quedan (debería estar vacío)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

SELECT '🧹 LIMPIEZA COMPLETADA - Listo para crear políticas nuevas' as resultado;
