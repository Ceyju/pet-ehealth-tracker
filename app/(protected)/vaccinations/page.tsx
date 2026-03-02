'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Syringe, AlertCircle, Plus } from 'lucide-react'
import { VaccinationCountdown } from '@/components/dashboard/vaccination-countdown'
import Image from 'next/image'

interface PetOption {
  id: string
  name: string
  species: string
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

type FilterStatus = 'all' | 'overdue' | 'urgent' | 'soon' | 'upcoming'

const speciesEmoji: Record<string, string> = {
  dog: '🐶', cat: '🐱', bird: '🐦', rabbit: '🐰',
  fish: '🐟', hamster: '🐹', turtle: '🐢', snake: '🐍',
}

export default function VaccinationsPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([])
  const [pets, setPets] = useState<PetOption[]>([])
  const [showPetDialog, setShowPetDialog] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterStatus>('all')

  useEffect(() => {
    const fetchVaccinations = async () => {
      if (!user?.id) return

      try {
        setLoading(true)

        // Get pets belonging to this user
        const { data: petsData, error: petsError } = await supabase
        .from('pets')
        .select('id, name, species, photo_url')
        .eq('user_id', user.id)

        if (petsError) throw petsError

        setPets((petsData ?? []) as PetOption[])
        const petIds = (petsData ?? []).map((p) => p.id).filter(Boolean)

        if (petIds.length === 0) {
          setVaccinations([])
          return
        }

        const { data, error: fetchError } = await supabase
          .from('vaccinations')
          .select(`
            id,
            pet_id,
            vaccine_name,
            next_due_date,
            pet:pets(id, name, species, breed, photo_url)
          `)
          .in('pet_id', petIds)
          .order('next_due_date', { ascending: true })

        if (fetchError) throw fetchError

        const normalized: Vaccination[] = ((data ?? []) as VaccinationRow[]).map((v) => ({
          ...v,
          pet: Array.isArray(v.pet) ? (v.pet[0] ?? null) : (v.pet ?? null),
        }))
        setVaccinations(normalized)
      } catch (err) {
        console.error('Error fetching vaccinations:', err)
        setError('Failed to load vaccinations')
      } finally {
        setLoading(false)
      }
    }

    fetchVaccinations()
  }, [user])

  const handleAddVaccination = () => {
    if (pets.length === 0) {
      toast.error('No pets registered', {
        description: 'Please register a pet first before recording vaccinations.',
      })
      return
    }
    setShowPetDialog(true)
  }

  const getFilteredVaccinations = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return vaccinations.filter((vaccination) => {
      const dueDate = new Date(vaccination.next_due_date)
      dueDate.setHours(0, 0, 0, 0)
      const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24))

      switch (filter) {
        case 'overdue':
          return daysUntil < 0
        case 'urgent':
          return daysUntil >= 0 && daysUntil <= 7
        case 'soon':
          return daysUntil > 7 && daysUntil <= 30
        case 'upcoming':
          return daysUntil > 30
        default:
          return true
      }
    })
  }

  const filtered = getFilteredVaccinations()

  const stats = {
    total: vaccinations.length,
    overdue: vaccinations.filter((v) => {
      const daysUntil = Math.ceil(
        (new Date(v.next_due_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
      )
      return daysUntil < 0
    }).length,
    urgent: vaccinations.filter((v) => {
      const daysUntil = Math.ceil(
        (new Date(v.next_due_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
      )
      return daysUntil >= 0 && daysUntil <= 7
    }).length,
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-100">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading vaccinations...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Vaccinations</h1>
          <p className="text-gray-600 mt-2">Track all upcoming vaccinations across your pets</p>
        </div>
        <Button onClick={handleAddVaccination} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          <Plus className="w-4 h-4" />
          Record Vaccination
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
          <span className="text-sm text-red-600">{error}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-6">
          <p className="text-sm text-gray-600 font-medium">Total Vaccinations</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-red-600 font-medium">Overdue</p>
          <p className="text-3xl font-bold text-red-600 mt-2">{stats.overdue}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-orange-600 font-medium">Due Soon</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">{stats.urgent}</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-wrap gap-2">
        {(['all', 'overdue', 'urgent', 'soon', 'upcoming'] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            onClick={() => setFilter(f)}
            className={filter === f ? 'bg-blue-600 hover:bg-blue-700' : ''}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      {vaccinations.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <Syringe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No vaccinations recorded</h3>
            <p className="text-gray-600 mb-6">Select a registered pet to record their first vaccination</p>
            <Button onClick={handleAddVaccination} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
              <Plus className="w-4 h-4" />
              Record Vaccination
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <div className="space-y-4">
            {filtered.length === 0 ? (
              <p className="text-center text-gray-600 py-8">No vaccinations match this filter</p>
            ) : (
              filtered.map((vaccination) => (
                <VaccinationCountdown key={vaccination.id} vaccination={vaccination} />
              ))
            )}
          </div>
        </Card>
      )}
      {/* Pet selector dialog */}
      <Dialog open={showPetDialog} onOpenChange={setShowPetDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select a Pet</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500 -mt-2">Choose which pet this vaccination is for</p>
          <div className="flex flex-col gap-2 mt-2">
            {pets.map((pet) => (
              <button
                key={pet.id}
                onClick={() => {
                  setShowPetDialog(false)
                  router.push(`/pets/${pet.id}/vaccinations/new`)
                }}
                className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                  {pet.photo_url ? (
                    <Image
                      src={pet.photo_url}
                      alt={pet.name}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xl leading-none">
                      {speciesEmoji[pet.species.toLowerCase()] ?? '🐾'}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{pet.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{pet.species}</p>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
