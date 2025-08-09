# 🏢 Educa Attendance System

Sistema completo de gestión de asistencias para instituciones educativas desarrollado con Next.js 15 y Supabase.

## ✨ Características Principales

### 🔐 Autenticación y Autorización
- Sistema de autenticación completo con Supabase Auth
- Roles diferenciados: `admin`, `super_admin`, `manager`, `hr`, `employee`
- Row Level Security (RLS) implementado
- Multi-tenancy con organizaciones

### 📊 Gestión de Asistencias
- Check-in/Check-out con timestamps automáticos
- Cálculo automático de horas trabajadas
- Historial completo de asistencias
- Estados de asistencia: `present`, `absent`, `late`, `half_day`, `sick_leave`

### 👥 Gestión de Empleados
- CRUD completo de empleados
- Gestión de departamentos y posiciones
- Control de acceso basado en roles
- Estados de empleados (activo/inactivo)

### 🖥️ Dashboards Diferenciados
- **Dashboard Admin**: Gestión completa del sistema
- **Dashboard Employee**: Vista personal de asistencias

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 15.4.4 con React 19
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Styling**: Tailwind CSS
- **TypeScript**: Tipado estricto en toda la aplicación
- **Build Tool**: Turbopack para desarrollo rápido

## 🔒 Seguridad

- **Row Level Security (RLS)** habilitado en todas las tablas
- **Multi-tenancy** con aislamiento por organización
- **Autenticación JWT** con Supabase Auth
- **Validación de roles** en frontend y backend
- **Protección CSRF** y validación de entrada

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

Para soporte técnico o preguntas:
- Abrir un Issue en GitHub
- Contactar al equipo de desarrollo

---

**Desarrollado con ❤️ para Educa-Crea**
