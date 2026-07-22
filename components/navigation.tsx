'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import {
  Bell,
  CalendarHeart,
  CreditCard,
  Home,
  LogOut,
  PawPrint,
  Settings,
} from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { ActionSearchProvider, ActionSearchTrigger } from '@/components/navigation/action-search'
import { NotificationCenter } from '@/components/navigation/notification-center'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const items = [
  { href: '/dashboard', label: 'Today', icon: Home },
  { href: '/pets', label: 'Pets', icon: PawPrint },
  { href: '/vaccinations', label: 'Health', icon: CalendarHeart },
  { href: '/ehealth-card', label: 'Card', icon: CreditCard },
  { href: '/settings', label: 'More', icon: Settings },
]

function isActive(pathname: string, href: string) {
  if (href === '/pets') return pathname === href || pathname.startsWith('/pets/')
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()

  const handleLogout = async () => {
    await logout()
    router.replace('/login')
  }

  return (
    <ActionSearchProvider>
      <header className="glass glass-strong fixed inset-x-0 top-0 z-50 hidden h-20 border-x-0 border-t-0 md:block">
        <div className="mx-auto flex h-full max-w-7xl items-center gap-6 px-6 lg:px-8">
          <Link href="/dashboard" className="flex shrink-0 items-center gap-2.5" aria-label="JoyCare home">
            <span className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <PawPrint className="size-5" aria-hidden="true" />
            </span>
            <span className="text-lg font-semibold tracking-tight">JoyCare</span>
          </Link>

          <nav className="flex items-center gap-1" aria-label="Primary navigation">
            {items.slice(0, 4).map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href)
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative flex min-h-11 items-center gap-2 rounded-2xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
                    active && 'text-foreground',
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="desktop-nav-active"
                      className="absolute inset-0 -z-10 rounded-2xl bg-accent"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                  <Icon className="size-4" aria-hidden="true" />
                  {label}
                </Link>
              )
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <ActionSearchTrigger />
            <NotificationCenter trigger={<Bell className="size-5" />} />
            <DropdownMenu>
              <DropdownMenuTrigger className="ios-control flex min-h-11 items-center gap-2 rounded-2xl px-2.5 hover:bg-accent" aria-label="Open profile menu">
                <span className="grid size-8 place-items-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
                  {(user?.full_name || user?.email || 'J').slice(0, 1).toUpperCase()}
                </span>
                <span className="hidden max-w-36 truncate text-sm font-medium lg:block">
                  {user?.full_name || 'Pet parent'}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2">
                <DropdownMenuLabel>
                  <span className="block truncate">{user?.full_name || 'Pet parent'}</span>
                  <span className="block truncate text-xs font-normal text-muted-foreground">{user?.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="min-h-10 rounded-xl">
                  <Link href="/settings"><Settings className="size-4" />Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="min-h-10 rounded-xl text-destructive focus:text-destructive">
                  <LogOut className="size-4" />Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <header className="glass glass-strong fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-x-0 border-t-0 px-4 md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2 text-base font-semibold" aria-label="JoyCare home">
          <span className="grid size-9 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <PawPrint className="size-4" />
          </span>
          JoyCare
        </Link>
        <div className="flex items-center gap-1">
          <ActionSearchTrigger compact />
          <NotificationCenter trigger={<Bell className="size-5" />} />
        </div>
      </header>

      <nav
        className="glass glass-strong fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-md items-center justify-around rounded-[1.65rem] p-1.5 md:hidden"
        aria-label="Primary navigation"
      >
        {items.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href)
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              aria-label={label}
              className={cn(
                'relative flex min-h-12 items-center justify-center gap-1.5 overflow-hidden rounded-[1.2rem] px-3 text-muted-foreground',
                active && 'text-primary-foreground',
              )}
            >
              {active && (
                <motion.span
                  layoutId="mobile-toolbar-active"
                  className="absolute inset-0 -z-10 rounded-[1.2rem] bg-primary"
                  transition={{ type: 'spring', stiffness: 440, damping: 32 }}
                />
              )}
              <Icon className="size-5 shrink-0" aria-hidden="true" />
              <motion.span
                initial={false}
                animate={{ width: active ? 'auto' : 0, opacity: active ? 1 : 0 }}
                className="overflow-hidden whitespace-nowrap text-xs font-semibold"
              >
                {label}
              </motion.span>
            </Link>
          )
        })}
      </nav>
    </ActionSearchProvider>
  )
}
