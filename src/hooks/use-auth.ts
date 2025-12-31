'use client'

import { useRouter } from 'next/navigation'
import { createClient, invalidateClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'

export function useAuth() {
  const router = useRouter()
  const {
    user,
    profile,
    session,
    loading,
    initialized,
    isRefreshing,
    isAuthReady,
    authError,
    setProfile,
    setAuthError,
    reset
  } = useAuthStore()

  const signOut = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch (error) {
      console.warn('Error signing out:', error)
    } finally {
      // Siempre limpiar estado, incluso si hay error
      invalidateClient()

      // Limpiar cookie de actividad
      if (typeof document !== 'undefined') {
        document.cookie = 'last_activity=; Max-Age=0; path=/'
      }

      reset()
      router.push('/login')
    }
  }

  const refreshProfile = async () => {
    if (!user) return

    try {
      const supabase = createClient()
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        setAuthError({
          code: 'profile_fetch_failed',
          message: 'No se pudo actualizar el perfil',
          recoverable: true
        })
        return
      }

      if (profileData) {
        setProfile(profileData)
        setAuthError(null)
      }
    } catch (error) {
      console.error('Error refreshing profile:', error)
    }
  }

  const clearAuthError = () => {
    setAuthError(null)
  }

  const isAdmin = profile?.role === 'admin'
  const isEmployee = profile?.role === 'employee'
  const canEdit = isAdmin || isEmployee

  return {
    // Estado
    user,
    profile,
    session,
    loading,
    initialized,
    isRefreshing,
    isAuthReady,
    authError,

    // Acciones
    signOut,
    refreshProfile,
    clearAuthError,

    // Helpers de rol
    isAdmin,
    isEmployee,
    canEdit,
  }
}
