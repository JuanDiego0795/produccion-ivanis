'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Syringe, AlertCircle, Plus, Loader2 } from 'lucide-react'
import { format, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { useVaccinations } from '@/hooks/use-vaccinations'

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const {
    vaccinations,
    loading,
    overdueVaccinations,
    upcomingVaccinations,
  } = useVaccinations()

  // Get vaccinations for selected date
  const selectedDateVaccinations = useMemo(() => {
    if (!selectedDate) return []
    return vaccinations.filter((v) => {
      const applicationDate = new Date(v.application_date)
      const nextDoseDate = v.next_dose_date ? new Date(v.next_dose_date) : null
      return (
        isSameDay(applicationDate, selectedDate) ||
        (nextDoseDate && isSameDay(nextDoseDate, selectedDate))
      )
    })
  }, [selectedDate, vaccinations])

  // Get dates with events for calendar highlighting
  const eventDates = useMemo(() => {
    const dates: Date[] = []
    vaccinations.forEach((v) => {
      if (v.next_dose_date) {
        dates.push(new Date(v.next_dose_date))
      }
    })
    return dates
  }, [vaccinations])

  // Custom day styling for calendar
  const modifiers = {
    hasEvent: eventDates,
    overdue: overdueVaccinations.map((v) => new Date(v.next_dose_date!)),
    upcoming: upcomingVaccinations.map((v) => new Date(v.next_dose_date!)),
  }

  const modifiersStyles = {
    hasEvent: {
      fontWeight: 'bold' as const,
    },
    overdue: {
      backgroundColor: 'rgb(254 202 202)',
      color: 'rgb(185 28 28)',
      borderRadius: '50%',
    },
    upcoming: {
      backgroundColor: 'rgb(254 243 199)',
      color: 'rgb(180 83 9)',
      borderRadius: '50%',
    },
  }

  if (loading) {
    return (
      <>
        <Header title="Calendario" />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    )
  }

  return (
    <>
      <Header title="Calendario" pendingAlerts={overdueVaccinations.length} />

      <div className="p-4 space-y-6">
        {/* Calendar */}
        <Card>
          <CardContent className="p-3">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={es}
              className="w-full"
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
            />
          </CardContent>
        </Card>

        {/* Selected Date Info */}
        {selectedDate && (
          <div className="space-y-3">
            <h3 className="font-semibold">
              {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
            </h3>
            {selectedDateVaccinations.length > 0 ? (
              selectedDateVaccinations.map((vax) => {
                const isNextDose =
                  vax.next_dose_date &&
                  isSameDay(new Date(vax.next_dose_date), selectedDate)
                return (
                  <Card key={vax.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            isNextDose
                              ? 'bg-amber-100'
                              : 'bg-green-100'
                          }`}
                        >
                          <Syringe
                            className={`h-5 w-5 ${
                              isNextDose ? 'text-amber-600' : 'text-green-600'
                            }`}
                          />
                        </div>
                        <div>
                          <p className="font-medium">{vax.vaccine_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {isNextDose ? 'Proxima dosis' : 'Aplicada'} - Dosis{' '}
                            {isNextDose ? vax.dose_number + 1 : vax.dose_number}
                          </p>
                        </div>
                      </div>
                      <Badge variant={isNextDose ? 'outline' : 'secondary'}>
                        {isNextDose ? 'Pendiente' : 'Completada'}
                      </Badge>
                    </CardContent>
                  </Card>
                )
              })
            ) : (
              <Card>
                <CardContent className="p-4 text-center text-muted-foreground">
                  No hay eventos para este dia
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Overdue Vaccinations */}
        {overdueVaccinations.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              Vacunas Vencidas ({overdueVaccinations.length})
            </h3>
            {overdueVaccinations.map((vax) => (
              <Card
                key={vax.id}
                className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950"
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                      <Syringe className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium">{vax.vaccine_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Dosis {vax.dose_number + 1} -{' '}
                        {format(new Date(vax.next_dose_date!), 'd MMM', {
                          locale: es,
                        })}
                      </p>
                    </div>
                  </div>
                  <Badge variant="destructive">Vencida</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Upcoming Vaccinations */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Syringe className="h-4 w-4" />
              Proximas Vacunas (7 dias)
            </h3>
            <Button asChild size="sm">
              <Link href="/vaccinations/new">
                <Plus className="mr-1 h-4 w-4" />
                Nueva
              </Link>
            </Button>
          </div>

          {upcomingVaccinations.length > 0 ? (
            upcomingVaccinations.map((vax) => {
              const daysUntil = Math.ceil(
                (new Date(vax.next_dose_date!).getTime() - new Date().getTime()) /
                  (1000 * 60 * 60 * 24)
              )
              return (
                <Card key={vax.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                        <Syringe className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium">{vax.vaccine_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Dosis {vax.dose_number + 1}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {format(new Date(vax.next_dose_date!), 'd MMM', {
                          locale: es,
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {daysUntil === 0
                          ? 'Hoy'
                          : daysUntil === 1
                          ? 'Manana'
                          : `En ${daysUntil} dias`}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          ) : (
            <Card>
              <CardContent className="p-4 text-center text-muted-foreground">
                No hay vacunas pendientes para los proximos 7 dias
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}
