'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'

export function useAuth() {
  const router = useRouter()
  const { user, profile, loading, setUser, setProfile, setLoading, reset } = useAuthStore()

  useEffect(() => {
    const supabase = createClient()

    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        setUser(session.user)

        // Fetch profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profileData) {
          setProfile(profileData)
        }
      }

      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)

          // Fetch profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (profileData) {
            setProfile(profileData)
          }
        } else if (event === 'SIGNED_OUT') {
          reset()
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [setUser, setProfile, setLoading, reset])

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    reset()
    router.push('/login')
    router.refresh()
  }

  const refreshProfile = async () => {
    if (!user) return

    const supabase = createClient()
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileData) {
      setProfile(profileData)
    }
  }

  const isAdmin = profile?.role === 'admin'
  const isEmployee = profile?.role === 'employee'
  const canEdit = isAdmin || isEmployee

  return {
    user,
    profile,
    loading,
    signOut,
    refreshProfile,
    isAdmin,
    isEmployee,
    canEdit,
  }
}
