'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, LogIn } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Credenciales incorrectas. Verifica tu email y contrasena.')
        } else {
          toast.error(error.message)
        }
        return
      }

      toast.success('Bienvenido!')
      router.push('/dashboard')
      router.refresh()
    } catch {
      toast.error('Error al iniciar sesion. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LogIn className="h-5 w-5" />
          Iniciar Sesion
        </CardTitle>
        <CardDescription>
          Ingresa tus credenciales para acceder al sistema
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleLogin}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contrasena</Label>
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
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Ingresando...
              </>
            ) : (
              'Ingresar'
            )}
          </Button>
          <div className="flex flex-col gap-2 text-center text-sm">
            <Link
              href="/forgot-password"
              className="text-green-600 hover:text-green-700 hover:underline"
            >
              Olvidaste tu contrasena?
            </Link>
            <span className="text-muted-foreground">
              No tienes cuenta?{' '}
              <Link
                href="/register"
                className="text-green-600 hover:text-green-700 hover:underline"
              >
                Registrate
              </Link>
            </span>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
