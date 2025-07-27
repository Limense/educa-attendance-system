-- =============================================
-- SCRIPT DE INICIALIZACIÓN COMPLETA - SUPABASE
-- Educa Attendance System v1.0
-- Descripción: Script único para crear toda la estructura escalable
-- =============================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- 1. TABLA: ORGANIZACIONES (Multi-tenancy)
-- =============================================

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  slug VARCHAR UNIQUE NOT NULL,
  domain VARCHAR,
  timezone VARCHAR DEFAULT 'UTC',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- 2. TABLA: DEPARTAMENTOS
-- =============================================

CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  code VARCHAR NOT NULL,
  manager_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, code)
);

-- =============================================
-- 3. TABLA: POSICIONES/CARGOS
-- =============================================

CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  code VARCHAR NOT NULL,
  department_id UUID REFERENCES departments(id),
  level INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, code)
);

-- =============================================
-- 4. TABLA: EMPLEADOS (Escalable)
-- =============================================

CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  employee_code VARCHAR NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  
  -- Información personal
  first_name VARCHAR NOT NULL,
  last_name VARCHAR NOT NULL,
  full_name VARCHAR GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  phone VARCHAR,
  avatar_url VARCHAR,
  
  -- Información laboral
  department_id UUID REFERENCES departments(id),
  position_id UUID REFERENCES positions(id),
  manager_id UUID REFERENCES employees(id),
  hire_date DATE NOT NULL,
  termination_date DATE,
  
  -- Configuración de trabajo
  work_schedule JSONB DEFAULT '{"hours_per_day": 8, "days_per_week": 5}',
  salary_info JSONB,
  
  -- Estado y roles
  is_active BOOLEAN DEFAULT true,
  role VARCHAR DEFAULT 'employee' CHECK (role IN ('employee', 'manager', 'hr', 'admin', 'super_admin')),
  permissions JSONB DEFAULT '[]',
  
  -- Auditoria
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES employees(id),
  
  -- Constraints
  UNIQUE(organization_id, employee_code)
);

-- =============================================
-- 5. TABLA: TIPOS DE ASISTENCIA
-- =============================================

CREATE TABLE attendance_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  code VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(organization_id, code)
);

-- =============================================
-- 6. TABLA: POLÍTICAS DE TRABAJO
-- =============================================

CREATE TABLE work_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  start_time TIME NOT NULL DEFAULT '09:00:00',
  end_time TIME NOT NULL DEFAULT '17:00:00',
  break_duration INTEGER DEFAULT 60,
  late_threshold INTEGER DEFAULT 15,
  working_days INTEGER DEFAULT 31,
  allow_remote BOOLEAN DEFAULT false,
  require_geolocation BOOLEAN DEFAULT false,
  max_daily_hours DECIMAL(4,2) DEFAULT 12.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- 7. TABLA: ASISTENCIAS (Particionada)
-- =============================================

CREATE TABLE attendances (
  id UUID DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  
  -- Información de fecha y tiempo
  attendance_date DATE NOT NULL,
  check_in_time TIMESTAMP,
  check_out_time TIMESTAMP,
  
  -- Cálculos automáticos
  work_hours DECIMAL(5,2),
  break_duration INTEGER DEFAULT 0,
  overtime_hours DECIMAL(5,2) DEFAULT 0,
  
  -- Estado y tipo
  status VARCHAR DEFAULT 'present' CHECK (status IN (
    'present', 'absent', 'late', 'early_leave', 
    'sick_leave', 'vacation', 'remote', 'overtime'
  )),
  attendance_type_id UUID REFERENCES attendance_types(id),
  
  -- Información de ubicación y seguridad
  ip_address INET,
  user_agent TEXT,
  location_data JSONB,
  
  -- Validación y aprobación
  is_approved BOOLEAN DEFAULT NULL,
  approved_by UUID REFERENCES employees(id),
  approved_at TIMESTAMP,
  
  -- Notas
  employee_notes TEXT,
  manager_notes TEXT,
  
  -- Metadatos
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraint único
  UNIQUE(organization_id, employee_id, attendance_date)
  
) PARTITION BY RANGE (attendance_date);

-- Crear particiones por año
CREATE TABLE attendances_2024 PARTITION OF attendances
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE attendances_2025 PARTITION OF attendances
FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

CREATE TABLE attendances_2026 PARTITION OF attendances
FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

-- =============================================
-- 8. TABLA: CONFIGURACIONES DEL SISTEMA
-- =============================================

CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  category VARCHAR NOT NULL,
  key VARCHAR NOT NULL,
  value JSONB NOT NULL,
  data_type VARCHAR DEFAULT 'object' CHECK (data_type IN ('string', 'number', 'boolean', 'object', 'array')),
  version INTEGER DEFAULT 1,
  previous_value JSONB,
  is_public BOOLEAN DEFAULT false,
  is_encrypted BOOLEAN DEFAULT false,
  description TEXT,
  validation_schema JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES employees(id),
  UNIQUE(organization_id, category, key)
);

-- =============================================
-- 9. TABLA: LOGS DE AUDITORÍA
-- =============================================

CREATE TABLE setting_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_id UUID REFERENCES system_settings(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  action VARCHAR NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE')),
  old_value JSONB,
  new_value JSONB,
  changed_by UUID REFERENCES employees(id),
  change_reason TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- 10. FUNCIONES Y TRIGGERS
-- =============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendances_updated_at BEFORE UPDATE ON attendances
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para calcular horas trabajadas
CREATE OR REPLACE FUNCTION calculate_work_hours()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.check_in_time IS NOT NULL AND NEW.check_out_time IS NOT NULL THEN
    NEW.work_hours = EXTRACT(EPOCH FROM (NEW.check_out_time - NEW.check_in_time)) / 3600;
    
    IF NEW.work_hours > 8 THEN
      NEW.overtime_hours = NEW.work_hours - 8;
    END IF;
  END IF;
  
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_attendance_hours
  BEFORE INSERT OR UPDATE ON attendances
  FOR EACH ROW EXECUTE FUNCTION calculate_work_hours();

-- Función para crear configuraciones por defecto
CREATE OR REPLACE FUNCTION create_default_settings(org_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO system_settings (organization_id, category, key, value, description, is_public) VALUES
  (org_id, 'auth', 'session_timeout', '{"hours": 8}', 'Tiempo de expiración de sesión', false),
  (org_id, 'auth', 'password_policy', '{"min_length": 8, "require_special": true}', 'Política de contraseñas', false),
  (org_id, 'attendance', 'work_schedule', '{"start": "09:00", "end": "17:00", "break_minutes": 60}', 'Horario de trabajo estándar', true),
  (org_id, 'attendance', 'late_threshold', '{"minutes": 15}', 'Minutos para considerar llegada tarde', true),
  (org_id, 'ui', 'theme', '{"primary_color": "#EC5971", "dark_mode": false}', 'Configuración de tema', true),
  (org_id, 'ui', 'language', '{"default": "es", "available": ["es", "en"]}', 'Configuración de idioma', true);
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 11. ÍNDICES PARA PERFORMANCE
-- =============================================

CREATE INDEX idx_employees_org_active ON employees (organization_id, is_active);
CREATE INDEX idx_employees_email ON employees (email);
CREATE INDEX idx_employees_department ON employees (department_id);
CREATE INDEX idx_attendances_employee_date ON attendances (employee_id, attendance_date);
CREATE INDEX idx_attendances_org_date ON attendances (organization_id, attendance_date);
CREATE INDEX idx_settings_org_category ON system_settings (organization_id, category);

-- =============================================
-- 12. ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (se configurarán más adelante con auth)
CREATE POLICY "Public read access" ON organizations FOR SELECT USING (true);
CREATE POLICY "Public read access" ON departments FOR SELECT USING (true);
CREATE POLICY "Public read access" ON employees FOR SELECT USING (true);
CREATE POLICY "Public read access" ON attendances FOR SELECT USING (true);
CREATE POLICY "Public read access" ON system_settings FOR SELECT USING (true);

-- =============================================
-- 13. DATOS INICIALES PARA DESARROLLO
-- =============================================

-- Crear organización demo
INSERT INTO organizations (id, name, slug, timezone) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Educa Demo', 'educa-demo', 'America/Mexico_City');

-- Crear departamentos
INSERT INTO departments (organization_id, name, code) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Recursos Humanos', 'RH'),
('550e8400-e29b-41d4-a716-446655440000', 'Tecnología', 'TI'),
('550e8400-e29b-41d4-a716-446655440000', 'Administración', 'ADM'),
('550e8400-e29b-41d4-a716-446655440000', 'Docencia', 'DOC');

-- Crear posiciones
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

-- Crear política de trabajo
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

-- Crear empleados de prueba
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
FROM generate_series(1, 5);

-- =============================================
-- ¡CONFIGURACIÓN COMPLETADA! 🎉
-- =============================================
