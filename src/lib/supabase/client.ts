import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

// Singleton para evitar múltiples instancias
let client: SupabaseClient | null = null

export function createClient() {
  if (!client) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables')
      throw new Error('Supabase configuration not available')
    }

    client = createBrowserClient(supabaseUrl, supabaseAnonKey)
  }
  return client
}

// Invalidar cliente después de logout para obtener una instancia fresca
export function invalidateClient() {
  client = null
}

// Helper para operaciones con timeout
export async function withTimeout<T>(
  promise: Promise<T>,
  ms = 15000
): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Request timeout')), ms)
  )
  return Promise.race([promise, timeout])
}
