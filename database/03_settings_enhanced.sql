-- =============================================
-- SISTEMA DE CONFIGURACIONES ESCALABLE
-- Descripción: Configuraciones flexibles con cache y versionado
-- =============================================

-- Configuraciones del sistema (mejorado)
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Identificación de la configuración
  category VARCHAR NOT NULL, -- auth, attendance, notifications, etc.
  key VARCHAR NOT NULL,
  
  -- Valor y metadatos
  value JSONB NOT NULL,
  data_type VARCHAR DEFAULT 'object' CHECK (data_type IN ('string', 'number', 'boolean', 'object', 'array')),
  
  -- Versionado para auditoria
  version INTEGER DEFAULT 1,
  previous_value JSONB,
  
  -- Configuración de aplicación
  is_public BOOLEAN DEFAULT false, -- Si puede ser leído por usuarios finales
  is_encrypted BOOLEAN DEFAULT false, -- Si contiene datos sensibles
  
  -- Descripción y validación
  description TEXT,
  validation_schema JSONB, -- JSON Schema para validar el valor
  
  -- Auditoria
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES employees(id),
  
  -- Constraints para integridad
  UNIQUE(organization_id, category, key),
  
  -- Índices para performance
  INDEX idx_settings_org_category (organization_id, category),
  INDEX idx_settings_public (is_public),
  INDEX idx_settings_key (key)
);

-- Tabla de logs de configuración (auditoria completa)
CREATE TABLE setting_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_id UUID REFERENCES system_settings(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  
  -- Cambios realizados
  action VARCHAR NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE')),
  old_value JSONB,
  new_value JSONB,
  
  -- Información del cambio
  changed_by UUID REFERENCES employees(id),
  change_reason TEXT,
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Índices para consultas de auditoria
  INDEX idx_audit_setting (setting_id),
  INDEX idx_audit_user (changed_by),
  INDEX idx_audit_date (created_at)
);

-- Función para crear configuraciones por defecto
CREATE OR REPLACE FUNCTION create_default_settings(org_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Configuraciones de autenticación
  INSERT INTO system_settings (organization_id, category, key, value, description, is_public) VALUES
  (org_id, 'auth', 'session_timeout', '{"hours": 8}', 'Tiempo de expiración de sesión', false),
  (org_id, 'auth', 'password_policy', '{"min_length": 8, "require_special": true}', 'Política de contraseñas', false),
  (org_id, 'auth', 'max_login_attempts', '{"attempts": 5, "lockout_minutes": 30}', 'Intentos máximos de login', false),
  
  -- Configuraciones de asistencia
  (org_id, 'attendance', 'work_schedule', '{"start": "09:00", "end": "17:00", "break_minutes": 60}', 'Horario de trabajo estándar', true),
  (org_id, 'attendance', 'late_threshold', '{"minutes": 15}', 'Minutos para considerar llegada tarde', true),
  (org_id, 'attendance', 'geolocation_required', '{"enabled": false, "radius_meters": 100}', 'Requerir geolocalización', true),
  (org_id, 'attendance', 'overtime_rules', '{"after_hours": 8, "rate_multiplier": 1.5}', 'Reglas de horas extra', false),
  
  -- Configuraciones de notificaciones
  (org_id, 'notifications', 'email_enabled', '{"enabled": true}', 'Notificaciones por email habilitadas', false),
  (org_id, 'notifications', 'late_arrival_alert', '{"enabled": true, "notify_manager": true}', 'Alerta de llegada tarde', false),
  
  -- Configuraciones de reportes
  (org_id, 'reports', 'export_formats', '{"allowed": ["excel", "csv", "pdf"]}', 'Formatos de exportación permitidos', true),
  (org_id, 'reports', 'retention_days', '{"days": 1095}', 'Días de retención de datos (3 años)', false),
  
  -- Configuraciones de UI
  (org_id, 'ui', 'theme', '{"primary_color": "#EC5971", "dark_mode": false}', 'Configuración de tema', true),
  (org_id, 'ui', 'language', '{"default": "es", "available": ["es", "en"]}', 'Configuración de idioma', true);
  
END;
$$ LANGUAGE plpgsql;

-- Trigger para auditoria automática de configuraciones
CREATE OR REPLACE FUNCTION audit_setting_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO setting_audit_logs (
      setting_id, organization_id, action, old_value, new_value, 
      changed_by, ip_address
    ) VALUES (
      NEW.id, NEW.organization_id, 'UPDATE', OLD.value, NEW.value,
      NEW.updated_by, inet_client_addr()
    );
    
    -- Actualizar versión
    NEW.version = OLD.version + 1;
    NEW.previous_value = OLD.value;
    NEW.updated_at = NOW();
    
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO setting_audit_logs (
      setting_id, organization_id, action, new_value, changed_by
    ) VALUES (
      NEW.id, NEW.organization_id, 'CREATE', NEW.value, NEW.updated_by
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_settings_trigger
  AFTER INSERT OR UPDATE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION audit_setting_changes();

-- Vista para acceso fácil a configuraciones
CREATE VIEW current_settings AS
SELECT 
  s.organization_id,
  s.category,
  s.key,
  s.value,
  s.is_public,
  s.description,
  s.updated_at
FROM system_settings s
WHERE s.version = (
  SELECT MAX(version) 
  FROM system_settings s2 
  WHERE s2.organization_id = s.organization_id 
    AND s2.category = s.category 
    AND s2.key = s.key
);

-- RLS para configuraciones
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY settings_org_isolation ON system_settings
  FOR ALL USING (organization_id = current_setting('app.current_organization_id')::UUID);
