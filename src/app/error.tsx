'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to console in development
    console.error('App error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-4 max-w-md">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-semibold">Algo salio mal</h2>
        <p className="text-muted-foreground">
          Hubo un error al cargar la pagina. Por favor intenta de nuevo.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset}>
            Intentar de nuevo
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/login'}>
            Ir al login
          </Button>
        </div>
      </div>
    </div>
  )
}
