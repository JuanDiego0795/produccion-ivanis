import { ProtectedContent } from './protected-content'

// La autenticación se verifica en el middleware
// Este layout solo renderiza el contenido protegido
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedContent>
      {children}
    </ProtectedContent>
  )
}
