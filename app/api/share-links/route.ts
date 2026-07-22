import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/supabase/server'
import { createOpaqueToken, hashToken } from '@/lib/security'
import { shareCreateSchema } from '@/lib/validation'

const expiryMs = { '24h': 86_400_000, '7d': 604_800_000, '30d': 2_592_000_000, never: null }

export async function GET() {
  const auth = await requireUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await auth.supabase
    .from('share_links')
    .select('id, pet_id, allowed_sections, expires_at, revoked_at, last_accessed_at, created_at')
    .eq('owner_id', auth.user.id)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  const auth = await requireUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const parsed = shareCreateSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Invalid share settings', fieldErrors: parsed.error.flatten().fieldErrors }, { status: 422 })

  const { data: pet } = await auth.supabase
    .from('pets')
    .select('id')
    .eq('id', parsed.data.petId)
    .eq('user_id', auth.user.id)
    .maybeSingle()
  if (!pet) return NextResponse.json({ error: 'Pet not found' }, { status: 404 })

  const token = createOpaqueToken()
  const duration = expiryMs[parsed.data.expiry]
  const expiresAt = duration === null ? null : new Date(Date.now() + duration).toISOString()
  const { data, error } = await auth.supabase.from('share_links').insert({
    owner_id: auth.user.id,
    pet_id: pet.id,
    token_hash: hashToken(token),
    allowed_sections: parsed.data.allowedSections,
    expires_at: expiresAt,
  }).select('id, pet_id, allowed_sections, expires_at, created_at').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
  return NextResponse.json({ data, url: `${origin}/share/${token}` }, { status: 201 })
}
