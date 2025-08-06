-- =============================================
-- DATOS DE MUESTRA SIMPLIFICADOS
-- =============================================

-- PASO 1: Primero verificar que tenemos empleados
SELECT 'Empleados encontrados:' as info, COUNT(*) as total FROM employees WHERE is_active = true;

-- PASO 2: Insertar datos de asistencia simples
INSERT INTO attendances (
  organization_id,
  employee_id,
  attendance_date,
  check_in_time,
  check_out_time,
  status,
  work_hours
)
SELECT 
  e.organization_id,
  e.id,
  CURRENT_DATE - 1,  -- Ayer
  '08:30:00'::time,
  '17:00:00'::time,
  'present',
  8.5
FROM employees e 
WHERE e.is_active = true
LIMIT 5;

-- PASO 3: Insertar más registros para hoy
INSERT INTO attendances (
  organization_id,
  employee_id,
  attendance_date,
  check_in_time,
  check_out_time,
  status,
  work_hours
)
SELECT 
  e.organization_id,
  e.id,
  CURRENT_DATE,  -- Hoy
  '09:00:00'::time,
  '17:30:00'::time,
  'present',
  8.5
FROM employees e 
WHERE e.is_active = true
LIMIT 3;

-- PASO 4: Algunas ausencias
INSERT INTO attendances (
  organization_id,
  employee_id,
  attendance_date,
  check_in_time,
  check_out_time,
  status
)
SELECT 
  e.organization_id,
  e.id,
  CURRENT_DATE - 2,  -- Anteayer
  NULL,
  NULL,
  'absent'
FROM employees e 
WHERE e.is_active = true
LIMIT 2;

-- VERIFICAR RESULTADOS
SELECT 'Registros creados:' as info, COUNT(*) as total FROM attendances;
SELECT 
  attendance_date,
  COUNT(*) as registros,
  COUNT(CASE WHEN check_in_time IS NOT NULL THEN 1 END) as presentes,
  COUNT(CASE WHEN check_in_time IS NULL THEN 1 END) as ausentes
FROM attendances 
GROUP BY attendance_date 
ORDER BY attendance_date DESC;
