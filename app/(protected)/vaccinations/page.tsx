'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Syringe, AlertCircle } from 'lucide-react'
import { VaccinationCountdown } from '@/components/dashboard/vaccination-countdown'

interface Vaccination {
  id: string
  pet_id: string
  vaccine_name: string
  next_due_date: string
  pet: {
    id: string
    name: string
    species: string
  }
}

type FilterStatus = 'all' | 'overdue' | 'urgent' | 'soon' | 'upcoming'

export default function VaccinationsPage() {
  const { user } = useAuthStore()
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterStatus>('all')

  useEffect(() => {
    const fetchVaccinations = async () => {
      if (!user) return

      try {
        setLoading(true)
        const { data, error: fetchError } = await supabase
          .from('vaccinations')
          .select(`
            id,
            pet_id,
            vaccine_name,
            next_due_date,
            pet:pets(id, name, species)
          `)
          .eq('user_id', user.id)
          .order('next_due_date', { ascending: true })

        if (fetchError) throw fetchError
        setVaccinations(data || [])
      } catch (err) {
        console.error('Error fetching vaccinations:', err)
        setError('Failed to load vaccinations')
      } finally {
        setLoading(false)
      }
    }

    fetchVaccinations()
  }, [user])

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
        <div className="flex items-center justify-center min-h-[400px]">
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
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
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
            <p className="text-gray-600 mb-6">Add your first pet and record their vaccinations to get started</p>
            <Link href="/pets/new">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Add a Pet
              </Button>
            </Link>
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
    </div>
  )
}
