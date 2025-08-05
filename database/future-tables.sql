-- =============================================
-- TABLAS FUTURAS PARA EMPLOYEE DASHBOARD
-- =============================================

-- 1. SOLICITUDES DE PERMISOS/LICENCIAS
CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  leave_type_id UUID REFERENCES leave_types(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_requested INTEGER NOT NULL,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approved_by UUID REFERENCES employees(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TIPOS DE PERMISOS/LICENCIAS
CREATE TABLE IF NOT EXISTS leave_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  max_days_per_year INTEGER,
  requires_approval BOOLEAN DEFAULT true,
  is_paid BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. PREFERENCIAS DE USUARIO
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE UNIQUE,
  language VARCHAR(10) DEFAULT 'es',
  timezone VARCHAR(50) DEFAULT 'America/Mexico_City',
  date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
  time_format VARCHAR(10) DEFAULT '24h',
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. NOTIFICACIONES
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. REPORTES DE ASISTENCIA (PARA HISTORIAL)
CREATE TABLE IF NOT EXISTS attendance_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  report_period VARCHAR(20) NOT NULL, -- 'weekly', 'monthly', 'yearly'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INTEGER DEFAULT 0,
  present_days INTEGER DEFAULT 0,
  absent_days INTEGER DEFAULT 0,
  late_days INTEGER DEFAULT 0,
  total_hours DECIMAL(8,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar tipos de permisos básicos
INSERT INTO leave_types (organization_id, name, description, max_days_per_year, requires_approval, is_paid) 
SELECT 
  o.id,
  'Vacaciones',
  'Días de vacaciones anuales',
  15,
  true,
  true
FROM organizations o
WHERE NOT EXISTS (SELECT 1 FROM leave_types WHERE name = 'Vacaciones');

INSERT INTO leave_types (organization_id, name, description, max_days_per_year, requires_approval, is_paid) 
SELECT 
  o.id,
  'Enfermedad',
  'Días por enfermedad',
  10,
  false,
  true
FROM organizations o
WHERE NOT EXISTS (SELECT 1 FROM leave_types WHERE name = 'Enfermedad');

INSERT INTO leave_types (organization_id, name, description, max_days_per_year, requires_approval, is_paid) 
SELECT 
  o.id,
  'Personal',
  'Asuntos personales',
  3,
  true,
  false
FROM organizations o
WHERE NOT EXISTS (SELECT 1 FROM leave_types WHERE name = 'Personal');

-- Crear índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_notifications_employee ON notifications(employee_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_attendance_reports_employee ON attendance_reports(employee_id);

SELECT 'Tablas futuras creadas correctamente' as resultado;
