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

## 📁 Estructura del Proyecto

```
src/
├── app/                    # App Router de Next.js
│   ├── api/               # API Routes
│   ├── attendance/        # Página de asistencias
│   ├── auth/             # Páginas de autenticación
│   ├── dashboard/        # Dashboards (admin/employee)
│   ├── employees/        # Gestión de empleados
│   └── page.tsx          # Homepage con redirección inteligente
├── components/           # Componentes reutilizables
│   ├── admin/           # Componentes del panel admin
│   ├── employees/       # Componentes de empleados
│   └── ui/              # Componentes UI base
├── hooks/               # Custom React hooks
├── lib/                 # Utilidades y configuración
│   └── supabase/       # Cliente de Supabase
├── services/           # Lógica de negocio
├── types/              # Definiciones TypeScript
└── utils/              # Funciones de utilidad
```

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd educa-attendance-system
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Copia `.env.local.example` a `.env.local` y configura:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Configurar base de datos
Ejecuta los scripts SQL en Supabase:
1. `database/supabase_init_complete.sql` - Configuración inicial completa
2. `database/auth_sync_trigger.sql` - Sincronización de autenticación

### 5. Ejecutar en desarrollo
```bash
npm run dev
```

El proyecto estará disponible en `http://localhost:3000`

## 👤 Usuarios de Prueba

### Administrador
- **Email**: `admin@educademo.com`
- **Password**: `admin123`
- **Rol**: `admin`

### Empleado
- **Email**: `juan.perez@educademo.com`
- **Password**: `employee123`
- **Rol**: `employee`

## 📱 Páginas Principales

- **`/`** - Homepage con redirección según autenticación
- **`/auth/login`** - Página de inicio de sesión
- **`/dashboard/admin`** - Panel administrativo completo
- **`/dashboard/employee`** - Panel del empleado
- **`/attendance`** - Sistema de control de asistencias
- **`/employees`** - Gestión de empleados (solo admin/manager)

## 🔒 Seguridad

- **Row Level Security (RLS)** habilitado en todas las tablas
- **Multi-tenancy** con aislamiento por organización
- **Autenticación JWT** con Supabase Auth
- **Validación de roles** en frontend y backend
- **Protección CSRF** y validación de entrada

## 🗄️ Base de Datos

### Tablas Principales
- **organizations**: Organizaciones/instituciones
- **employees**: Datos de empleados con roles
- **attendances**: Registros de asistencia
- **departments**: Departamentos de la organización
- **positions**: Posiciones/cargos
- **attendance_types**: Tipos de asistencia
- **system_settings**: Configuración del sistema

### Políticas RLS
Todas las tablas tienen políticas RLS configuradas para:
- Aislamiento por organización
- Control de acceso basado en roles
- Protección de datos sensibles

## 🚀 Despliegue

### Vercel (Recomendado)
```bash
npm run build
vercel deploy
```

### Variables de entorno de producción
Asegúrate de configurar todas las variables de entorno en tu plataforma de despliegue.

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

Para soporte técnico o preguntas:
- Abrir un Issue en GitHub
- Contactar al equipo de desarrollo

---

**Desarrollado con ❤️ para Educa-Crea**
