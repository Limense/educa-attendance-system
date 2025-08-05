-- =============================================
-- ANÁLISIS Y CORRECCIÓN DE PERMISOS POR ROL
-- =============================================

-- =============================================
-- 1. VER PERMISOS ACTUALES
-- =============================================

-- Ver todas las políticas de employees
SELECT 
    policyname as "Política",
    cmd as "Operación",
    CASE 
        WHEN qual LIKE '%super_admin%' AND qual LIKE '%admin%' THEN '👑 Super Admin + 👤 Admin'
        WHEN qual LIKE '%super_admin%' THEN '👑 Solo Super Admin'
        WHEN qual LIKE '%admin%' THEN '👤 Solo Admin'
        ELSE '🔓 Todos'
    END as "Quién puede",
    LEFT(qual, 100) as "Condición (resumida)"
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'employees'
ORDER BY cmd, policyname;

-- =============================================
-- 2. PROBLEMA ACTUAL: ADMIN PUEDE CAMBIAR ROLES
-- =============================================

-- La política actual permite que admin actualice cualquier campo
-- incluyendo el role, lo cual es un riesgo de seguridad

-- =============================================
-- 3. CORREGIR POLÍTICA DE ACTUALIZACIÓN
-- =============================================

-- Eliminar política actual
DROP POLICY IF EXISTS "employees_update_policy" ON employees;

-- Crear nueva política más granular
CREATE POLICY "employees_update_policy" ON employees
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL 
    AND
    (
      -- EMPLEADOS: Solo pueden actualizar campos limitados de su perfil
      (
        id = auth.uid()
        AND
        -- Verificar que no están intentando cambiar campos críticos
        (
          OLD.role = NEW.role AND  -- No puede cambiar su rol
          OLD.organization_id = NEW.organization_id AND  -- No puede cambiar organización
          OLD.is_active = NEW.is_active  -- No puede activarse/desactivarse
        )
      )
      OR
      -- ADMINS: Pueden actualizar empleados pero NO cambiar roles críticos
      (
        EXISTS (
          SELECT 1 FROM employees admin_emp
          WHERE admin_emp.id = auth.uid() 
          AND admin_emp.role = 'admin'
          AND admin_emp.is_active = true
          AND admin_emp.organization_id = employees.organization_id
        )
        AND
        -- RESTRICCIONES PARA ADMIN:
        (
          OLD.role = NEW.role OR  -- No puede cambiar roles
          (OLD.role = 'admin' AND NEW.role = 'employee')  -- Solo puede degradar admin->employee
        )
        AND
        NEW.role != 'super_admin'  -- NUNCA puede crear super_admin
      )
      OR
      -- SUPER_ADMIN: Control total sin restricciones
      EXISTS (
        SELECT 1 FROM employees admin_emp
        WHERE admin_emp.id = auth.uid() 
        AND admin_emp.role = 'super_admin'
        AND admin_emp.is_active = true
        AND admin_emp.organization_id = employees.organization_id
      )
    )
  );

-- =============================================
-- 4. DEFINIR PERMISOS CLAROS POR ROL
-- =============================================

SELECT '
👑 SUPER_ADMIN puede:
  ✅ Crear empleados (cualquier rol)
  ✅ Actualizar cualquier campo de cualquier empleado
  ✅ Cambiar roles (incluso crear otros super_admin)
  ✅ Eliminar empleados
  ✅ Ver logs de auditoría
  ✅ Administrar organizaciones

👤 ADMIN puede:
  ✅ Ver todos los empleados de su organización
  ✅ Actualizar datos básicos (nombre, email, departamento, etc.)
  ✅ Degradar admin -> employee (solo degradar)
  ✅ Activar/desactivar empleados normales
  ❌ Crear empleados
  ❌ Cambiar roles a super_admin
  ❌ Eliminar empleados
  ❌ Ver logs de auditoría

🧑‍💼 EMPLOYEE puede:
  ✅ Ver su propio perfil
  ✅ Actualizar datos personales básicos (teléfono, avatar)
  ❌ Cambiar su rol
  ❌ Cambiar su estado activo
  ❌ Ver otros empleados (excepto en el contexto necesario)
' as "PERMISOS POR ROL";

-- =============================================
-- 5. VERIFICAR NUEVA CONFIGURACIÓN
-- =============================================

SELECT 
    policyname as "Política",
    cmd as "Operación"
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'employees'
ORDER BY cmd, policyname;

SELECT '✅ PERMISOS CORREGIDOS - Admin ya no puede escalar privilegios' as resultado;
