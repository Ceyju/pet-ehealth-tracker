const DAY_MS = 86_400_000

export type CareStatus = 'overdue' | 'due-soon' | 'upcoming' | 'complete' | 'unscheduled'

export function startOfLocalDay(value = new Date()) {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}

export function daysUntil(dateValue: string | null, now = new Date()) {
  if (!dateValue) return null
  const due = startOfLocalDay(new Date(`${dateValue.slice(0, 10)}T00:00:00`))
  if (Number.isNaN(due.getTime())) return null
  return Math.round((due.getTime() - startOfLocalDay(now).getTime()) / DAY_MS)
}

export function vaccinationStatus(nextDueDate: string | null, now = new Date()): CareStatus {
  const days = daysUntil(nextDueDate, now)
  if (days === null) return 'unscheduled'
  if (days < 0) return 'overdue'
  if (days <= 30) return 'due-soon'
  return 'upcoming'
}

export function formatHealthDate(value: string | null, options?: Intl.DateTimeFormatOptions) {
  if (!value) return 'Not set'
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value)
  if (Number.isNaN(date.getTime())) return 'Invalid date'
  return new Intl.DateTimeFormat(undefined, options ?? { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}
