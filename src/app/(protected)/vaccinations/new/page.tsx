'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, ArrowLeft } from 'lucide-react'
import { useVaccinations } from '@/hooks/use-vaccinations'
import { usePigs } from '@/hooks/use-pigs'
import {
  createVaccinationSchema,
  type CreateVaccinationInput,
} from '@/lib/validations/vaccination'
import { format, addDays } from 'date-fns'

const commonVaccines = [
  { name: 'Peste Porcina Clasica', interval: 180 },
  { name: 'Fiebre Aftosa', interval: 180 },
  { name: 'Neumonia', interval: 21 },
  { name: 'Circovirosis', interval: 21 },
  { name: 'Mycoplasma', interval: 14 },
  { name: 'E. Coli', interval: 21 },
  { name: 'Ileitis', interval: 0 },
  { name: 'Desparasitacion', interval: 90 },
]

export default function NewVaccinationPage() {
  const router = useRouter()
  const { createVaccination, schedules } = useVaccinations()
  const { pigs } = usePigs()
  const [loading, setLoading] = useState(false)
  const [selectedVaccine, setSelectedVaccine] = useState<string>('')

  const today = format(new Date(), 'yyyy-MM-dd')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<CreateVaccinationInput>({
    resolver: zodResolver(createVaccinationSchema) as any,
    defaultValues: {
      application_date: today,
      dose_number: 1,
    },
  })

  const activePigs = pigs.filter((p) => p.status === 'active')

  const handleVaccineSelect = (vaccineName: string) => {
    setSelectedVaccine(vaccineName)
    form.setValue('vaccine_name', vaccineName)

    // Auto-set next dose date based on vaccine interval
    const vaccine = commonVaccines.find((v) => v.name === vaccineName)
    const schedule = schedules.find((s) => s.vaccine_name === vaccineName)

    const interval = schedule?.dose_interval_days || vaccine?.interval || 0
    if (interval > 0) {
      const applicationDate = form.getValues('application_date') || today
      const nextDose = addDays(new Date(applicationDate), interval)
      form.setValue('next_dose_date', format(nextDose, 'yyyy-MM-dd'))
    } else {
      form.setValue('next_dose_date', null)
    }
  }

  const onSubmit = async (data: CreateVaccinationInput) => {
    setLoading(true)
    try {
      await createVaccination({
        vaccine_name: data.vaccine_name,
        application_date: data.application_date,
        pig_id: data.pig_id || null,
        next_dose_date: data.next_dose_date || null,
        dose_number: data.dose_number,
        administered_by: data.administered_by,
        notes: data.notes || null,
      })
      toast.success('Vacunacion registrada')
      router.push('/vaccinations')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al registrar vacunacion'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header title="Registrar Vacuna" />

      <div className="p-4 space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Nueva Vacunacion</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Vaccine Selection */}
              <div className="space-y-2">
                <Label>Vacuna Comun (opcional)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {commonVaccines.map((vaccine) => (
                    <button
                      key={vaccine.name}
                      type="button"
                      onClick={() => handleVaccineSelect(vaccine.name)}
                      className={`p-2 text-sm rounded-lg border-2 transition-colors text-left ${
                        selectedVaccine === vaccine.name
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {vaccine.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vaccine_name">
                  Nombre de Vacuna <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="vaccine_name"
                  placeholder="Nombre de la vacuna"
                  {...form.register('vaccine_name')}
                />
                {form.formState.errors.vaccine_name && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.vaccine_name.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="application_date">
                    Fecha de Aplicacion <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="application_date"
                    type="date"
                    {...form.register('application_date')}
                  />
                  {form.formState.errors.application_date && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.application_date.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dose_number">
                    Numero de Dosis <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="dose_number"
                    type="number"
                    min={1}
                    {...form.register('dose_number')}
                  />
                  {form.formState.errors.dose_number && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.dose_number.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="administered_by">
                  Aplicada por <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="administered_by"
                  placeholder="Nombre del aplicador"
                  {...form.register('administered_by')}
                />
                {form.formState.errors.administered_by && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.administered_by.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pig_id">Asignar a Cerdo (opcional)</Label>
                <Select
                  value={form.watch('pig_id') || 'general'}
                  onValueChange={(v) =>
                    form.setValue('pig_id', v === 'general' ? null : v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vacunacion general" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Vacunacion General</SelectItem>
                    {activePigs.map((pig) => (
                      <SelectItem key={pig.id} value={pig.id}>
                        {pig.identifier || `Cerdo ${pig.id.slice(0, 8)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="next_dose_date">Proxima Dosis (opcional)</Label>
                <Input
                  id="next_dose_date"
                  type="date"
                  {...form.register('next_dose_date')}
                />
                <p className="text-xs text-muted-foreground">
                  Si la vacuna requiere refuerzo, indica la fecha de la proxima dosis
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas (opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Observaciones adicionales..."
                  {...form.register('notes')}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  'Registrar Vacunacion'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
