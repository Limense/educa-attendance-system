-- =============================================
-- VERIFICACIÓN COMPLETA DE ROLES EN SUPABASE
-- =============================================

-- 1. ROLES ÚNICOS ENCONTRADOS
SELECT 
  DISTINCT role as "Rol Encontrado",
  COUNT(*) as "Cantidad"
FROM employees 
WHERE role IS NOT NULL
GROUP BY role
ORDER BY role;

-- 2. VERIFICAR ROLES ESPERADOS
WITH expected_roles AS (
  SELECT unnest(ARRAY[
    'employee',
    'admin',
    'super_admin'
    -- Roles futuros (comentados por ahora):
    -- 'supervisor', 
    -- 'manager',
    -- 'hr'
  ]) as expected_role
),
current_roles AS (
  SELECT DISTINCT role FROM employees WHERE role IS NOT NULL
)
SELECT 
  er.expected_role as "Rol Esperado",
  CASE 
    WHEN cr.role IS NOT NULL THEN '✅ EXISTE'
    ELSE '❌ FALTA'
  END as "Estado",
  COALESCE(
    (SELECT COUNT(*) FROM employees WHERE role = er.expected_role), 
    0
  ) as "Cantidad Empleados"
FROM expected_roles er
LEFT JOIN current_roles cr ON er.expected_role = cr.role
ORDER BY er.expected_role;

-- 3. EMPLEADOS POR ROL (DETALLADO)
SELECT 
  role as "Rol",
  first_name as "Nombre",
  email as "Email",
  employee_status as "Estado",
  created_at as "Creado"
FROM employees 
WHERE role IS NOT NULL
ORDER BY role, first_name;

-- 4. EMPLEADOS SIN ROL
SELECT 
  COUNT(*) as "Empleados sin rol",
  CASE 
    WHEN COUNT(*) > 0 THEN '⚠️ HAY EMPLEADOS SIN ROL'
    ELSE '✅ TODOS TIENEN ROL'
  END as "Estado"
FROM employees 
WHERE role IS NULL OR role = '';

-- 5. ESTADÍSTICAS GENERALES
SELECT 
  COUNT(*) as "Total Empleados",
  COUNT(DISTINCT role) as "Roles Únicos",
  COUNT(CASE WHEN role IS NULL THEN 1 END) as "Sin Rol",
  COUNT(CASE WHEN employee_status = 'active' THEN 1 END) as "Activos"
FROM employees;
