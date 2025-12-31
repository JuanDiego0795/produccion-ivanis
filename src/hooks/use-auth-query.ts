'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import type { SupabaseClient } from '@supabase/supabase-js'

interface UseAuthQueryOptions<T> {
  queryFn: (supabase: SupabaseClient) => Promise<T>
  enabled?: boolean
  retryOnAuthError?: boolean
}

interface UseAuthQueryResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  isAuthError: boolean
  refetch: () => Promise<void>
}

// Detectar si un error es de autenticacion
function isAuthErrorCode(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase()
    return (
      msg.includes('jwt') ||
      msg.includes('token') ||
      msg.includes('401') ||
      msg.includes('403') ||
      msg.includes('not authenticated') ||
      msg.includes('session') ||
      msg.includes('refresh_token') ||
      msg.includes('invalid claim')
    )
  }
  return false
}

export function useAuthQuery<T>({
  queryFn,
  enabled = true,
  retryOnAuthError = true
}: UseAuthQueryOptions<T>): UseAuthQueryResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthError, setIsAuthError] = useState(false)

  const { isAuthReady, isRefreshing, user, reset } = useAuthStore()
  const isMountedRef = useRef(true)
  const retriesRef = useRef(0)
  const lastFetchRef = useRef<number>(0)

  // Usar ref para queryFn para evitar problemas de dependencias
  const queryFnRef = useRef(queryFn)
  queryFnRef.current = queryFn

  const execute = useCallback(async () => {
    // Gate 1: Auth debe estar listo
    if (!isAuthReady) {
      console.log('[useAuthQuery] Waiting for auth to be ready')
      return
    }

    // Gate 2: No fetch durante token refresh
    if (isRefreshing) {
      console.log('[useAuthQuery] Token is refreshing, waiting...')
      return
    }

    // Gate 3: Debe haber usuario para datos protegidos
    if (!user) {
      console.log('[useAuthQuery] No user, skipping fetch')
      setLoading(false)
      setData(null)
      return
    }

    // Gate 4: Debe estar habilitado
    if (!enabled) {
      setLoading(false)
      return
    }

    // Prevenir fetches duplicados muy rapidos
    const now = Date.now()
    if (now - lastFetchRef.current < 100) {
      return
    }
    lastFetchRef.current = now

    setLoading(true)
    setError(null)
    setIsAuthError(false)

    try {
      const supabase = createClient()
      const result = await queryFnRef.current(supabase)

      if (isMountedRef.current) {
        setData(result)
        retriesRef.current = 0
      }
    } catch (err) {
      if (!isMountedRef.current) return

      console.error('[useAuthQuery] Query error:', err)
      const authErr = isAuthErrorCode(err)
      setIsAuthError(authErr)

      if (authErr && retryOnAuthError) {
        if (retriesRef.current < 1) {
          // Reintentar una vez (el token podria estar refrescandose)
          retriesRef.current++
          console.log('[useAuthQuery] Auth error, retrying in 1.5s...')
          setTimeout(() => {
            if (isMountedRef.current) {
              execute()
            }
          }, 1500)
          return
        }

        // Error de auth despues de reintento - hacer logout
        console.warn('[useAuthQuery] Auth error after retry, logging out')
        reset()
        return
      }

      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [isAuthReady, isRefreshing, user, enabled, retryOnAuthError, reset])

  // Cleanup
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Ejecutar cuando auth este listo
  useEffect(() => {
    if (isAuthReady && !isRefreshing && user && enabled) {
      execute()
    }
  }, [isAuthReady, isRefreshing, user, enabled, execute])

  // Re-ejecutar cuando token refresh termine
  useEffect(() => {
    if (!isRefreshing && isAuthReady && user && enabled) {
      // Token refresh termino, re-fetch
      retriesRef.current = 0 // Reset retries
    }
  }, [isRefreshing, isAuthReady, user, enabled])

  return {
    data,
    loading: loading || !isAuthReady || isRefreshing,
    error,
    isAuthError,
    refetch: execute
  }
}

// Hook para mutaciones con auth
export function useAuthMutation() {
  const { user, isAuthReady, reset } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = useCallback(async <T>(
    mutationFn: (supabase: SupabaseClient, userId: string) => Promise<T>
  ): Promise<T | null> => {
    if (!isAuthReady || !user) {
      setError('Usuario no autenticado')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const result = await mutationFn(supabase, user.id)
      return result
    } catch (err) {
      if (isAuthErrorCode(err)) {
        reset()
        return null
      }
      setError(err instanceof Error ? err.message : 'Error desconocido')
      throw err
    } finally {
      setLoading(false)
    }
  }, [isAuthReady, user, reset])

  return { mutate, loading, error }
}
