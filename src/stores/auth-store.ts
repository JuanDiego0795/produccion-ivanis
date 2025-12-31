import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile } from '@/types/database'

interface AuthState {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  initialized: boolean
  isRefreshing: boolean
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  setSession: (session: Session | null) => void
  setLoading: (loading: boolean) => void
  setInitialized: (initialized: boolean) => void
  setRefreshing: (isRefreshing: boolean) => void
  reset: () => void
  // Inicializar desde servidor (hidratación SSR)
  hydrate: (user: User | null, profile: Profile | null, session: Session | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  session: null,
  loading: true,
  initialized: false,
  isRefreshing: false,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),
  setInitialized: (initialized) => set({ initialized }),
  setRefreshing: (isRefreshing) => set({ isRefreshing }),
  reset: () => set({
    user: null,
    profile: null,
    session: null,
    loading: false,
    initialized: true,
    isRefreshing: false
  }),
  hydrate: (user, profile, session) => set({
    user,
    profile,
    session,
    loading: false,
    initialized: true,
    isRefreshing: false
  }),
}))
