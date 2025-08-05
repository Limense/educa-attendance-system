-- =============================================
-- CREAR NUEVA CUENTA SUPER_ADMIN
-- =============================================

-- PASO 1: Crear el usuario super_admin en la tabla employees
INSERT INTO employees (
    id,
    organization_id, 
    employee_code, 
    email, 
    first_name, 
    last_name,
    role, 
    hire_date, 
    is_active
) VALUES (
    gen_random_uuid(),  -- Genera un UUID automáticamente
    '550e8400-e29b-41d4-a716-446655440000',  -- ID de la organización demo
    'SUP2025001', 
    'superadmin@educa-demo.com', 
    'Super', 
    'Administrador',
    'super_admin', 
    CURRENT_DATE, 
    true
);

-- PASO 2: Verificar que se creó correctamente
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
WHERE email = 'superadmin@educa-demo.com';

-- PASO 3: Mostrar todos los usuarios admin para verificar
SELECT 
    employee_code,
    email,
    first_name,
    last_name,
    role,
    is_active
FROM employees 
WHERE role IN ('admin', 'super_admin')
ORDER BY created_at;

SELECT '✅ SUPER_ADMIN CREADO - Ahora ve a Supabase Auth para crear el usuario' as resultado;
