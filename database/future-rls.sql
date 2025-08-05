-- =============================================
-- RLS PARA FUNCIONALIDADES FUTURAS
-- =============================================
-- Configurar RLS según los 3 roles para las nuevas tablas

-- Habilitar RLS en todas las tablas nuevas
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;  
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_reports ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLÍTICAS PARA LEAVE_REQUESTS (Solicitudes de Permisos)
-- =============================================

-- VER SOLICITUDES:
-- • super_admin/admin: Ven todas las solicitudes
-- • employee: Solo sus propias solicitudes
CREATE POLICY "leave_requests_select_policy" ON leave_requests
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND
    organization_id IN (
      SELECT organization_id FROM employees WHERE id = auth.uid()
    )
    AND
    (
      -- Admins ven todas
      EXISTS (
        SELECT 1 FROM employees 
        WHERE id = auth.uid() 
        AND role IN ('super_admin', 'admin')
      )
      OR
      -- Employees solo sus propias solicitudes
      employee_id = auth.uid()
    )
  );

-- CREAR SOLICITUDES: Employees pueden crear sus propias, admins para cualquiera
CREATE POLICY "leave_requests_insert_policy" ON leave_requests
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND
    (
      -- Su propia solicitud
      employee_id = auth.uid()
      OR
      -- Admins pueden crear para cualquiera
      EXISTS (
        SELECT 1 FROM employees 
        WHERE id = auth.uid() 
        AND role IN ('super_admin', 'admin')
      )
    )
  );

-- ACTUALIZAR SOLICITUDES: Employees solo las suyas (para cancelar), admins cualquiera
CREATE POLICY "leave_requests_update_policy" ON leave_requests
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL 
    AND
    (
      -- Sus propias solicitudes (para cancelar)
      employee_id = auth.uid()
      OR
      -- Admins pueden aprobar/rechazar cualquiera
      EXISTS (
        SELECT 1 FROM employees 
        WHERE id = auth.uid() 
        AND role IN ('super_admin', 'admin')
      )
    )
  );

-- =============================================
-- POLÍTICAS PARA LEAVE_TYPES (Tipos de Permisos)
-- =============================================

-- VER TIPOS: Todos pueden ver (para formularios)
CREATE POLICY "leave_types_select_policy" ON leave_types
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND
    organization_id IN (
      SELECT organization_id FROM employees WHERE id = auth.uid()
    )
  );

-- CREAR/MODIFICAR TIPOS: Solo admins
CREATE POLICY "leave_types_insert_policy" ON leave_types
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "leave_types_update_policy" ON leave_types
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL 
    AND
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND organization_id = leave_types.organization_id
      AND role IN ('super_admin', 'admin')
    )
  );

-- =============================================
-- POLÍTICAS PARA USER_PREFERENCES (Preferencias)
-- =============================================

-- VER PREFERENCIAS: Solo sus propias preferencias
CREATE POLICY "user_preferences_select_policy" ON user_preferences
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND
    employee_id = auth.uid()
  );

-- CREAR/ACTUALIZAR PREFERENCIAS: Solo sus propias preferencias
CREATE POLICY "user_preferences_insert_policy" ON user_preferences
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND
    employee_id = auth.uid()
  );

CREATE POLICY "user_preferences_update_policy" ON user_preferences
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL 
    AND
    employee_id = auth.uid()
  );

-- =============================================
-- POLÍTICAS PARA NOTIFICATIONS (Notificaciones)
-- =============================================

-- VER NOTIFICACIONES: Solo sus propias notificaciones
CREATE POLICY "notifications_select_policy" ON notifications
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND
    employee_id = auth.uid()
  );

-- CREAR NOTIFICACIONES: Solo admins pueden crear notificaciones
CREATE POLICY "notifications_insert_policy" ON notifications
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'admin')
    )
  );

-- ACTUALIZAR NOTIFICACIONES: Solo el destinatario (para marcar como leída)
CREATE POLICY "notifications_update_policy" ON notifications
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL 
    AND
    employee_id = auth.uid()
  );

-- =============================================
-- POLÍTICAS PARA ATTENDANCE_REPORTS (Reportes)
-- =============================================

-- VER REPORTES:
-- • super_admin/admin: Ven todos los reportes
-- • employee: Solo sus propios reportes
CREATE POLICY "attendance_reports_select_policy" ON attendance_reports
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND
    organization_id IN (
      SELECT organization_id FROM employees WHERE id = auth.uid()
    )
    AND
    (
      -- Admins ven todos
      EXISTS (
        SELECT 1 FROM employees 
        WHERE id = auth.uid() 
        AND role IN ('super_admin', 'admin')
      )
      OR
      -- Employees solo sus propios reportes
      employee_id = auth.uid()
    )
  );

-- CREAR REPORTES: Sistema automático, pero permitir a todos para generar sus reportes
CREATE POLICY "attendance_reports_insert_policy" ON attendance_reports
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND
    (
      -- Su propio reporte
      employee_id = auth.uid()
      OR
      -- Admins pueden generar reportes para cualquiera
      EXISTS (
        SELECT 1 FROM employees 
        WHERE id = auth.uid() 
        AND role IN ('super_admin', 'admin')
      )
    )
  );

SELECT 'RLS configurado para funcionalidades futuras del Employee Dashboard' as resultado;
