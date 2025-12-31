'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Vaccination, VaccinationSchedule } from '@/types/database'
import { useAuthStore } from '@/stores/auth-store'
import { useAuthQuery } from './use-auth-query'

interface VaccinationData {
  vaccinations: Vaccination[]
  schedules: VaccinationSchedule[]
}

export function useVaccinations() {
  const { user } = useAuthStore()
  const [mutating, setMutating] = useState(false)

  // Usar useAuthQuery para fetch - espera a que auth este listo
  const {
    data,
    loading: queryLoading,
    error,
    isAuthError,
    refetch: fetchVaccinations
  } = useAuthQuery<VaccinationData>({
    queryFn: async (supabase) => {
      const [vaccinationsResult, schedulesResult] = await Promise.all([
        supabase
          .from('vaccinations')
          .select('*')
          .order('application_date', { ascending: false }),
        supabase
          .from('vaccination_schedules')
          .select('*')
          .eq('is_active', true)
          .order('vaccine_name'),
      ])

      if (vaccinationsResult.error) throw vaccinationsResult.error
      if (schedulesResult.error) throw schedulesResult.error

      return {
        vaccinations: vaccinationsResult.data || [],
        schedules: schedulesResult.data || []
      }
    }
  })

  const loading = queryLoading || mutating
  const vaccinations = data?.vaccinations || []
  const schedules = data?.schedules || []

  const createVaccination = async (vacData: {
    vaccine_name: string
    application_date: string
    pig_id?: string | null
    next_dose_date?: string | null
    dose_number: number
    administered_by: string
    notes?: string | null
  }) => {
    if (!user) throw new Error('Usuario no autenticado')
    setMutating(true)

    try {
      const supabase = createClient()
      const { data: result, error } = await supabase
        .from('vaccinations')
        .insert({
          ...vacData,
          created_by: user.id,
        })
        .select()
        .single()

      if (error) throw error
      await fetchVaccinations()
      return result
    } finally {
      setMutating(false)
    }
  }

  const updateVaccination = async (id: string, updates: Partial<Vaccination>) => {
    setMutating(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('vaccinations')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      await fetchVaccinations()
      return data
    } finally {
      setMutating(false)
    }
  }

  const deleteVaccination = async (id: string) => {
    setMutating(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('vaccinations').delete().eq('id', id)

      if (error) throw error
      await fetchVaccinations()
    } finally {
      setMutating(false)
    }
  }

  const markReminderSent = async (id: string) => {
    setMutating(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('vaccinations')
        .update({ reminder_sent: true })
        .eq('id', id)

      if (error) throw error
      await fetchVaccinations()
    } finally {
      setMutating(false)
    }
  }

  // Calcular vacunas pendientes, vencidas, proximas
  const { pendingVaccinations, overdueVaccinations, upcomingVaccinations } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const pending = vaccinations.filter((v) => {
      if (!v.next_dose_date) return false
      return new Date(v.next_dose_date) >= new Date()
    })

    const overdue = vaccinations.filter((v) => {
      if (!v.next_dose_date) return false
      const nextDose = new Date(v.next_dose_date)
      nextDose.setHours(0, 0, 0, 0)
      return nextDose < today
    })

    const upcoming = vaccinations.filter((v) => {
      if (!v.next_dose_date) return false
      const nextDose = new Date(v.next_dose_date)
      nextDose.setHours(0, 0, 0, 0)
      const daysUntil = Math.ceil((nextDose.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return daysUntil >= 0 && daysUntil <= 7
    })

    return {
      pendingVaccinations: pending,
      overdueVaccinations: overdue,
      upcomingVaccinations: upcoming
    }
  }, [vaccinations])

  return {
    vaccinations,
    schedules,
    loading,
    error,
    isAuthError,
    fetchVaccinations,
    createVaccination,
    updateVaccination,
    deleteVaccination,
    markReminderSent,
    pendingVaccinations,
    overdueVaccinations,
    upcomingVaccinations,
  }
}

export function usePigVaccinations(pigId: string) {
  // Usar useAuthQuery para fetch - espera a que auth este listo
  const {
    data: vaccinations,
    loading,
    error,
    isAuthError,
    refetch: fetchVaccinations
  } = useAuthQuery<Vaccination[]>({
    queryFn: async (supabase) => {
      const { data, error } = await supabase
        .from('vaccinations')
        .select('*')
        .eq('pig_id', pigId)
        .order('application_date', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!pigId
  })

  return {
    vaccinations: vaccinations || [],
    loading,
    error,
    isAuthError,
    fetchVaccinations
  }
}
