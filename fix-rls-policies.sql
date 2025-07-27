-- =============================================
-- SCRIPT: ARREGLAR POLÍTICAS RLS EN SUPABASE
-- =============================================

-- PASO 1: Eliminar políticas restrictivas actuales
DROP POLICY IF EXISTS "Public read access" ON attendances;
DROP POLICY IF EXISTS "Public read access" ON employees;
DROP POLICY IF EXISTS "Public read access" ON organizations;
DROP POLICY IF EXISTS "Public read access" ON departments;

-- PASO 2: Crear políticas más permisivas para desarrollo
-- (En producción serían más restrictivas)

-- Política para employess - permitir lectura/escritura para usuarios autenticados
CREATE POLICY "Authenticated users can read employees" ON employees
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update employees" ON employees
FOR UPDATE USING (auth.role() = 'authenticated');

-- Política para attendances - permitir todas las operaciones para usuarios autenticados
CREATE POLICY "Authenticated users can read attendances" ON attendances
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert attendances" ON attendances
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update attendances" ON attendances
FOR UPDATE USING (auth.role() = 'authenticated');

-- Políticas para organizations y departments - lectura pública
CREATE POLICY "Public read organizations" ON organizations
FOR SELECT USING (true);

CREATE POLICY "Public read departments" ON departments
FOR SELECT USING (true);

CREATE POLICY "Public read positions" ON positions
FOR SELECT USING (true);

-- PASO 3: Verificar que las políticas están activas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('employees', 'attendances', 'organizations', 'departments')
ORDER BY tablename, policyname;
