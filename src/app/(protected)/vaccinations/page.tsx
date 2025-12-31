'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import {
  Loader2,
  Plus,
  Search,
  Syringe,
  AlertCircle,
  CheckCircle,
  Clock,
  Trash2,
} from 'lucide-react'
import { useVaccinations } from '@/hooks/use-vaccinations'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function VaccinationsPage() {
  const {
    vaccinations,
    loading,
    overdueVaccinations,
    upcomingVaccinations,
    deleteVaccination,
  } = useVaccinations()
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const filteredVaccinations = vaccinations.filter(
    (v) =>
      v.vaccine_name.toLowerCase().includes(search.toLowerCase()) ||
      v.administered_by.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await deleteVaccination(deleteId)
      toast.success('Vacuna eliminada')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al eliminar vacuna'
      )
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  const getStatusBadge = (vaccination: (typeof vaccinations)[0]) => {
    if (!vaccination.next_dose_date) {
      return <Badge variant="secondary">Completada</Badge>
    }
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const nextDose = new Date(vaccination.next_dose_date)
    nextDose.setHours(0, 0, 0, 0)
    const daysUntil = Math.ceil(
      (nextDose.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysUntil < 0) {
      return <Badge variant="destructive">Vencida</Badge>
    } else if (daysUntil <= 7) {
      return (
        <Badge className="bg-amber-500 hover:bg-amber-600">
          En {daysUntil} dias
        </Badge>
      )
    }
    return <Badge variant="outline">Pendiente</Badge>
  }

  if (loading) {
    return (
      <>
        <Header title="Vacunaciones" />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    )
  }

  return (
    <>
      <Header
        title="Vacunaciones"
        pendingAlerts={overdueVaccinations.length}
      />

      <div className="p-4 space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-xl font-bold">
                  {overdueVaccinations.length}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Vencidas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-amber-600">
                <Clock className="h-4 w-4" />
                <span className="text-xl font-bold">
                  {upcomingVaccinations.length}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Proximas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-xl font-bold">{vaccinations.length}</span>
              </div>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar vacuna..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button asChild>
            <Link href="/vaccinations/new">
              <Plus className="mr-2 h-4 w-4" />
              Nueva
            </Link>
          </Button>
        </div>

        {/* Vaccinations List */}
        <div className="space-y-3">
          {filteredVaccinations.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Syringe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay vacunaciones registradas</p>
                <Button asChild className="mt-4">
                  <Link href="/vaccinations/new">Registrar Primera Vacuna</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredVaccinations.map((vaccination) => (
              <Card key={vaccination.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Syringe className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{vaccination.vaccine_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Dosis {vaccination.dose_number} - Aplicada:{' '}
                          {format(new Date(vaccination.application_date), 'd MMM yyyy', {
                            locale: es,
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Por: {vaccination.administered_by}
                        </p>
                        {vaccination.next_dose_date && (
                          <p className="text-sm text-muted-foreground">
                            Proxima dosis:{' '}
                            {format(new Date(vaccination.next_dose_date), 'd MMM yyyy', {
                              locale: es,
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(vaccination)}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(vaccination.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Vacunacion</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. Se eliminara permanentemente el
              registro de esta vacunacion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
