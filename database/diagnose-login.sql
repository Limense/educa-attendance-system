-- =============================================
-- DIAGNÓSTICO DEL PROBLEMA DE LOGIN ADMIN
-- =============================================

-- 1. VERIFICAR USUARIOS EN LA TABLA EMPLOYEES
SELECT 
    id,
    employee_code,
    email,
    first_name,
    last_name,
    role,
    is_active,
    created_at
FROM employees 
WHERE email = 'admin@educa-demo.com' OR role IN ('admin', 'super_admin')
ORDER BY created_at;

-- =============================================
-- 2. VERIFICAR USUARIOS EN SUPABASE AUTH
-- =============================================
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    updated_at,
    last_sign_in_at
FROM auth.users 
WHERE email = 'admin@educa-demo.com';

-- =============================================
-- 3. VERIFICAR SI HAY MATCH ENTRE AUTH Y EMPLOYEES
-- =============================================
SELECT 
    'EMPLOYEES' as tabla,
    e.id,
    e.email,
    e.role,
    e.is_active
FROM employees e
WHERE e.email = 'admin@educa-demo.com'

UNION ALL

SELECT 
    'AUTH' as tabla,
    au.id,
    au.email,
    'N/A' as role,
    CASE WHEN au.email_confirmed_at IS NOT NULL THEN 'true' ELSE 'false' END as is_active
FROM auth.users au
WHERE au.email = 'admin@educa-demo.com';

-- =============================================
-- 4. VERIFICAR POLÍTICAS RLS ACTUALES
-- =============================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'employees'
ORDER BY policyname;

-- =============================================
-- 5. PROBAR CONSULTA COMO SI FUERA EL LOGIN
-- =============================================
-- Esta consulta simula lo que hace el sistema al hacer login
SELECT 
    e.id,
    e.email,
    e.first_name,
    e.last_name,
    e.role,
    e.is_active,
    e.organization_id
FROM employees e
WHERE e.email = 'admin@educa-demo.com' 
AND e.is_active = true;

SELECT '🔍 DIAGNÓSTICO COMPLETADO' as resultado;
