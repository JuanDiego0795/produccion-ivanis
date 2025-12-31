'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, KeyRound, CheckCircle } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      setHasSession(!!session)
    }
    checkSession()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error('Las contrasenas no coinciden')
      return
    }

    if (password.length < 6) {
      toast.error('La contrasena debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        password,
      })

      if (error) {
        toast.error(error.message)
        return
      }

      setSuccess(true)
      toast.success('Contrasena actualizada correctamente')

      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch {
      toast.error('Error al actualizar la contrasena. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (!hasSession) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Enlace Invalido</CardTitle>
          <CardDescription>
            El enlace de recuperacion ha expirado o es invalido
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Por favor, solicita un nuevo enlace de recuperacion.
          </p>
        </CardContent>
        <CardFooter>
          <Link href="/forgot-password" className="w-full">
            <Button className="w-full">Solicitar Nuevo Enlace</Button>
          </Link>
        </CardFooter>
      </Card>
    )
  }

  if (success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            Contrasena Actualizada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Tu contrasena ha sido actualizada correctamente. Seras redirigido
            al dashboard en unos segundos...
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5" />
          Nueva Contrasena
        </CardTitle>
        <CardDescription>
          Ingresa tu nueva contrasena
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nueva Contrasena</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              minLength={6}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Contrasena</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              minLength={6}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Actualizando...
              </>
            ) : (
              'Actualizar Contrasena'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
