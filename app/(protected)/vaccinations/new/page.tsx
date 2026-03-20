'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlusCircle, Edit2, ArrowLeft, Calendar, Heart, Syringe, QrCode, Clock } from 'lucide-react'
import { VaccinationCountdown } from '@/components/dashboard/vaccination-countdown'
import Image from 'next/image'

interface Pet {
  id: string
  name: string
  species: string
  breed: string | null
  date_of_birth: string | null
  weight: number | null
  microchip_id: string | null
  photo_url: string | null
}

interface VaccinationPet {
  id: string
  name: string
  species: string
  breed: string | null
  photo_url: string | null
}

interface Vaccination {
  id: string
  pet_id: string
  vaccine_name: string
  next_due_date: string
  pet: VaccinationPet | null
}

type VaccinationRow = Omit<Vaccination, 'pet'> & {
  pet: VaccinationPet[] | VaccinationPet | null
}

export default function PetDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuthStore()
  const [pet, setPet] = useState<Pet | null>(null)
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id || !id) return

      try {
        setLoading(true)

        const { data: petData, error: petError } = await supabase
          .from('pets')
          .select('*')
          .eq('id', id)
          .eq('pet_id', user.id)
          .single()

        if (petError) throw petError
        if (!petData) {
          setError('Pet not found')
          return
        }

        setPet(petData)

        const { data: vaccData, error: vaccError } = await supabase
          .from('vaccinations')
          .select(`
            id,
            pet_id,
            vaccine_name,
            next_due_date,
            pet:pets(id, name, species, breed, photo_url)
          `)
          .eq('pet_id', id)
          .order('next_due_date', { ascending: true })

        if (vaccError) throw vaccError

        const normalized: Vaccination[] = ((vaccData ?? []) as VaccinationRow[]).map((v) => ({
          ...v,
          pet: Array.isArray(v.pet) ? (v.pet[0] ?? null) : (v.pet ?? null),
        }))
        setVaccinations(normalized)
      } catch (err) {
        console.error('Error fetching pet details:', err)
        setError('Failed to load pet details')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, user])

  const calculateAge = (dateOfBirth: string | null) => {
    if (!dateOfBirth) return 'Unknown'
    const today = new Date()
    const birth = new Date(dateOfBirth)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }

    return `${age} years old`
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#7CA982]"></div>
            <p className="mt-4 text-gray-600">Loading pet details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !pet) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Card className="p-8 text-center">
          <p className="text-red-600">{error || 'Pet not found'}</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Button
        variant="outline"
        onClick={() => router.back()}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card className="overflow-hidden">
            {pet.photo_url && (
              <div className="h-64 bg-gray-200 overflow-hidden">
                <Image
                  src={pet.photo_url}
                  alt={pet.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-6">
              <h1 className="text-3xl font-bold text-gray-900">{pet.name}</h1>
              <p className="text-gray-600 mt-2">
                {pet.species}{pet.breed ? ` • ${pet.breed}` : ''}
              </p>

              <div className="mt-6 space-y-4">
                {pet.date_of_birth && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Age</p>
                      <p className="font-medium text-gray-900">{calculateAge(pet.date_of_birth)}</p>
                    </div>
                  </div>
                )}
                {pet.weight && (
                  <div className="flex items-center gap-3">
                    <Heart className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Weight</p>
                      <p className="font-medium text-gray-900">{pet.weight} kg</p>
                    </div>
                  </div>
                )}
                {pet.microchip_id && (
                  <div className="flex items-center gap-3">
                    <QrCode className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Microchip ID</p>
                      <p className="font-medium text-gray-900 text-sm">{pet.microchip_id}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-col gap-2">
                <Link href={`/pets/${id}/edit`} className="block">
                  <Button className="w-full bg-[#243E36] hover:bg-[#1a2e28] text-white">
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </Link>
                <Link href={`/pets/${id}/qr-code`} className="block">
                  <Button variant="outline" className="w-full">
                    <QrCode className="w-4 h-4 mr-2" />
                    QR Code
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Vaccinations</h2>
              <div className="flex gap-2">
                {vaccinations.length > 0 && (
                  <Link href={`/pets/${id}/timeline`}>
                    <Button variant="outline">
                      <Clock className="w-4 h-4 mr-2" />
                      Timeline
                    </Button>
                  </Link>
                )}
                <Link href={`/pets/${id}/vaccinations/new`}>
                  <Button className="bg-[#243E36] hover:bg-[#1a2e28] text-white">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Add Vaccination
                  </Button>
                </Link>
              </div>
            </div>

            {vaccinations.length === 0 ? (
              <div className="text-center py-12">
                <Syringe className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No vaccinations recorded yet</p>
                <Link href={`/pets/${id}/vaccinations/new`}>
                  <Button>Add Vaccination Record</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {vaccinations.map((vaccination) => (
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