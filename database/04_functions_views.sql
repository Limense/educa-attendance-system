-- =============================================
-- FUNCIONES Y VISTAS UTILITARIAS PARA ESCALABILIDAD
-- Descripción: Optimizaciones para performance y reportes
-- =============================================

-- Vista materializada para dashboard de empleados (performance)
CREATE MATERIALIZED VIEW employee_dashboard_stats AS
SELECT 
  e.id as employee_id,
  e.organization_id,
  e.full_name,
  e.department_id,
  d.name as department_name,
  
  -- Estadísticas del mes actual
  COUNT(a.id) FILTER (WHERE a.attendance_date >= date_trunc('month', CURRENT_DATE)) as days_present_month,
  AVG(a.work_hours) FILTER (WHERE a.attendance_date >= date_trunc('month', CURRENT_DATE)) as avg_hours_month,
  SUM(a.work_hours) FILTER (WHERE a.attendance_date >= date_trunc('month', CURRENT_DATE)) as total_hours_month,
  SUM(a.overtime_hours) FILTER (WHERE a.attendance_date >= date_trunc('month', CURRENT_DATE)) as overtime_month,
  
  -- Estadísticas del año actual
  COUNT(a.id) FILTER (WHERE a.attendance_date >= date_trunc('year', CURRENT_DATE)) as days_present_year,
  SUM(a.work_hours) FILTER (WHERE a.attendance_date >= date_trunc('year', CURRENT_DATE)) as total_hours_year,
  
  -- Estadísticas de puntualidad
  COUNT(a.id) FILTER (WHERE a.status = 'late' AND a.attendance_date >= date_trunc('month', CURRENT_DATE)) as late_days_month,
  
  -- Última asistencia
  MAX(a.attendance_date) as last_attendance,
  
  updated_at
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN attendances a ON e.id = a.employee_id AND a.status != 'absent'
WHERE e.is_active = true
GROUP BY e.id, e.organization_id, e.full_name, e.department_id, d.name;

-- Índice para la vista materializada
CREATE UNIQUE INDEX idx_employee_dashboard_stats_pk ON employee_dashboard_stats (employee_id);
CREATE INDEX idx_employee_dashboard_org ON employee_dashboard_stats (organization_id);

-- Función para refrescar estadísticas (ejecutar diariamente)
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY employee_dashboard_stats;
END;
$$ LANGUAGE plpgsql;

-- Vista para reportes de asistencia por departamento
CREATE VIEW department_attendance_summary AS
SELECT 
  d.organization_id,
  d.id as department_id,
  d.name as department_name,
  DATE_TRUNC('month', a.attendance_date) as month,
  
  COUNT(DISTINCT a.employee_id) as unique_employees,
  COUNT(a.id) FILTER (WHERE a.status = 'present') as present_days,
  COUNT(a.id) FILTER (WHERE a.status = 'absent') as absent_days,
  COUNT(a.id) FILTER (WHERE a.status = 'late') as late_days,
  COUNT(a.id) FILTER (WHERE a.status = 'remote') as remote_days,
  
  AVG(a.work_hours) FILTER (WHERE a.work_hours > 0) as avg_daily_hours,
  SUM(a.work_hours) as total_work_hours,
  SUM(a.overtime_hours) as total_overtime_hours,
  
  -- Tasa de asistencia
  ROUND(
    (COUNT(a.id) FILTER (WHERE a.status = 'present')::DECIMAL / 
     NULLIF(COUNT(a.id), 0)) * 100, 2
  ) as attendance_rate
  
FROM departments d
LEFT JOIN employees e ON d.id = e.department_id AND e.is_active = true
LEFT JOIN attendances a ON e.id = a.employee_id
WHERE a.attendance_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY d.organization_id, d.id, d.name, DATE_TRUNC('month', a.attendance_date);

