import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/supabase/server'
import { reminderSchema } from '@/lib/validation'

export async function POST(request: Request) {
  const auth = await requireUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const parsed = reminderSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Check the reminder details', fieldErrors: parsed.error.flatten().fieldErrors }, { status: 422 })
  if (parsed.data.petId) {
    const { data: pet } = await auth.supabase.from('pets').select('id').eq('id', parsed.data.petId).eq('user_id', auth.user.id).maybeSingle()
    if (!pet) return NextResponse.json({ error: 'Pet not found' }, { status: 404 })
  }
  const { data, error } = await auth.supabase.from('reminders').insert({
    user_id: auth.user.id,
    pet_id: parsed.data.petId ?? null,
    source_type: 'custom',
    title: parsed.data.title,
    notes: parsed.data.notes || null,
    due_at: parsed.data.dueAt,
    recurrence: parsed.data.recurrence,
    channels: parsed.data.channels,
  }).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data }, { status: 201 })
}
