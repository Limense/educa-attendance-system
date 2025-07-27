-- =============================================
-- TABLA: attendances (Versión Escalable)
-- Descripción: Sistema de asistencias con particionado y escalabilidad
-- =============================================

-- Tipos de asistencia (normalizado)
CREATE TABLE attendance_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  code VARCHAR NOT NULL, -- REGULAR, OVERTIME, REMOTE, SICK_LEAVE, etc.
  name VARCHAR NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(organization_id, code)
);

-- Políticas de trabajo (horarios y reglas)
CREATE TABLE work_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  
  -- Configuración de horarios
  start_time TIME NOT NULL DEFAULT '09:00:00',
  end_time TIME NOT NULL DEFAULT '17:00:00',
  break_duration INTEGER DEFAULT 60, -- minutos
  late_threshold INTEGER DEFAULT 15, -- minutos para ser considerado tarde
  
  -- Días laborales (bit mask: 1234567 = Lun-Dom)
  working_days INTEGER DEFAULT 31, -- 0011111 = Lun-Vie
  
  -- Configuración adicional
  allow_remote BOOLEAN DEFAULT false,
  require_geolocation BOOLEAN DEFAULT false,
  max_daily_hours DECIMAL(4,2) DEFAULT 12.00,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla principal de asistencias (PARTICIONADA por fecha para escalabilidad)
CREATE TABLE attendances (
  id UUID DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  
  -- Información de fecha y tiempo
  attendance_date DATE NOT NULL,
  check_in_time TIMESTAMP,
  check_out_time TIMESTAMP,
  
  -- Cálculos automáticos
  work_hours DECIMAL(5,2), -- Horas trabajadas
  break_duration INTEGER DEFAULT 0, -- Minutos de descanso
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
  location_data JSONB, -- {lat, lng, accuracy, address}
  
  -- Validación y aprobación
  is_approved BOOLEAN DEFAULT NULL, -- NULL = pending, true = approved, false = rejected
  approved_by UUID REFERENCES employees(id),
  approved_at TIMESTAMP,
  
  -- Notas y observaciones
  employee_notes TEXT,
  manager_notes TEXT,
  
  -- Metadatos
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraint único por empleado y fecha
  UNIQUE(organization_id, employee_id, attendance_date),
  
  -- Índices para performance
  INDEX idx_attendances_employee_date (employee_id, attendance_date),
  INDEX idx_attendances_org_date (organization_id, attendance_date),
  INDEX idx_attendances_status (status),
  INDEX idx_attendances_approval (is_approved)
  
) PARTITION BY RANGE (attendance_date);

-- Crear particiones por año para escalabilidad
-- Esto permite manejar millones de registros eficientemente
CREATE TABLE attendances_2024 PARTITION OF attendances
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE attendances_2025 PARTITION OF attendances
FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

CREATE TABLE attendances_2026 PARTITION OF attendances
FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

-- Trigger para cálculo automático de horas
CREATE OR REPLACE FUNCTION calculate_work_hours()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo calcular si hay check_in y check_out
  IF NEW.check_in_time IS NOT NULL AND NEW.check_out_time IS NOT NULL THEN
    NEW.work_hours = EXTRACT(EPOCH FROM (NEW.check_out_time - NEW.check_in_time)) / 3600;
    
    -- Calcular overtime si excede 8 horas
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

-- RLS para multi-tenancy
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;

CREATE POLICY attendances_org_isolation ON attendances
  FOR ALL USING (organization_id = current_setting('app.current_organization_id')::UUID);
