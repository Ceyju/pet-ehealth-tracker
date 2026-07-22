import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/supabase/server'
import { medicalRecordSchema } from '@/lib/validation'

export async function POST(request: Request) {
  const auth = await requireUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const parsed = medicalRecordSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Check the record details', fieldErrors: parsed.error.flatten().fieldErrors }, { status: 422 })
  const { data: pet } = await auth.supabase.from('pets').select('id').eq('id', parsed.data.petId).eq('user_id', auth.user.id).maybeSingle()
  if (!pet) return NextResponse.json({ error: 'Pet not found' }, { status: 404 })
  const { data, error } = await auth.supabase.from('medical_records').insert({
    pet_id: pet.id,
    record_type: parsed.data.recordType,
    title: parsed.data.title,
    date: parsed.data.occurredOn,
    occurred_on: parsed.data.occurredOn,
    description: parsed.data.description || null,
    provider_name: parsed.data.providerName || null,
  }).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data }, { status: 201 })
}
