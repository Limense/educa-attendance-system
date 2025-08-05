-- =============================================
-- DEBUG: VERIFICAR AUTENTICACIÓN Y PERMISOS
-- =============================================

-- 1. Ver todos los usuarios en auth.users
SELECT 
    id as "Auth ID",
    email,
    created_at
FROM auth.users 
ORDER BY created_at DESC;

-- 2. Ver todos los empleados
SELECT 
    id as "Employee ID",
    email,
    role,
    is_active,
    full_name
FROM employees 
ORDER BY created_at DESC;

-- 3. Buscar desincronización (usuarios en auth pero no en employees)
SELECT 
    au.id as "Auth ID",
    au.email as "Auth Email",
    e.id as "Employee ID",
    e.email as "Employee Email",
    e.role,
    e.is_active
FROM auth.users au
LEFT JOIN employees e ON au.id = e.id
WHERE e.id IS NULL;

-- 4. Verificar el usuario actual (si está autenticado)
SELECT 
    auth.uid() as "Current Auth UID",
    auth.email() as "Current Auth Email";

-- 5. Verificar si el usuario actual existe en employees
SELECT 
    e.id,
    e.email,
    e.role,
    e.is_active,
    e.full_name,
    CASE 
        WHEN e.id = auth.uid() THEN '✅ MATCH'
        ELSE '❌ NO MATCH'
    END as "ID Match"
FROM employees e
WHERE e.id = auth.uid()
   OR e.email = auth.email();

SELECT '🔍 DEBUG COMPLETADO - Revisar resultados arriba' as resultado;
