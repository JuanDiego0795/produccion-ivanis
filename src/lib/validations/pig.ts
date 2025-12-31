import { z } from 'zod'

export const pigSexOptions = [
  { value: 'male', label: 'Macho' },
  { value: 'female', label: 'Hembra' },
  { value: 'unknown', label: 'Desconocido' },
] as const

export const createPigSchema = z.object({
  identifier: z.string().optional().nullable(),
  purchase_date: z.string().min(1, 'La fecha de compra es requerida'),
  purchase_price: z.coerce.number({ message: 'Ingresa un numero valido' }).positive('Debe ser mayor a 0'),
  purchase_weight: z.coerce.number({ message: 'Ingresa un numero valido' }).positive('Debe ser mayor a 0').optional().nullable(),
  breed: z.string().optional().nullable(),
  sex: z.enum(['male', 'female', 'unknown']).optional().nullable(),
  age_months: z.coerce.number({ message: 'Ingresa un numero valido' }).int('Debe ser un numero entero').min(0, 'No puede ser negativo').optional().nullable(),
  pen_location: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const createMultiplePigsSchema = z.object({
  quantity: z.coerce.number({ message: 'Ingresa un numero valido' }).int('Debe ser un numero entero').min(1, 'La cantidad debe ser al menos 1').max(100, 'Maximo 100 cerdos por lote'),
  purchase_date: z.string().min(1, 'La fecha de compra es requerida'),
  total_price: z.coerce.number({ message: 'Ingresa un numero valido' }).positive('Debe ser mayor a 0'),
  average_weight: z.coerce.number({ message: 'Ingresa un numero valido' }).positive('Debe ser mayor a 0').optional().nullable(),
  breed: z.string().optional().nullable(),
  sex: z.enum(['male', 'female', 'unknown']).optional().nullable(),
  age_months: z.coerce.number({ message: 'Ingresa un numero valido' }).int('Debe ser un numero entero').min(0, 'No puede ser negativo').optional().nullable(),
  pen_location: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const updatePigSchema = createPigSchema.partial()

export const sellPigSchema = z.object({
  sale_date: z.string().min(1, 'La fecha de venta es requerida'),
  sale_price: z.coerce.number({ message: 'Ingresa un numero valido' }).positive('Debe ser mayor a 0'),
  sale_weight: z.coerce.number({ message: 'Ingresa un numero valido' }).positive('Debe ser mayor a 0').optional().nullable(),
  client_id: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const registerDeathSchema = z.object({
  death_date: z.string().min(1, 'La fecha de muerte es requerida'),
  death_reason: z.string().min(1, 'La razon es requerida'),
  notes: z.string().optional().nullable(),
})

export const weightRecordSchema = z.object({
  weight: z.coerce.number({ message: 'Ingresa un numero valido' }).positive('El peso debe ser mayor a 0'),
  date: z.string().min(1, 'La fecha es requerida'),
  notes: z.string().optional().nullable(),
})

// Explicit types for react-hook-form compatibility
export type CreatePigInput = {
  identifier?: string | null
  purchase_date: string
  purchase_price: number
  purchase_weight?: number | null
  breed?: string | null
  sex?: 'male' | 'female' | 'unknown' | null
  age_months?: number | null
  pen_location?: string | null
  notes?: string | null
}

export type CreateMultiplePigsInput = {
  quantity: number
  purchase_date: string
  total_price: number
  average_weight?: number | null
  breed?: string | null
  sex?: 'male' | 'female' | 'unknown' | null
  age_months?: number | null
  pen_location?: string | null
  notes?: string | null
}

export type UpdatePigInput = Partial<CreatePigInput>

export type SellPigInput = {
  sale_date: string
  sale_price: number
  sale_weight?: number | null
  client_id?: string | null
  notes?: string | null
}

export type RegisterDeathInput = {
  death_date: string
  death_reason: string
  notes?: string | null
}

export type WeightRecordInput = {
  weight: number
  date: string
  notes?: string | null
}
