-- =============================================
-- COMPLETAR RLS - CON 3 ROLES ESPECÍFICOS
-- =============================================
-- ROLES ACTIVOS:
-- • super_admin = Control total
-- • admin = Panel administrativo y CRUD
-- • employee = Solo su información

-- Habilitar RLS en las tablas que faltan
ALTER TABLE work_policies ENABLE ROW LEVEL SECURITY;

-- Buscar y habilitar RLS en todas las tablas de attendance
DO $$
DECLARE
    table_name text;
BEGIN
    FOR table_name IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename LIKE 'attendance%'
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
        RAISE NOTICE 'RLS habilitado en tabla: %', table_name;
    END LOOP;
END $$;

-- Buscar y habilitar RLS en todas las tablas de auditoría
DO $$
DECLARE
    table_name text;
BEGIN
    FOR table_name IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename LIKE 'setting_audit%'
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
        RAISE NOTICE 'RLS habilitado en tabla: %', table_name;
    END LOOP;
END $$;

-- =============================================
-- POLÍTICAS PARA WORK_POLICIES SEGÚN ROLES
-- =============================================

-- VER POLÍTICAS DE TRABAJO:
-- • super_admin/admin: Ven todas las políticas de su organización
-- • employee: Ven las políticas que les aplican
CREATE POLICY "work_policies_select_policy" ON work_policies
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND
    organization_id IN (
      SELECT organization_id FROM employees WHERE id = auth.uid()
    )
    AND
    (
      -- Admins ven todas las políticas
      EXISTS (
        SELECT 1 FROM employees 
        WHERE id = auth.uid() 
        AND role IN ('super_admin', 'admin')
      )
      OR
      -- Employees ven políticas que les aplican (todas por ahora)
      EXISTS (
        SELECT 1 FROM employees 
        WHERE id = auth.uid() 
        AND role = 'employee'
      )
    )
  );

-- CREAR POLÍTICAS: Solo admins
CREATE POLICY "work_policies_insert_policy" ON work_policies
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'admin')
    )
  );

-- ACTUALIZAR POLÍTICAS: Solo admins
CREATE POLICY "work_policies_update_policy" ON work_policies
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL 
    AND
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND organization_id = work_policies.organization_id
      AND role IN ('super_admin', 'admin')
    )
  );

-- ELIMINAR POLÍTICAS: Solo super_admin y admin
CREATE POLICY "work_policies_delete_policy" ON work_policies
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL 
    AND
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND organization_id = work_policies.organization_id
      AND role IN ('super_admin', 'admin')
    )
  );

-- =============================================
-- POLÍTICAS PARA TABLAS DE ATTENDANCE ADICIONALES
-- =============================================

-- Crear políticas dinámicamente para todas las tablas de attendance
DO $$
DECLARE
    table_name text;
BEGIN
    FOR table_name IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename LIKE 'attendance%'
        AND tablename != 'attendances' -- Ya tiene políticas
    LOOP
        -- VER ASISTENCIAS: Admins ven todas, employees solo las suyas
        EXECUTE format('
            CREATE POLICY "%s_select_policy" ON %I
            FOR SELECT
            USING (
                auth.uid() IS NOT NULL 
                AND
                (
                    -- Sus propias asistencias (si tiene employee_id)
                    (
                        EXISTS (SELECT 1 FROM information_schema.columns 
                                WHERE table_name = ''%s'' AND column_name = ''employee_id'')
                        AND employee_id = auth.uid()
                    )
                    OR
                    -- Admins ven todas de su organización
                    EXISTS (
                        SELECT 1 FROM employees 
                        WHERE id = auth.uid() 
                        AND role IN (''super_admin'', ''admin'')
                    )
                )
            )', table_name, table_name, table_name);

        -- CREAR ASISTENCIAS: Employees sus propias, admins cualquiera  
        EXECUTE format('
            CREATE POLICY "%s_insert_policy" ON %I
            FOR INSERT
            WITH CHECK (
                auth.uid() IS NOT NULL 
                AND
                (
                    -- Su propia asistencia (si tiene employee_id)
                    (
                        EXISTS (SELECT 1 FROM information_schema.columns 
                                WHERE table_name = ''%s'' AND column_name = ''employee_id'')
                        AND employee_id = auth.uid()
                    )
                    OR
                    -- Admins pueden crear para cualquiera
                    EXISTS (
                        SELECT 1 FROM employees 
                        WHERE id = auth.uid() 
                        AND role IN (''super_admin'', ''admin'')
                    )
                )
            )', table_name, table_name, table_name);

        -- ACTUALIZAR ASISTENCIAS: Similar a crear
        EXECUTE format('
            CREATE POLICY "%s_update_policy" ON %I
            FOR UPDATE
            USING (
                auth.uid() IS NOT NULL 
                AND
                (
                    -- Su propia asistencia (si tiene employee_id)
                    (
                        EXISTS (SELECT 1 FROM information_schema.columns 
                                WHERE table_name = ''%s'' AND column_name = ''employee_id'')
                        AND employee_id = auth.uid()
                    )
                    OR
                    -- Admins pueden actualizar cualquiera
                    EXISTS (
                        SELECT 1 FROM employees 
                        WHERE id = auth.uid() 
                        AND role IN (''super_admin'', ''admin'')
                    )
                )
            )', table_name, table_name, table_name);

        RAISE NOTICE 'Políticas de asistencia creadas para tabla: %', table_name;
    END LOOP;
END $$;

-- =============================================
-- POLÍTICAS PARA TABLAS DE AUDITORÍA SEGÚN ROLES
-- =============================================

-- Solo super_admin puede ver auditorías, admin puede ver algunas, employee no ve nada
DO $$
DECLARE
    table_name text;
BEGIN
    FOR table_name IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename LIKE 'setting_audit%'
    LOOP
        -- VER AUDITORÍAS: Solo super_admin y admin (limitado)
        EXECUTE format('
            CREATE POLICY "%s_select_policy" ON %I
            FOR SELECT
            USING (
                auth.uid() IS NOT NULL 
                AND
                EXISTS (
                    SELECT 1 FROM employees 
                    WHERE id = auth.uid() 
                    AND role IN (''super_admin'', ''admin'')
                )
            )', table_name, table_name);
        
        -- CREAR AUDITORÍAS: Sistema automático, pero permitir a super_admin
        EXECUTE format('
            CREATE POLICY "%s_insert_policy" ON %I
            FOR INSERT
            WITH CHECK (
                auth.uid() IS NOT NULL 
                AND
                EXISTS (
                    SELECT 1 FROM employees 
                    WHERE id = auth.uid() 
                    AND role = ''super_admin''
                )
            )', table_name, table_name);
        
        RAISE NOTICE 'Políticas de auditoría creadas para tabla: %', table_name;
    END LOOP;
END $$;

-- =============================================
-- VERIFICAR QUE TODAS LAS TABLAS TENGAN RLS
-- =============================================

-- Mostrar estado RLS de todas las tablas
SELECT 
    tablename as "Tabla",
    CASE 
        WHEN rowsecurity THEN '✅ RLS HABILITADO'
        ELSE '❌ RLS DESHABILITADO'
    END as "Estado RLS"
FROM pg_tables t
LEFT JOIN pg_class c ON c.relname = t.tablename
WHERE t.schemaname = 'public'
AND t.tablename NOT LIKE 'pg_%'
ORDER BY tablename;

SELECT 'Proceso completado - Verificar tablas arriba' as resultado;