-- Función para generar código de empleado automático
CREATE OR REPLACE FUNCTION generate_employee_code(org_id UUID, dept_code VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
  year_suffix VARCHAR := EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR;
  next_number INTEGER;
  new_code VARCHAR;
BEGIN
  -- Obtener el siguiente número para el departamento
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(employee_code FROM '[0-9]+$') AS INTEGER)
  ), 0) + 1
  INTO next_number
  FROM employees 
  WHERE organization_id = org_id 
    AND employee_code LIKE dept_code || year_suffix || '%';
  
  -- Generar código: DEPT + AÑO + NÚMERO (ej: IT2025001)
  new_code := dept_code || year_suffix || LPAD(next_number::VARCHAR, 3, '0');
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Función para validar check-in/check-out
CREATE OR REPLACE FUNCTION validate_attendance_time(
  emp_id UUID,
  check_type VARCHAR, -- 'in' o 'out'
  timestamp_value TIMESTAMP,
  location_data JSONB DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  result JSONB := '{"valid": true, "warnings": []}';
  last_record RECORD;
  work_policy RECORD;
  warnings TEXT[] := '{}';
BEGIN
  -- Obtener política de trabajo del empleado
  SELECT wp.* INTO work_policy
  FROM employees e
  JOIN work_policies wp ON wp.organization_id = e.organization_id
  WHERE e.id = emp_id AND wp.is_active = true
  LIMIT 1;
  
  -- Obtener último registro del día
  SELECT * INTO last_record
  FROM attendances
  WHERE employee_id = emp_id 
    AND attendance_date = timestamp_value::DATE
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Validaciones para check-in
  IF check_type = 'in' THEN
    -- Verificar si ya hizo check-in
    IF last_record.check_in_time IS NOT NULL THEN
      result := jsonb_set(result, '{valid}', 'false');
      warnings := array_append(warnings, 'Ya registró entrada hoy');
    END IF;
    
    -- Verificar horario (si es muy tarde)
    IF timestamp_value::TIME > (work_policy.start_time + INTERVAL '30 minutes') THEN
      warnings := array_append(warnings, 'Llegada tarde detectada');
    END IF;
    
  -- Validaciones para check-out
  ELSIF check_type = 'out' THEN
    -- Verificar si no hizo check-in
    IF last_record.check_in_time IS NULL THEN
      result := jsonb_set(result, '{valid}', 'false');
      warnings := array_append(warnings, 'Debe registrar entrada primero');
    END IF;
    
    -- Verificar si ya hizo check-out
    IF last_record.check_out_time IS NOT NULL THEN
      result := jsonb_set(result, '{valid}', 'false');
      warnings := array_append(warnings, 'Ya registró salida hoy');
    END IF;
    
  END IF;
  
  -- Agregar warnings al resultado
  result := jsonb_set(result, '{warnings}', to_jsonb(warnings));
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener configuración de organización (cached)
CREATE OR REPLACE FUNCTION get_org_setting(org_id UUID, setting_category VARCHAR, setting_key VARCHAR)
RETURNS JSONB AS $$
DECLARE
  setting_value JSONB;
BEGIN
  SELECT value INTO setting_value
  FROM system_settings
  WHERE organization_id = org_id
    AND category = setting_category
    AND key = setting_key
  ORDER BY version DESC
  LIMIT 1;
  
  RETURN COALESCE(setting_value, '{}');
END;
$$ LANGUAGE plpgsql STABLE; -- STABLE para caching

-- Indices adicionales para performance
CREATE INDEX CONCURRENTLY idx_attendances_employee_month 
ON attendances (employee_id, attendance_date) 
WHERE attendance_date >= CURRENT_DATE - INTERVAL '1 month';

CREATE INDEX CONCURRENTLY idx_attendances_org_status 
ON attendances (organization_id, status, attendance_date);

CREATE INDEX CONCURRENTLY idx_employees_active_org 
ON employees (organization_id, is_active, department_id) 
WHERE is_active = true;
