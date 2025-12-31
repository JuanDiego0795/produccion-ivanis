'use server'

import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types/database'

// Admin client with service role key for user management
function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL no esta configurada')
  }

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY no esta configurada en el servidor. Contacta al administrador.')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Verify the current user is an admin
async function verifyAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    throw new Error('No autorizado - Solo administradores')
  }

  return user
}

export async function getUsers() {
  await verifyAdmin()

  const adminClient = getAdminClient()

  // Get all users from auth
  const { data: authUsers, error: authError } = await adminClient.auth.admin.listUsers()

  if (authError) {
    throw new Error(authError.message)
  }

  // Get all profiles
  const { data: profiles, error: profilesError } = await adminClient
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (profilesError) {
    throw new Error(profilesError.message)
  }

  // Combine auth users with profiles
  const users = profiles?.map((profile) => {
    const authUser = authUsers.users.find((u) => u.id === profile.id)
    return {
      ...profile,
      email: authUser?.email || 'Sin email',
      lastSignIn: authUser?.last_sign_in_at || null,
      emailConfirmed: authUser?.email_confirmed_at ? true : false,
    }
  }) || []

  return users
}

export async function createUser(data: {
  email: string
  password: string
  fullName: string
  role: UserRole
}) {
  await verifyAdmin()

  const adminClient = getAdminClient()

  // Create auth user
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: {
      full_name: data.fullName,
    },
  })

  if (authError) {
    throw new Error(authError.message)
  }

  if (!authData.user) {
    throw new Error('Error al crear usuario')
  }

  // Update profile with role (trigger should have created it)
  const { error: profileError } = await adminClient
    .from('profiles')
    .update({
      full_name: data.fullName,
      role: data.role,
    })
    .eq('id', authData.user.id)

  if (profileError) {
    // Try to create profile if it doesn't exist
    const { error: insertError } = await adminClient
      .from('profiles')
      .insert({
        id: authData.user.id,
        full_name: data.fullName,
        role: data.role,
      })

    if (insertError) {
      console.error('Error creating profile:', insertError)
    }
  }

  return { success: true, userId: authData.user.id }
}

export async function updateUserRole(userId: string, role: UserRole) {
  await verifyAdmin()

  const adminClient = getAdminClient()

  const { error } = await adminClient
    .from('profiles')
    .update({ role })
    .eq('id', userId)

  if (error) {
    throw new Error(error.message)
  }

  return { success: true }
}

export async function deleteUser(userId: string) {
  const currentUser = await verifyAdmin()

  // Prevent self-deletion
  if (currentUser.id === userId) {
    throw new Error('No puedes eliminar tu propia cuenta')
  }

  const adminClient = getAdminClient()

  // Delete auth user (this will cascade to profile due to foreign key)
  const { error } = await adminClient.auth.admin.deleteUser(userId)

  if (error) {
    throw new Error(error.message)
  }

  return { success: true }
}

export async function resetUserPassword(userId: string, newPassword: string) {
  await verifyAdmin()

  const adminClient = getAdminClient()

  const { error } = await adminClient.auth.admin.updateUserById(userId, {
    password: newPassword,
  })

  if (error) {
    throw new Error(error.message)
  }

  return { success: true }
}
