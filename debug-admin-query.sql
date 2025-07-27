-- =============================================
-- DEBUG: CONSULTA ADMIN DASHBOARD
-- =============================================

-- 1. Verificar asistencias existentes hoy
SELECT 
  COUNT(*) as total_hoy,
  organization_id
FROM attendances 
WHERE attendance_date = CURRENT_DATE
GROUP BY organization_id;

-- 2. Ver todas las asistencias con detalles
SELECT 
  a.id,
  a.organization_id,
  a.employee_id,
  a.attendance_date,
  a.check_in_time,
  a.check_out_time,
  a.status,
  a.created_at,
  e.first_name,
  e.last_name,
  e.email
FROM attendances a
LEFT JOIN employees e ON a.employee_id = e.id
WHERE a.organization_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY a.created_at DESC
LIMIT 5;

-- 3. Verificar estructura JOIN que usa el admin dashboard
SELECT 
  a.*,
  jsonb_build_object(
    'first_name', e.first_name,
    'last_name', e.last_name,
    'email', e.email
  ) as employee
FROM attendances a
LEFT JOIN employees e ON a.employee_id = e.id
WHERE a.organization_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY a.created_at DESC
LIMIT 3;

-- 4. Verificar si hay problema con el SELECT anidado
SELECT 
  a.id,
  a.organization_id,
  a.employee_id,
  a.attendance_date,
  a.check_in_time,
  a.check_out_time,
  a.status,
  a.created_at
FROM attendances a
WHERE a.organization_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY a.created_at DESC
LIMIT 5;
