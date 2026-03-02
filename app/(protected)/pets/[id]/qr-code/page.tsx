'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { QRCodeGenerator } from '@/components/qr-code-generator'
import { ArrowLeft } from 'lucide-react'

interface Pet {
  id: string
  name: string
}

export default function QRCodePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuthStore()
  const [pet, setPet] = useState<Pet | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPet = async () => {
      if (!user) return

      try {
        const { data } = await supabase
          .from('pets')
          .select('id, name')
          .eq('id', id)
          .eq('user_id', user.id)
          .single()

        setPet(data)
      } catch (err) {
        console.error('Error fetching pet:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPet()
  }, [id, user])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {pet.name}'s QR Code
        </h1>
        <p className="text-gray-600 mb-8">
          Share this QR code to allow others to quickly access your pet's health records
        </p>

        <div className="flex justify-center py-8">
          {user && (
            <QRCodeGenerator petId={pet.id} petName={pet.name} userId={user.id} />
          )}
        </div>

        <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">How to use this QR code:</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• Download or share the QR code image</li>
            <li>• Others can scan it to view your pet's vaccination records</li>
            <li>• Perfect for vets, pet sitters, or travel documents</li>
            <li>• No login required to view public health records</li>
          </ul>
        </div>
      </Card>
    </div>
  )
}
