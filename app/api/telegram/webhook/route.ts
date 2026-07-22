import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { hashToken, safeSecretEquals } from '@/lib/security'

type TelegramUpdate = {
  message?: {
    text?: string
    chat?: { id?: number; username?: string }
  }
}

export async function POST(request: Request) {
  if (!safeSecretEquals(request.headers.get('x-telegram-bot-api-secret-token'), process.env.TELEGRAM_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const update = await request.json() as TelegramUpdate
  const match = update.message?.text?.match(/^\/start\s+([A-Za-z0-9_-]{20,64})$/)
  const chatId = update.message?.chat?.id
  if (!match || !chatId) return NextResponse.json({ ok: true })

  const admin = createAdminSupabaseClient()
  const tokenHash = hashToken(match[1])
  const { data: connection } = await admin.from('telegram_connections')
    .select('id')
    .eq('connection_token_hash', tokenHash)
    .gt('token_expires_at', new Date().toISOString())
    .is('revoked_at', null)
    .maybeSingle()
  if (!connection) return NextResponse.json({ ok: true })

  await admin.from('telegram_connections').update({
    chat_id: String(chatId),
    telegram_username: update.message?.chat?.username || null,
    connected_at: new Date().toISOString(),
    connection_token_hash: null,
    token_expires_at: null,
  }).eq('id', connection.id)

  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (botToken) {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: 'JoyCare reminders are connected. We’ll only send care dates and secure links.' }),
    })
  }
  return NextResponse.json({ ok: true })
}
