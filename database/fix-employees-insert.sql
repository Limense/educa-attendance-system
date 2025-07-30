-- =============================================
-- SCRIPT: ARREGLAR INSERCIÓN DE EMPLEADOS
-- Problema: Falta política INSERT para employees
-- =============================================

-- PASO 1: Eliminar política existente de employees si existe
DROP POLICY IF EXISTS "employees_insert_policy" ON employees;

-- PASO 2: Crear política INSERT para employees
CREATE POLICY "employees_insert_policy" ON employees
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- PASO 3: Verificar que RLS esté habilitado en employees
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- PASO 4: Verificar todas las políticas de employees
-- Opcional: Solo para debug, comentar estas líneas después de ejecutar
SELECT 
    tablename,
    policyname, 
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'employees'
ORDER BY policyname;

-- PASO 5: Verificar que el usuario tenga rol authenticated
SELECT auth.role(), auth.uid();
