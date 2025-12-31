'use client'

import { useAuthStore } from '@/stores/auth-store'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Loader2, AlertTriangle } from 'lucide-react'

interface ProtectedContentProps {
  children: React.ReactNode
}

export function ProtectedContent({ children }: ProtectedContentProps) {
  const { isAuthReady, loading, authError } = useAuthStore()

  // Mostrar loading mientras auth inicializa
  if (!isAuthReady || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Banner de warning si hay error recuperable */}
      {authError?.recoverable && (
        <div className="bg-yellow-100 dark:bg-yellow-900/30 px-4 py-2 flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-200">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>{authError.message}</span>
        </div>
      )}
      <main className="pb-20">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
