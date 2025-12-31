export type UserRole = 'admin' | 'employee' | 'viewer'
export type PigStatus = 'active' | 'sold' | 'deceased'
export type PigSex = 'male' | 'female' | 'unknown'
export type ExpenseType =
  | 'food'
  | 'vaccine'
  | 'medicine'
  | 'veterinary'
  | 'transport'
  | 'facilities'
  | 'personnel'
  | 'utilities'
  | 'other'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          role: UserRole
          avatar_url: string | null
          permissions: Record<string, boolean> | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          role?: UserRole
          avatar_url?: string | null
          permissions?: Record<string, boolean> | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          role?: UserRole
          avatar_url?: string | null
          permissions?: Record<string, boolean> | null
          updated_at?: string
        }
      }
      pigs: {
        Row: {
          id: string
          identifier: string | null
          purchase_date: string
          purchase_price: number
          purchase_weight: number | null
          current_weight: number | null
          breed: string | null
          sex: PigSex | null
          age_months: number | null
          pen_location: string | null
          status: PigStatus
          sale_date: string | null
          sale_price: number | null
          sale_weight: number | null
          death_date: string | null
          death_reason: string | null
          notes: string | null
          client_id: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          identifier?: string | null
          purchase_date: string
          purchase_price: number
          purchase_weight?: number | null
          current_weight?: number | null
          breed?: string | null
          sex?: PigSex | null
          age_months?: number | null
          pen_location?: string | null
          status?: PigStatus
          sale_date?: string | null
          sale_price?: number | null
          sale_weight?: number | null
          death_date?: string | null
          death_reason?: string | null
          notes?: string | null
          client_id?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          identifier?: string | null
          purchase_date?: string
          purchase_price?: number
          purchase_weight?: number | null
          current_weight?: number | null
          breed?: string | null
          sex?: PigSex | null
          age_months?: number | null
          pen_location?: string | null
          status?: PigStatus
          sale_date?: string | null
          sale_price?: number | null
          sale_weight?: number | null
          death_date?: string | null
          death_reason?: string | null
          notes?: string | null
          client_id?: string | null
          updated_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          pig_id: string | null
          type: ExpenseType
          description: string
          amount: number
          date: string
          invoice_number: string | null
          supplier: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          pig_id?: string | null
          type: ExpenseType
          description: string
          amount: number
          date: string
          invoice_number?: string | null
          supplier?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          pig_id?: string | null
          type?: ExpenseType
          description?: string
          amount?: number
          date?: string
          invoice_number?: string | null
          supplier?: string | null
        }
      }
      vaccinations: {
        Row: {
          id: string
          pig_id: string | null
          vaccine_name: string
          application_date: string
          next_dose_date: string | null
          dose_number: number
          administered_by: string
          notes: string | null
          reminder_sent: boolean
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          pig_id?: string | null
          vaccine_name: string
          application_date: string
          next_dose_date?: string | null
          dose_number?: number
          administered_by: string
          notes?: string | null
          reminder_sent?: boolean
          created_by: string
          created_at?: string
        }
        Update: {
          pig_id?: string | null
          vaccine_name?: string
          application_date?: string
          next_dose_date?: string | null
          dose_number?: number
          administered_by?: string
          notes?: string | null
          reminder_sent?: boolean
        }
      }
      vaccination_schedules: {
        Row: {
          id: string
          vaccine_name: string
          description: string
          dose_interval_days: number
          total_doses: number
          reminder_days_before: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          vaccine_name: string
          description: string
          dose_interval_days: number
          total_doses?: number
          reminder_days_before?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          vaccine_name?: string
          description?: string
          dose_interval_days?: number
          total_doses?: number
          reminder_days_before?: number
          is_active?: boolean
        }
      }
      clients: {
        Row: {
          id: string
          name: string
          phone: string | null
          email: string | null
          address: string | null
          tax_id: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          phone?: string | null
          email?: string | null
          address?: string | null
          tax_id?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          phone?: string | null
          email?: string | null
          address?: string | null
          tax_id?: string | null
          notes?: string | null
        }
      }
      weight_records: {
        Row: {
          id: string
          pig_id: string
          weight: number
          date: string
          notes: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          pig_id: string
          weight: number
          date: string
          notes?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          pig_id?: string
          weight?: number
          date?: string
          notes?: string | null
        }
      }
    }
    Enums: {
      user_role: UserRole
      pig_status: PigStatus
      pig_sex: PigSex
      expense_type: ExpenseType
    }
  }
}

// Helper types for easier usage
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type Pig = Database['public']['Tables']['pigs']['Row']
export type PigInsert = Database['public']['Tables']['pigs']['Insert']
export type PigUpdate = Database['public']['Tables']['pigs']['Update']

export type Expense = Database['public']['Tables']['expenses']['Row']
export type ExpenseInsert = Database['public']['Tables']['expenses']['Insert']
export type ExpenseUpdate = Database['public']['Tables']['expenses']['Update']

export type Vaccination = Database['public']['Tables']['vaccinations']['Row']
export type VaccinationInsert = Database['public']['Tables']['vaccinations']['Insert']
export type VaccinationUpdate = Database['public']['Tables']['vaccinations']['Update']

export type VaccinationSchedule = Database['public']['Tables']['vaccination_schedules']['Row']
export type VaccinationScheduleInsert = Database['public']['Tables']['vaccination_schedules']['Insert']
export type VaccinationScheduleUpdate = Database['public']['Tables']['vaccination_schedules']['Update']

export type Client = Database['public']['Tables']['clients']['Row']
export type ClientInsert = Database['public']['Tables']['clients']['Insert']
export type ClientUpdate = Database['public']['Tables']['clients']['Update']

export type WeightRecord = Database['public']['Tables']['weight_records']['Row']
export type WeightRecordInsert = Database['public']['Tables']['weight_records']['Insert']
export type WeightRecordUpdate = Database['public']['Tables']['weight_records']['Update']
