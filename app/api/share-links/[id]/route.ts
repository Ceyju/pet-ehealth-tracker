import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/supabase/server'

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { error } = await auth.supabase
    .from('share_links')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id)
    .eq('owner_id', auth.user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
