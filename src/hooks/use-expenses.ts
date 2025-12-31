'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Expense } from '@/types/database'
import { useAuthStore } from '@/stores/auth-store'

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
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuthStore()

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data, error: fetchError } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false })

      if (fetchError) throw fetchError
      setExpenses(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar gastos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

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
  }

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
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
  }

  const deleteExpense = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('expenses').delete().eq('id', id)

    if (error) throw error
    await fetchExpenses()
  }

  return {
    expenses,
    loading,
    error,
    fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
  }
}

export function useFinancialSummary() {
  const [summary, setSummary] = useState<ExpenseSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSummary = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Fetch expenses
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: true })

      if (expensesError) throw expensesError

      // Fetch sold pigs for income
      const { data: soldPigs, error: pigsError } = await supabase
        .from('pigs')
        .select('sale_price, sale_date')
        .eq('status', 'sold')
        .not('sale_price', 'is', null)

      if (pigsError) throw pigsError

      // Calculate totals
      const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0
      const totalIncome = soldPigs?.reduce((sum, p) => sum + Number(p.sale_price), 0) || 0
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
          .reduce((sum, e) => sum + Number(e.amount), 0) || 0

        const monthIncome = soldPigs?.filter((p) => p.sale_date?.startsWith(monthKey))
          .reduce((sum, p) => sum + Number(p.sale_price), 0) || 0

        monthlyData.push({
          month: monthLabel,
          expenses: monthExpenses,
          income: monthIncome,
        })
      }

      setSummary({
        totalExpenses,
        totalIncome,
        balance,
        expensesByType,
        monthlyData,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar resumen')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  return {
    summary,
    loading,
    error,
    fetchSummary,
  }
}
