import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Forzar renderizado dinamico - esta pagina usa cookies
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      console.warn('Auth check error:', error.message)
      redirect('/login')
    }

    if (user) {
      redirect('/dashboard')
    } else {
      redirect('/login')
    }
  } catch (error) {
    console.error('Root page error:', error)
    // En caso de error, redirigir a login
    redirect('/login')
  }
}
