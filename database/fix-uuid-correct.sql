-- =============================================
-- ACTUALIZAR CON EL UUID CORRECTO
-- =============================================

-- Basado en la imagen anterior, el UUID correcto parece ser:
UPDATE employees 
SET id = 'dc94b679-2796-4d40-91de-00c21a582e2b'::uuid
WHERE email = 'admin@educa-demo.com';

-- Si no funciona el anterior, probar este:
-- UPDATE employees 
-- SET id = (SELECT id FROM auth.users WHERE email = 'admin@educa-demo.com')
-- WHERE email = 'admin@educa-demo.com';

-- Verificar que se actualizó
SELECT 
    'AUTH' as tabla,
    au.id,
    au.email
FROM auth.users au
WHERE au.email = 'admin@educa-demo.com'

UNION ALL

SELECT 
    'EMPLOYEES' as tabla,
    e.id,
    e.email
FROM employees e
WHERE e.email = 'admin@educa-demo.com';

SELECT '✅ UUID SINCRONIZADO' as resultado;
