-- DIAGNÓSTICO: Problema con trigger prevent_privilege_escalation
-- El trigger no reconoce correctamente al super_admin

-- 1. Verificar el usuario actual autenticado
SELECT 
    auth.uid() as current_auth_uid,
    'Usuario actualmente autenticado' as descripcion;

-- 2. Verificar que existe el empleado con ese ID y rol super_admin
SELECT 
    id,
    email,
    role,
    is_active,
    'Empleado en tabla employees' as descripcion
FROM employees 
WHERE id = auth.uid();

-- 3. Verificar exactamente lo que el trigger está evaluando
SELECT 
    EXISTS (
        SELECT 1 FROM employees 
        WHERE id = auth.uid() 
        AND role = 'super_admin'
        AND is_active = true
    ) as tiene_permisos_super_admin,
    'Resultado de la validación del trigger' as descripcion;

-- 4. Ver todos los super_admins activos
SELECT 
    id,
    email,
    role,
    is_active,
    'Todos los super_admins activos' as descripcion
FROM employees 
WHERE role = 'super_admin' 
AND is_active = true;

-- 5. SOLUCIÓN TEMPORAL: Crear función de prueba más permisiva
CREATE OR REPLACE FUNCTION prevent_privilege_escalation_debug()
RETURNS TRIGGER AS $$
DECLARE
    current_user_role TEXT;
    current_user_active BOOLEAN;
BEGIN
    -- Obtener información del usuario actual
    SELECT role, is_active INTO current_user_role, current_user_active
    FROM employees 
    WHERE id = auth.uid();
    
    -- Log para debug
    RAISE NOTICE 'Usuario actual: %, Rol: %, Activo: %', auth.uid(), current_user_role, current_user_active;
    RAISE NOTICE 'Intentando crear empleado con rol: %', NEW.role;
    
    -- Solo super_admin puede crear otros admins o super_admins
    IF NEW.role IN ('admin', 'super_admin') THEN
        IF current_user_role != 'super_admin' OR current_user_active != true THEN
            RAISE EXCEPTION 'Solo super_admin puede crear roles administrativos. Usuario actual: % con rol: %', auth.uid(), current_user_role;
        END IF;
    END IF;
    
    -- Los admins no pueden cambiar roles (solo en UPDATE)
    IF TG_OP = 'UPDATE' THEN
        IF OLD.role != NEW.role THEN
            IF current_user_role != 'super_admin' OR current_user_active != true THEN
                RAISE EXCEPTION 'Solo super_admin puede cambiar roles. Usuario actual: % con rol: %', auth.uid(), current_user_role;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. APLICAR LA FUNCIÓN CORREGIDA TEMPORALMENTE
DROP TRIGGER IF EXISTS prevent_privilege_escalation_trigger ON employees;
CREATE TRIGGER prevent_privilege_escalation_trigger
    BEFORE INSERT OR UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION prevent_privilege_escalation_debug();

-- INSTRUCCIONES:
-- 1. Ejecuta estos queries en orden
-- 2. Revisa los resultados de las verificaciones
-- 3. Intenta crear un empleado desde la aplicación
-- 4. Observa los logs del trigger debug
-- 5. Si funciona, podemos hacer permanente la corrección
