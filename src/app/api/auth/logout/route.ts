import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()

    // Crear respuesta limpiando cookies
    const response = NextResponse.json({ message: 'Logout exitoso' })

    // Limpiar cookies de auth
    response.cookies.set('sb-auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })

    response.cookies.set('sb-refresh-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })

    // Limpiar cookie de actividad
    response.cookies.set('last_activity', '', {
      maxAge: 0,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Logout exception:', error)
    // Aun asi limpiar cookies
    const response = NextResponse.json({ message: 'Logout completado' })
    response.cookies.set('sb-auth-token', '', { maxAge: 0, path: '/' })
    response.cookies.set('sb-refresh-token', '', { maxAge: 0, path: '/' })
    return response
  }
}
