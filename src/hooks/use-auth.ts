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
    setProfile,
    reset
  } = useAuthStore()

  const signOut = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()

      // Invalidar cliente para obtener instancia fresca
      invalidateClient()

      // Limpiar cookie de actividad
      document.cookie = 'last_activity=; Max-Age=0; path=/'

      reset()
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Error signing out:', error)
      // Force reset even on error
      invalidateClient()
      reset()
      router.push('/login')
    }
  }

  const refreshProfile = async () => {
    if (!user) return

    try {
      const supabase = createClient()
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
      }
    } catch (error) {
      console.error('Error refreshing profile:', error)
    }
  }

  const isAdmin = profile?.role === 'admin'
  const isEmployee = profile?.role === 'employee'
  const canEdit = isAdmin || isEmployee

  return {
    user,
    profile,
    session,
    loading,
    initialized,
    isRefreshing,
    signOut,
    refreshProfile,
    isAdmin,
    isEmployee,
    canEdit,
  }
}
