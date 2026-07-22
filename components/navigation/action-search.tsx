'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarPlus, CornerDownLeft, CreditCard, Loader2, PawPrint, Search, Settings, Syringe, X } from 'lucide-react'
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { cn } from '@/lib/utils'

const actions = [
  { label: 'Add a pet', description: 'Create a new pet profile', href: '/pets/new', icon: PawPrint, keywords: ['new', 'create', 'animal'] },
  { label: 'Record vaccination', description: 'Add an owner-maintained vaccine record', href: '/vaccinations/new', icon: Syringe, keywords: ['vaccine', 'shot', 'health'] },
  { label: 'Open health card', description: 'View or securely share the orange card', href: '/ehealth-card', icon: CreditCard, keywords: ['qr', 'share', 'card'] },
  { label: 'View reminders', description: 'Review scheduled and overdue care', href: '/vaccinations?view=reminders', icon: CalendarPlus, keywords: ['due', 'notification', 'schedule'] },
  { label: 'Open settings', description: 'Manage profile, Telegram, and appearance', href: '/settings', icon: Settings, keywords: ['profile', 'telegram', 'theme'] },
]

const ActionSearchContext = createContext<{ openSearch: () => void } | null>(null)

export function ActionSearchProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [pets, setPets] = useState<Array<{ id: string; name: string; species: string }>>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        if (event.repeat) return
        const nextOpen = !open
        setOpen(nextOpen)
        if (!nextOpen) setQuery('')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    if (!open || !user?.id) return
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setLoadError(null)
      const { data, error } = await supabase
        .from('pets')
        .select('id, name, species')
        .eq('user_id', user.id)
        .order('name')
        .limit(20)
      if (cancelled) return
      setPets(data ?? [])
      setLoadError(error ? 'Pets could not be loaded. Quick actions are still available.' : null)
      setLoading(false)
    }
    void load()
    return () => { cancelled = true }
  }, [open, user?.id])

  const navigate = (href: string) => {
    setOpen(false)
    setQuery('')
    router.push(href)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) setQuery('')
  }

  return (
    <ActionSearchContext.Provider value={{ openSearch: () => setOpen(true) }}>
      {children}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
        showCloseButton={false}
        overlayClassName="bg-background/1 backdrop-blur-xs"
        className="glass glass-strong top-[max(4.5rem,10vh)] w-[calc(100%-1.5rem)] max-w-xl translate-y-0 gap-0 overflow-hidden rounded-[1.75rem] border-border/80 bg-popover/95 p-0 shadow-2xl sm:w-[calc(100%-2rem)]"
      >
        <DialogTitle className="sr-only">Search JoyCare</DialogTitle>
        <Command className="bg-transparent [&_[data-slot=command-input-wrapper]]:h-16 [&_[data-slot=command-input-wrapper]]:px-4" shouldFilter>
          <div className="relative">
            <CommandInput
              autoFocus
              value={query}
              onValueChange={setQuery}
              placeholder="Find a pet or choose an action…"
              className="h-16 pr-12 text-base"
            />
            <DialogClose asChild>
              <button type="button" aria-label="Close search" className="absolute right-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <X className="size-4" />
              </button>
            </DialogClose>
          </div>

          <CommandList className="min-h-64 max-h-[min(55vh,27rem)] scroll-py-2 p-2">
            <CommandEmpty>
              <div className="grid min-h-52 place-items-center px-6 text-center">
                <div><Search className="mx-auto mb-3 size-7 text-muted-foreground/60" /><p className="font-medium">No matches found</p><p className="mt-1 text-sm text-muted-foreground">Try a pet name or an action like “reminders”.</p></div>
              </div>
            </CommandEmpty>

            {loading && (
              <div className="flex min-h-16 items-center justify-center gap-2 text-sm text-muted-foreground" role="status">
                <Loader2 className="size-4 animate-spin" /> Loading pets…
              </div>
            )}
            {loadError && <p className="mx-2 mb-2 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{loadError}</p>}

            {!loading && pets.length > 0 && (
              <CommandGroup heading="Pets" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-2 [&_[cmdk-group-heading]]:pt-1 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.14em]">
                {pets.map((pet) => (
                  <CommandItem
                    key={pet.id}
                    value={pet.name}
                    keywords={[pet.species]}
                    onSelect={() => navigate(`/pets/${pet.id}`)}
                    className="group min-h-14 cursor-pointer gap-3 rounded-2xl px-3 data-[selected=true]:bg-accent"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-secondary text-secondary-foreground"><PawPrint className="size-4" /></span>
                    <span className="min-w-0 flex-1"><span className="block truncate font-medium">{pet.name}</span><span className="block text-xs capitalize text-muted-foreground">{pet.species}</span></span>
                    <CornerDownLeft className="size-3.5 text-muted-foreground opacity-0 group-data-[selected=true]:opacity-100" />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {!loading && pets.length > 0 && <CommandSeparator className="my-2" />}

            <CommandGroup heading="Quick actions" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-2 [&_[cmdk-group-heading]]:pt-1 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.14em]">
              {actions.map((item) => (
                <CommandItem
                  key={item.href}
                  value={item.label}
                  keywords={item.keywords}
                  onSelect={() => navigate(item.href)}
                  className="group min-h-14 cursor-pointer gap-3 rounded-2xl px-3 data-[selected=true]:bg-accent"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-secondary text-secondary-foreground"><item.icon className="size-4" /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate font-medium">{item.label}</span><span className="block truncate text-xs text-muted-foreground">{item.description}</span></span>
                  <CornerDownLeft className="size-3.5 text-muted-foreground opacity-0 group-data-[selected=true]:opacity-100" />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>

          <div className="hidden min-h-11 items-center gap-4 border-t px-4 text-[11px] text-muted-foreground sm:flex">
            <span className="flex items-center gap-1.5"><kbd className="rounded-md border bg-muted px-1.5 py-0.5">↑↓</kbd> Navigate</span>
            <span className="flex items-center gap-1.5"><kbd className="rounded-md border bg-muted px-1.5 py-0.5">↵</kbd> Open</span>
            <span className="ml-auto flex items-center gap-1.5"><kbd className="rounded-md border bg-muted px-1.5 py-0.5">Esc</kbd> Close</span>
          </div>
        </Command>
        </DialogContent>
      </Dialog>
    </ActionSearchContext.Provider>
  )
}

export function ActionSearchTrigger({ compact = false }: { compact?: boolean }) {
  const context = useContext(ActionSearchContext)
  if (!context) throw new Error('ActionSearchTrigger must be used inside ActionSearchProvider')

  return (
    <button
      type="button"
      onClick={context.openSearch}
      className={cn(
        'ios-control flex min-h-11 items-center gap-2 rounded-2xl text-muted-foreground hover:bg-accent hover:text-foreground',
        compact ? 'w-11 justify-center' : 'w-48 justify-start border bg-background/60 px-3 lg:w-60',
      )}
      aria-label="Search and quick actions"
    >
      <Search className="size-4" />
      {!compact && <><span className="text-sm">Search</span><kbd className="ml-auto text-[12px]">ctrl+K</kbd></>}
    </button>
  )
}
