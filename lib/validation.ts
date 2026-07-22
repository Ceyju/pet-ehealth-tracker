import { z } from 'zod'

export const shareCreateSchema = z.object({
  petId: z.string().uuid(),
  expiry: z.enum(['24h', '7d', '30d', 'never']).default('7d'),
  allowedSections: z.array(z.enum(['identity', 'vaccinations', 'deworming'])).min(1).refine((items) => items.includes('identity'), 'Identity is required').default(['identity', 'vaccinations', 'deworming']),
})

export const medicalRecordSchema = z.object({
  petId: z.string().uuid(),
  recordType: z.enum(['checkup', 'lab_test', 'surgery', 'vaccination', 'dental', 'other']),
  title: z.string().trim().min(1).max(120),
  occurredOn: z.string().date(),
  description: z.string().trim().max(3000).optional().nullable(),
  providerName: z.string().trim().max(160).optional().nullable(),
})

export const reminderSchema = z.object({
  petId: z.string().uuid().optional().nullable(),
  title: z.string().trim().min(1).max(120),
  notes: z.string().trim().max(1000).optional().nullable(),
  dueAt: z.string().datetime(),
  recurrence: z.enum(['none', 'daily', 'weekly', 'monthly', 'yearly']).default('none'),
  channels: z.array(z.enum(['in_app', 'telegram'])).min(1).default(['in_app', 'telegram']),
})
