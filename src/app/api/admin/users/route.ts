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

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Configuracion de Supabase incompleta')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function GET() {
  try {
    // Verificar admin
    const authResult = await verifyAdmin()
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const adminClient = getAdminClient()

    // Obtener usuarios de auth
    const { data: authUsers, error: authError } = await adminClient.auth.admin.listUsers()

    if (authError) {
      console.error('[Admin API] Auth error:', authError)
      return NextResponse.json(
        { error: authError.message },
        { status: 500 }
      )
    }

    // Obtener perfiles
    const { data: profiles, error: profilesError } = await adminClient
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (profilesError) {
      console.error('[Admin API] Profiles error:', profilesError)
      return NextResponse.json(
        { error: profilesError.message },
        { status: 500 }
      )
    }

    // Combinar datos
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
    console.error('[Admin API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    )
  }
}
