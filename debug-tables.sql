-- Verificar estructura real de la tabla attendances
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'attendances' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar estructura de employees
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'employees' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Ver datos existentes de ejemplo
SELECT * FROM attendances LIMIT 1;
SELECT id, first_name, last_name, email, organization_id FROM employees LIMIT 1;
