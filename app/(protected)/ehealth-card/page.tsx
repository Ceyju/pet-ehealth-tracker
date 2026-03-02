'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { EHealthCarousel } from '@/components/ehealth-carousel'
import type { EHealthPet, EHealthVaccination } from '@/components/ehealth-card'

export default function EHealthCardPage() {
  const { user } = useAuthStore()
  const [pets, setPets] = useState<EHealthPet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        // 1. Fetch all user pets
        const { data: petsData, error: petsErr } = await supabase
          .from('pets')
          .select('id, name, species, breed, microchip_id, photo_url')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (petsErr) throw petsErr
        if (!petsData || petsData.length === 0) {
          setPets([])
          return
        }

        const petIds = petsData.map((p) => p.id).filter(Boolean)

        // 2. Fetch vaccinations for all pets at once
        const { data: vaccData, error: vaccErr } = await supabase
          .from('vaccinations')
          .select('id, pet_id, vaccine_name, next_due_date, date_administered, clinic_name, vet_name')
          .in('pet_id', petIds)
          .order('date_administered', { ascending: false })

        if (vaccErr) throw vaccErr

        // 3. Group vaccinations by pet_id
        const vaccByPet: Record<string, EHealthVaccination[]> = {}
        for (const v of vaccData ?? []) {
          if (!vaccByPet[v.pet_id]) vaccByPet[v.pet_id] = []
          vaccByPet[v.pet_id].push({
            id: v.id,
            vaccine_name: v.vaccine_name,
            next_due_date: v.next_due_date,
            date_administered: v.date_administered,
            clinic_name: v.clinic_name,
            vet_name: v.vet_name,
          })
        }

        const enriched: EHealthPet[] = petsData.map((p) => ({
          id: p.id,
          name: p.name,
          species: p.species,
          breed: p.breed,
          microchip_id: p.microchip_id,
          photo_url: p.photo_url,
          vaccinations: vaccByPet[p.id] ?? [],
        }))

        setPets(enriched)
      } catch (err) {
        console.error('Error loading eHealth cards:', err)
        setError('Failed to load eHealth cards')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  /* ----- loading ----- */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-125">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-orange-500 mx-auto" />
          <p className="mt-4 text-gray-500 text-sm">Loading eHealth cards…</p>
        </div>
      </div>
    )
  }

  /* ----- empty state ----- */
  if (pets.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/dashboard">
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="text-center py-20">
          <p className="text-gray-500 mb-4">No pets registered yet.</p>
          <Link href="/pets/new">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">Add your first pet</Button>
          </Link>
        </div>
      </div>
    )
  }

  /* ----- main ----- */
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">eHealth Card</h1>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      <EHealthCarousel pets={pets} userId={user?.id ?? ''} />
    </div>
  )
}
