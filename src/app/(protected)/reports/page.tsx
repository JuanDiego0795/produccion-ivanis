'use client'

import { useState, useMemo } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  FileText,
  FileSpreadsheet,
  Download,
  Loader2,
  PiggyBank,
  DollarSign,
  Syringe,
  TrendingUp,
  Calendar,
} from 'lucide-react'
import { usePigs } from '@/hooks/use-pigs'
import { useExpenses, useFinancialSummary } from '@/hooks/use-expenses'
import { useVaccinations } from '@/hooks/use-vaccinations'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'

type ReportType = 'inventory' | 'finances' | 'vaccinations' | 'profitability'

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('inventory')
  const [dateFrom, setDateFrom] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-dd'))
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [exporting, setExporting] = useState(false)

  const { pigs, loading: pigsLoading } = usePigs()
  const { expenses, loading: expensesLoading } = useExpenses()
  const { summary } = useFinancialSummary()
  const { vaccinations, loading: vaccinationsLoading } = useVaccinations()

  const loading = pigsLoading || expensesLoading || vaccinationsLoading

  // Filter data by date range
  const filteredPigs = useMemo(() => {
    return pigs.filter((p) => {
      const date = new Date(p.purchase_date)
      return date >= new Date(dateFrom) && date <= new Date(dateTo)
    })
  }, [pigs, dateFrom, dateTo])

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const date = new Date(e.date)
      return date >= new Date(dateFrom) && date <= new Date(dateTo)
    })
  }, [expenses, dateFrom, dateTo])

  const filteredVaccinations = useMemo(() => {
    return vaccinations.filter((v) => {
      const date = new Date(v.application_date)
      return date >= new Date(dateFrom) && date <= new Date(dateTo)
    })
  }, [vaccinations, dateFrom, dateTo])

  // Calculate summary stats for the selected period
  const periodStats = useMemo(() => {
    const activePigs = pigs.filter((p) => p.status === 'active').length
    const soldPigs = filteredPigs.filter((p) => p.status === 'sold')
    const totalSales = soldPigs.reduce((sum, p) => sum + (p.sale_price || 0), 0)
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0)
    const profit = totalSales - totalExpenses

    return {
      activePigs,
      soldCount: soldPigs.length,
      totalSales,
      totalExpenses,
      profit,
      vaccinationsCount: filteredVaccinations.length,
    }
  }, [pigs, filteredPigs, filteredExpenses, filteredVaccinations])

  const exportToPDF = async () => {
    setExporting(true)
    try {
      const { jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')

      const doc = new jsPDF()
      const title = getReportTitle()
      const dateRange = `${format(new Date(dateFrom), 'd MMM yyyy', { locale: es })} - ${format(new Date(dateTo), 'd MMM yyyy', { locale: es })}`

      // Header
      doc.setFontSize(18)
      doc.text('Produccion Ivanis', 14, 20)
      doc.setFontSize(14)
      doc.text(title, 14, 30)
      doc.setFontSize(10)
      doc.text(`Periodo: ${dateRange}`, 14, 38)
      doc.text(`Generado: ${format(new Date(), 'd MMM yyyy HH:mm', { locale: es })}`, 14, 44)

      let startY = 55

      if (reportType === 'inventory') {
        // Summary
        doc.setFontSize(12)
        doc.text('Resumen de Inventario', 14, startY)
        startY += 8

        autoTable(doc, {
          startY,
          head: [['Metrica', 'Valor']],
          body: [
            ['Cerdos Activos', pigs.filter((p) => p.status === 'active').length.toString()],
            ['Cerdos Vendidos (periodo)', filteredPigs.filter((p) => p.status === 'sold').length.toString()],
            ['Bajas (periodo)', filteredPigs.filter((p) => p.status === 'deceased').length.toString()],
          ],
        })

        startY = (doc as any).lastAutoTable.finalY + 10
        doc.text('Detalle de Cerdos', 14, startY)
        startY += 8

        autoTable(doc, {
          startY,
          head: [['ID', 'Estado', 'Fecha Compra', 'Precio Compra', 'Peso Actual']],
          body: filteredPigs.map((p) => [
            p.identifier || p.id.slice(0, 8),
            p.status === 'active' ? 'Activo' : p.status === 'sold' ? 'Vendido' : 'Baja',
            format(new Date(p.purchase_date), 'd/MM/yyyy'),
            `$${p.purchase_price.toLocaleString()}`,
            p.current_weight ? `${p.current_weight} lb` : '-',
          ]),
        })
      } else if (reportType === 'finances') {
        doc.setFontSize(12)
        doc.text('Resumen Financiero', 14, startY)
        startY += 8

        autoTable(doc, {
          startY,
          head: [['Metrica', 'Valor']],
          body: [
            ['Total Ventas', `$${periodStats.totalSales.toLocaleString()}`],
            ['Total Gastos', `$${periodStats.totalExpenses.toLocaleString()}`],
            ['Balance', `$${periodStats.profit.toLocaleString()}`],
          ],
        })

        startY = (doc as any).lastAutoTable.finalY + 10
        doc.text('Detalle de Gastos', 14, startY)
        startY += 8

        autoTable(doc, {
          startY,
          head: [['Fecha', 'Tipo', 'Descripcion', 'Monto']],
          body: filteredExpenses.map((e) => [
            format(new Date(e.date), 'd/MM/yyyy'),
            e.type,
            e.description,
            `$${e.amount.toLocaleString()}`,
          ]),
        })
      } else if (reportType === 'vaccinations') {
        doc.setFontSize(12)
        doc.text('Resumen de Vacunaciones', 14, startY)
        startY += 8

        autoTable(doc, {
          startY,
          head: [['Metrica', 'Valor']],
          body: [
            ['Total Vacunaciones', filteredVaccinations.length.toString()],
            ['Vacunas Pendientes', vaccinations.filter((v) => v.next_dose_date).length.toString()],
          ],
        })

        startY = (doc as any).lastAutoTable.finalY + 10
        doc.text('Detalle de Vacunaciones', 14, startY)
        startY += 8

        autoTable(doc, {
          startY,
          head: [['Fecha', 'Vacuna', 'Dosis', 'Aplicada por', 'Proxima Dosis']],
          body: filteredVaccinations.map((v) => [
            format(new Date(v.application_date), 'd/MM/yyyy'),
            v.vaccine_name,
            v.dose_number.toString(),
            v.administered_by,
            v.next_dose_date ? format(new Date(v.next_dose_date), 'd/MM/yyyy') : '-',
          ]),
        })
      } else if (reportType === 'profitability') {
        doc.setFontSize(12)
        doc.text('Analisis de Rentabilidad', 14, startY)
        startY += 8

        const soldPigs = filteredPigs.filter((p) => p.status === 'sold')
        const totalPurchase = soldPigs.reduce((sum, p) => sum + p.purchase_price, 0)
        const totalSale = soldPigs.reduce((sum, p) => sum + (p.sale_price || 0), 0)
        const grossProfit = totalSale - totalPurchase
        const roi = totalPurchase > 0 ? ((grossProfit / totalPurchase) * 100).toFixed(1) : '0'

        autoTable(doc, {
          startY,
          head: [['Metrica', 'Valor']],
          body: [
            ['Cerdos Vendidos', soldPigs.length.toString()],
            ['Costo Total Compra', `$${totalPurchase.toLocaleString()}`],
            ['Ingreso Total Venta', `$${totalSale.toLocaleString()}`],
            ['Ganancia Bruta', `$${grossProfit.toLocaleString()}`],
            ['Gastos Operativos', `$${periodStats.totalExpenses.toLocaleString()}`],
            ['Ganancia Neta', `$${(grossProfit - periodStats.totalExpenses).toLocaleString()}`],
            ['ROI', `${roi}%`],
          ],
        })

        if (soldPigs.length > 0) {
          startY = (doc as any).lastAutoTable.finalY + 10
          doc.text('Detalle de Ventas', 14, startY)
          startY += 8

          autoTable(doc, {
            startY,
            head: [['ID', 'Precio Compra', 'Precio Venta', 'Ganancia', 'Fecha Venta']],
            body: soldPigs.map((p) => [
              p.identifier || p.id.slice(0, 8),
              `$${p.purchase_price.toLocaleString()}`,
              `$${(p.sale_price || 0).toLocaleString()}`,
              `$${((p.sale_price || 0) - p.purchase_price).toLocaleString()}`,
              p.sale_date ? format(new Date(p.sale_date), 'd/MM/yyyy') : '-',
            ]),
          })
        }
      }

      doc.save(`reporte-${reportType}-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
      toast.success('PDF generado correctamente')
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Error al generar PDF')
    } finally {
      setExporting(false)
    }
  }

  const exportToExcel = async () => {
    setExporting(true)
    try {
      const XLSX = await import('xlsx')

      const workbook = XLSX.utils.book_new()
      const dateRange = `${format(new Date(dateFrom), 'd-MM-yyyy')} a ${format(new Date(dateTo), 'd-MM-yyyy')}`

      if (reportType === 'inventory') {
        // Summary sheet
        const summaryData = [
          ['Reporte de Inventario - Produccion Ivanis'],
          [`Periodo: ${dateRange}`],
          [],
          ['Metrica', 'Valor'],
          ['Cerdos Activos', pigs.filter((p) => p.status === 'active').length],
          ['Cerdos Vendidos (periodo)', filteredPigs.filter((p) => p.status === 'sold').length],
          ['Bajas (periodo)', filteredPigs.filter((p) => p.status === 'deceased').length],
        ]
        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen')

        // Detail sheet
        const detailData = [
          ['ID', 'Estado', 'Fecha Compra', 'Precio Compra', 'Peso Actual', 'Raza', 'Ubicacion'],
          ...filteredPigs.map((p) => [
            p.identifier || p.id.slice(0, 8),
            p.status === 'active' ? 'Activo' : p.status === 'sold' ? 'Vendido' : 'Baja',
            format(new Date(p.purchase_date), 'd/MM/yyyy'),
            p.purchase_price,
            p.current_weight || '',
            p.breed || '',
            p.pen_location || '',
          ]),
        ]
        const detailSheet = XLSX.utils.aoa_to_sheet(detailData)
        XLSX.utils.book_append_sheet(workbook, detailSheet, 'Detalle')
      } else if (reportType === 'finances') {
        const summaryData = [
          ['Reporte Financiero - Produccion Ivanis'],
          [`Periodo: ${dateRange}`],
          [],
          ['Metrica', 'Valor'],
          ['Total Ventas', periodStats.totalSales],
          ['Total Gastos', periodStats.totalExpenses],
          ['Balance', periodStats.profit],
        ]
        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen')

        const expensesData = [
          ['Fecha', 'Tipo', 'Descripcion', 'Monto', 'Proveedor', 'No. Factura'],
          ...filteredExpenses.map((e) => [
            format(new Date(e.date), 'd/MM/yyyy'),
            e.type,
            e.description,
            e.amount,
            e.supplier || '',
            e.invoice_number || '',
          ]),
        ]
        const expensesSheet = XLSX.utils.aoa_to_sheet(expensesData)
        XLSX.utils.book_append_sheet(workbook, expensesSheet, 'Gastos')
      } else if (reportType === 'vaccinations') {
        const data = [
          ['Reporte de Vacunaciones - Produccion Ivanis'],
          [`Periodo: ${dateRange}`],
          [],
          ['Fecha', 'Vacuna', 'Dosis', 'Aplicada por', 'Proxima Dosis', 'Notas'],
          ...filteredVaccinations.map((v) => [
            format(new Date(v.application_date), 'd/MM/yyyy'),
            v.vaccine_name,
            v.dose_number,
            v.administered_by,
            v.next_dose_date ? format(new Date(v.next_dose_date), 'd/MM/yyyy') : '',
            v.notes || '',
          ]),
        ]
        const sheet = XLSX.utils.aoa_to_sheet(data)
        XLSX.utils.book_append_sheet(workbook, sheet, 'Vacunaciones')
      } else if (reportType === 'profitability') {
        const soldPigs = filteredPigs.filter((p) => p.status === 'sold')
        const totalPurchase = soldPigs.reduce((sum, p) => sum + p.purchase_price, 0)
        const totalSale = soldPigs.reduce((sum, p) => sum + (p.sale_price || 0), 0)
        const grossProfit = totalSale - totalPurchase
        const roi = totalPurchase > 0 ? ((grossProfit / totalPurchase) * 100).toFixed(1) : '0'

        const summaryData = [
          ['Analisis de Rentabilidad - Produccion Ivanis'],
          [`Periodo: ${dateRange}`],
          [],
          ['Metrica', 'Valor'],
          ['Cerdos Vendidos', soldPigs.length],
          ['Costo Total Compra', totalPurchase],
          ['Ingreso Total Venta', totalSale],
          ['Ganancia Bruta', grossProfit],
          ['Gastos Operativos', periodStats.totalExpenses],
          ['Ganancia Neta', grossProfit - periodStats.totalExpenses],
          ['ROI (%)', roi],
        ]
        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen')

        if (soldPigs.length > 0) {
          const detailData = [
            ['ID', 'Precio Compra', 'Precio Venta', 'Ganancia', 'Fecha Compra', 'Fecha Venta'],
            ...soldPigs.map((p) => [
              p.identifier || p.id.slice(0, 8),
              p.purchase_price,
              p.sale_price || 0,
              (p.sale_price || 0) - p.purchase_price,
              format(new Date(p.purchase_date), 'd/MM/yyyy'),
              p.sale_date ? format(new Date(p.sale_date), 'd/MM/yyyy') : '',
            ]),
          ]
          const detailSheet = XLSX.utils.aoa_to_sheet(detailData)
          XLSX.utils.book_append_sheet(workbook, detailSheet, 'Ventas')
        }
      }

      XLSX.writeFile(workbook, `reporte-${reportType}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`)
      toast.success('Excel generado correctamente')
    } catch (error) {
      console.error('Error generating Excel:', error)
      toast.error('Error al generar Excel')
    } finally {
      setExporting(false)
    }
  }

  const getReportTitle = () => {
    switch (reportType) {
      case 'inventory':
        return 'Reporte de Inventario'
      case 'finances':
        return 'Reporte Financiero'
      case 'vaccinations':
        return 'Reporte de Vacunaciones'
      case 'profitability':
        return 'Analisis de Rentabilidad'
    }
  }

  const getReportIcon = () => {
    switch (reportType) {
      case 'inventory':
        return <PiggyBank className="h-5 w-5" />
      case 'finances':
        return <DollarSign className="h-5 w-5" />
      case 'vaccinations':
        return <Syringe className="h-5 w-5" />
      case 'profitability':
        return <TrendingUp className="h-5 w-5" />
    }
  }

  if (loading) {
    return (
      <>
        <Header title="Reportes" />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    )
  }

  return (
    <>
      <Header title="Reportes" />

      <div className="p-4 space-y-6">
        {/* Report Type Selection */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { type: 'inventory' as ReportType, label: 'Inventario', icon: PiggyBank },
            { type: 'finances' as ReportType, label: 'Finanzas', icon: DollarSign },
            { type: 'vaccinations' as ReportType, label: 'Vacunas', icon: Syringe },
            { type: 'profitability' as ReportType, label: 'Rentabilidad', icon: TrendingUp },
          ].map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              onClick={() => setReportType(type)}
              className={`flex items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                reportType === type
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </div>

        {/* Date Range */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Periodo del Reporte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateFrom">Desde</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateTo">Hasta</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const now = new Date()
                  setDateFrom(format(startOfMonth(now), 'yyyy-MM-dd'))
                  setDateTo(format(endOfMonth(now), 'yyyy-MM-dd'))
                }}
              >
                Este Mes
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const lastMonth = subMonths(new Date(), 1)
                  setDateFrom(format(startOfMonth(lastMonth), 'yyyy-MM-dd'))
                  setDateTo(format(endOfMonth(lastMonth), 'yyyy-MM-dd'))
                }}
              >
                Mes Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDateFrom(format(subMonths(new Date(), 3), 'yyyy-MM-dd'))
                  setDateTo(format(new Date(), 'yyyy-MM-dd'))
                }}
              >
                3 Meses
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getReportIcon()}
              {getReportTitle()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {reportType === 'inventory' && (
                <>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{pigs.filter((p) => p.status === 'active').length}</p>
                    <p className="text-sm text-muted-foreground">Cerdos Activos</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{filteredPigs.filter((p) => p.status === 'sold').length}</p>
                    <p className="text-sm text-muted-foreground">Vendidos (periodo)</p>
                  </div>
                </>
              )}
              {reportType === 'finances' && (
                <>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold text-green-600">${periodStats.totalSales.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Ventas</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold text-red-600">${periodStats.totalExpenses.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Gastos</p>
                  </div>
                </>
              )}
              {reportType === 'vaccinations' && (
                <>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{filteredVaccinations.length}</p>
                    <p className="text-sm text-muted-foreground">Vacunaciones</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{vaccinations.filter((v) => v.next_dose_date).length}</p>
                    <p className="text-sm text-muted-foreground">Pendientes</p>
                  </div>
                </>
              )}
              {reportType === 'profitability' && (
                <>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className={`text-2xl font-bold ${periodStats.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${periodStats.profit.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">Balance</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{periodStats.soldCount}</p>
                    <p className="text-sm text-muted-foreground">Cerdos Vendidos</p>
                  </div>
                </>
              )}
            </div>

            {/* Export Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={exportToPDF}
                disabled={exporting}
                className="flex-1"
                variant="outline"
              >
                {exporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="mr-2 h-4 w-4" />
                )}
                Exportar PDF
              </Button>
              <Button
                onClick={exportToExcel}
                disabled={exporting}
                className="flex-1"
              >
                {exporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                )}
                Exportar Excel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
