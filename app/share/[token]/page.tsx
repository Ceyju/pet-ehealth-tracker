import type { Metadata } from 'next'
import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { hashToken } from '@/lib/security'
import { allowPublicShareRead } from '@/lib/rate-limit'
import { EHealthCard, type EHealthPet } from '@/components/ehealth-card'

export const metadata: Metadata = { title: 'Shared health card', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

type SharedPayload = { pet: Omit<EHealthPet, 'vaccinations'>; vaccinations: EHealthPet['vaccinations']; expires_at: string | null }

export default async function SharedCardPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  let payload: SharedPayload | null = null
  if (/^[A-Za-z0-9_-]{40,64}$/.test(token) && allowPublicShareRead(hashToken(token))) {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase.rpc('resolve_pet_share', { p_token_hash: hashToken(token) })
    payload = data as unknown as SharedPayload | null
  }

  if (!payload?.pet) {
    return (
      <main className="grid min-h-screen place-items-center px-4">
        <section className="surface max-w-md p-8 text-center">
          <ShieldAlert className="mx-auto mb-4 size-10 text-muted-foreground" />
          <h1 className="text-xl font-semibold">This share is unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">It may have expired or been revoked by the pet owner.</p>
          <Link href="/" className="mt-6 inline-flex min-h-11 items-center rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground">Open JoyCare</Link>
        </section>
      </main>
    )
  }

  const pet: EHealthPet = { ...payload.pet, vaccinations: payload.vaccinations ?? [] }
  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto mb-6 max-w-md text-center">
        <p className="eyebrow">Shared from JoyCare</p>
        <h1 className="mt-2 text-2xl font-semibold">{pet.name}’s health card</h1>
        <p className="mt-2 text-sm text-muted-foreground">Owner-maintained information. Confirm clinical decisions with a veterinary professional.</p>
      </div>
      <EHealthCard pet={pet} />
      {payload.expires_at && <p className="mx-auto mt-5 max-w-md text-center text-xs text-muted-foreground">Share expires {new Date(payload.expires_at).toLocaleString()}</p>}
    </main>
  )
}
