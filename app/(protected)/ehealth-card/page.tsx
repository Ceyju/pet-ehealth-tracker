'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { EHealthCarousel } from '@/components/ehealth-carousel'
import type { EHealthPet, EHealthVaccination } from '@/components/ehealth-card'
import { ShareControls } from '@/components/sharing/share-controls'

export default function EHealthCardPage() {
  const user = useAuthStore((state) => state.user)
  const [pets, setPets] = useState<EHealthPet[]>([])
  const [shareUrls, setShareUrls] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user?.id) return
    const load = async () => {
      try {
        const { data: petRows, error: petError } = await supabase.from('pets')
          .select('id, name, species, breed, microchip_id, photo_url, is_dewormed, deworming_date, deworming_location')
          .eq('user_id', user.id).order('created_at', { ascending: false })
        if (petError) throw petError
        const ids = (petRows ?? []).map((pet) => pet.id)
        const vaccinationRows = ids.length ? await supabase.from('vaccinations')
          .select('id, pet_id, vaccine_name, next_due_date, date_administered, clinic_name, vet_name')
          .in('pet_id', ids).order('date_administered', { ascending: false }) : { data: [], error: null }
        if (vaccinationRows.error) throw vaccinationRows.error
        const byPet: Record<string, EHealthVaccination[]> = {}
        for (const vaccination of vaccinationRows.data ?? []) (byPet[vaccination.pet_id] ||= []).push(vaccination)
        setPets((petRows ?? []).map((pet) => ({ ...pet, vaccinations: byPet[pet.id] ?? [] })))
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Could not load health cards')
      } finally { setLoading(false) }
    }
    void load()
  }, [user?.id])

  if (loading) return <div className="grid min-h-96 place-items-center"><div className="size-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" /></div>
  return (
    <div className="page-shell space-y-6">
      <header><p className="eyebrow">Portable health summary</p><h1 className="page-heading mt-1">eHealth Card</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Your orange card stays familiar. Sharing is now private, revocable, and clearly marked as owner-maintained.</p></header>
      {error && <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
      {!pets.length ? <section className="surface grid place-items-center gap-4 py-16 text-center"><p className="text-muted-foreground">Add a pet to create their health card.</p><Button asChild className="ios-control"><Link href="/pets/new"><Plus className="size-4" />Add pet</Link></Button></section> : <><EHealthCarousel pets={pets} shareUrls={shareUrls} /><ShareControls pets={pets} onShareCreated={(petId, url) => setShareUrls((current) => ({ ...current, [petId]: url }))} /></>}
    </div>
  )
}
