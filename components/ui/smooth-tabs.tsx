'use client'

import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

export type SmoothTab = { value: string; label: string; count?: number }

export function SmoothTabs({ tabs, value, onValueChange, id = 'smooth-tabs' }: { tabs: SmoothTab[]; value: string; onValueChange: (value: string) => void; id?: string }) {
  return (
    <div role="tablist" aria-label="Health sections" className="inline-flex max-w-full gap-1 overflow-x-auto rounded-2xl border bg-muted/60 p-1">
      {tabs.map((tab) => {
        const selected = value === tab.value
        return (
          <button key={tab.value} role="tab" aria-selected={selected} onClick={() => onValueChange(tab.value)} className={cn('relative min-h-10 whitespace-nowrap rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors', selected && 'text-foreground')}>
            {selected && <motion.span layoutId={`${id}-active`} className="absolute inset-0 -z-10 rounded-xl bg-background shadow-sm" transition={{ type: 'spring', stiffness: 430, damping: 34 }} />}
            {tab.label}{typeof tab.count === 'number' && <span className="ml-1.5 text-xs text-muted-foreground">{tab.count}</span>}
          </button>
        )
      })}
    </div>
  )
}
