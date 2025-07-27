-- =============================================
-- TABLA: employees (Versión Escalable)
-- Descripción: Gestión completa de empleados con escalabilidad multi-tenant
-- =============================================

-- Tabla de organizaciones (para multi-tenancy futuro)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  slug VARCHAR UNIQUE NOT NULL, -- para subdominios
  domain VARCHAR, -- dominios corporativos
  timezone VARCHAR DEFAULT 'UTC',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de departamentos (normalizada y escalable)
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  code VARCHAR NOT NULL, -- HR, IT, SALES, etc.
  manager_id UUID, -- Self-reference para jerarquía
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, code)
);

-- Tabla de posiciones/cargos
CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  code VARCHAR NOT NULL,
  department_id UUID REFERENCES departments(id),
  level INTEGER DEFAULT 1, -- Nivel jerárquico
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, code)
);

-- Empleados mejorados con escalabilidad
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  employee_code VARCHAR NOT NULL, -- Código único por organización
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
  manager_id UUID REFERENCES employees(id), -- Jerarquía
  hire_date DATE NOT NULL,
  termination_date DATE,
  
  -- Configuración de trabajo
  work_schedule JSONB DEFAULT '{"hours_per_day": 8, "days_per_week": 5}',
  salary_info JSONB, -- Información sensible encriptada
  
  -- Estado y roles
  is_active BOOLEAN DEFAULT true,
  role VARCHAR DEFAULT 'employee' CHECK (role IN ('employee', 'manager', 'hr', 'admin', 'super_admin')),
  permissions JSONB DEFAULT '[]', -- Permisos específicos
  
  -- Auditoria y metadatos
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES employees(id),
  
  -- Constraints para escalabilidad
  UNIQUE(organization_id, employee_code),
  
  -- Índices para performance
  INDEX idx_employees_org_active (organization_id, is_active),
  INDEX idx_employees_email (email),
  INDEX idx_employees_department (department_id),
  INDEX idx_employees_manager (manager_id)
);

-- Triggers para auditoria automática
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) para multi-tenancy
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Política: Los empleados solo ven datos de su organización
CREATE POLICY employees_org_isolation ON employees
  FOR ALL USING (organization_id = current_setting('app.current_organization_id')::UUID);
