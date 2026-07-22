import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/supabase/server'
import { createOpaqueToken, hashToken } from '@/lib/security'

export async function POST() {
  const auth = await requireUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const username = process.env.TELEGRAM_BOT_USERNAME
  if (!username) return NextResponse.json({ error: 'Telegram is not configured yet' }, { status: 503 })

  const token = createOpaqueToken(24)
  const { error } = await auth.supabase.from('telegram_connections').upsert({
    user_id: auth.user.id,
    connection_token_hash: hashToken(token),
    token_expires_at: new Date(Date.now() + 10 * 60_000).toISOString(),
    revoked_at: null,
  }, { onConflict: 'user_id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ url: `https://t.me/${username}?start=${token}` })
}

export async function DELETE() {
  const auth = await requireUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { error } = await auth.supabase.from('telegram_connections').update({
    revoked_at: new Date().toISOString(),
    chat_id: null,
    connection_token_hash: null,
    token_expires_at: null,
  }).eq('user_id', auth.user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
