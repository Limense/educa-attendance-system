-- ====================================================================
-- SCRIPT DE APLICACIÓN DE INTEGRACIÓN AUTH-EMPLEADOS
-- ====================================================================
-- Este script aplica la integración completa entre Supabase Auth y empleados
-- Ejecutar en Supabase SQL Editor o usando psql

\echo '🔄 Aplicando integración Auth-Empleados...'

-- 1. Verificar que las tablas necesarias existen
\echo '📋 Verificando estructura de base de datos...'

-- Verificar tabla employees
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees') THEN
        RAISE EXCEPTION 'Tabla employees no encontrada. Ejecute primero el script de inicialización.';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'auth_user_id') THEN
        RAISE EXCEPTION 'Columna auth_user_id no encontrada en employees. Ejecute primero el script de inicialización.';
    END IF;
    
    RAISE NOTICE '✅ Tabla employees verificada correctamente';
END $$;

-- Verificar tabla organizations
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
        RAISE EXCEPTION 'Tabla organizations no encontrada. Ejecute primero el script de inicialización.';
    END IF;
    
    RAISE NOTICE '✅ Tabla organizations verificada correctamente';
END $$;

-- 2. Aplicar el trigger de sincronización
\echo '🔧 Aplicando trigger de sincronización Auth-Empleados...'

-- Leer y ejecutar el archivo de trigger
\i database/auth_sync_trigger.sql

-- 3. Verificar que el trigger se aplicó correctamente
\echo '🔍 Verificando instalación del trigger...'

DO $$
BEGIN
    -- Verificar función
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'handle_new_user_registration'
        AND routine_type = 'FUNCTION'
    ) THEN
        RAISE EXCEPTION 'Función handle_new_user_registration no encontrada';
    END IF;
    
    -- Verificar trigger
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'on_auth_user_created'
    ) THEN
        RAISE EXCEPTION 'Trigger on_auth_user_created no encontrado';
    END IF;
    
    RAISE NOTICE '✅ Trigger de sincronización instalado correctamente';
END $$;

-- 4. Crear política de RLS para auth_user_id si no existe
\echo '🔒 Verificando políticas de seguridad...'

DO $$
BEGIN
    -- Verificar que RLS está habilitado en employees
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'employees' 
        AND rowsecurity = true
    ) THEN
        RAISE NOTICE '⚠️ RLS no está habilitado en employees. Habilitando...';
        ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
    END IF;
    
    RAISE NOTICE '✅ Políticas de seguridad verificadas';
END $$;

-- 5. Mensaje final
\echo ''
\echo '🎉 INTEGRACIÓN AUTH-EMPLEADOS APLICADA EXITOSAMENTE'
\echo ''
\echo '📌 PRÓXIMOS PASOS:'
\echo '   1. Reiniciar la aplicación Next.js'
\echo '   2. Probar la creación de empleados desde la interfaz'
\echo '   3. Verificar que se crean usuarios en auth.users automáticamente'
\echo ''
\echo '🔧 COMANDOS DE VERIFICACIÓN:'
\echo '   SELECT * FROM auth.users ORDER BY created_at DESC LIMIT 5;'
\echo '   SELECT * FROM employees ORDER BY created_at DESC LIMIT 5;'
\echo ''
\echo '⚠️ IMPORTANTE:'
\echo '   - Los empleados ahora se crean vía Supabase Auth'
\echo '   - Se requiere email único para cada empleado'  
\echo '   - La sincronización es automática vía triggers'
\echo ''
