-- =============================================
-- SINCRONIZAR IDs ENTRE AUTH.USERS Y EMPLOYEES
-- =============================================

-- PASO 1: Ver los IDs que no coinciden
SELECT 
    'ANTES - AUTH' as origen,
    au.id as auth_id,
    au.email
FROM auth.users au
WHERE au.email = 'admin@educa-demo.com'

UNION ALL

SELECT 
    'ANTES - EMPLOYEES' as origen,
    e.id as employee_id,
    e.email
FROM employees e
WHERE e.email = 'admin@educa-demo.com';

-- =============================================
-- PASO 2: ACTUALIZAR EL ID EN EMPLOYEES
-- =============================================

-- Actualizar el admin para que tenga el mismo ID que en auth.users
UPDATE employees 
SET id = 'c7ed94b679-2796-4d40-91de-00c21a582e2b'
WHERE email = 'admin@educa-demo.com';

-- =============================================
-- PASO 3: VERIFICAR QUE AHORA COINCIDEN
-- =============================================

SELECT 
    'DESPUÉS - AUTH' as origen,
    au.id as id_final,
    au.email
FROM auth.users au
WHERE au.email = 'admin@educa-demo.com'

UNION ALL

SELECT 
    'DESPUÉS - EMPLOYEES' as origen,
    e.id as id_final,
    e.email
FROM employees e
WHERE e.email = 'admin@educa-demo.com';

-- =============================================
-- PASO 4: PROBAR LOGIN SIMULATION
-- =============================================

-- Esta consulta debe devolver el usuario ahora
SELECT 
    e.id,
    e.email,
    e.first_name,
    e.last_name,
    e.role,
    e.is_active,
    'LOGIN EXITOSO' as status
FROM employees e
WHERE e.email = 'admin@educa-demo.com' 
AND e.is_active = true;

SELECT '✅ SINCRONIZACIÓN COMPLETADA - Prueba el login ahora' as resultado;
