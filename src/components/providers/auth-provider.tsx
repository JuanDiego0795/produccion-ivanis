'use client'

import { useEffect, useCallback, useRef } from 'react'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'

// Configuracion de intervalos
const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000 // 5 minutos
const REFRESH_BEFORE_EXPIRY_MS = 10 * 60 * 1000 // 10 minutos antes
const PROFILE_RETRY_DELAY_MS = 2000 // 2 segundos entre reintentos
const MAX_PROFILE_RETRIES = 2

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const {
    user,
    setUser,
    setProfile,
    setSession,
    setLoading,
    setInitialized,
    setRefreshing,
    setAuthReady,
    setAuthError,
    reset
  } = useAuthStore()

  const isMountedRef = useRef(true)
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null)
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null)
  // Referencia al cliente para evitar crear nuevas instancias
  const supabaseRef = useRef(createClient())

  // Fetch profile con reintentos
  const fetchProfile = useCallback(async (userId: string, retries = 0): Promise<boolean> => {
    try {
      const { data: profileData, error } = await supabaseRef.current
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        if (retries < MAX_PROFILE_RETRIES) {
          await new Promise(r => setTimeout(r, PROFILE_RETRY_DELAY_MS))
          return fetchProfile(userId, retries + 1)
        }

        // Profile fetch fallo despues de reintentos
        console.warn('Profile fetch failed after retries:', error.message)
        if (isMountedRef.current) {
          setAuthError({
            code: 'profile_fetch_failed',
            message: 'No se pudo cargar el perfil',
            recoverable: true
          })
        }
        return false
      }

      if (profileData && isMountedRef.current) {
        setProfile(profileData)
        setAuthError(null)
      }
      return true
    } catch (error) {
      console.warn('Profile fetch exception:', error)
      return false
    }
  }, [setProfile, setAuthError])

  // Funcion para refrescar la sesion
  const refreshSession = useCallback(async () => {
    if (!isMountedRef.current) return

    setRefreshing(true)

    try {
      const { data: { session: newSession }, error } = await supabaseRef.current.auth.refreshSession()

      if (error) {
        console.warn('Session refresh error:', error.message)
        if (error.message.includes('refresh_token')) {
          reset()
          setAuthReady(true)
        }
        return
      }

      if (newSession && isMountedRef.current) {
        setSession(newSession)
        setUser(newSession.user)
      }
    } catch (error) {
      console.warn('Session refresh failed:', error)
    } finally {
      if (isMountedRef.current) {
        setRefreshing(false)
      }
    }
  }, [setSession, setUser, setRefreshing, setAuthReady, reset])

  // Configurar refresh proactivo basado en expiracion del token
  const setupProactiveRefresh = useCallback((expiresAt: number) => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
    }

    const expiresAtMs = expiresAt * 1000
    const refreshAt = expiresAtMs - REFRESH_BEFORE_EXPIRY_MS
    const delay = refreshAt - Date.now()

    if (delay > 0) {
      refreshTimerRef.current = setTimeout(() => {
        refreshSession()
      }, delay)
    }
  }, [refreshSession])

  // Inicializacion y listeners de auth
  useEffect(() => {
    isMountedRef.current = true

    const initializeAuth = async () => {
      try {
        // Usar getUser() - mas seguro que getSession()
        const { data: { user: authUser }, error } = await supabaseRef.current.auth.getUser()

        if (error) {
          console.warn('Auth error:', error.message)
          if (isMountedRef.current) {
            setLoading(false)
            setInitialized(true)
            setAuthReady(true) // Ready para login page
          }
          return
        }

        if (!isMountedRef.current) return

        if (authUser) {
          setUser(authUser)

          // Obtener sesion para tokens
          const { data: { session: authSession } } = await supabaseRef.current.auth.getSession()
          if (authSession) {
            setSession(authSession)
            if (authSession.expires_at) {
              setupProactiveRefresh(authSession.expires_at)
            }
          }

          // Fetch profile con reintentos
          await fetchProfile(authUser.id)

          // IMPORTANTE: Marcar auth ready incluso si profile fallo
          if (isMountedRef.current) {
            setAuthReady(true)
          }
        } else {
          // No hay usuario - ready para login page
          if (isMountedRef.current) {
            setAuthReady(true)
          }
        }
      } catch (error) {
        console.warn('Auth initialization error:', error)
        if (isMountedRef.current) {
          setAuthError({
            code: 'unknown',
            message: 'Error de inicializacion',
            recoverable: true
          })
          setAuthReady(true) // Ready para que app pueda recuperarse
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false)
          setInitialized(true)
        }
      }
    }

    initializeAuth()

    // Listener para cambios de auth
    const { data: { subscription } } = supabaseRef.current.auth.onAuthStateChange(
      async (event: AuthChangeEvent, newSession: Session | null) => {
        if (!isMountedRef.current) return

        if (event === 'SIGNED_IN' && newSession?.user) {
          setUser(newSession.user)
          setSession(newSession)
          setAuthReady(false) // Temporalmente no ready mientras carga profile

          if (newSession.expires_at) {
            setupProactiveRefresh(newSession.expires_at)
          }

          // Fetch profile
          await fetchProfile(newSession.user.id)

          if (isMountedRef.current) {
            setAuthReady(true)
          }
        } else if (event === 'SIGNED_OUT') {
          reset()
          setAuthReady(true) // Ready para login
          if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current)
          }
        } else if (event === 'TOKEN_REFRESHED' && newSession) {
          setSession(newSession)
          if (newSession.expires_at) {
            setupProactiveRefresh(newSession.expires_at)
          }
        }

        setLoading(false)
      }
    )

    return () => {
      isMountedRef.current = false
      subscription.unsubscribe()
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
      }
    }
  }, [setUser, setProfile, setSession, setLoading, setInitialized, setAuthReady, setAuthError, reset, setupProactiveRefresh, fetchProfile])

  // Heartbeat: verificar sesion cada 5 minutos
  useEffect(() => {
    if (!user) {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current)
        heartbeatRef.current = null
      }
      return
    }

    heartbeatRef.current = setInterval(() => {
      refreshSession()
    }, HEARTBEAT_INTERVAL_MS)

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current)
      }
    }
  }, [user, refreshSession])

  // Sincronizar cuando usuario vuelve a la pestana
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        refreshSession()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user, refreshSession])

  // Sincronizar entre pestanas via storage event (optimizado)
  useEffect(() => {
    const handleStorageChange = async (e: StorageEvent) => {
      if (e.key?.includes('supabase.auth')) {
        // Usa el cliente existente (no crea nuevo)
        const { data: { user: currentUser } } = await supabaseRef.current.auth.getUser()
        if (!currentUser && user) {
          reset()
          setAuthReady(true)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [user, reset, setAuthReady])

  return <>{children}</>
}
