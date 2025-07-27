-- =============================================
-- VERIFICAR Y ARREGLAR PROBLEMA DE PARTICIONES
-- =============================================

-- 1. Verificar particiones existentes
SELECT 
  schemaname,
  tablename,
  partitionbounds
FROM pg_tables 
WHERE tablename LIKE 'attendances%'
ORDER BY tablename;

-- 2. Verificar si la partición para 2025 existe
SELECT EXISTS (
  SELECT 1 FROM pg_tables 
  WHERE tablename = 'attendances_2025'
);

-- 3. Si no existe la partición 2025, crearla
CREATE TABLE IF NOT EXISTS attendances_2025 PARTITION OF attendances
FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

-- 4. Test de inserción específico para hoy (2025-07-27)
-- Debe ir a la partición attendances_2025
DO $$
DECLARE
  test_employee_id UUID;
  test_org_id UUID := '550e8400-e29b-41d4-a716-446655440000';
BEGIN
  -- Obtener ID del empleado
  SELECT id INTO test_employee_id 
  FROM employees 
  WHERE email = 'empleado2@educa-demo.com';
  
  IF test_employee_id IS NOT NULL THEN
    -- Intentar insertar en attendances
    INSERT INTO attendances (
      organization_id,
      employee_id,
      attendance_date, 
      check_in_time,
      status
    ) VALUES (
      test_org_id,
      test_employee_id,
      '2025-07-27',
      NOW(),
      'present'
    ) ON CONFLICT (organization_id, employee_id, attendance_date) 
    DO UPDATE SET 
      check_in_time = EXCLUDED.check_in_time,
      updated_at = NOW();
      
    RAISE NOTICE 'Inserción exitosa para empleado: %', test_employee_id;
  ELSE
    RAISE NOTICE 'Empleado no encontrado';
  END IF;
END $$;

-- 5. Verificar que se insertó correctamente
SELECT 
  a.id,
  a.organization_id,
  a.employee_id,
  a.attendance_date,
  a.check_in_time,
  a.status,
  e.email
FROM attendances a
JOIN employees e ON a.employee_id = e.id  
WHERE e.email = 'empleado2@educa-demo.com'
  AND a.attendance_date = '2025-07-27';
  
-- 6. Si necesitas limpiar datos de prueba
-- DELETE FROM attendances WHERE employee_id = (SELECT id FROM employees WHERE email = 'empleado2@educa-demo.com') AND attendance_date = '2025-07-27';
