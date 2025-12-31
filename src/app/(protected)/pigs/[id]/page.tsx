'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import {
  ArrowLeft,
  PiggyBank,
  Scale,
  DollarSign,
  Skull,
  Calendar,
  MapPin,
  TrendingUp,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react'
import { usePig, usePigs } from '@/hooks/use-pigs'
import { useAuth } from '@/hooks/use-auth'
import {
  sellPigSchema,
  registerDeathSchema,
  weightRecordSchema,
  type SellPigInput,
  type RegisterDeathInput,
  type WeightRecordInput,
} from '@/lib/validations/pig'
import { format, differenceInDays } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export default function PigDetailPage() {
  const params = useParams()
  const router = useRouter()
  const pigId = params.id as string
  const { pig, weightRecords, loading, addWeightRecord, fetchPig } = usePig(pigId)
  const { sellPig, registerDeath, deletePig } = usePigs()
  const { canEdit, isAdmin } = useAuth()

  const [weightDialogOpen, setWeightDialogOpen] = useState(false)
  const [sellDialogOpen, setSellDialogOpen] = useState(false)
  const [deathDialogOpen, setDeathDialogOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const today = format(new Date(), 'yyyy-MM-dd')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const weightForm = useForm<WeightRecordInput>({
    resolver: zodResolver(weightRecordSchema) as any,
    defaultValues: { date: today },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sellForm = useForm<SellPigInput>({
    resolver: zodResolver(sellPigSchema) as any,
    defaultValues: { sale_date: today },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deathForm = useForm<RegisterDeathInput>({
    resolver: zodResolver(registerDeathSchema) as any,
    defaultValues: { death_date: today },
  })

  const handleAddWeight = async (data: WeightRecordInput) => {
    setActionLoading(true)
    try {
      await addWeightRecord({
        weight: data.weight,
        date: data.date,
        notes: data.notes || null,
      })
      toast.success('Peso registrado')
      setWeightDialogOpen(false)
      weightForm.reset({ date: today })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al registrar peso')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSell = async (data: SellPigInput) => {
    setActionLoading(true)
    try {
      await sellPig(pigId, {
        sale_date: data.sale_date,
        sale_price: data.sale_price,
        sale_weight: data.sale_weight || null,
        client_id: data.client_id || null,
        notes: data.notes || null,
      })
      toast.success('Venta registrada')
      setSellDialogOpen(false)
      fetchPig()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al registrar venta')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeath = async (data: RegisterDeathInput) => {
    setActionLoading(true)
    try {
      await registerDeath(pigId, {
        death_date: data.death_date,
        death_reason: data.death_reason,
        notes: data.notes || null,
      })
      toast.success('Muerte registrada')
      setDeathDialogOpen(false)
      fetchPig()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al registrar muerte')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    setActionLoading(true)
    try {
      await deletePig(pigId)
      toast.success('Cerdo eliminado')
      router.push('/pigs')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al eliminar cerdo')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <>
        <Header title="Detalle" />
        <div className="p-4 space-y-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-60 w-full" />
        </div>
      </>
    )
  }

  if (!pig) {
    return (
      <>
        <Header title="Error" />
        <div className="p-4 text-center">
          <p className="text-muted-foreground">Cerdo no encontrado</p>
          <Button onClick={() => router.push('/pigs')} className="mt-4">
            Volver a la lista
          </Button>
        </div>
      </>
    )
  }

  const daysInFarm = differenceInDays(new Date(), new Date(pig.purchase_date))
  const weightGain = pig.current_weight && pig.purchase_weight
    ? pig.current_weight - pig.purchase_weight
    : null
  const dailyGain = weightGain && daysInFarm > 0
    ? (weightGain / daysInFarm).toFixed(2)
    : null
  const profit = pig.status === 'sold' && pig.sale_price
    ? pig.sale_price - pig.purchase_price
    : null

  const chartData = weightRecords.map((r) => ({
    date: format(new Date(r.date), 'dd/MM', { locale: es }),
    peso: r.weight,
  }))

  const getStatusBadge = () => {
    switch (pig.status) {
      case 'active':
        return <Badge className="bg-green-500">Activo</Badge>
      case 'sold':
        return <Badge className="bg-blue-500">Vendido</Badge>
      case 'deceased':
        return <Badge variant="destructive">Fallecido</Badge>
    }
  }

  const getSexLabel = () => {
    switch (pig.sex) {
      case 'male':
        return 'Macho'
      case 'female':
        return 'Hembra'
      default:
        return 'Desconocido'
    }
  }

  return (
    <>
      <Header title={pig.identifier || 'Cerdo'} />

      <div className="p-4 space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>

        {/* Status and Basic Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <PiggyBank className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">
                    {pig.identifier || 'Sin identificador'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {pig.breed || 'Raza no especificada'}
                  </p>
                </div>
              </div>
              {getStatusBadge()}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  Compra: {format(new Date(pig.purchase_date), 'd MMM yyyy', { locale: es })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span>Precio: ${pig.purchase_price.toLocaleString()}</span>
              </div>
              {pig.pen_location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{pig.pen_location}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Scale className="h-4 w-4 text-muted-foreground" />
                <span>
                  {pig.current_weight ? `${pig.current_weight} kg` : 'Sin peso'}
                </span>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{daysInFarm}</p>
                <p className="text-xs text-muted-foreground">Dias en granja</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {weightGain ? `${weightGain.toFixed(1)}` : '-'}
                </p>
                <p className="text-xs text-muted-foreground">kg ganados</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{dailyGain || '-'}</p>
                <p className="text-xs text-muted-foreground">kg/dia</p>
              </div>
            </div>

            {pig.status === 'sold' && profit !== null && (
              <>
                <Separator className="my-4" />
                <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Ganancia</p>
                      <p className={`text-2xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {profit >= 0 ? '+' : ''}{profit.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Venta</p>
                      <p className="font-semibold">${pig.sale_price?.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {pig.status === 'deceased' && (
              <>
                <Separator className="my-4" />
                <div className="bg-red-50 dark:bg-red-950 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Razon de muerte</p>
                  <p className="font-medium">{pig.death_reason}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Fecha: {pig.death_date && format(new Date(pig.death_date), 'd MMM yyyy', { locale: es })}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Weight Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Historial de Peso
            </CardTitle>
            {canEdit && pig.status === 'active' && (
              <Dialog open={weightDialogOpen} onOpenChange={setWeightDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Peso
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Registrar Peso</DialogTitle>
                    <DialogDescription>
                      Ingresa el peso actual del cerdo
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={weightForm.handleSubmit(handleAddWeight)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Peso (kg)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          {...weightForm.register('weight')}
                        />
                        {weightForm.formState.errors.weight && (
                          <p className="text-sm text-destructive">
                            {weightForm.formState.errors.weight.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Fecha</Label>
                        <Input type="date" {...weightForm.register('date')} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Notas (opcional)</Label>
                      <Textarea {...weightForm.register('notes')} />
                    </div>
                    <Button type="submit" className="w-full" disabled={actionLoading}>
                      {actionLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Guardar'
                      )}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent>
            {chartData.length > 1 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="peso"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                {chartData.length === 1
                  ? 'Registra mas pesos para ver la grafica'
                  : 'No hay registros de peso'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        {canEdit && pig.status === 'active' && (
          <div className="grid grid-cols-2 gap-3">
            <Dialog open={sellDialogOpen} onOpenChange={setSellDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Vender
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Venta</DialogTitle>
                </DialogHeader>
                <form onSubmit={sellForm.handleSubmit(handleSell)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Fecha de Venta</Label>
                      <Input type="date" {...sellForm.register('sale_date')} />
                    </div>
                    <div className="space-y-2">
                      <Label>Precio de Venta</Label>
                      <Input
                        type="number"
                        step="0.01"
                        {...sellForm.register('sale_price')}
                      />
                      {sellForm.formState.errors.sale_price && (
                        <p className="text-sm text-destructive">
                          {sellForm.formState.errors.sale_price.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Peso Final (kg) - Opcional</Label>
                    <Input
                      type="number"
                      step="0.1"
                      {...sellForm.register('sale_weight')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Notas (opcional)</Label>
                    <Textarea {...sellForm.register('notes')} />
                  </div>
                  <Button type="submit" className="w-full" disabled={actionLoading}>
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Confirmar Venta'
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={deathDialogOpen} onOpenChange={setDeathDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <Skull className="mr-2 h-4 w-4" />
                  Fallecido
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Muerte</DialogTitle>
                </DialogHeader>
                <form onSubmit={deathForm.handleSubmit(handleDeath)} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Fecha</Label>
                    <Input type="date" {...deathForm.register('death_date')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Razon / Causa</Label>
                    <Textarea
                      placeholder="Describe la causa de muerte..."
                      {...deathForm.register('death_reason')}
                    />
                    {deathForm.formState.errors.death_reason && (
                      <p className="text-sm text-destructive">
                        {deathForm.formState.errors.death_reason.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Notas adicionales (opcional)</Label>
                    <Textarea {...deathForm.register('notes')} />
                  </div>
                  <Button
                    type="submit"
                    variant="destructive"
                    className="w-full"
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Confirmar'
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Delete (Admin only) */}
        {isAdmin && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="w-full text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar Cerdo
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Eliminar Cerdo?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta accion no se puede deshacer. Se eliminaran todos los
                  registros de peso y vacunas asociados.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground"
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* Notes */}
        {pig.notes && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Notas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{pig.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Additional Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Informacion Adicional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sexo</span>
              <span>{getSexLabel()}</span>
            </div>
            {pig.age_months && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Edad al comprar</span>
                <span>{pig.age_months} meses</span>
              </div>
            )}
            {pig.purchase_weight && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Peso al comprar</span>
                <span>{pig.purchase_weight} kg</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
