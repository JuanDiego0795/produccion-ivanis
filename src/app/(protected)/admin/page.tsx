'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Users, RefreshCw } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

interface User {
  id: string
  full_name: string
  role: string
  email: string
}

export default function AdminPage() {
  const router = useRouter()
  const { isAdmin, loading: authLoading } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)

    try {
      // Usar API route en vez de server action
      const response = await fetch('/api/admin/users')

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al cargar usuarios')
      }

      const data = await response.json()
      setUsers(data.users || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/dashboard')
      return
    }
    if (!authLoading && isAdmin) {
      fetchUsers()
    }
  }, [authLoading, isAdmin, router])

  if (authLoading) {
    return (
      <>
        <Header title="Administracion" />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <>
      <Header title="Administracion" />

      <div className="p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Usuarios ({users.length})</h2>
          </div>
          <Button variant="outline" size="icon" onClick={fetchUsers} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {error && (
          <Card className="border-destructive">
            <CardContent className="p-4 text-destructive">
              Error: {error}
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <Card key={user.id}>
                <CardContent className="p-4">
                  <p className="font-medium">{user.full_name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground">Rol: {user.role}</p>
                </CardContent>
              </Card>
            ))}
            {users.length === 0 && !error && (
              <p className="text-center text-muted-foreground">No hay usuarios</p>
            )}
          </div>
        )}
      </div>
    </>
  )
}
