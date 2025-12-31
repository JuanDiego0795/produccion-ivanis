'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [initialized, setInitialized] = useState(false)
  const { setUser, setProfile, setLoading, reset } = useAuthStore()

  useEffect(() => {
    const supabase = createClient()

    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        setUser(session.user)

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
      setInitialized(true)
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)

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

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    )
  }

  return <>{children}</>
}
