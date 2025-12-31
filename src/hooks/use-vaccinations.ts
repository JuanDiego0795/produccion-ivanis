'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Vaccination, VaccinationSchedule } from '@/types/database'
import { useAuthStore } from '@/stores/auth-store'

export function useVaccinations() {
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([])
  const [schedules, setSchedules] = useState<VaccinationSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuthStore()

  const fetchVaccinations = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

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

      setVaccinations(vaccinationsResult.data || [])
      setSchedules(schedulesResult.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar vacunas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchVaccinations()
  }, [fetchVaccinations])

  const createVaccination = async (data: {
    vaccine_name: string
    application_date: string
    pig_id?: string | null
    next_dose_date?: string | null
    dose_number: number
    administered_by: string
    notes?: string | null
  }) => {
    if (!user) throw new Error('Usuario no autenticado')

    const supabase = createClient()
    const { data: result, error } = await supabase
      .from('vaccinations')
      .insert({
        ...data,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) throw error
    await fetchVaccinations()
    return result
  }

  const updateVaccination = async (id: string, updates: Partial<Vaccination>) => {
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
  }

  const deleteVaccination = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('vaccinations').delete().eq('id', id)

    if (error) throw error
    await fetchVaccinations()
  }

  const markReminderSent = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('vaccinations')
      .update({ reminder_sent: true })
      .eq('id', id)

    if (error) throw error
    await fetchVaccinations()
  }

  // Get pending vaccinations (next_dose_date in the future)
  const pendingVaccinations = vaccinations.filter((v) => {
    if (!v.next_dose_date) return false
    return new Date(v.next_dose_date) >= new Date()
  })

  // Get overdue vaccinations
  const overdueVaccinations = vaccinations.filter((v) => {
    if (!v.next_dose_date) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const nextDose = new Date(v.next_dose_date)
    nextDose.setHours(0, 0, 0, 0)
    return nextDose < today
  })

  // Get upcoming vaccinations (next 7 days)
  const upcomingVaccinations = vaccinations.filter((v) => {
    if (!v.next_dose_date) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const nextDose = new Date(v.next_dose_date)
    nextDose.setHours(0, 0, 0, 0)
    const daysUntil = Math.ceil((nextDose.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntil >= 0 && daysUntil <= 7
  })

  return {
    vaccinations,
    schedules,
    loading,
    error,
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
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([])
  const [loading, setLoading] = useState(true)

  const fetchVaccinations = useCallback(async () => {
    setLoading(true)

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('vaccinations')
        .select('*')
        .eq('pig_id', pigId)
        .order('application_date', { ascending: false })

      if (error) throw error
      setVaccinations(data || [])
    } catch {
      setVaccinations([])
    } finally {
      setLoading(false)
    }
  }, [pigId])

  useEffect(() => {
    if (pigId) {
      fetchVaccinations()
    }
  }, [pigId, fetchVaccinations])

  return { vaccinations, loading, fetchVaccinations }
}
