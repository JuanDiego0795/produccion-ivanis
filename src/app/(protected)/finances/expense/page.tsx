'use client'

import { useState, useEffect } from 'react'
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
import {
  Loader2,
  ArrowLeft,
  Wheat,
  Syringe,
  Pill,
  Stethoscope,
  Truck,
  Building,
  Users,
  Lightbulb,
  MoreHorizontal,
} from 'lucide-react'
import { useExpenses } from '@/hooks/use-expenses'
import { usePigs } from '@/hooks/use-pigs'
import {
  createExpenseSchema,
  expenseTypeOptions,
  type CreateExpenseInput,
} from '@/lib/validations/expense'
import { format } from 'date-fns'

const iconMap: Record<string, React.ReactNode> = {
  Wheat: <Wheat className="h-4 w-4" />,
  Syringe: <Syringe className="h-4 w-4" />,
  Pill: <Pill className="h-4 w-4" />,
  Stethoscope: <Stethoscope className="h-4 w-4" />,
  Truck: <Truck className="h-4 w-4" />,
  Building: <Building className="h-4 w-4" />,
  Users: <Users className="h-4 w-4" />,
  Lightbulb: <Lightbulb className="h-4 w-4" />,
  MoreHorizontal: <MoreHorizontal className="h-4 w-4" />,
}

export default function NewExpensePage() {
  const router = useRouter()
  const { createExpense } = useExpenses()
  const { pigs } = usePigs()
  const [loading, setLoading] = useState(false)
  const [selectedType, setSelectedType] = useState<string>('food')

  const today = format(new Date(), 'yyyy-MM-dd')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<CreateExpenseInput>({
    resolver: zodResolver(createExpenseSchema) as any,
    defaultValues: {
      date: today,
      type: 'food',
    },
  })

  const activePigs = pigs.filter((p) => p.status === 'active')

  const onSubmit = async (data: CreateExpenseInput) => {
    setLoading(true)
    try {
      await createExpense({
        type: data.type,
        description: data.description,
        amount: data.amount,
        date: data.date,
        pig_id: data.pig_id || null,
        invoice_number: data.invoice_number || null,
        supplier: data.supplier || null,
      })
      toast.success('Gasto registrado')
      router.push('/finances')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al registrar gasto'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    form.setValue('type', selectedType as CreateExpenseInput['type'])
  }, [selectedType, form])

  return (
    <>
      <Header title="Registrar Gasto" />

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
            <CardTitle>Nuevo Gasto</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Expense Type Selection */}
              <div className="space-y-2">
                <Label>Tipo de Gasto</Label>
                <div className="grid grid-cols-3 gap-2">
                  {expenseTypeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSelectedType(option.value)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors ${
                        selectedType === option.value
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {iconMap[option.icon]}
                      <span className="text-xs">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">
                    Monto <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...form.register('amount')}
                  />
                  {form.formState.errors.amount && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.amount.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">
                    Fecha <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    {...form.register('date')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Descripcion <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe el gasto..."
                  {...form.register('description')}
                />
                {form.formState.errors.description && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.description.message}
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
                    <SelectValue placeholder="Gasto general" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Gasto General</SelectItem>
                    {activePigs.map((pig) => (
                      <SelectItem key={pig.id} value={pig.id}>
                        {pig.identifier || `Cerdo ${pig.id.slice(0, 8)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier">Proveedor</Label>
                  <Input
                    id="supplier"
                    placeholder="Nombre del proveedor"
                    {...form.register('supplier')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoice_number">No. Factura</Label>
                  <Input
                    id="invoice_number"
                    placeholder="123456"
                    {...form.register('invoice_number')}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  'Registrar Gasto'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
