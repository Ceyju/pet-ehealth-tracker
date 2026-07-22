import { describe, expect, it } from 'vitest'
import { daysUntil, formatHealthDate, vaccinationStatus } from './care'

describe('care date calculations', () => {
  const now = new Date('2026-07-22T12:00:00')

  it('uses calendar days instead of elapsed hours', () => {
    expect(daysUntil('2026-07-23', now)).toBe(1)
    expect(daysUntil('2026-07-21', now)).toBe(-1)
  })

  it('classifies canonical vaccination due dates', () => {
    expect(vaccinationStatus('2026-07-21', now)).toBe('overdue')
    expect(vaccinationStatus('2026-08-01', now)).toBe('due-soon')
    expect(vaccinationStatus('2026-09-30', now)).toBe('upcoming')
    expect(vaccinationStatus(null, now)).toBe('unscheduled')
  })

  it('handles absent and invalid display dates safely', () => {
    expect(formatHealthDate(null)).toBe('Not set')
    expect(formatHealthDate('not-a-date')).toBe('Invalid date')
  })
})
