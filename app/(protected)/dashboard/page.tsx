'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, Calendar, Loader2 } from 'lucide-react'
import { DashboardStats } from '@/components/dashboard/stats'
import { VaccinationCountdown } from '@/components/dashboard/vaccination-countdown'
import { EHealthCarousel } from '@/components/ehealth-carousel'
import type { EHealthPet, EHealthVaccination } from '@/components/ehealth-card'
import Image from 'next/image'
import { Pet, Vaccination } from '@/types'


const speciesIconMap: Record<string, string> = {
  dog: "🐶",
  cat: "🐱",
  bird: "🐦",
  rabbit: "🐰",
  hamster: "🐹",
  fish: "🐠",
  turtle: "🐢",
  reptile: "🦎",
}

const getPetIcon = (species?: string) =>
  speciesIconMap[(species || "").toLowerCase()] ?? "🐾"

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [pets, setPets] = useState<Pet[]>([])
  const [ehealthPets, setEhealthPets] = useState<EHealthPet[]>([])
  const [upcomingVaccinations, setUpcomingVaccinations] = useState<Vaccination[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Fetch pets
        const { data: petsData, error: petsError } = await supabase
          .from('pets')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (petsError) throw petsError
        setPets(petsData || [])

        const petIds = (petsData || [])
          .map((p) => p.id)
          .filter((id): id is string => typeof id === 'string' && id.trim().length > 0)

        if (petIds.length === 0) {
          setUpcomingVaccinations([])
          setEhealthPets([])
          return
        }

        // Fetch ALL vaccinations with full fields for eHealth card
        const { data: vaccData, error: vaccError } = await supabase
          .from('vaccinations')
          .select('id, pet_id, vaccine_name, next_due_date, date_administered, clinic_name, vet_name')
          .in('pet_id', petIds)
          .order('date_administered', { ascending: false })

        if (vaccError) throw vaccError

        // Build eHealth pets structure
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
        setEhealthPets(
          (petsData ?? []).map((p) => ({
            id: p.id,
            name: p.name,
            species: p.species,
            breed: p.breed,
            microchip_id: p.microchip_id ?? null,
            photo_url: p.photo_url,
            vaccinations: vaccByPet[p.id] ?? [],
          }))
        )

        // Upcoming vaccinations (next 90 days) derived from the same fetch
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const in90Days = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)

        const upcoming: Vaccination[] = (vaccData ?? [])
          .filter((v) => {
            if (!v.next_due_date) return false
            const due = new Date(v.next_due_date)
            return due >= today && due <= in90Days
          })
          .sort((a, b) => new Date(a.next_due_date).getTime() - new Date(b.next_due_date).getTime())
          .slice(0, 5)
          .map((v) => {
            const petInfo = (petsData ?? []).find((p) => p.id === v.pet_id) ?? null
            return {
              id: v.id,
              pet_id: v.pet_id,
              vaccine_name: v.vaccine_name,
              next_due_date: v.next_due_date,
              pet: petInfo
                ? { id: petInfo.id, name: petInfo.name, species: petInfo.species, breed: petInfo.breed ?? null, photo_url: petInfo.photo_url ?? null }
                : null,
            }
          })
        setUpcomingVaccinations(upcoming)
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        setError('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#7CA982] mx-auto" />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, {user?.full_name}!</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
          <span className="text-sm text-red-600">{error}</span>
        </div>
      )}

      {/* Stats */}
      <DashboardStats petsCount={pets.length} vaccinationsCount={upcomingVaccinations.length} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        {/* Left Column - eHealth Card */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">eHealth Card</h2>
              <Link href="/ehealth-card">
                <Button variant="outline" size="sm">Full View</Button>
              </Link>
            </div>
            {pets.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No pets registered yet.</p>
                <Link href="/pets/new">
                  <Button className="bg-[#243E36] hover:bg-[#1a2e28] text-white">Add your first pet</Button>
                </Link>
              </div>
            ) : (
              <EHealthCarousel pets={ehealthPets} userId={user?.id ?? ''} />
            )}
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Your Pets */}
          {pets.length > 0 && (
            <Card className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Your Pets</h3>
                <Link href="/pets">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </div>
              <div className="space-y-2">
                {pets.slice(0, 3).map((pet) => (
                  <Link key={pet.id} href={`/pets/${pet.id}`} className="block">
                    <div className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                        {pet.photo_url ? (
                          <Image
                            src={pet.photo_url}
                            alt={`${pet.name} picture`}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-lg leading-none" aria-hidden="true">
                            {getPetIcon(pet.species)}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 leading-tight">{pet.name}</p>
                        <p className="text-sm text-gray-600 leading-tight">
                          {pet.species}{pet.breed ? ` - ${pet.breed}` : ""}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {/* Upcoming Vaccinations */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Upcoming Vaccinations</h3>
              <Link href="/vaccinations">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </div>
            {upcomingVaccinations.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No upcoming vaccinations in the next 90 days</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingVaccinations.map((vaccination) => (
                  <VaccinationCountdown key={vaccination.id} vaccination={vaccination} />
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
