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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, PiggyBank, Users } from 'lucide-react'
import { usePigs } from '@/hooks/use-pigs'
import {
  createPigSchema,
  createMultiplePigsSchema,
  pigSexOptions,
  type CreatePigInput,
  type CreateMultiplePigsInput,
} from '@/lib/validations/pig'
import { format } from 'date-fns'

export default function NewPigPage() {
  const router = useRouter()
  const { createPig, createMultiplePigs } = usePigs()
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'single' | 'multiple'>('single')

  const today = format(new Date(), 'yyyy-MM-dd')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const singleForm = useForm<CreatePigInput>({
    resolver: zodResolver(createPigSchema) as any,
    defaultValues: {
      purchase_date: today,
      sex: 'unknown',
    },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const multipleForm = useForm<CreateMultiplePigsInput>({
    resolver: zodResolver(createMultiplePigsSchema) as any,
    defaultValues: {
      quantity: 1,
      purchase_date: today,
      sex: 'unknown',
    },
  })

  const onSubmitSingle = async (data: CreatePigInput) => {
    setLoading(true)
    try {
      await createPig({
        identifier: data.identifier || null,
        purchase_date: data.purchase_date,
        purchase_price: data.purchase_price,
        purchase_weight: data.purchase_weight || null,
        breed: data.breed || null,
        sex: data.sex || null,
        age_months: data.age_months || null,
        pen_location: data.pen_location || null,
        notes: data.notes || null,
      })
      toast.success('Cerdo registrado exitosamente')
      router.push('/pigs')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al registrar cerdo'
      )
    } finally {
      setLoading(false)
    }
  }

  const onSubmitMultiple = async (data: CreateMultiplePigsInput) => {
    setLoading(true)
    try {
      await createMultiplePigs(
        data.quantity,
        {
          purchase_date: data.purchase_date,
          purchase_weight: data.average_weight || null,
          breed: data.breed || null,
          sex: data.sex || null,
          age_months: data.age_months || null,
          pen_location: data.pen_location || null,
          notes: data.notes || null,
        },
        data.total_price
      )
      toast.success(`${data.quantity} cerdos registrados exitosamente`)
      router.push('/pigs')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al registrar cerdos'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header title="Nuevo Cerdo" />

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

        <Tabs value={mode} onValueChange={(v) => setMode(v as 'single' | 'multiple')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single" className="gap-2">
              <PiggyBank className="h-4 w-4" />
              Individual
            </TabsTrigger>
            <TabsTrigger value="multiple" className="gap-2">
              <Users className="h-4 w-4" />
              Lote
            </TabsTrigger>
          </TabsList>

          {/* Single Pig Form */}
          <TabsContent value="single">
            <Card>
              <CardHeader>
                <CardTitle>Registrar Cerdo Individual</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={singleForm.handleSubmit(onSubmitSingle)}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="purchase_date">
                        Fecha de Compra <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="purchase_date"
                        type="date"
                        {...singleForm.register('purchase_date')}
                      />
                      {singleForm.formState.errors.purchase_date && (
                        <p className="text-sm text-destructive">
                          {singleForm.formState.errors.purchase_date.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="purchase_price">
                        Precio <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="purchase_price"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...singleForm.register('purchase_price')}
                      />
                      {singleForm.formState.errors.purchase_price && (
                        <p className="text-sm text-destructive">
                          {singleForm.formState.errors.purchase_price.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="identifier">Identificador (Arete/Nombre)</Label>
                    <Input
                      id="identifier"
                      placeholder="Ej: A-001, Manchas, etc."
                      {...singleForm.register('identifier')}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="purchase_weight">Peso (lb)</Label>
                      <Input
                        id="purchase_weight"
                        type="number"
                        step="0.1"
                        placeholder="0.0"
                        {...singleForm.register('purchase_weight')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="age_months">Edad (meses)</Label>
                      <Input
                        id="age_months"
                        type="number"
                        placeholder="0"
                        {...singleForm.register('age_months')}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sex">Sexo</Label>
                      <Select
                        value={singleForm.watch('sex') || 'unknown'}
                        onValueChange={(v) =>
                          singleForm.setValue('sex', v as 'male' | 'female' | 'unknown')
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          {pigSexOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="breed">Raza</Label>
                      <Input
                        id="breed"
                        placeholder="Ej: Landrace, Duroc"
                        {...singleForm.register('breed')}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pen_location">Ubicacion (Corral)</Label>
                    <Input
                      id="pen_location"
                      placeholder="Ej: Corral 1, Sector A"
                      {...singleForm.register('pen_location')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notas</Label>
                    <Textarea
                      id="notes"
                      placeholder="Observaciones adicionales..."
                      {...singleForm.register('notes')}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Registrando...
                      </>
                    ) : (
                      'Registrar Cerdo'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Multiple Pigs Form */}
          <TabsContent value="multiple">
            <Card>
              <CardHeader>
                <CardTitle>Registrar Lote de Cerdos</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={multipleForm.handleSubmit(onSubmitMultiple)}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantity">
                        Cantidad <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        max="100"
                        {...multipleForm.register('quantity')}
                      />
                      {multipleForm.formState.errors.quantity && (
                        <p className="text-sm text-destructive">
                          {multipleForm.formState.errors.quantity.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="total_price">
                        Precio Total <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="total_price"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...multipleForm.register('total_price')}
                      />
                      {multipleForm.formState.errors.total_price && (
                        <p className="text-sm text-destructive">
                          {multipleForm.formState.errors.total_price.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {multipleForm.watch('quantity') > 0 &&
                    multipleForm.watch('total_price') > 0 && (
                      <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                        Precio por cerdo: $
                        {(
                          multipleForm.watch('total_price') /
                          multipleForm.watch('quantity')
                        ).toFixed(2)}
                      </p>
                    )}

                  <div className="space-y-2">
                    <Label htmlFor="purchase_date_multiple">
                      Fecha de Compra <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="purchase_date_multiple"
                      type="date"
                      {...multipleForm.register('purchase_date')}
                    />
                    {multipleForm.formState.errors.purchase_date && (
                      <p className="text-sm text-destructive">
                        {multipleForm.formState.errors.purchase_date.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="average_weight">Peso Promedio (lb)</Label>
                      <Input
                        id="average_weight"
                        type="number"
                        step="0.1"
                        placeholder="0.0"
                        {...multipleForm.register('average_weight')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="age_months_multiple">Edad (meses)</Label>
                      <Input
                        id="age_months_multiple"
                        type="number"
                        placeholder="0"
                        {...multipleForm.register('age_months')}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sex_multiple">Sexo</Label>
                      <Select
                        value={multipleForm.watch('sex') || 'unknown'}
                        onValueChange={(v) =>
                          multipleForm.setValue('sex', v as 'male' | 'female' | 'unknown')
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          {pigSexOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="breed_multiple">Raza</Label>
                      <Input
                        id="breed_multiple"
                        placeholder="Ej: Landrace, Duroc"
                        {...multipleForm.register('breed')}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pen_location_multiple">Ubicacion (Corral)</Label>
                    <Input
                      id="pen_location_multiple"
                      placeholder="Ej: Corral 1, Sector A"
                      {...multipleForm.register('pen_location')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes_multiple">Notas</Label>
                    <Textarea
                      id="notes_multiple"
                      placeholder="Observaciones adicionales..."
                      {...multipleForm.register('notes')}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Registrando...
                      </>
                    ) : (
                      `Registrar ${multipleForm.watch('quantity') || 0} Cerdos`
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
