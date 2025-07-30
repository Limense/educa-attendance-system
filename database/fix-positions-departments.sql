-- =============================================
-- ARREGLAR POSICIONES - ASOCIAR A DEPARTAMENTOS
-- =============================================

-- Obtener IDs de departamentos para referencia
-- Recursos Humanos, Tecnología, Administración, Docencia

-- Actualizar posiciones existentes con department_id
UPDATE positions SET department_id = (
  SELECT id FROM departments WHERE code = 'ADM' AND organization_id = '550e8400-e29b-41d4-a716-446655440000'
) WHERE code = 'DIR' AND organization_id = '550e8400-e29b-41d4-a716-446655440000';

UPDATE positions SET department_id = (
  SELECT id FROM departments WHERE code = 'RH' AND organization_id = '550e8400-e29b-41d4-a716-446655440000'
) WHERE code = 'GER' AND organization_id = '550e8400-e29b-41d4-a716-446655440000';

UPDATE positions SET department_id = (
  SELECT id FROM departments WHERE code = 'TI' AND organization_id = '550e8400-e29b-41d4-a716-446655440000'
) WHERE code = 'COORD' AND organization_id = '550e8400-e29b-41d4-a716-446655440000';

UPDATE positions SET department_id = (
  SELECT id FROM departments WHERE code = 'DOC' AND organization_id = '550e8400-e29b-41d4-a716-446655440000'
) WHERE code = 'ESP' AND organization_id = '550e8400-e29b-41d4-a716-446655440000';

UPDATE positions SET department_id = (
  SELECT id FROM departments WHERE code = 'RH' AND organization_id = '550e8400-e29b-41d4-a716-446655440000'
) WHERE code = 'AST' AND organization_id = '550e8400-e29b-41d4-a716-446655440000';

-- Verificar resultado
SELECT 
  p.title,
  p.code,
  d.name as department_name,
  d.code as department_code
FROM positions p
LEFT JOIN departments d ON p.department_id = d.id
WHERE p.organization_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY p.level DESC;
