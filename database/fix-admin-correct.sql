-- =============================================
-- CORREGIR ID DEL ADMIN - SINTAXIS CORRECTA
-- =============================================

-- Actualizar el admin con el UUID correcto (sin comillas simples dentro del UUID)
UPDATE employees 
SET id = 'c7ed94b679-2796-4d40-91de-00c21a582e2b'
WHERE email = 'admin@educa-demo.com';

-- Verificar que se actualizó correctamente
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

-- Probar login simulation
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

SELECT '✅ ADMIN CORREGIDO - Prueba el login ahora' as resultado;
