import { z } from 'zod'

export const createVaccinationSchema = z.object({
  vaccine_name: z.string().min(1, 'El nombre de la vacuna es requerido'),
  application_date: z.string().min(1, 'La fecha de aplicacion es requerida'),
  pig_id: z.string().uuid().optional().nullable(),
  next_dose_date: z.string().optional().nullable(),
  dose_number: z.coerce.number({ message: 'Ingresa un numero valido' }).int().min(1, 'La dosis debe ser al menos 1').default(1),
  administered_by: z.string().min(1, 'El aplicador es requerido'),
  notes: z.string().optional().nullable(),
})

export type CreateVaccinationInput = {
  vaccine_name: string
  application_date: string
  pig_id?: string | null
  next_dose_date?: string | null
  dose_number: number
  administered_by: string
  notes?: string | null
}

export type UpdateVaccinationInput = Partial<CreateVaccinationInput>
