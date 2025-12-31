'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, Mail, ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        toast.error(error.message)
        return
      }

      setEmailSent(true)
      toast.success('Email enviado! Revisa tu bandeja de entrada.')
    } catch {
      toast.error('Error al enviar el email. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Enviado
          </CardTitle>
          <CardDescription>
            Revisa tu bandeja de entrada
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Hemos enviado un enlace de recuperacion a{' '}
            <strong>{email}</strong>. Haz clic en el enlace para restablecer
            tu contrasena.
          </p>
          <p className="text-sm text-muted-foreground">
            Si no recibes el email en unos minutos, revisa tu carpeta de spam.
          </p>
        </CardContent>
        <CardFooter>
          <Link href="/login" className="w-full">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al inicio de sesion
            </Button>
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Recuperar Contrasena
        </CardTitle>
        <CardDescription>
          Ingresa tu email para recibir un enlace de recuperacion
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
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
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar Enlace'
            )}
          </Button>
          <Link
            href="/login"
            className="text-sm text-green-600 hover:text-green-700 hover:underline"
          >
            <ArrowLeft className="inline mr-1 h-4 w-4" />
            Volver al inicio de sesion
          </Link>
        </CardFooter>
      </form>
    </Card>
  )
}
