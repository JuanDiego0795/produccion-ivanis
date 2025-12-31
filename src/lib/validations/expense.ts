import { z } from 'zod'

export const expenseTypeOptions = [
  { value: 'food', label: 'Alimento', icon: 'Wheat' },
  { value: 'vaccine', label: 'Vacunas', icon: 'Syringe' },
  { value: 'medicine', label: 'Medicinas', icon: 'Pill' },
  { value: 'veterinary', label: 'Veterinario', icon: 'Stethoscope' },
  { value: 'transport', label: 'Transporte', icon: 'Truck' },
  { value: 'facilities', label: 'Instalaciones', icon: 'Building' },
  { value: 'personnel', label: 'Personal', icon: 'Users' },
  { value: 'utilities', label: 'Servicios', icon: 'Lightbulb' },
  { value: 'other', label: 'Otros', icon: 'MoreHorizontal' },
] as const

export type ExpenseType = typeof expenseTypeOptions[number]['value']

export const createExpenseSchema = z.object({
  type: z.enum(['food', 'vaccine', 'medicine', 'veterinary', 'transport', 'facilities', 'personnel', 'utilities', 'other']),
  description: z.string().min(1, 'La descripcion es requerida'),
  amount: z.coerce.number({ message: 'Ingresa un numero valido' }).positive('El monto debe ser mayor a 0'),
  date: z.string().min(1, 'La fecha es requerida'),
  pig_id: z.string().uuid().optional().nullable(),
  invoice_number: z.string().optional().nullable(),
  supplier: z.string().optional().nullable(),
})

export type CreateExpenseInput = {
  type: ExpenseType
  description: string
  amount: number
  date: string
  pig_id?: string | null
  invoice_number?: string | null
  supplier?: string | null
}

export type UpdateExpenseInput = Partial<CreateExpenseInput>
