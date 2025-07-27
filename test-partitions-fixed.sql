-- =============================================
-- VERIFICAR PARTICIONES - VERSIÓN CORREGIDA
-- =============================================

-- 1. Verificar particiones existentes (query compatible)
SELECT 
  schemaname,
  tablename
FROM pg_tables 
WHERE tablename LIKE 'attendances%'
  AND schemaname = 'public'
ORDER BY tablename;

-- 2. Verificar estructura de la tabla principal
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'attendances'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Test de inserción simple para empleado2
DO $$
DECLARE
  test_employee_id UUID;
  test_org_id UUID := '550e8400-e29b-41d4-a716-446655440000';
  today_date DATE := CURRENT_DATE;
BEGIN
  -- Obtener ID del empleado
  SELECT id INTO test_employee_id 
  FROM employees 
  WHERE email = 'empleado2@educa-demo.com';
  
  IF test_employee_id IS NOT NULL THEN
    RAISE NOTICE 'Empleado encontrado: %', test_employee_id;
    RAISE NOTICE 'Organización: %', test_org_id;
    RAISE NOTICE 'Fecha: %', today_date;
    
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
      today_date,
      NOW(),
      'present'
    ) ON CONFLICT (organization_id, employee_id, attendance_date) 
    DO UPDATE SET 
      check_in_time = EXCLUDED.check_in_time,
      updated_at = NOW();
      
    RAISE NOTICE '✅ Inserción/actualización exitosa para %', test_employee_id;
  ELSE
    RAISE NOTICE '❌ Empleado empleado2@educa-demo.com no encontrado';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Error: %', SQLERRM;
END $$;

-- 4. Verificar que se insertó correctamente
SELECT 
  a.id,
  a.organization_id,
  a.employee_id,
  a.attendance_date,
  a.check_in_time,
  a.status,
  e.email,
  e.first_name,
  e.last_name
FROM attendances a
JOIN employees e ON a.employee_id = e.id  
WHERE e.email = 'empleado2@educa-demo.com'
  AND a.attendance_date = CURRENT_DATE
ORDER BY a.created_at DESC
LIMIT 1;

-- 5. Verificar políticas activas
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd
FROM pg_policies 
WHERE tablename = 'attendances'
ORDER BY policyname;
