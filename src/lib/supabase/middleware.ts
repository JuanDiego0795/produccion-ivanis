import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Timeout de inactividad: 60 minutos
const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Verificar auth con timeout usando getUser() (más seguro que getSession)
  let user = null
  try {
    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 5000)
    )
    const authPromise = supabase.auth.getUser().then(res => res.data.user)
    user = await Promise.race([authPromise, timeoutPromise])
  } catch (error) {
    console.warn('Middleware auth check failed:', error)
  }

  // Rutas públicas
  const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password']
  const isPublicPath = publicPaths.some(path =>
    request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(path)
  )

  // Si es ruta pública, permitir acceso
  if (isPublicPath) {
    // Pero si está autenticado, redirigir al dashboard
    if (user) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // Rutas protegidas - redirigir a login si no autenticado
  const protectedPaths = ['/dashboard', '/pigs', '/finances', '/calendar', '/profile', '/admin', '/vaccinations', '/reports']
  const isProtectedPath = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Verificar timeout de inactividad para usuarios autenticados
  if (user && isProtectedPath) {
    const lastActivity = request.cookies.get('last_activity')?.value

    if (lastActivity) {
      const elapsed = Date.now() - parseInt(lastActivity, 10)

      if (elapsed > INACTIVITY_TIMEOUT_MS) {
        // Sesión expirada por inactividad
        const url = request.nextUrl.clone()
        url.pathname = '/login'

        // Marcar cookie para mostrar mensaje en login
        const response = NextResponse.redirect(url)
        response.cookies.set('session_expired', 'inactivity', {
          maxAge: 60,
          httpOnly: false
        })
        // Limpiar cookie de actividad
        response.cookies.delete('last_activity')

        return response
      }
    }

    // Actualizar timestamp de última actividad
    supabaseResponse.cookies.set('last_activity', Date.now().toString(), {
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: INACTIVITY_TIMEOUT_MS / 1000,
    })
  }

  return supabaseResponse
}
