'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Search, PiggyBank, RefreshCw } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { usePigs } from '@/hooks/use-pigs'
import type { Pig } from '@/types/database'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function PigsPage() {
  const { canEdit } = useAuth()
  const { pigs, loading, error, fetchPigs } = usePigs()
  const [searchTerm, setSearchTerm] = useState('')

  const filteredPigs = pigs.filter(
    (pig) =>
      pig.identifier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pig.pen_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pig.breed?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const activePigs = filteredPigs.filter((p) => p.status === 'active')
  const soldPigs = filteredPigs.filter((p) => p.status === 'sold')
  const deceasedPigs = filteredPigs.filter((p) => p.status === 'deceased')

  const PigCard = ({ pig }: { pig: Pig }) => (
    <Link href={`/pigs/${pig.id}`}>
      <Card className="hover:bg-accent transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <PiggyBank className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">
                  {pig.identifier || 'Sin identificador'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {pig.pen_location || pig.breed || 'Sin ubicacion'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium">
                {pig.current_weight ? `${pig.current_weight} lb` : '-'}
              </p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(pig.purchase_date), 'd MMM', { locale: es })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )

  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-12">
      <PiggyBank className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
      <p className="text-muted-foreground">{message}</p>
      {canEdit && (
        <Link href="/pigs/new">
          <Button className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Registrar Cerdo
          </Button>
        </Link>
      )}
    </div>
  )

  const LoadingSkeleton = () => (
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
              <div>
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  if (error) {
    return (
      <>
        <Header title="Cerdos" />
        <div className="p-4 text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={fetchPigs}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
        </div>
      </>
    )
  }

  return (
    <>
      <Header title="Cerdos" />

      <div className="p-4 space-y-4">
        {/* Search and Add */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por ID, ubicacion o raza..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          {canEdit && (
            <Link href="/pigs/new">
              <Button size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>

        {/* Summary */}
        {!loading && pigs.length > 0 && (
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-green-50 dark:bg-green-950 rounded-lg p-2">
              <p className="text-lg font-bold text-green-600">{activePigs.length}</p>
              <p className="text-xs text-muted-foreground">Activos</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-2">
              <p className="text-lg font-bold text-blue-600">{soldPigs.length}</p>
              <p className="text-xs text-muted-foreground">Vendidos</p>
            </div>
            <div className="bg-red-50 dark:bg-red-950 rounded-lg p-2">
              <p className="text-lg font-bold text-red-600">{deceasedPigs.length}</p>
              <p className="text-xs text-muted-foreground">Fallecidos</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active" className="gap-1 text-xs sm:text-sm">
              Activos
              <Badge variant="secondary" className="ml-1 text-xs">
                {activePigs.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="sold" className="gap-1 text-xs sm:text-sm">
              Vendidos
              <Badge variant="secondary" className="ml-1 text-xs">
                {soldPigs.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="deceased" className="gap-1 text-xs sm:text-sm">
              Fallecidos
              <Badge variant="secondary" className="ml-1 text-xs">
                {deceasedPigs.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-3 mt-4">
            {loading ? (
              <LoadingSkeleton />
            ) : activePigs.length > 0 ? (
              activePigs.map((pig) => <PigCard key={pig.id} pig={pig} />)
            ) : (
              <EmptyState message="No hay cerdos activos" />
            )}
          </TabsContent>

          <TabsContent value="sold" className="space-y-3 mt-4">
            {loading ? (
              <LoadingSkeleton />
            ) : soldPigs.length > 0 ? (
              soldPigs.map((pig) => <PigCard key={pig.id} pig={pig} />)
            ) : (
              <EmptyState message="No hay cerdos vendidos" />
            )}
          </TabsContent>

          <TabsContent value="deceased" className="space-y-3 mt-4">
            {loading ? (
              <LoadingSkeleton />
            ) : deceasedPigs.length > 0 ? (
              deceasedPigs.map((pig) => <PigCard key={pig.id} pig={pig} />)
            ) : (
              <EmptyState message="No hay cerdos fallecidos" />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
