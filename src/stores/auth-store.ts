import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile } from '@/types/database'

// Error estructurado para auth
export interface AuthError {
  code: 'session_expired' | 'network_error' | 'profile_fetch_failed' | 'unknown'
  message: string
  recoverable: boolean
}

interface AuthState {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  initialized: boolean
  isRefreshing: boolean
  // NUEVO: Auth listo para que hooks hagan fetch
  isAuthReady: boolean
  // NUEVO: Error de auth para UI
  authError: AuthError | null

  // Setters
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  setSession: (session: Session | null) => void
  setLoading: (loading: boolean) => void
  setInitialized: (initialized: boolean) => void
  setRefreshing: (isRefreshing: boolean) => void
  setAuthReady: (isAuthReady: boolean) => void
  setAuthError: (authError: AuthError | null) => void
  reset: () => void
  hydrate: (user: User | null, profile: Profile | null, session: Session | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  session: null,
  loading: true,
  initialized: false,
  isRefreshing: false,
  isAuthReady: false,
  authError: null,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),
  setInitialized: (initialized) => set({ initialized }),
  setRefreshing: (isRefreshing) => set({ isRefreshing }),
  setAuthReady: (isAuthReady) => set({ isAuthReady }),
  setAuthError: (authError) => set({ authError }),

  reset: () => set({
    user: null,
    profile: null,
    session: null,
    loading: false,
    initialized: true,
    isRefreshing: false,
    isAuthReady: true, // Ready para login page
    authError: null
  }),

  hydrate: (user, profile, session) => set({
    user,
    profile,
    session,
    loading: false,
    initialized: true,
    isRefreshing: false,
    isAuthReady: true,
    authError: null
  }),
}))
