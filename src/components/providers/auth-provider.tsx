'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useAuthStore } from '@/stores/auth-store'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const {
    setUser,
    setProfile,
    setLoading,
    setInitialized,
    setAuthReady,
    setAuthError,
    reset
  } = useAuthStore()

  const isMountedRef = useRef(true)
  const initializedRef = useRef(false)

  // Verificar autenticacion via API con timeout
  const checkAuth = useCallback(async () => {
    if (initializedRef.current) return
    initializedRef.current = true

    console.log('[AuthProvider] Checking authentication via API')

    // Crear controller para timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 segundos

    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!isMountedRef.current) return

      if (response.ok) {
        const data = await response.json()
        console.log('[AuthProvider] User authenticated:', data.user?.email)

        setUser(data.user)
        setProfile(data.profile)
        setAuthError(null)
      } else {
        // No autenticado - es normal para login page
        console.log('[AuthProvider] Not authenticated, status:', response.status)
        reset()
      }
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('[AuthProvider] Auth check timeout')
      } else {
        console.warn('[AuthProvider] Auth check error:', error)
      }

      if (isMountedRef.current) {
        // En caso de error, resetear para permitir login
        reset()
        setAuthError({
          code: 'network_error',
          message: 'Error de conexion',
          recoverable: true
        })
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
        setInitialized(true)
        setAuthReady(true)
      }
    }
  }, [setUser, setProfile, setLoading, setInitialized, setAuthReady, setAuthError, reset])

  // Inicializar al montar
  useEffect(() => {
    isMountedRef.current = true
    checkAuth()

    return () => {
      isMountedRef.current = false
    }
  }, [checkAuth])

  // Escuchar cambios de visibilidad para re-verificar auth
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Re-verificar auth cuando el usuario vuelve a la pestana
        initializedRef.current = false
        checkAuth()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [checkAuth])

  return <>{children}</>
}
