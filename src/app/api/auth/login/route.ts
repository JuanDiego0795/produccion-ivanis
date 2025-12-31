import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Cookie config
const COOKIE_NAME = 'sb-auth-token'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 dias

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y password son requeridos' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.warn('Login error:', error.message)
      return NextResponse.json(
        { error: 'Credenciales incorrectas' },
        { status: 401 }
      )
    }

    if (!data.session) {
      return NextResponse.json(
        { error: 'No se pudo crear la sesion' },
        { status: 500 }
      )
    }

    // Crear respuesta con cookie httpOnly
    const response = NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      message: 'Login exitoso',
    })

    // Setear cookie httpOnly con el access_token
    response.cookies.set(COOKIE_NAME, data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    })

    // Tambien guardar refresh token
    if (data.session.refresh_token) {
      response.cookies.set('sb-refresh-token', data.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: COOKIE_MAX_AGE,
        path: '/',
      })
    }

    return response
  } catch (error) {
    console.error('Login exception:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
