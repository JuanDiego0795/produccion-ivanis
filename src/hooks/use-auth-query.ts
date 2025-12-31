'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import type { SupabaseClient } from '@supabase/supabase-js'

interface UseAuthQueryOptions<T> {
  queryFn: (supabase: SupabaseClient) => Promise<T>
  enabled?: boolean
}

interface UseAuthQueryResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  isAuthError: boolean
  refetch: () => Promise<void>
}

export function useAuthQuery<T>({
  queryFn,
  enabled = true,
}: UseAuthQueryOptions<T>): UseAuthQueryResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthError, setIsAuthError] = useState(false)

  const { isAuthReady, user } = useAuthStore()
  const isMountedRef = useRef(true)
  const queryFnRef = useRef(queryFn)
  queryFnRef.current = queryFn

  const execute = useCallback(async () => {
    // Esperar a que auth este listo
    if (!isAuthReady) {
      return
    }

    // Sin usuario, no hacer fetch
    if (!user) {
      setLoading(false)
      setData(null)
      return
    }

    // No habilitado
    if (!enabled) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    setIsAuthError(false)

    try {
      const supabase = createClient()
      const result = await queryFnRef.current(supabase)

      if (isMountedRef.current) {
        setData(result)
      }
    } catch (err) {
      if (!isMountedRef.current) return

      console.error('[useAuthQuery] Error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'

      // Detectar errores de auth
      const isAuth = errorMessage.toLowerCase().includes('jwt') ||
        errorMessage.toLowerCase().includes('token') ||
        errorMessage.includes('401') ||
        errorMessage.includes('403')

      setIsAuthError(isAuth)
      setError(errorMessage)

      // Si es error de auth, redirigir a logout
      if (isAuth) {
        window.location.href = '/login'
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [isAuthReady, user, enabled])

  // Cleanup
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Ejecutar cuando auth este listo
  useEffect(() => {
    if (isAuthReady && user && enabled) {
      execute()
    }
  }, [isAuthReady, user, enabled, execute])

  return {
    data,
    loading: loading || !isAuthReady,
    error,
    isAuthError,
    refetch: execute
  }
}
