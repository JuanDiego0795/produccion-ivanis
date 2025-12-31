import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  )
}

// Tipo para el estado de auth del servidor
export interface ServerAuthState {
  user: User | null
  profile: Profile | null
  session: Session | null
}

// Obtiene el estado completo de auth para hidratar el cliente
export async function getServerAuthState(): Promise<ServerAuthState> {
  try {
    const supabase = await createClient()

    // Usar getUser() en vez de getSession() - más seguro
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return { user: null, profile: null, session: null }
    }

    // Cargar perfil del usuario (con manejo de errores)
    let profile = null
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      profile = profileData
    } catch {
      console.warn('Failed to fetch profile for user:', user.id)
    }

    // Obtener sesión con tokens
    let session = null
    try {
      const { data: { session: sessionData } } = await supabase.auth.getSession()
      session = sessionData
    } catch {
      console.warn('Failed to fetch session')
    }

    return { user, profile, session }
  } catch (error) {
    console.error('getServerAuthState error:', error)
    return { user: null, profile: null, session: null }
  }
}
