-- =============================================
-- DATOS DE MUESTRA PARA REPORTES
-- =============================================
-- Script para crear datos de asistencia de prueba

-- Verificar que tengamos empleados
SELECT 'Empleados disponibles:' as info;
SELECT id, employee_code, full_name, role FROM employees LIMIT 5;

-- Insertar asistencias de muestra para los últimos 30 días
INSERT INTO attendances (
  organization_id,
  employee_id,
  attendance_date,
  check_in_time,
  check_out_time,
  status
)
SELECT 
  '550e8400-e29b-41d4-a716-446655440000' as organization_id,
  e.id as employee_id,
  (CURRENT_DATE - (random() * 30)::INTEGER) as attendance_date,
  (TIME '08:00:00' + (random() * interval '2 hours')) as check_in_time,
  (TIME '16:00:00' + (random() * interval '4 hours')) as check_out_time,
  'present' as status
FROM employees e 
WHERE e.organization_id = '550e8400-e29b-41d4-a716-446655440000'
  AND e.is_active = true
  AND e.role = 'employee'
  AND random() > 0.2  -- 80% de asistencias
ORDER BY random()
LIMIT 50;

-- Insertar algunas ausencias
INSERT INTO attendances (
  organization_id,
  employee_id,
  attendance_date,
  check_in_time,
  check_out_time,
  status
)
SELECT 
  '550e8400-e29b-41d4-a716-446655440000' as organization_id,
  e.id as employee_id,
  (CURRENT_DATE - (random() * 30)::INTEGER) as attendance_date,
  NULL as check_in_time,
  NULL as check_out_time,
  'absent' as status
FROM employees e 
WHERE e.organization_id = '550e8400-e29b-41d4-a716-446655440000'
  AND e.is_active = true
  AND e.role = 'employee'
ORDER BY random()
LIMIT 10;

-- Insertar algunas asistencias incompletas (solo check-in)
INSERT INTO attendances (
  organization_id,
  employee_id,
  attendance_date,
  check_in_time,
  check_out_time,
  status
)
SELECT 
  '550e8400-e29b-41d4-a716-446655440000' as organization_id,
  e.id as employee_id,
  (CURRENT_DATE - (random() * 10)::INTEGER) as attendance_date,
  (TIME '08:00:00' + (random() * interval '2 hours')) as check_in_time,
  NULL as check_out_time,
  'present' as status
FROM employees e 
WHERE e.organization_id = '550e8400-e29b-41d4-a716-446655440000'
  AND e.is_active = true
  AND e.role = 'employee'
ORDER BY random()
LIMIT 8;

-- Verificar los datos insertados
SELECT 'Resumen de asistencias creadas:' as info;
SELECT 
  COUNT(*) as total_registros,
  COUNT(CASE WHEN check_in_time IS NOT NULL THEN 1 END) as con_entrada,
  COUNT(CASE WHEN check_in_time IS NOT NULL AND check_out_time IS NOT NULL THEN 1 END) as completas,
  COUNT(CASE WHEN check_in_time IS NULL THEN 1 END) as ausencias
FROM attendances 
WHERE organization_id = '550e8400-e29b-41d4-a716-446655440000';

-- Mostrar algunos registros de ejemplo
SELECT 'Ejemplos de registros:' as info;
SELECT 
  a.attendance_date,
  e.full_name,
  a.check_in_time,
  a.check_out_time,
  a.work_hours,
  a.status
FROM attendances a
JOIN employees e ON a.employee_id = e.id
WHERE a.organization_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY a.attendance_date DESC
LIMIT 10;

SELECT '✅ DATOS DE MUESTRA CREADOS EXITOSAMENTE' as resultado;
