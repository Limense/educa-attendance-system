-- Script SQL para verificar y crear datos de prueba
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar estructura de tablas existentes
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('employees', 'departments', 'positions', 'attendances', 'organizations')
ORDER BY table_name, ordinal_position;

-- 2. Verificar datos existentes
SELECT 'employees' as table_name, count(*) as count FROM employees
UNION ALL
SELECT 'departments' as table_name, count(*) as count FROM departments
UNION ALL
SELECT 'positions' as table_name, count(*) as count FROM positions
UNION ALL
SELECT 'organizations' as table_name, count(*) as count FROM organizations
UNION ALL
SELECT 'attendances' as table_name, count(*) as count FROM attendances;

-- 3. Crear organización de prueba si no existe
INSERT INTO organizations (id, name, subscription_plan, created_at)
VALUES (
  'org-test-001',
  'Empresa de Prueba',
  'premium',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 4. Crear departamento de prueba si no existe
INSERT INTO departments (id, name, organization_id, created_at)
VALUES (
  'dept-test-001',
  'Desarrollo',
  'org-test-001',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 5. Crear posición de prueba si no existe
INSERT INTO positions (id, title, department_id, created_at)
VALUES (
  'pos-test-001',
  'Desarrollador Frontend',
  'dept-test-001',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 6. Crear empleado de prueba si no existe
INSERT INTO employees (
  id, 
  email, 
  first_name, 
  last_name, 
  phone,
  employee_code,
  organization_id,
  department_id,
  position_id,
  hire_date,
  status,
  created_at
) VALUES (
  'emp-test-001',
  'test@example.com',
  'Juan',
  'Pérez',
  '+51987654321',
  'EMP001',
  'org-test-001',
  'dept-test-001',
  'pos-test-001',
  '2024-01-15',
  'active',
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- 7. Verificar datos creados
SELECT 
  e.first_name,
  e.last_name,
  e.email,
  d.name as department,
  p.title as position,
  o.name as organization
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN positions p ON e.position_id = p.id
LEFT JOIN organizations o ON e.organization_id = o.id
WHERE e.email = 'test@example.com';
