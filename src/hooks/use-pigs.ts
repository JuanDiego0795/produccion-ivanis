'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Pig, PigInsert, WeightRecord, WeightRecordInsert } from '@/types/database'
import { useAuthStore } from '@/stores/auth-store'
import { useAuthQuery } from './use-auth-query'

export function usePigs() {
  const { user } = useAuthStore()
  const [mutating, setMutating] = useState(false)

  // Usar useAuthQuery para fetch - espera a que auth este listo
  const {
    data: pigs,
    loading: queryLoading,
    error,
    isAuthError,
    refetch: fetchPigs
  } = useAuthQuery<Pig[]>({
    queryFn: async (supabase) => {
      const { data, error: fetchError } = await supabase
        .from('pigs')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      return data || []
    }
  })

  const loading = queryLoading || mutating

  const createPig = async (pigData: Omit<PigInsert, 'created_by'>) => {
    if (!user) throw new Error('Usuario no autenticado')
    setMutating(true)

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('pigs')
        .insert({
          ...pigData,
          created_by: user.id,
          current_weight: pigData.purchase_weight,
        })
        .select()
        .single()

      if (error) throw error
      await fetchPigs()
      return data
    } finally {
      setMutating(false)
    }
  }

  const createMultiplePigs = async (
    quantity: number,
    baseData: Omit<PigInsert, 'created_by' | 'purchase_price'>,
    totalPrice: number
  ) => {
    if (!user) throw new Error('Usuario no autenticado')

    const pricePerPig = totalPrice / quantity
    const pigsToCreate: PigInsert[] = []

    for (let i = 0; i < quantity; i++) {
      pigsToCreate.push({
        ...baseData,
        purchase_price: pricePerPig,
        current_weight: baseData.purchase_weight,
        created_by: user.id,
      })
    }

    const supabase = createClient()
    const { data, error } = await supabase
      .from('pigs')
      .insert(pigsToCreate)
      .select()

    if (error) throw error
    await fetchPigs()
    return data
  }

  const updatePig = async (id: string, updates: Partial<Pig>) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('pigs')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    await fetchPigs()
    return data
  }

  const sellPig = async (
    id: string,
    saleData: {
      sale_date: string
      sale_price: number
      sale_weight?: number | null
      client_id?: string | null
      notes?: string | null
    }
  ) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('pigs')
      .update({
        status: 'sold' as const,
        sale_date: saleData.sale_date,
        sale_price: saleData.sale_price,
        sale_weight: saleData.sale_weight,
        client_id: saleData.client_id,
        notes: saleData.notes,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    await fetchPigs()
    return data
  }

  const registerDeath = async (
    id: string,
    deathData: {
      death_date: string
      death_reason: string
      notes?: string | null
    }
  ) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('pigs')
      .update({
        status: 'deceased' as const,
        death_date: deathData.death_date,
        death_reason: deathData.death_reason,
        notes: deathData.notes,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    await fetchPigs()
    return data
  }

  const deletePig = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('pigs').delete().eq('id', id)

    if (error) throw error
    await fetchPigs()
  }

  return {
    pigs: pigs || [],
    loading,
    error,
    isAuthError,
    fetchPigs,
    createPig,
    createMultiplePigs,
    updatePig,
    sellPig,
    registerDeath,
    deletePig,
  }
}

export function usePig(id: string) {
  const { user } = useAuthStore()
  const [mutating, setMutating] = useState(false)

  // Usar useAuthQuery para fetch - espera a que auth este listo
  const {
    data,
    loading: queryLoading,
    error,
    isAuthError,
    refetch: fetchPig
  } = useAuthQuery<{ pig: Pig; weightRecords: WeightRecord[] }>({
    queryFn: async (supabase) => {
      const [pigResult, weightsResult] = await Promise.all([
        supabase.from('pigs').select('*').eq('id', id).single(),
        supabase
          .from('weight_records')
          .select('*')
          .eq('pig_id', id)
          .order('date', { ascending: true }),
      ])

      if (pigResult.error) throw pigResult.error
      if (weightsResult.error) throw weightsResult.error

      return {
        pig: pigResult.data,
        weightRecords: weightsResult.data || []
      }
    },
    enabled: !!id
  })

  const loading = queryLoading || mutating

  const addWeightRecord = async (recordData: Omit<WeightRecordInsert, 'pig_id' | 'created_by'>) => {
    if (!user) throw new Error('Usuario no autenticado')
    setMutating(true)

    try {
      const supabase = createClient()

      // Add weight record
      const { error: weightError } = await supabase
        .from('weight_records')
        .insert({
          ...recordData,
          pig_id: id,
          created_by: user.id,
        })

      if (weightError) throw weightError

      // Update current_weight on pig
      const { error: pigError } = await supabase
        .from('pigs')
        .update({ current_weight: recordData.weight })
        .eq('id', id)

      if (pigError) throw pigError

      await fetchPig()
    } finally {
      setMutating(false)
    }
  }

  return {
    pig: data?.pig || null,
    weightRecords: data?.weightRecords || [],
    loading,
    error,
    isAuthError,
    fetchPig,
    addWeightRecord,
  }
}
