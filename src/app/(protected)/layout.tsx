import { redirect } from 'next/navigation'
import { getServerAuthState } from '@/lib/supabase/server'
import { ProtectedContent } from './protected-content'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Verificar auth en servidor
  const authState = await getServerAuthState()

  // Si no hay usuario, redirigir inmediatamente
  if (!authState.user) {
    redirect('/login')
  }

  // El AuthProvider está en el root layout
  // Aquí solo verificamos y renderizamos el contenido
  return (
    <ProtectedContent>
      {children}
    </ProtectedContent>
  )
}
