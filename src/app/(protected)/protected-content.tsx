'use client'

import { BottomNav } from '@/components/layout/bottom-nav'

interface ProtectedContentProps {
  children: React.ReactNode
}

export function ProtectedContent({ children }: ProtectedContentProps) {
  return (
    <div className="min-h-screen bg-background">
      <main className="pb-20">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
