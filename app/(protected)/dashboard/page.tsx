'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlusCircle, AlertCircle, Heart, Calendar } from 'lucide-react'
import { DashboardStats } from '@/components/dashboard/stats'
import { VaccinationCountdown } from '@/components/dashboard/vaccination-countdown'

interface Pet {
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
  pet: Pet
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [pets, setPets] = useState<Pet[]>([])
  const [upcomingVaccinations, setUpcomingVaccinations] = useState<Vaccination[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return

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

        // Fetch upcoming vaccinations
        const today = new Date().toISOString().split('T')[0]
        const { data: vaccinationsData, error: vaccinationsError } = await supabase
          .from('vaccinations')
          .select(`
            id,
            pet_id,
            vaccine_name,
            next_due_date,
            pet:pets(id, name, species, breed, photo_url)
          `)
          .eq('user_id', user.id)
          .gte('next_due_date', today)
          .lte('next_due_date', new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .order('next_due_date', { ascending: true })
          .limit(5)

        if (vaccinationsError) throw vaccinationsError
        setUpcomingVaccinations(vaccinationsData || [])
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
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
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-red-600">{error}</span>
        </div>
      )}

      {/* Stats */}
      <DashboardStats petsCount={pets.length} vaccinationsCount={upcomingVaccinations.length} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        {/* Left Column - Vaccination Countdown */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Upcoming Vaccinations</h2>
              <Link href="/vaccinations">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </div>

            {upcomingVaccinations.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No upcoming vaccinations</p>
                <Link href="/pets" className="mt-4">
                  <Button>Add a Pet</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingVaccinations.map((vaccination) => (
                  <VaccinationCountdown key={vaccination.id} vaccination={vaccination} />
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column - Quick Actions */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link href="/pets/new" className="block">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white justify-start">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Add New Pet
                </Button>
              </Link>
              <Link href="/vaccinations/new" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  Record Vaccination
                </Button>
              </Link>
            </div>
          </Card>

          {/* Pets Summary */}
          {pets.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Your Pets</h3>
              <div className="space-y-3">
                {pets.slice(0, 3).map((pet) => (
                  <Link key={pet.id} href={`/pets/${pet.id}`}>
                    <div className="p-3 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                      <p className="font-medium text-gray-900">{pet.name}</p>
                      <p className="text-sm text-gray-600">{pet.species}{pet.breed ? ` - ${pet.breed}` : ''}</p>
                    </div>
                  </Link>
                ))}
              </div>
              {pets.length > 3 && (
                <Link href="/pets">
                  <Button variant="ghost" className="w-full mt-3">
                    View All Pets
                  </Button>
                </Link>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
