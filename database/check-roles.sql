-- =============================================
-- SCRIPT PARA VERIFICAR ROLES EXISTENTES
-- =============================================

-- 1. Ver todos los roles únicos en la tabla employees
SELECT DISTINCT role as "Roles Existentes" 
FROM employees 
ORDER BY role;

-- 2. Contar empleados por rol
SELECT 
  role as "Rol",
  COUNT(*) as "Cantidad de Empleados"
FROM employees 
GROUP BY role 
ORDER BY role;

-- 3. Ver empleados con sus roles específicos
SELECT 
  id,
  name,
  email,
  role,
  status,
  organization_id
FROM employees 
ORDER BY role, name;

-- 4. Verificar si existen los roles definidos en el código
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM employees WHERE role = 'employee') THEN '✅ employee'
    ELSE '❌ employee'
  END as "employee",
  CASE 
    WHEN EXISTS (SELECT 1 FROM employees WHERE role = 'supervisor') THEN '✅ supervisor'
    ELSE '❌ supervisor'
  END as "supervisor",
  CASE 
    WHEN EXISTS (SELECT 1 FROM employees WHERE role = 'manager') THEN '✅ manager'
    ELSE '❌ manager'
  END as "manager",
  CASE 
    WHEN EXISTS (SELECT 1 FROM employees WHERE role = 'hr') THEN '✅ hr'
    ELSE '❌ hr'
  END as "hr",
  CASE 
    WHEN EXISTS (SELECT 1 FROM employees WHERE role = 'admin') THEN '✅ admin'
    ELSE '❌ admin'
  END as "admin",
  CASE 
    WHEN EXISTS (SELECT 1 FROM employees WHERE role = 'super_admin') THEN '✅ super_admin'  
    ELSE '❌ super_admin'
  END as "super_admin";

-- 5. Ver estructura de la tabla employees para confirmar el campo role
\d employees;
