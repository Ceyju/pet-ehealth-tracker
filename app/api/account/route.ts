import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { requireUser } from '@/lib/supabase/server'

export async function GET() {
  const auth = await requireUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: pets } = await auth.supabase.from('pets').select('*').eq('user_id', auth.user.id)
  const petIds = (pets ?? []).map((pet) => pet.id)
  const [vaccinations, records, reminders, profile] = await Promise.all([
    petIds.length ? auth.supabase.from('vaccinations').select('*').in('pet_id', petIds) : Promise.resolve({ data: [] }),
    petIds.length ? auth.supabase.from('medical_records').select('*').in('pet_id', petIds) : Promise.resolve({ data: [] }),
    auth.supabase.from('reminders').select('*').eq('user_id', auth.user.id),
    auth.supabase.from('profiles').select('*').eq('id', auth.user.id).maybeSingle(),
  ])
  return NextResponse.json({ exported_at: new Date().toISOString(), profile: profile.data, pets, vaccinations: vaccinations.data, medical_records: records.data, reminders: reminders.data }, {
    headers: { 'content-disposition': `attachment; filename="joycare-export-${new Date().toISOString().slice(0, 10)}.json"` },
  })
}

export async function DELETE() {
  const auth = await requireUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { error: dataError } = await auth.supabase.rpc('delete_current_account')
  if (dataError) return NextResponse.json({ error: dataError.message }, { status: 400 })
  const admin = createAdminSupabaseClient()
  const { error: authError } = await admin.auth.admin.deleteUser(auth.user.id)
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
