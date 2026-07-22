'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'

type ReminderPreview = { id: string; title: string; due_at: string; status: string }

export function NotificationCenter({ trigger }: { trigger: ReactNode }) {
  const user = useAuthStore((state) => state.user)
  const [items, setItems] = useState<ReminderPreview[]>([])

  useEffect(() => {
    if (!user?.id) return
    const load = async () => {
      const { data } = await supabase
        .from('reminders')
        .select('id, title, due_at, status')
        .eq('user_id', user.id)
        .eq('status', 'scheduled')
        .order('due_at')
        .limit(5)
      setItems(data ?? [])
    }
    void load()
  }, [user?.id])

  return (
    <Popover>
      <PopoverTrigger className="ios-control relative grid min-h-11 w-11 place-items-center rounded-2xl text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Open notifications">
        {trigger}
        {items.length > 0 && <span className="absolute right-2 top-2 size-2 rounded-full bg-orange-500 ring-2 ring-background" />}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))] rounded-3xl p-2">
        <div className="px-3 py-2">
          <p className="font-semibold">Care reminders</p>
          <p className="text-xs text-muted-foreground">Upcoming across all pets</p>
        </div>
        {items.length ? (
          <div className="space-y-1">
            {items.map((item) => (
              <Link key={item.id} href="/vaccinations?view=reminders" className="flex min-h-14 items-center gap-3 rounded-2xl px-3 hover:bg-accent">
                <span className="size-2 rounded-full bg-orange-500" />
                <span className="min-w-0"><span className="block truncate text-sm font-medium">{item.title}</span><span className="block text-xs text-muted-foreground">{new Date(item.due_at).toLocaleString()}</span></span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid place-items-center gap-2 px-4 py-10 text-center">
            <CheckCircle2 className="size-8 text-primary" />
            <p className="text-sm font-medium">You’re all caught up</p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
