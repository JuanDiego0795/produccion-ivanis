'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, PiggyBank, Wallet, CalendarDays, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/pigs',
    label: 'Cerdos',
    icon: PiggyBank,
  },
  {
    href: '/finances',
    label: 'Finanzas',
    icon: Wallet,
  },
  {
    href: '/calendar',
    label: 'Calendario',
    icon: CalendarDays,
  },
  {
    href: '/profile',
    label: 'Perfil',
    icon: User,
  },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border pb-safe">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center w-full h-full gap-1 transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className={cn('h-5 w-5', isActive && 'text-primary')} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
