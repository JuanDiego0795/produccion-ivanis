'use client'

import { useEffect, useCallback, useRef } from 'react'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'

// Intervalos de refresh
const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000 // 5 minutos
const REFRESH_BEFORE_EXPIRY_MS = 10 * 60 * 1000 // 10 minutos antes

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
    reset
  } = useAuthStore()

  const isMountedRef = useRef(true)
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null)
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Función para refrescar la sesión
  const refreshSession = useCallback(async () => {
    if (!isMountedRef.current) return

    const supabase = createClient()
    setRefreshing(true)

    try {
      const { data: { session: newSession }, error } = await supabase.auth.refreshSession()

      if (error) {
        console.warn('Session refresh error:', error.message)
        if (error.message.includes('refresh_token')) {
          reset()
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
  }, [setSession, setUser, setRefreshing, reset])

  // Configurar refresh proactivo basado en expiración del token
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

  // Inicialización y listeners de auth
  useEffect(() => {
    const supabase = createClient()
    isMountedRef.current = true

    const initializeAuth = async () => {
      try {
        // Usar getUser() - más seguro que getSession()
        const { data: { user: authUser }, error } = await supabase.auth.getUser()

        if (error) {
          console.warn('Auth error:', error.message)
          if (isMountedRef.current) {
            setLoading(false)
            setInitialized(true)
          }
          return
        }

        if (!isMountedRef.current) return

        if (authUser) {
          setUser(authUser)

          // Obtener sesión para tokens
          const { data: { session: authSession } } = await supabase.auth.getSession()
          if (authSession) {
            setSession(authSession)
            if (authSession.expires_at) {
              setupProactiveRefresh(authSession.expires_at)
            }
          }

          // Fetch profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single()

          if (profileData && isMountedRef.current) {
            setProfile(profileData)
          }
        }
      } catch (error) {
        console.warn('Auth initialization error:', error)
      } finally {
        if (isMountedRef.current) {
          setLoading(false)
          setInitialized(true)
        }
      }
    }

    initializeAuth()

    // Listener para cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, newSession: Session | null) => {
        if (!isMountedRef.current) return

        if (event === 'SIGNED_IN' && newSession?.user) {
          setUser(newSession.user)
          setSession(newSession)

          if (newSession.expires_at) {
            setupProactiveRefresh(newSession.expires_at)
          }

          // Fetch profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newSession.user.id)
            .single()

          if (profileData && isMountedRef.current) {
            setProfile(profileData)
          }
        } else if (event === 'SIGNED_OUT') {
          reset()
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
  }, [setUser, setProfile, setSession, setLoading, setInitialized, reset, setupProactiveRefresh])

  // Heartbeat: verificar sesión cada 5 minutos
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

  // Sincronizar cuando usuario vuelve a la pestaña
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        // Refrescar sesión al volver a la pestaña
        refreshSession()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user, refreshSession])

  // Sincronizar entre pestañas via storage event
  useEffect(() => {
    const handleStorageChange = async (e: StorageEvent) => {
      // Supabase usa localStorage para auth
      if (e.key?.includes('supabase.auth')) {
        // Otra pestaña cambió el estado de auth
        const supabase = createClient()
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        if (!currentUser && user) {
          // Se cerró sesión en otra pestaña
          reset()
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [user, reset])

  return <>{children}</>
}
