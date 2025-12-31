'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Expense } from '@/types/database'
import { useAuthStore } from '@/stores/auth-store'
import { useAuthQuery } from './use-auth-query'

interface ExpenseSummary {
  totalExpenses: number
  totalIncome: number
  balance: number
  expensesByType: Record<string, number>
  monthlyData: Array<{
    month: string
    expenses: number
    income: number
  }>
}

export function useExpenses() {
  const { user } = useAuthStore()
  const [mutating, setMutating] = useState(false)

  // Usar useAuthQuery para fetch - espera a que auth este listo
  const {
    data: expenses,
    loading: queryLoading,
    error,
    isAuthError,
    refetch: fetchExpenses
  } = useAuthQuery<Expense[]>({
    queryFn: async (supabase) => {
      const { data, error: fetchError } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false })

      if (fetchError) throw fetchError
      return data || []
    }
  })

  const loading = queryLoading || mutating

  const createExpense = async (expenseData: {
    type: string
    description: string
    amount: number
    date: string
    pig_id?: string | null
    invoice_number?: string | null
    supplier?: string | null
  }) => {
    if (!user) throw new Error('Usuario no autenticado')
    setMutating(true)

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          ...expenseData,
          created_by: user.id,
        })
        .select()
        .single()

      if (error) throw error
      await fetchExpenses()
      return data
    } finally {
      setMutating(false)
    }
  }

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    setMutating(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      await fetchExpenses()
      return data
    } finally {
      setMutating(false)
    }
  }

  const deleteExpense = async (id: string) => {
    setMutating(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('expenses').delete().eq('id', id)

      if (error) throw error
      await fetchExpenses()
    } finally {
      setMutating(false)
    }
  }

  return {
    expenses: expenses || [],
    loading,
    error,
    isAuthError,
    fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
  }
}

export function useFinancialSummary() {
  // Usar useAuthQuery para fetch - espera a que auth este listo
  const {
    data: summary,
    loading,
    error,
    isAuthError,
    refetch: fetchSummary
  } = useAuthQuery<ExpenseSummary>({
    queryFn: async (supabase) => {
      // Fetch expenses
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: true })

      if (expensesError) throw expensesError
      const expenses = expensesData as Array<{ amount: number; type: string; date: string }> | null

      // Fetch sold pigs for income
      const { data: soldPigsData, error: pigsError } = await supabase
        .from('pigs')
        .select('sale_price, sale_date')
        .eq('status', 'sold')
        .not('sale_price', 'is', null)

      if (pigsError) throw pigsError
      const soldPigs = soldPigsData as Array<{ sale_price: number; sale_date: string | null }> | null

      // Calculate totals
      const totalExpenses = expenses?.reduce((sum: number, e) => sum + Number(e.amount), 0) || 0
      const totalIncome = soldPigs?.reduce((sum: number, p) => sum + Number(p.sale_price), 0) || 0
      const balance = totalIncome - totalExpenses

      // Expenses by type
      const expensesByType: Record<string, number> = {}
      expenses?.forEach((e) => {
        expensesByType[e.type] = (expensesByType[e.type] || 0) + Number(e.amount)
      })

      // Monthly data (last 6 months)
      const monthlyData: Array<{ month: string; expenses: number; income: number }> = []
      const now = new Date()
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthKey = date.toISOString().slice(0, 7)
        const monthLabel = date.toLocaleDateString('es', { month: 'short', year: '2-digit' })

        const monthExpenses = expenses?.filter((e) => e.date.startsWith(monthKey))
          .reduce((sum: number, e) => sum + Number(e.amount), 0) || 0

        const monthIncome = soldPigs?.filter((p) => p.sale_date?.startsWith(monthKey))
          .reduce((sum: number, p) => sum + Number(p.sale_price), 0) || 0

        monthlyData.push({
          month: monthLabel,
          expenses: monthExpenses,
          income: monthIncome,
        })
      }

      return {
        totalExpenses,
        totalIncome,
        balance,
        expensesByType,
        monthlyData,
      }
    }
  })

  return {
    summary,
    loading,
    error,
    isAuthError,
    fetchSummary,
  }
}
