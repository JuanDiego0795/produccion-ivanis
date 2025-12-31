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

  // Verificar autenticacion via API
  const checkAuth = useCallback(async () => {
    if (initializedRef.current) return
    initializedRef.current = true

    console.log('[AuthProvider] Checking authentication via API')

    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      })

      if (!isMountedRef.current) return

      if (response.ok) {
        const data = await response.json()
        console.log('[AuthProvider] User authenticated:', data.user?.email)

        setUser(data.user)
        setProfile(data.profile)
        setAuthError(null)
      } else {
        // No autenticado - es normal para login page
        console.log('[AuthProvider] Not authenticated')
        reset()
      }
    } catch (error) {
      console.warn('[AuthProvider] Auth check error:', error)
      if (isMountedRef.current) {
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
