'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlusCircle, Edit2, Trash2, Heart } from 'lucide-react'

interface Pet {
  id: string
  name: string
  species: string
  breed: string | null
  photo_url: string | null
}

export default function PetsPage() {
  const { user } = useAuthStore()
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    const fetchPets = async () => {
      if (!user) return

      try {
        setLoading(true)
        const { data, error: fetchError } = await supabase
          .from('pets')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (fetchError) throw fetchError
        setPets(data || [])
      } catch (err) {
        console.error('Error fetching pets:', err)
        setError('Failed to load pets')
      } finally {
        setLoading(false)
      }
    }

    fetchPets()
  }, [user])

  const handleDelete = async (petId: string) => {
    if (!window.confirm('Are you sure you want to delete this pet?')) return

    setDeletingId(petId)
    try {
      const { error: deleteError } = await supabase
        .from('pets')
        .delete()
        .eq('id', petId)
        .eq('user_id', user?.id)

      if (deleteError) throw deleteError
      setPets(pets.filter((p) => p.id !== petId))
    } catch (err) {
      console.error('Error deleting pet:', err)
      setError('Failed to delete pet')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-100">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#7CA982]"></div>
            <p className="mt-4 text-gray-600">Loading pets...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Pets</h1>
          <p className="text-gray-600 mt-2">Manage all your pets in one place</p>
        </div>
        <Link href="/pets/new">
          <Button className="bg-[#243E36] hover:bg-[#1a2e28] text-white">
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Pet
          </Button>
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      {pets.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No pets yet</h3>
            <p className="text-gray-600 mb-6">Start tracking your pet's vaccinations by adding your first pet</p>
            <Link href="/pets/new">
              <Button className="bg-[#243E36] hover:bg-[#1a2e28] text-white">
                <PlusCircle className="w-4 h-4 mr-2" />
                Add Your First Pet
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pets.map((pet) => (
            <Card key={pet.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {pet.photo_url && (
                <div className="h-48 bg-gray-200 overflow-hidden">
                  <img
                    src={pet.photo_url}
                    alt={pet.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900">{pet.name}</h3>
                <p className="text-gray-600 mt-1">
                  {pet.species}{pet.breed ? ` • ${pet.breed}` : ''}
                </p>

                <div className="flex gap-2 mt-6">
                  <Link href={`/pets/${pet.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      View Details
                    </Button>
                  </Link>
                  <Link href={`/pets/${pet.id}/edit`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="px-3"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    className="px-3 text-red-600 hover:text-red-700"
                    onClick={() => handleDelete(pet.id)}
                    disabled={deletingId === pet.id}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
