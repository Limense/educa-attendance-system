# 🧪 Plan de Testing Manual - Dashboard de Empleado

## ✅ Lista de Verificación de Funcionalidades

### 1. 🔑 **Autenticación y Acceso**
- [ ] La página redirige a login si no hay sesión activa
- [ ] Usuario autenticado puede acceder al dashboard
- [ ] Los datos del empleado se cargan correctamente

### 2. 👤 **Información del Empleado**
- [ ] Nombre completo se muestra correctamente
- [ ] Email del empleado se muestra
- [ ] Departamento se carga (si existe)
- [ ] Posición se carga (si existe)
- [ ] Foto de perfil (si existe)

### 3. ⏰ **Reloj en Tiempo Real**
- [ ] Reloj muestra hora actual
- [ ] Reloj se actualiza cada segundo
- [ ] Formato de hora es correcto
- [ ] Fecha actual se muestra

### 4. 📅 **Estado de Asistencia**
- [ ] Carga asistencia del día actual
- [ ] Muestra estado correcto (sin check-in, con check-in, completo)
- [ ] Actualiza estado después de acciones

### 5. ⬇️ **Funcionalidad Check-In**
- [ ] Botón Check-In está disponible cuando no hay registro
- [ ] Check-In registra entrada correctamente
- [ ] Hora de entrada se guarda correctamente
- [ ] Estado cambia después del check-in
- [ ] Botón se deshabilita durante el proceso
- [ ] Mensaje de confirmación aparece

### 6. ⬆️ **Funcionalidad Check-Out**
- [ ] Botón Check-Out aparece después del check-in
- [ ] Check-Out registra salida correctamente
- [ ] Hora de salida se guarda correctamente
- [ ] Estado final es correcto
- [ ] Botón se deshabilita durante el proceso
- [ ] Mensaje de confirmación aparece

### 7. 🔔 **Sistema de Notificaciones**
- [ ] Mensajes de éxito aparecen correctamente
- [ ] Mensajes de error aparecen cuando hay fallos
- [ ] Mensajes desaparecen automáticamente
- [ ] Estilo de mensajes es correcto

### 8. 🎨 **Interfaz de Usuario**
- [ ] Layout responsive funciona
- [ ] Colores y estilos son consistentes
- [ ] Botones tienen estados visuales correctos
- [ ] Loading states funcionan
- [ ] Animaciones son suaves

### 9. 🚪 **Logout**
- [ ] Botón de logout está presente
- [ ] Logout limpia la sesión
- [ ] Redirige a login después de logout
- [ ] localStorage se limpia

### 10. 🔄 **Casos Edge**
- [ ] Manejo correcto de errores de red
- [ ] Comportamiento cuando ya hay check-in del día
- [ ] Comportamiento cuando hay check-out previo
- [ ] Validation de datos requeridos

## 🚀 **Pasos para Testing Manual**

### Paso 1: Preparación
1. Abrir http://localhost:3000/dashboard/employee
2. Verificar que redirige a login si no hay sesión
3. Hacer login con credenciales válidas

### Paso 2: Testing Básico
1. Verificar que datos del empleado cargan
2. Observar reloj por 10 segundos (debe actualizar)
3. Verificar estado inicial de asistencia

### Paso 3: Testing Check-In
1. Hacer clic en botón Check-In
2. Verificar que se registra correctamente
3. Verificar cambio de estado
4. Verificar mensaje de confirmación

### Paso 4: Testing Check-Out
1. Hacer clic en botón Check-Out
2. Verificar que se registra correctamente
3. Verificar estado final
4. Verificar mensaje de confirmación

### Paso 5: Testing Edge Cases
1. Intentar hacer check-in cuando ya existe
2. Probar con errores de red (desconectar internet)
3. Verificar comportamiento en diferentes tamaños de pantalla

### Paso 6: Testing Logout
1. Hacer clic en logout
2. Verificar redirección
3. Intentar acceder al dashboard (debe redirigir a login)

## 📊 **Criterios de Éxito**
- ✅ 90%+ de funcionalidades funcionan correctamente
- ✅ Sin errores de consola críticos
- ✅ UI responsive en móvil y desktop
- ✅ Tiempos de respuesta aceptables
- ✅ Datos se persisten correctamente en base de datos
