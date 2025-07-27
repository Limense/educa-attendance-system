-- =============================================
-- CONFIGURACIÓN DE AUTENTICACIÓN
-- Descripción: Usuarios de prueba para demostración
-- =============================================

-- Nota: Estos usuarios deben crearse desde la interfaz de Supabase Auth
-- o usando el cliente de Supabase en código

-- Usuarios Demo para Testing:

-- 1. ADMINISTRADOR
-- Email: admin@educa-demo.com
-- Password: admin123
-- Debe estar vinculado al empleado con role 'admin'

-- 2. EMPLEADO 1  
-- Email: empleado1@educa-demo.com
-- Password: empleado123
-- Debe estar vinculado al empleado con role 'employee'

-- 3. EMPLEADO 2
-- Email: empleado2@educa-demo.com  
-- Password: empleado123
-- Debe estar vinculado al empleado con role 'employee'

-- IMPORTANTE: 
-- Los emails de los usuarios en auth.users deben coincidir exactamente 
-- con los emails en la tabla employees para que funcione el login.

-- Para crear estos usuarios, usar el cliente de Supabase:
-- await supabase.auth.admin.createUser({
--   email: 'admin@educa-demo.com',
--   password: 'admin123',
--   email_confirm: true
-- });
