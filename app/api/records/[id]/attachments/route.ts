import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/supabase/server'

const allowedTypes = new Set(['application/pdf', 'image/jpeg', 'image/png'])
const maxBytes = 10 * 1024 * 1024

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { data: record } = await auth.supabase.from('medical_records').select('id, pet_id').eq('id', id).maybeSingle()
  if (!record) return NextResponse.json({ error: 'Record not found' }, { status: 404 })
  const { data: pet } = await auth.supabase.from('pets').select('id').eq('id', record.pet_id).eq('user_id', auth.user.id).maybeSingle()
  if (!pet) return NextResponse.json({ error: 'Record not found' }, { status: 404 })

  const formData = await request.formData()
  const file = formData.get('file')
  if (!(file instanceof File) || !allowedTypes.has(file.type) || file.size <= 0 || file.size > maxBytes) {
    return NextResponse.json({ error: 'Use a PDF, JPEG, or PNG file up to 10 MB' }, { status: 422 })
  }
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '-').slice(-120) || 'attachment'
  const path = `${auth.user.id}/${record.id}/${randomUUID()}-${safeName}`
  const { error: uploadError } = await auth.supabase.storage.from('medical-records').upload(path, file, { contentType: file.type, upsert: false })
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 400 })
  const { data, error } = await auth.supabase.from('medical_record_attachments').insert({ record_id: record.id, storage_path: path, mime_type: file.type, byte_size: file.size, original_name: file.name }).select('*').single()
  if (error) { await auth.supabase.storage.from('medical-records').remove([path]); return NextResponse.json({ error: error.message }, { status: 400 }) }
  return NextResponse.json({ data }, { status: 201 })
}
