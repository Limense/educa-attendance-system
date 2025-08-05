-- =============================================
-- DIAGNÓSTICO: ¿POR QUÉ NO APARECEN DEPARTAMENTOS?
-- =============================================

-- 1. VERIFICAR SI EXISTEN DEPARTAMENTOS
SELECT 
    'DEPARTAMENTOS EXISTENTES' as consulta,
    COUNT(*) as total
FROM departments;

-- 2. VER TODOS LOS DEPARTAMENTOS (sin RLS temporalmente)
ALTER TABLE departments DISABLE ROW LEVEL SECURITY;

SELECT 
    id,
    organization_id,
    name,
    code,
    is_active
FROM departments
ORDER BY name;

-- 3. VERIFICAR LA ORGANIZACIÓN DEL USUARIO ACTUAL
SELECT 
    'USUARIO ACTUAL' as info,
    id as user_id,
    email,
    organization_id,
    role
FROM employees 
WHERE email = 'andry_emilioq@educa.pe';

-- 4. VERIFICAR SI HAY MATCH DE ORGANIZACIÓN
SELECT 
    d.name as departamento,
    d.organization_id as dept_org_id,
    e.organization_id as user_org_id,
    CASE 
        WHEN d.organization_id = e.organization_id THEN '✅ MATCH'
        ELSE '❌ NO MATCH'
    END as organizacion_match
FROM departments d
CROSS JOIN employees e
WHERE e.email = 'andry_emilioq@educa.pe';

-- 5. REACTIVAR RLS
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- 6. PROBAR CONSULTA CON RLS ACTIVO
SELECT 
    'CON RLS ACTIVO' as consulta,
    d.name,
    d.code
FROM departments d;

SELECT '🔍 DIAGNÓSTICO COMPLETADO' as resultado;
