'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function ProtectedError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Protected route error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-4 max-w-md">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-semibold">Error en la pagina</h2>
        <p className="text-muted-foreground">
          No se pudo cargar el contenido. Esto puede deberse a un problema de conexion.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset}>
            Intentar de nuevo
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
            Ir al dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
