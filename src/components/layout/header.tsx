'use client'

import Link from 'next/link'
import { Bell, Menu, Syringe, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useAuth } from '@/hooks/use-auth'
import { useVaccinations } from '@/hooks/use-vaccinations'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface HeaderProps {
  title: string
  pendingAlerts?: number
}

export function Header({ title, pendingAlerts }: HeaderProps) {
  const { profile, isAdmin } = useAuth()
  const { overdueVaccinations, upcomingVaccinations } = useVaccinations()

  const alertCount = pendingAlerts ?? overdueVaccinations.length

  return (
    <header className="sticky top-0 z-40 bg-card border-b border-border">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader>
                <SheetTitle className="text-left">Produccion Ivanis</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="px-2">
                  <p className="text-sm text-muted-foreground">Usuario</p>
                  <p className="font-medium">{profile?.full_name}</p>
                  <Badge variant="secondary" className="mt-1">
                    {profile?.role === 'admin' ? 'Administrador' :
                     profile?.role === 'employee' ? 'Empleado' : 'Visor'}
                  </Badge>
                </div>
                <div className="border-t pt-4 space-y-1">
                  <Link
                    href="/vaccinations"
                    className="block px-2 py-2 text-sm hover:bg-accent rounded-md"
                  >
                    Vacunaciones
                  </Link>
                  <Link
                    href="/reports"
                    className="block px-2 py-2 text-sm hover:bg-accent rounded-md"
                  >
                    Reportes
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="block px-2 py-2 text-sm hover:bg-accent rounded-md"
                    >
                      Panel de Administracion
                    </Link>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>

        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {alertCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center bg-destructive text-destructive-foreground text-xs font-medium rounded-full">
                    {alertCount > 9 ? '9+' : alertCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="p-3 border-b">
                <h3 className="font-semibold">Alertas</h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {overdueVaccinations.length === 0 && upcomingVaccinations.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    No hay alertas pendientes
                  </div>
                ) : (
                  <div className="divide-y">
                    {overdueVaccinations.map((vax) => (
                      <Link
                        key={vax.id}
                        href="/vaccinations"
                        className="flex items-start gap-3 p-3 hover:bg-accent transition-colors"
                      >
                        <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-red-600">Vacuna Vencida</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {vax.vaccine_name} - Dosis {vax.dose_number + 1}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(vax.next_dose_date!), "d 'de' MMM", { locale: es })}
                          </p>
                        </div>
                      </Link>
                    ))}
                    {upcomingVaccinations.slice(0, 3).map((vax) => (
                      <Link
                        key={vax.id}
                        href="/vaccinations"
                        className="flex items-start gap-3 p-3 hover:bg-accent transition-colors"
                      >
                        <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                          <Syringe className="h-4 w-4 text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-amber-600">Vacuna Proxima</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {vax.vaccine_name} - Dosis {vax.dose_number + 1}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(vax.next_dose_date!), "d 'de' MMM", { locale: es })}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              {(overdueVaccinations.length > 0 || upcomingVaccinations.length > 0) && (
                <div className="p-2 border-t">
                  <Button asChild variant="ghost" className="w-full">
                    <Link href="/calendar">Ver Calendario</Link>
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  )
}
