-- =============================================
-- TRIGGER PARA SINCRONIZAR AUTH CON EMPLOYEES
-- =============================================
-- 
-- Descripción: Trigger que automáticamente crea un empleado cuando se registra un usuario
-- Aplicando principios SOLID y buenas prácticas de PostgreSQL
--
-- Principios aplicados:
-- - Single Responsibility: Función específica para sincronización
-- - Open/Closed: Extensible para nuevos campos sin modificar lógica base
-- - Dependency Inversion: Utiliza metadatos de auth.users
-- =============================================

-- Función para manejar nuevos usuarios registrados
CREATE OR REPLACE FUNCTION handle_new_user_registration()
RETURNS TRIGGER AS $$
DECLARE
    default_org_id UUID;
    employee_code_generated VARCHAR;
BEGIN
    -- Obtener organización por defecto o crear una si no existe
    SELECT id INTO default_org_id 
    FROM organizations 
    WHERE slug = 'educa-demo' 
    LIMIT 1;
    
    -- Si no existe organización por defecto, usar la primera disponible
    IF default_org_id IS NULL THEN
        SELECT id INTO default_org_id 
        FROM organizations 
        WHERE is_active = true 
        ORDER BY created_at ASC 
        LIMIT 1;
    END IF;
    
    -- Si aún no hay organización, crear una por defecto
    IF default_org_id IS NULL THEN
        INSERT INTO organizations (name, slug, is_active)
        VALUES ('Educa Demo', 'educa-demo', true)
        RETURNING id INTO default_org_id;
    END IF;
    
    -- Generar código de empleado automático
    employee_code_generated := 'EMP' || LPAD(
        (COALESCE(
            (SELECT MAX(CAST(SUBSTRING(employee_code FROM 4) AS INTEGER))
             FROM employees 
             WHERE employee_code ~ '^EMP[0-9]+$'
             AND organization_id = default_org_id), 
            0
        ) + 1)::TEXT, 
        6, 
        '0'
    );
    
    -- Extraer first_name y last_name del display_name o email
    DECLARE
        display_name_parts TEXT[];
        first_name_value VARCHAR := '';
        last_name_value VARCHAR := '';
    BEGIN
        -- Intentar extraer nombres del display_name
        IF NEW.raw_user_meta_data ->> 'full_name' IS NOT NULL THEN
            display_name_parts := string_to_array(NEW.raw_user_meta_data ->> 'full_name', ' ');
        ELSIF NEW.raw_user_meta_data ->> 'name' IS NOT NULL THEN
            display_name_parts := string_to_array(NEW.raw_user_meta_data ->> 'name', ' ');
        ELSE
            -- Fallback: usar parte del email
            display_name_parts := string_to_array(split_part(NEW.email, '@', 1), '.');
        END IF;
        
        -- Asignar first_name y last_name
        first_name_value := COALESCE(display_name_parts[1], 'Usuario');
        last_name_value := COALESCE(display_name_parts[2], 'Sin Apellido');
        
        -- Capitalizar nombres
        first_name_value := INITCAP(first_name_value);
        last_name_value := INITCAP(last_name_value);
    END;
    
    -- Determinar rol basado en metadatos o usar employee por defecto
    DECLARE
        user_role VARCHAR := 'employee';
    BEGIN
        -- Verificar si viene rol en metadatos
        IF NEW.raw_user_meta_data ->> 'role' IS NOT NULL THEN
            user_role := NEW.raw_user_meta_data ->> 'role';
        -- Si es el primer usuario, hacerlo admin
        ELSIF NOT EXISTS (SELECT 1 FROM employees WHERE organization_id = default_org_id) THEN
            user_role := 'admin';
        END IF;
        
        -- Validar que el rol sea válido
        IF user_role NOT IN ('employee', 'manager', 'hr', 'admin', 'super_admin') THEN
            user_role := 'employee';
        END IF;
    END;
    
    -- Insertar en tabla employees
    INSERT INTO employees (
        id, -- Usar mismo ID que auth.users para facilitar joins
        organization_id,
        employee_code,
        email,
        first_name,
        last_name,
        phone,
        hire_date,
        role,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        NEW.id, -- ID del usuario de auth
        default_org_id,
        employee_code_generated,
        NEW.email,
        first_name_value,
        last_name_value,
        NEW.phone,
        CURRENT_DATE, -- Fecha de contratación = fecha de registro
        user_role,
        true,
        NOW(),
        NOW()
    );
    
    -- Log para debugging
    RAISE NOTICE 'Usuario sincronizado: % (%) con rol % en organización %', 
                 NEW.email, employee_code_generated, user_role, default_org_id;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log del error pero no fallar el registro
        RAISE WARNING 'Error sincronizando usuario %: %', NEW.email, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger para ejecutar la función
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user_registration();

-- =============================================
-- FUNCIÓN PARA SINCRONIZAR USUARIOS EXISTENTES
-- =============================================

CREATE OR REPLACE FUNCTION sync_existing_auth_users()
RETURNS INTEGER AS $$
DECLARE
    user_record RECORD;
    synced_count INTEGER := 0;
BEGIN
    -- Sincronizar usuarios de auth que no están en employees
    FOR user_record IN 
        SELECT au.id, au.email, au.phone, au.raw_user_meta_data, au.created_at
        FROM auth.users au
        LEFT JOIN employees e ON au.id = e.id
        WHERE e.id IS NULL
        AND au.email IS NOT NULL
    LOOP
        -- Simular inserción para activar lógica del trigger
        PERFORM handle_new_user_registration() WHERE OLD IS NULL AND NEW = user_record;
        synced_count := synced_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Sincronizados % usuarios existentes', synced_count;
    RETURN synced_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentario para ejecutar manualmente si es necesario:
-- SELECT sync_existing_auth_users();
