-- SOLUCIÓN: Crear registro de empleado para usuario autenticado
-- Problema: Usuario existe en auth.users pero no en employees
-- Este script crea el registro faltante del empleado super_admin

-- 1. Verificar el usuario actual en auth.users
SELECT 
    id as auth_id,
    email,
    created_at
FROM auth.users 
WHERE email = 'amrdc@educa.pe';

-- 2. Verificar que NO existe en employees
SELECT * FROM employees WHERE email = 'amrdc@educa.pe';

-- 3. Crear el registro del empleado super_admin
-- IMPORTANTE: Usar el mismo ID que tiene en auth.users
INSERT INTO employees (
    id,
    employee_code,
    first_name,
    last_name,
    email,
    role,
    department_id,
    position_id,
    hire_date,
    is_active,
    created_by
) VALUES (
    '586878da-9296-40f3-973b-bbf916f8abe9', -- ID del auth.users
    'SUPER001',
    'Administrador',
    'Sistema',
    'amrdc@educa.pe',
    'super_admin',
    '550e8400-e29b-41d4-a716-446655440000', -- organization_id que ya existe
    '550e8400-e29b-41d4-a716-446655440000', -- position_id que ya existe
    CURRENT_DATE,
    true,
    '586878da-9296-40f3-973b-bbf9f6f8abe9' -- self-created
);

-- 4. Verificar que se creó correctamente
SELECT 
    id,
    employee_code,
    first_name,
    last_name,
    email,
    role,
    is_active
FROM employees 
WHERE email = 'amrdc@educa.pe';

-- 5. Probar que ahora funciona la validación
SELECT 
    emp.id,
    emp.email,
    emp.role,
    auth.id as auth_id
FROM employees emp
JOIN auth.users auth ON emp.id = auth.id
WHERE emp.email = 'amrdc@educa.pe';

-- RESULTADO ESPERADO:
-- ✅ Usuario debe existir en ambas tablas con el mismo ID
-- ✅ La validación de permisos debe funcionar correctamente
-- ✅ Debe poder crear empleados sin error de permisos
