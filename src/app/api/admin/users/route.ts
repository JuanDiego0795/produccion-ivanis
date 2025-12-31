import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

// Verificar que el usuario actual es admin
async function verifyAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado', status: 401 }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { error: 'No autorizado - Solo administradores', status: 403 }
  }

  return { user }
}

// Obtener cliente admin con service role
function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL no disponible en runtime')
  }

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY no disponible en runtime')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// GET - Listar usuarios
export async function GET() {
  try {
    const authResult = await verifyAdmin()
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const adminClient = getAdminClient()

    const { data: authUsers, error: authError } = await adminClient.auth.admin.listUsers()

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    const { data: profiles, error: profilesError } = await adminClient
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (profilesError) {
      return NextResponse.json({ error: profilesError.message }, { status: 500 })
    }

    const users = profiles?.map((profile) => {
      const authUser = authUsers.users.find((u) => u.id === profile.id)
      return {
        ...profile,
        email: authUser?.email || 'Sin email',
        lastSignIn: authUser?.last_sign_in_at || null,
        emailConfirmed: !!authUser?.email_confirmed_at,
      }
    }) || []

    return NextResponse.json({ users })
  } catch (error) {
    console.error('[Admin API] GET Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    )
  }
}

// POST - Crear usuario
export async function POST(request: Request) {
  try {
    const authResult = await verifyAdmin()
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const { email, password, fullName, role } = await request.json()

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Email, password y nombre son requeridos' },
        { status: 400 }
      )
    }

    const adminClient = getAdminClient()

    // Crear usuario en auth
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 })
    }

    // Actualizar perfil con rol
    const { error: profileError } = await adminClient
      .from('profiles')
      .update({ full_name: fullName, role: role || 'employee' })
      .eq('id', authData.user.id)

    if (profileError) {
      // Si falla update, intentar insert
      await adminClient.from('profiles').insert({
        id: authData.user.id,
        full_name: fullName,
        role: role || 'employee',
      })
    }

    return NextResponse.json({ success: true, userId: authData.user.id })
  } catch (error) {
    console.error('[Admin API] POST Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    )
  }
}

// PATCH - Actualizar rol de usuario
export async function PATCH(request: Request) {
  try {
    const authResult = await verifyAdmin()
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const { userId, role } = await request.json()

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'userId y role son requeridos' },
        { status: 400 }
      )
    }

    const adminClient = getAdminClient()

    const { error } = await adminClient
      .from('profiles')
      .update({ role })
      .eq('id', userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Admin API] PATCH Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar usuario
export async function DELETE(request: Request) {
  try {
    const authResult = await verifyAdmin()
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId es requerido' }, { status: 400 })
    }

    // Prevenir auto-eliminacion
    if (authResult.user.id === userId) {
      return NextResponse.json(
        { error: 'No puedes eliminar tu propia cuenta' },
        { status: 400 }
      )
    }

    const adminClient = getAdminClient()

    const { error } = await adminClient.auth.admin.deleteUser(userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Admin API] DELETE Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    )
  }
}
