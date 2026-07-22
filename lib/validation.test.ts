import { describe, expect, it } from 'vitest'
import { medicalRecordSchema, reminderSchema, shareCreateSchema } from './validation'

const petId = 'a7f4d9b5-7eb2-4bb7-aef8-8bb468645d5a'

describe('server mutation schemas', () => {
  it('defaults secure shares to seven days and requires identity', () => {
    expect(shareCreateSchema.parse({ petId }).expiry).toBe('7d')
    expect(shareCreateSchema.safeParse({ petId, allowedSections: ['vaccinations'] }).success).toBe(false)
  })

  it('rejects oversized record titles and malformed dates', () => {
    expect(medicalRecordSchema.safeParse({ petId, recordType: 'checkup', title: 'x'.repeat(121), occurredOn: 'today' }).success).toBe(false)
  })

  it('requires at least one valid reminder channel', () => {
    expect(reminderSchema.safeParse({ petId, title: 'Medication', dueAt: new Date().toISOString(), channels: [] }).success).toBe(false)
  })
})
