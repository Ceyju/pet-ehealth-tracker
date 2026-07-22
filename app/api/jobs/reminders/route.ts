import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { safeSecretEquals } from '@/lib/security'

export async function POST(request: Request) {
  const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || null
  if (!safeSecretEquals(bearer, process.env.CRON_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) return NextResponse.json({ error: 'Telegram is not configured' }, { status: 503 })

  const admin = createAdminSupabaseClient()
  const now = new Date()
  const windowStart = new Date(now.getTime() - 60 * 60_000)
  const { data: reminders, error } = await admin.from('reminders')
    .select('id, user_id, pet_id, title, due_at')
    .eq('status', 'scheduled')
    .contains('channels', ['telegram'])
    .gte('due_at', windowStart.toISOString())
    .lte('due_at', now.toISOString())
    .limit(100)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let sent = 0
  for (const reminder of reminders ?? []) {
    const { data: existing } = await admin.from('notification_deliveries')
      .select('id, status')
      .eq('reminder_id', reminder.id)
      .eq('channel', 'telegram')
      .eq('scheduled_for', reminder.due_at)
      .maybeSingle()
    if (existing?.status === 'sent') continue

    const { data: connection } = await admin.from('telegram_connections')
      .select('chat_id')
      .eq('user_id', reminder.user_id)
      .not('chat_id', 'is', null)
      .is('revoked_at', null)
      .maybeSingle()
    if (!connection?.chat_id) continue

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: connection.chat_id,
        text: `🐾 JoyCare reminder\n${reminder.title}\nDue ${new Date(reminder.due_at).toLocaleString('en-US', { timeZone: 'UTC' })} UTC`,
        reply_markup: appUrl ? { inline_keyboard: [[{ text: 'Open JoyCare', url: `${appUrl}/vaccinations?view=reminders` }]] } : undefined,
        protect_content: true,
      }),
    })
    const result = await response.json() as { ok?: boolean; result?: { message_id?: number }; description?: string }
    await admin.from('notification_deliveries').upsert({
      reminder_id: reminder.id,
      channel: 'telegram',
      scheduled_for: reminder.due_at,
      status: result.ok ? 'sent' : 'failed',
      attempted_at: new Date().toISOString(),
      provider_message_id: result.result?.message_id ? String(result.result.message_id) : null,
      error_message: result.ok ? null : (result.description || 'Telegram delivery failed'),
    }, { onConflict: 'reminder_id,channel,scheduled_for' })
    if (result.ok) sent += 1
  }
  return NextResponse.json({ processed: reminders?.length ?? 0, sent })
}
