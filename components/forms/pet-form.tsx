'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertCircle, CalendarIcon, Loader2, Upload } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

interface PetFormProps {
  petId?: string
  onSuccess?: () => void
}

const SPECIES_OPTIONS = ['Dog', 'Cat']

export function PetForm({ petId, onSuccess }: PetFormProps) {
  const router = useRouter()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [dobOpen, setDobOpen] = useState(false)
  const [dewormingOpen, setDewormingOpen] = useState(false)
  const [cropOpen, setCropOpen] = useState(false)
  const [rawImageUrl, setRawImageUrl] = useState<string | null>(null)
  const croppieRef = useRef<HTMLDivElement>(null)
  const croppieInstance = useRef<any>(null)

  const [formData, setFormData] = useState({
    name: '',
    species: '',
    breed: '',
    date_of_birth: '',
    weight: '',
    microchip_id: '',
    is_dewormed: false,
    deworming_date: '',
    deworming_location: '',
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
            species: data.species
              ? data.species.charAt(0).toUpperCase() + data.species.slice(1)
              : '',
            breed: data.breed || '',
            date_of_birth: data.date_of_birth || '',
            weight: data.weight ? String(data.weight) : '',
            microchip_id: data.microchip_id || '',
            is_dewormed: data.is_dewormed || false,
            deworming_date: data.deworming_date || '',
            deworming_location: data.deworming_location || '',
          })
          setPhotoUrl(data.photo_url)
        }
      }

      fetchPet()
    }
  }, [petId, user])

  useEffect(() => {
    if (!cropOpen) return

    // Wait for the Dialog to mount its DOM before init
    const timer = setTimeout(async () => {
      if (!croppieRef.current || !rawImageUrl) return
      const CroppieLib = (await import('croppie')).default
      if (croppieInstance.current) {
        croppieInstance.current.destroy()
      }
      croppieInstance.current = new CroppieLib(croppieRef.current, {
        viewport: { width: 200, height: 200, type: 'square' },
        boundary: { width: 280, height: 280 },
        showZoomer: true,
        enableOrientation: true,
      })
      croppieInstance.current.bind({ url: rawImageUrl })
    }, 150)

    return () => {
      clearTimeout(timer)
      if (croppieInstance.current) {
        croppieInstance.current.destroy()
        croppieInstance.current = null
      }
    }
  }, [cropOpen, rawImageUrl])

  // Step 1: user picks a file → open crop modal
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setRawImageUrl(url)
    setCropOpen(true)
    e.target.value = '' // allow re-selecting same file
  }

  // Step 2: user confirms crop → upload blob to Supabase
  const handleCropConfirm = async () => {
    if (!croppieInstance.current || !user) return
    setUploadingPhoto(true)
    setCropOpen(false)
    try {
      const blob: Blob = await croppieInstance.current.result({
        type: 'blob',
        size: { width: 400, height: 400 },
        format: 'jpeg',
        quality: 0.9,
      })
      const fileName = `${user.id}/${Date.now()}-cropped.jpg`
      const { error: uploadError } = await supabase.storage
        .from('pet-photos')
        .upload(fileName, blob, { upsert: true, contentType: 'image/jpeg' })
      if (uploadError) throw uploadError
      const { data: urlData } = supabase.storage
        .from('pet-photos')
        .getPublicUrl(fileName)
      setPhotoUrl(urlData.publicUrl)
      if (rawImageUrl) URL.revokeObjectURL(rawImageUrl)
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
        is_dewormed: formData.is_dewormed,
        deworming_date: formData.is_dewormed && formData.deworming_date ? formData.deworming_date : null,
        deworming_location: formData.is_dewormed && formData.deworming_location ? formData.deworming_location : null,
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

        {/* Crop Modal */}
        <Dialog open={cropOpen} onOpenChange={(open) => { if (!open) setCropOpen(false) }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Crop Photo</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center py-2">
              <div ref={croppieRef} />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setCropOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-[#243E36] hover:bg-[#1a2e28] text-white"
                onClick={handleCropConfirm}
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading...</>
                ) : 'Crop & Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
                onChange={handleFileSelect}
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
            <Select
              value={formData.species}
              onValueChange={(value) => setFormData({ ...formData, species: value })}
              disabled={loading}
            >
              <SelectTrigger id="species" className="w-full">
                <SelectValue placeholder="Select species" />
              </SelectTrigger>
              <SelectContent>
                {SPECIES_OPTIONS.map((species) => (
                  <SelectItem key={species} value={species}>
                    {species}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

        {/* Deworming */}
        <div className="col-span-1 md:col-span-2 border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Deworming</p>
              <p className="text-xs text-gray-500">Has this pet been dewormed?</p>
            </div>
            <Switch
              checked={formData.is_dewormed}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_dewormed: checked })
              }
              disabled={loading}
            />
          </div>

          {formData.is_dewormed && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deworming Date
                </label>
                <Popover open={dewormingOpen} onOpenChange={setDewormingOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={loading}
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !formData.deworming_date && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.deworming_date
                        ? format(parseISO(formData.deworming_date), 'PPP')
                        : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      captionLayout="dropdown"
                      selected={formData.deworming_date ? parseISO(formData.deworming_date) : undefined}
                      onSelect={(date) => {
                        setFormData({
                          ...formData,
                          deworming_date: date ? format(date, 'yyyy-MM-dd') : '',
                        })
                        setDewormingOpen(false)
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Clinic / Location
                </label>
                <Input
                  type="text"
                  value={formData.deworming_location}
                  onChange={(e) => setFormData({ ...formData, deworming_location: e.target.value })}
                  placeholder="e.g., City Vet Clinic"
                  disabled={loading}
                />
              </div>
            </div>
          )}
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