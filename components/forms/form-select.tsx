'use client'

import { useId, useMemo, useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

export interface SelectOption {
  label: string
  value: string | number
}

interface FormSelectProps {
  id?: string
  label: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  error?: string
  className?: string
  onClear?: () => void
  searchable?: boolean
  searchPlaceholder?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: { trigger: 'h-9 text-xs', option: 'text-xs', label: 'text-xs', search: 'h-8 text-xs' },
  md: { trigger: 'min-h-11 text-sm', option: 'text-sm', label: 'text-sm', search: 'h-9 text-sm' },
  lg: { trigger: 'min-h-12 text-base', option: 'text-base', label: 'text-base', search: 'h-10 text-base' },
}

export function FormSelect({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = 'Select option',
  required = false,
  disabled = false,
  readOnly = false,
  error,
  className,
  onClear,
  searchable = false,
  searchPlaceholder = 'Search…',
  size = 'md',
}: FormSelectProps) {
  const generatedId = useId()
  const controlId = id ?? generatedId
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const styles = sizeClasses[size]
  const selectedLabel = options.find((option) => String(option.value) === value)?.label

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    if (!searchable || !query) return options
    return options.filter((option) => option.label.toLocaleLowerCase().includes(query))
  }, [options, search, searchable])

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={controlId} className={cn('font-medium text-foreground', styles.label)}>
        {label}
        {required && <span className="ml-1 text-primary" aria-hidden="true">*</span>}
      </label>

      {readOnly ? (
        <div id={controlId} className={cn('flex w-full items-center rounded-lg border border-input bg-muted/50 px-3 text-muted-foreground', styles.trigger, className)}>
          <span className="min-w-0 flex-1 truncate">{value ? selectedLabel ?? value : placeholder}</span>
          <ChevronDown className="size-4 shrink-0 opacity-40" aria-hidden="true" />
        </div>
      ) : (
        <div className="relative">
          <Select
            value={value || undefined}
            onValueChange={onChange}
            disabled={disabled}
            open={open}
            onOpenChange={(nextOpen) => {
              setOpen(nextOpen)
              if (!nextOpen) setSearch('')
            }}
          >
            <SelectTrigger
              id={controlId}
              aria-invalid={Boolean(error)}
              aria-required={required}
              className={cn(
                'w-full rounded-lg border-input bg-transparent text-foreground shadow-xs dark:bg-input/30',
                onClear && value && 'pr-16',
                styles.trigger,
                className,
              )}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>

            <SelectContent position="popper" className="max-h-80 min-w-[var(--radix-select-trigger-width)]">
              {searchable && (
                <div className="sticky top-0 z-10 border-b bg-popover p-2">
                  <Input
                    autoFocus
                    aria-label={searchPlaceholder}
                    placeholder={searchPlaceholder}
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    onKeyDown={(event) => event.stopPropagation()}
                    className={styles.search}
                  />
                </div>
              )}
              {filteredOptions.length ? filteredOptions.map((option) => (
                <SelectItem key={String(option.value)} value={String(option.value)} className={styles.option}>
                  {option.label}
                </SelectItem>
              )) : (
                <div className="p-3 text-center text-sm text-muted-foreground">No results found</div>
              )}
            </SelectContent>
          </Select>

          {onClear && value && !disabled && (
            <button
              type="button"
              aria-label={`Clear ${label}`}
              onClick={() => {
                onClear()
                onChange('')
              }}
              className="absolute right-9 top-1/2 z-10 grid size-7 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
