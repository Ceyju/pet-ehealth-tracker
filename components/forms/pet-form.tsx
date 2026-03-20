'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { AlertCircle, CalendarIcon, Loader2, Upload } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'

interface PetFormProps {
  petId?: string
  onSuccess?: () => void
}

const SPECIES_OPTIONS = ['Dog', 'Cat', 'Bird', 'Rabbit', 'Hamster', 'Other']

export function PetForm({ petId, onSuccess }: PetFormProps) {
  const router = useRouter()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [dobOpen, setDobOpen] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    species: '',
    breed: '',
    date_of_birth: '',
    weight: '',
    microchip_id: '',
  })

  useEffect(() => {
    if (petId && user) {
      const fetchPet = async () => {
        const { data } = await supabase
          .from('pets')
          .select('*')
          .eq('id', petId)
          .eq('user_id', user.id)
          .single()

        if (data) {
          setFormData({
            name: data.name,
            species: data.species,
            breed: data.breed || '',
            date_of_birth: data.date_of_birth || '',
            weight: data.weight ? String(data.weight) : '',
            microchip_id: data.microchip_id || '',
          })
          setPhotoUrl(data.photo_url)
        }
      }

      fetchPet()
    }
  }, [petId, user])

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingPhoto(true)
    try {
      const fileName = `${user.id}/${Date.now()}-${file.name}`
      const { error: uploadError, data } = await supabase.storage
        .from('pet-photos')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('pet-photos')
        .getPublicUrl(fileName)

      setPhotoUrl(urlData.publicUrl)
    } catch (err) {
      setError('Failed to upload photo')
      console.error('Upload error:', err)
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const petData = {
        name: formData.name,
        species: formData.species.toLowerCase(),
        breed: formData.breed || null,
        date_of_birth: formData.date_of_birth || null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        microchip_id: formData.microchip_id || null,
        photo_url: photoUrl,
        user_id: user.id,
      }

      if (petId) {
        const { error: updateError } = await supabase
          .from('pets')
          .update(petData)
          .eq('id', petId)
          .eq('user_id', user.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('pets')
          .insert([petData])

        if (insertError) throw insertError
      }

      onSuccess?.()
      router.push('/pets')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const selectedDob = formData.date_of_birth ? parseISO(formData.date_of_birth) : undefined

  return (
    <Card className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        {petId ? 'Edit Pet' : 'Add New Pet'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-red-600">{error}</span>
          </div>
        )}

        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pet Photo
          </label>
          <div className="flex flex-col items-center gap-3">
            {photoUrl && (
              <img
                src={photoUrl}
                alt="Pet"
                className="w-50 h-50 rounded-lg object-cover border-2 border-gray-200"
              />
            )}
            <label className="flex items-center justify-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#7CA982] transition-colors">
              <Upload className="w-5 h-5 mr-2 text-gray-600" />
              <span className="text-sm text-gray-600">
                {uploadingPhoto ? 'Uploading...' : photoUrl ? 'Edit photo' : 'Click to upload'}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={uploadingPhoto}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Pet Name *
            </label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Max"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="species" className="block text-sm font-medium text-gray-700 mb-2">
              Species *
            </label>
            <select
              id="species"
              value={formData.species}
              onChange={(e) => setFormData({ ...formData, species: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7CA982] focus:border-transparent"
              disabled={loading}
            >
              {SPECIES_OPTIONS.map((species) => (
                <option key={species} value={species}>
                  {species}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="breed" className="block text-sm font-medium text-gray-700 mb-2">
              Breed
            </label>
            <Input
              id="breed"
              type="text"
              value={formData.breed}
              onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
              placeholder="e.g., Golden Retriever"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date of Birth
            </label>
            <Popover open={dobOpen} onOpenChange={setDobOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={loading}
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !formData.date_of_birth && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.date_of_birth
                    ? format(parseISO(formData.date_of_birth), 'PPP')
                    : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  captionLayout="dropdown"
                  selected={selectedDob}
                  onSelect={(date) => {
                    setFormData({
                      ...formData,
                      date_of_birth: date ? format(date, 'yyyy-MM-dd') : '',
                    })
                    setDobOpen(false)
                  }}
                  fromYear={1990}
                  toYear={new Date().getFullYear()}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-2">
              Weight (kg)
            </label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              placeholder="e.g., 25.5"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="microchip" className="block text-sm font-medium text-gray-700 mb-2">
              Microchip ID
            </label>
            <Input
              id="microchip"
              type="text"
              value={formData.microchip_id}
              onChange={(e) => setFormData({ ...formData, microchip_id: e.target.value })}
              placeholder="e.g., 123456789"
              disabled={loading}
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 pt-6">
          <Button
            type="submit"
            className="flex-1 bg-[#243E36] hover:bg-[#1a2e28] text-white"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              petId ? 'Update Pet' : 'Add Pet'
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  )
}