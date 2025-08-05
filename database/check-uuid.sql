-- =============================================
-- VERIFICAR EL UUID EXACTO DE AUTH.USERS
-- =============================================

-- Ver el UUID exacto y su longitud
SELECT 
    id,
    email,
    LENGTH(id::text) as longitud_uuid,
    id::text as uuid_como_texto
FROM auth.users 
WHERE email = 'admin@educa-demo.com';

-- Intentar convertir manualmente para ver el formato correcto
SELECT 
    id,
    CAST(id AS UUID) as uuid_cast
FROM auth.users 
WHERE email = 'admin@educa-demo.com';
