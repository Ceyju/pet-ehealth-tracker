'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download } from 'lucide-react'
import { VaccinationTimeline } from '@/components/dashboard/vaccination-timeline'
import { exportPetHealthRecordsPDF } from '@/lib/pdf-export'

interface Pet {
  id: string
  name: string
  species: string
  breed: string | null
  date_of_birth: string | null
  weight: number | null
  microchip_id: string | null
}

interface Vaccination {
  id: string
  vaccine_name: string
  vaccination_date: string
  next_due_date: string
  clinic_name: string | null
}

export default function TimelinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuthStore()
  const [pet, setPet] = useState<Pet | null>(null)
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      try {
        setLoading(true)

        // Fetch pet
        const { data: petData } = await supabase
          .from('pets')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single()

        if (petData) {
          setPet(petData)
        }

        // Fetch vaccinations
        const { data: vaccData } = await supabase
          .from('vaccinations')
          .select('id, vaccine_name, vaccination_date, next_due_date, clinic_name')
          .eq('pet_id', id)
          .order('vaccination_date', { ascending: false })

        setVaccinations(vaccData || [])
      } catch (err) {
        console.error('Error fetching data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, user])

  const handleExportPDF = async () => {
    if (!pet) return

    setExporting(true)
    try {
      await exportPetHealthRecordsPDF(
        {
          name: pet.name,
          species: pet.species,
          breed: pet.breed || undefined,
          dateOfBirth: pet.date_of_birth || undefined,
          weight: pet.weight || undefined,
          microchipId: pet.microchip_id || undefined,
        },
        vaccinations.map((v) => ({
          vaccineName: v.vaccine_name,
          vaccinationDate: v.vaccination_date,
          nextDueDate: v.next_due_date,
          clinicName: v.clinic_name || undefined,
        }))
      )
    } catch (err) {
      console.error('Error exporting PDF:', err)
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading timeline...</p>
        </div>
      </div>
    )
  }

  if (!pet) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="p-8 text-center">
          <p className="text-red-600">Pet not found</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Button
        variant="outline"
        onClick={() => router.back()}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <Card className="p-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Vaccination Timeline</h1>
            <p className="text-gray-600 mt-2">{pet.name}'s health history</p>
          </div>
          <Button
            onClick={handleExportPDF}
            disabled={exporting}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            {exporting ? 'Exporting...' : 'Export PDF'}
          </Button>
        </div>

        {vaccinations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No vaccination records yet</p>
            <Link href={`/pets/${pet.id}/vaccinations/new`}>
              <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">
                Add Vaccination
              </Button>
            </Link>
          </div>
        ) : (
          <VaccinationTimeline vaccinations={vaccinations} />
        )}
      </Card>

      {vaccinations.length > 0 && (
        <Card className="p-6 mt-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-gray-600 text-sm">Total Vaccinations</p>
              <p className="text-3xl font-bold text-gray-900">{vaccinations.length}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">First Vaccination</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(vaccinations[vaccinations.length - 1].vaccination_date).toLocaleDateString(
                  'en-US',
                  { year: 'numeric', month: 'short', day: 'numeric' }
                )}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Latest Vaccination</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(vaccinations[0].vaccination_date).toLocaleDateString(
                  'en-US',
                  { year: 'numeric', month: 'short', day: 'numeric' }
                )}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
