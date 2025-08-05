-- =============================================
-- SOLUCIONAR PROBLEMA DE DEPARTAMENTOS
-- =============================================

-- PASO 1: Verificar el organization_id del usuario
SELECT 
    email,
    organization_id,
    'ANTES' as estado
FROM employees 
WHERE email = 'andry_emilioq@educa.pe';

-- PASO 2: Asignar la organización correcta al usuario
UPDATE employees 
SET organization_id = '550e8400-e29b-41d4-a716-446655440000'
WHERE email = 'andry_emilioq@educa.pe';

-- PASO 3: Verificar que se actualizó
SELECT 
    email,
    organization_id,
    'DESPUÉS' as estado
FROM employees 
WHERE email = 'andry_emilioq@educa.pe';

-- PASO 4: Probar que ahora puede ver departamentos con RLS activo
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

SELECT 
    'DEPARTAMENTOS VISIBLES AHORA' as resultado,
    d.name,
    d.code
FROM departments d;

SELECT '✅ PROBLEMA SOLUCIONADO - Recarga el formulario' as resultado;
