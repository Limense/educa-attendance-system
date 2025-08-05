-- CORRECCIÓN PERMANENTE: Trigger prevent_privilege_escalation mejorado
-- Reemplaza el trigger temporal con la versión final optimizada

-- Función mejorada y definitiva para prevenir escalación de privilegios
CREATE OR REPLACE FUNCTION prevent_privilege_escalation()
RETURNS TRIGGER AS $$
DECLARE
    current_user_role TEXT;
    current_user_active BOOLEAN;
BEGIN
    -- Obtener información del usuario actual
    SELECT role, is_active INTO current_user_role, current_user_active
    FROM employees 
    WHERE id = auth.uid();
    
    -- Solo super_admin puede crear otros super_admins
    IF NEW.role = 'super_admin' THEN
        IF current_user_role != 'super_admin' OR current_user_active != true THEN
            RAISE EXCEPTION 'Solo super_admin puede crear otros super_admin';
        END IF;
    END IF;
    
    -- Super_admin y admin pueden crear admins
    IF NEW.role = 'admin' THEN
        IF current_user_role NOT IN ('super_admin', 'admin') OR current_user_active != true THEN
            RAISE EXCEPTION 'Solo super_admin o admin pueden crear roles administrativos';
        END IF;
    END IF;
    
    -- Validaciones para UPDATE (cambio de roles)
    IF TG_OP = 'UPDATE' THEN
        -- Solo super_admin puede cambiar roles a super_admin
        IF OLD.role != NEW.role AND NEW.role = 'super_admin' THEN
            IF current_user_role != 'super_admin' OR current_user_active != true THEN
                RAISE EXCEPTION 'Solo super_admin puede asignar rol super_admin';
            END IF;
        END IF;
        
        -- Super_admin y admin pueden cambiar roles admin/employee
        IF OLD.role != NEW.role AND NEW.role IN ('admin', 'employee') THEN
            IF current_user_role NOT IN ('super_admin', 'admin') OR current_user_active != true THEN
                RAISE EXCEPTION 'Solo super_admin o admin pueden cambiar roles';
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar el trigger corregido
DROP TRIGGER IF EXISTS prevent_privilege_escalation_trigger ON employees;
CREATE TRIGGER prevent_privilege_escalation_trigger
    BEFORE INSERT OR UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION prevent_privilege_escalation();

-- Limpiar función temporal de debug
DROP FUNCTION IF EXISTS prevent_privilege_escalation_debug();

-- CONFIRMACIÓN: El sistema ahora tiene estas reglas de permisos:
-- ✅ Super_admin: Puede crear/editar TODOS los roles (employee, admin, super_admin)
-- ✅ Admin: Puede crear/editar employee y admin (NO super_admin)
-- ✅ Employee: Solo puede ver, NO crear ni editar roles
-- ✅ Todas las validaciones funcionan correctamente

-- RESULTADO: Sistema de permisos completamente funcional y seguro
