'use client'

import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  PiggyBank,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Percent,
  AlertTriangle,
  Syringe,
  Loader2,
  Skull,
  ShoppingCart,
  Scale,
  Calendar,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { usePigs } from '@/hooks/use-pigs'
import { useFinancialSummary } from '@/hooks/use-expenses'
import { useVaccinations } from '@/hooks/use-vaccinations'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function DashboardPage() {
  const { profile } = useAuth()
  const { pigs, loading: pigsLoading } = usePigs()
  const { summary, loading: summaryLoading } = useFinancialSummary()
  const { overdueVaccinations, upcomingVaccinations, loading: vaccinationsLoading } = useVaccinations()

  const loading = pigsLoading || summaryLoading || vaccinationsLoading

  // Calculate pig statistics
  const activePigs = pigs.filter((p) => p.status === 'active')
  const soldPigs = pigs.filter((p) => p.status === 'sold')
  const deadPigs = pigs.filter((p) => p.status === 'deceased')

  // Calculate average weight of active pigs
  const avgWeight = activePigs.length > 0
    ? activePigs.reduce((sum, p) => sum + (p.current_weight || 0), 0) / activePigs.length
    : 0

  // Calculate total investment in active pigs
  const totalInvestment = activePigs.reduce((sum, p) => sum + (p.purchase_price || 0), 0)

  // Calculate total revenue from sold pigs
  const totalRevenue = soldPigs.reduce((sum, p) => sum + (p.sale_price || 0), 0)

  // Calculate ROI
  const totalExpenses = summary?.totalExpenses || 0
  const totalIncome = summary?.totalIncome || 0
  const balance = totalIncome - totalExpenses
  const roi = totalExpenses > 0 ? ((totalIncome - totalExpenses) / totalExpenses * 100) : 0

  // Current month profit
  const currentMonth = new Date().toISOString().slice(0, 7)
  const monthlyData = summary?.monthlyData || []
  const currentMonthData = monthlyData.find((m) => {
    const monthDate = new Date()
    const monthLabel = monthDate.toLocaleDateString('es', { month: 'short', year: '2-digit' })
    return m.month === monthLabel
  })
  const monthlyProfit = currentMonthData ? currentMonthData.income - currentMonthData.expenses : 0

  // Recent activity - last 5 sold/deceased pigs
  const recentActivity = [...pigs]
    .filter((p) => p.status === 'sold' || p.status === 'deceased')
    .sort((a, b) => {
      const dateA = a.sale_date || a.death_date || ''
      const dateB = b.sale_date || b.death_date || ''
      return dateB.localeCompare(dateA)
    })
    .slice(0, 5)

  const pendingVaccinations = overdueVaccinations.length + upcomingVaccinations.length

  if (loading) {
    return (
      <>
        <Header title="Dashboard" />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    )
  }

  return (
    <>
      <Header title="Dashboard" />

      <div className="p-4 space-y-6">
        {/* Welcome message */}
        <div>
          <h2 className="text-xl font-semibold">
            Hola, {profile?.full_name?.split(' ')[0] || 'Usuario'}
          </h2>
          <p className="text-muted-foreground text-sm">
            Resumen de tu granja porcina
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Cerdos Activos
              </CardTitle>
              <PiggyBank className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activePigs.length}</div>
              <p className="text-xs text-muted-foreground">
                {soldPigs.length} vendidos, {deadPigs.length} bajas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Balance Total
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${balance.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">ingresos - gastos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ganancia Mes
              </CardTitle>
              {monthlyProfit >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${monthlyProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${monthlyProfit.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">este mes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                ROI Total
              </CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {roi.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">retorno</p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <Scale className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <div className="text-lg font-bold">{avgWeight.toFixed(0)} lb</div>
              <p className="text-xs text-muted-foreground">Peso prom.</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <ShoppingCart className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <div className="text-lg font-bold">${totalInvestment.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Inversion</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <DollarSign className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <div className="text-lg font-bold">${totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Ventas</p>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Chart */}
        {monthlyData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Tendencia (6 meses)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} width={40} />
                    <Tooltip
                      formatter={(value) => `$${Number(value).toLocaleString()}`}
                      labelStyle={{ fontSize: 12 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="income"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={false}
                      name="Ingresos"
                    />
                    <Line
                      type="monotone"
                      dataKey="expenses"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={false}
                      name="Gastos"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Alerts Section */}
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Alertas y Recordatorios
          </h3>

          {overdueVaccinations.length > 0 && (
            <Link href="/vaccinations">
              <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
                <CardContent className="flex items-center gap-3 p-4">
                  <Syringe className="h-5 w-5 text-red-600" />
                  <div className="flex-1">
                    <p className="font-medium text-red-800 dark:text-red-200">
                      {overdueVaccinations.length} vacunas vencidas
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      Requieren atencion inmediata
                    </p>
                  </div>
                  <Badge variant="destructive">{overdueVaccinations.length}</Badge>
                </CardContent>
              </Card>
            </Link>
          )}

          {upcomingVaccinations.length > 0 && (
            <Link href="/calendar">
              <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
                <CardContent className="flex items-center gap-3 p-4">
                  <Calendar className="h-5 w-5 text-amber-600" />
                  <div className="flex-1">
                    <p className="font-medium text-amber-800 dark:text-amber-200">
                      {upcomingVaccinations.length} vacunas proximas
                    </p>
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      En los proximos 7 dias
                    </p>
                  </div>
                  <Badge className="bg-amber-500">{upcomingVaccinations.length}</Badge>
                </CardContent>
              </Card>
            </Link>
          )}

          {pendingVaccinations === 0 && (
            <Card>
              <CardContent className="p-4 text-center text-muted-foreground">
                No hay alertas pendientes
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Actividad Reciente</h3>
            <div className="space-y-2">
              {recentActivity.map((pig) => (
                <Card key={pig.id}>
                  <CardContent className="flex items-center gap-3 p-3">
                    {pig.status === 'sold' ? (
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                        <DollarSign className="h-4 w-4 text-green-600" />
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <Skull className="h-4 w-4 text-gray-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {pig.identifier || `Cerdo ${pig.id.slice(0, 8)}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {pig.status === 'sold'
                          ? `Vendido por $${pig.sale_price?.toLocaleString()}`
                          : `Baja: ${pig.death_reason || 'Sin especificar'}`}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {pig.sale_date || pig.death_date
                        ? format(new Date(pig.sale_date || pig.death_date!), 'd MMM', { locale: es })
                        : ''}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="space-y-3">
          <h3 className="font-semibold">Acciones Rapidas</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/pigs/new"
              className="flex items-center justify-center gap-2 p-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              <PiggyBank className="h-5 w-5" />
              Nuevo Cerdo
            </Link>
            <Link
              href="/finances/expense"
              className="flex items-center justify-center gap-2 p-4 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
            >
              <DollarSign className="h-5 w-5" />
              Registrar Gasto
            </Link>
            <Link
              href="/vaccinations/new"
              className="flex items-center justify-center gap-2 p-4 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
            >
              <Syringe className="h-5 w-5" />
              Nueva Vacuna
            </Link>
            <Link
              href="/calendar"
              className="flex items-center justify-center gap-2 p-4 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
            >
              <Calendar className="h-5 w-5" />
              Calendario
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
