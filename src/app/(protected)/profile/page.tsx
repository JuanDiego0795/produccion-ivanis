'use client'

import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { LogOut, User, Mail, Shield, Settings } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

export default function ProfilePage() {
  const { user, profile, signOut, isAdmin } = useAuth()

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador'
      case 'employee':
        return 'Empleado'
      default:
        return 'Visor'
    }
  }

  return (
    <>
      <Header title="Perfil" />

      <div className="p-4 space-y-6">
        {/* Profile Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-20 w-20 mb-4">
                <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                  {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold">{profile?.full_name}</h2>
              <p className="text-muted-foreground">{user?.email}</p>
              <Badge className="mt-2" variant="secondary">
                {profile?.role ? getRoleName(profile.role) : 'Usuario'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informacion de Cuenta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Nombre</p>
                <p className="font-medium">{profile?.full_name}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Rol</p>
                <p className="font-medium">
                  {profile?.role ? getRoleName(profile.role) : 'Usuario'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Panel Link */}
        {isAdmin && (
          <a href="/admin">
            <Card className="hover:bg-accent transition-colors cursor-pointer">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Settings className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Panel de Administracion</p>
                    <p className="text-sm text-muted-foreground">
                      Gestionar usuarios y configuracion
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </a>
        )}

        {/* Logout */}
        <Button
          variant="destructive"
          className="w-full"
          onClick={signOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar Sesion
        </Button>
      </div>
    </>
  )
}
