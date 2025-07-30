import { NextRequest } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

// API Route: /api/employee/create
// Solo para uso backend seguro
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, firstName, lastName, role, phone, departmentId, positionId, hireDate, organizationId } = body

    // Validación básica
    if (!email || !password || !firstName || !lastName || !role || !hireDate || !organizationId) {
      return Response.json({ error: 'Faltan campos obligatorios: email, password, firstName, lastName, role, hireDate, organizationId' }, { status: 400 })
    }

    // Construir metadatos para el trigger
    const user_metadata = {
      full_name: `${firstName} ${lastName}`,
      first_name: firstName,
      last_name: lastName,
      role,
      phone,
      department_id: departmentId,
      position_id: positionId,
      hire_date: hireDate,
      organization_id: organizationId
    }

    const supabase = createAdminSupabaseClient()

    // 1. Crear usuario en Supabase Auth
    const { data: user, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata,
    })

    if (authError || !user?.user) {
      console.error('❌ Supabase Auth Error:', authError)
      return Response.json({ error: authError?.message || 'Error creando usuario', details: authError }, { status: 400 })
    }

    // 2. Insertar datos en employees (si trigger no lo hace automáticamente)
    // Si tienes trigger, puedes omitir este paso
    // const { error: dbError } = await supabase.from('employees').insert({
    //   id: user.user.id,
    //   email,
    //   ...employeeData,
    // })
    // if (dbError) {
    //   console.error('❌ DB Error:', dbError)
    //   return Response.json({ error: dbError.message, details: dbError }, { status: 400 })
    // }

    return Response.json({ user: user.user }, { status: 201 })
  } catch (error) {
    console.error('❌ API Route Critical Error:', error)
    return Response.json({ error: 'Error crítico en API', details: String(error) }, { status: 500 })
  }
}
