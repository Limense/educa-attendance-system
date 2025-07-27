-- =============================================
-- SCRIPT: CREAR USUARIOS DE PRUEBA EN SUPABASE AUTH
-- =============================================

-- Para crear usuarios en Supabase Auth necesitas:
-- 1. Ir a: https://zxhdrtkjvybuqsprpqxu.supabase.co
-- 2. Authentication > Users > Add User

-- Usuario Empleado de Prueba:
-- Email: empleado1@educa-demo.com
-- Password: Testing123!
-- Confirmado: YES

-- Usuario Admin de Prueba:
-- Email: admin@educa-demo.com 
-- Password: Admin123!
-- Confirmado: YES

-- NOTA: Los usuarios ya existen en la tabla employees,
-- solo necesitan ser creados en Supabase Auth para el login.

-- Verificar que los empleados existen:
SELECT 
  email, 
  first_name, 
  last_name, 
  role,
  organization_id
FROM employees 
WHERE email IN ('empleado1@educa-demo.com', 'admin@educa-demo.com');

-- Si necesitas crear más empleados de prueba:
INSERT INTO employees (
  organization_id, 
  employee_code, 
  email, 
  first_name, 
  last_name,
  role, 
  hire_date, 
  is_active
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'TEST001', 
  'test@educa-demo.com', 
  'Usuario', 
  'Prueba',
  'employee', 
  CURRENT_DATE, 
  true
) ON CONFLICT (email) DO NOTHING;
