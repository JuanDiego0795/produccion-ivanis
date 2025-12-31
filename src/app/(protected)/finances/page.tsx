'use client'

import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Receipt,
  Wheat,
  Syringe,
  Pill,
  Stethoscope,
  Truck,
  Building,
  Users,
  Lightbulb,
  MoreHorizontal,
  RefreshCw,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useExpenses, useFinancialSummary } from '@/hooks/use-expenses'
import { expenseTypeOptions } from '@/lib/validations/expense'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const iconMap: Record<string, React.ElementType> = {
  Wheat: Wheat,
  Syringe: Syringe,
  Pill: Pill,
  Stethoscope: Stethoscope,
  Truck: Truck,
  Building: Building,
  Users: Users,
  Lightbulb: Lightbulb,
  MoreHorizontal: MoreHorizontal,
}

const COLORS = ['#16a34a', '#2563eb', '#dc2626', '#eab308', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6b7280']

export default function FinancesPage() {
  const { canEdit } = useAuth()
  const { expenses, loading: expensesLoading, fetchExpenses } = useExpenses()
  const { summary, loading: summaryLoading, error, fetchSummary } = useFinancialSummary()

  const loading = expensesLoading || summaryLoading

  const getExpenseIcon = (type: string) => {
    const option = expenseTypeOptions.find((o) => o.value === type)
    if (!option) return Receipt
    return iconMap[option.icon] || Receipt
  }

  const getExpenseLabel = (type: string) => {
    const option = expenseTypeOptions.find((o) => o.value === type)
    return option?.label || type
  }

  // Recent transactions (last 10)
  const recentExpenses = expenses.slice(0, 10)

  // Pie chart data
  const pieData = summary
    ? Object.entries(summary.expensesByType).map(([type, amount], index) => ({
        name: getExpenseLabel(type),
        value: amount,
        color: COLORS[index % COLORS.length],
      }))
    : []

  if (error) {
    return (
      <>
        <Header title="Finanzas" />
        <div className="p-4 text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => { fetchExpenses(); fetchSummary(); }}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
        </div>
      </>
    )
  }

  return (
    <>
      <Header title="Finanzas" />

      <div className="p-4 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4">
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">
                Balance Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-32 bg-white/20" />
              ) : (
                <div className={`text-3xl font-bold ${(summary?.balance || 0) < 0 ? 'text-red-200' : ''}`}>
                  ${(summary?.balance || 0).toLocaleString()}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Ingresos
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-6 w-24" />
                ) : (
                  <div className="text-xl font-bold text-green-600">
                    ${(summary?.totalIncome || 0).toLocaleString()}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Gastos
                </CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-6 w-24" />
                ) : (
                  <div className="text-xl font-bold text-red-600">
                    ${(summary?.totalExpenses || 0).toLocaleString()}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        {canEdit && (
          <Link href="/finances/expense">
            <Button className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Registrar Gasto
            </Button>
          </Link>
        )}

        {/* Charts */}
        {!loading && summary && (
          <div className="space-y-4">
            {/* Monthly Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Flujo de Caja (6 meses)</CardTitle>
              </CardHeader>
              <CardContent>
                {summary.monthlyData.some((d) => d.expenses > 0 || d.income > 0) ? (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={summary.monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="income" name="Ingresos" fill="#16a34a" />
                        <Bar dataKey="expenses" name="Gastos" fill="#dc2626" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No hay datos para mostrar
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Expenses by Type */}
            {pieData.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Gastos por Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name} (${((percent || 0) * 100).toFixed(0)}%)`
                          }
                          labelLine={false}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Transactions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Gastos Recientes</h3>
            <Link href="/finances/history">
              <Button variant="ghost" size="sm">
                Ver todo
              </Button>
            </Link>
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="expenses">Solo Gastos</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-3 mt-4">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="flex-1">
                            <Skeleton className="h-4 w-32 mb-2" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                          <Skeleton className="h-4 w-16" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : recentExpenses.length > 0 ? (
                recentExpenses.map((expense) => {
                  const Icon = getExpenseIcon(expense.type)
                  return (
                    <Card key={expense.id}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">{expense.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(expense.date), 'd MMM yyyy', { locale: es })}
                              {' - '}
                              {getExpenseLabel(expense.type)}
                            </p>
                          </div>
                        </div>
                        <p className="font-semibold text-red-600">
                          -${Number(expense.amount).toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>
                  )
                })
              ) : (
                <div className="text-center py-12">
                  <Receipt className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">
                    No hay movimientos registrados
                  </p>
                  {canEdit && (
                    <Link href="/finances/expense">
                      <Button className="mt-4">
                        <Plus className="mr-2 h-4 w-4" />
                        Registrar Gasto
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="expenses" className="space-y-3 mt-4">
              {loading ? (
                <Skeleton className="h-24 w-full" />
              ) : recentExpenses.length > 0 ? (
                recentExpenses.map((expense) => {
                  const Icon = getExpenseIcon(expense.type)
                  return (
                    <Card key={expense.id}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">{expense.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(expense.date), 'd MMM yyyy', { locale: es })}
                            </p>
                          </div>
                        </div>
                        <p className="font-semibold text-red-600">
                          -${Number(expense.amount).toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>
                  )
                })
              ) : (
                <div className="text-center py-12">
                  <Receipt className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No hay gastos registrados</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  )
}
