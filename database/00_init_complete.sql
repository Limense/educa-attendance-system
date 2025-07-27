-- =============================================
-- SCRIPT DE INICIALIZACIÓN COMPLETA
-- Descripción: Ejecutar este script para configurar toda la base de datos
-- =============================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Ejecutar todos los scripts en orden
\i 01_employees_enhanced.sql
\i 02_attendances_enhanced.sql
\i 03_settings_enhanced.sql
\i 04_functions_views.sql

-- Crear datos iniciales para desarrollo
INSERT INTO organizations (id, name, slug, timezone) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Educa Demo', 'educa-demo', 'America/Mexico_City');

-- Crear departamentos iniciales
INSERT INTO departments (organization_id, name, code) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Recursos Humanos', 'RH'),
('550e8400-e29b-41d4-a716-446655440000', 'Tecnología', 'TI'),
('550e8400-e29b-41d4-a716-446655440000', 'Administración', 'ADM'),
('550e8400-e29b-41d4-a716-446655440000', 'Docencia', 'DOC');

-- Crear posiciones iniciales
INSERT INTO positions (organization_id, title, code, level) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Director General', 'DIR', 10),
('550e8400-e29b-41d4-a716-446655440000', 'Gerente', 'GER', 8),
('550e8400-e29b-41d4-a716-446655440000', 'Coordinador', 'COORD', 6),
('550e8400-e29b-41d4-a716-446655440000', 'Especialista', 'ESP', 4),
('550e8400-e29b-41d4-a716-446655440000', 'Asistente', 'AST', 2);

-- Crear tipos de asistencia
INSERT INTO attendance_types (organization_id, code, name) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'REGULAR', 'Asistencia Regular'),
('550e8400-e29b-41d4-a716-446655440000', 'REMOTE', 'Trabajo Remoto'),
('550e8400-e29b-41d4-a716-446655440000', 'OVERTIME', 'Tiempo Extra'),
('550e8400-e29b-41d4-a716-446655440000', 'SICK_LEAVE', 'Incapacidad'),
('550e8400-e29b-41d4-a716-446655440000', 'VACATION', 'Vacaciones');

-- Crear política de trabajo por defecto
INSERT INTO work_policies (organization_id, name, start_time, end_time) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Horario Estándar', '09:00:00', '17:00:00');

-- Crear configuraciones por defecto
SELECT create_default_settings('550e8400-e29b-41d4-a716-446655440000');

-- Crear usuario administrador inicial
INSERT INTO employees (
  organization_id, employee_code, email, first_name, last_name,
  role, hire_date, is_active
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000', 
  'ADM2025001', 
  'admin@educa-demo.com', 
  'Administrador', 
  'Sistema',
  'super_admin', 
  CURRENT_DATE, 
  true
);

-- Crear algunos empleados de prueba
INSERT INTO employees (
  organization_id, employee_code, email, first_name, last_name,
  department_id, role, hire_date, is_active
) 
SELECT 
  '550e8400-e29b-41d4-a716-446655440000',
  'EMP2025' || LPAD(generate_series::TEXT, 3, '0'),
  'empleado' || generate_series || '@educa-demo.com',
  'Empleado',
  'Número ' || generate_series,
  (SELECT id FROM departments WHERE code = 'DOC' LIMIT 1),
  'employee',
  CURRENT_DATE - (random() * 365)::INTEGER,
  true
FROM generate_series(1, 10);

-- Refrescar estadísticas iniciales
SELECT refresh_dashboard_stats();

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE '🎉 Base de datos inicializada correctamente!';
  RAISE NOTICE '📊 Organización: Educa Demo';
  RAISE NOTICE '👥 Empleados creados: 11 (1 admin + 10 empleados)';
  RAISE NOTICE '🏢 Departamentos: 4';
  RAISE NOTICE '⚙️ Configuraciones: Completadas';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 Usuario admin: admin@educa-demo.com';
  RAISE NOTICE '🆔 Organization ID: 550e8400-e29b-41d4-a716-446655440000';
END $$;
