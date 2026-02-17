'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { AlertCircle, Loader2 } from 'lucide-react'

interface VaccinationFormProps {
  petId: string
  vaccinationId?: string
  onSuccess?: () => void
}

const COMMON_VACCINES = [
  'DHPP',
  'Rabies',
  'FVRCP',
  'FeLV',
  'Bordetella',
  'Leptospirosis',
  'Influenza',
  'Heartworm Test',
  'Other',
]

export function VaccinationForm({ petId, vaccinationId, onSuccess }: VaccinationFormProps) {
  const router = useRouter()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [petName, setPetName] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    vaccine_name: '',
    vaccination_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    next_due_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    clinic_name: '',
    notes: '',
    is_verified: false,
  })

  useEffect(() => {
    if (!user) return

    // Fetch pet name
    const fetchPetName = async () => {
      const { data } = await supabase
        .from('pets')
        .select('name')
        .eq('id', petId)
        .eq('user_id', user.id)
        .single()

      setPetName(data?.name || null)
    }

    fetchPetName()

    // Fetch existing vaccination if editing
    if (vaccinationId) {
      const fetchVaccination = async () => {
        const { data } = await supabase
          .from('vaccinations')
          .select('*')
          .eq('id', vaccinationId)
          .eq('user_id', user.id)
          .single()

        if (data) {
          setFormData({
            vaccine_name: data.vaccine_name,
            vaccination_date: data.vaccination_date,
            expiry_date: data.expiry_date || '',
            next_due_date: data.next_due_date,
            clinic_name: data.clinic_name || '',
            notes: data.notes || '',
            is_verified: data.is_verified,
          })
        }
      }

      fetchVaccination()
    }
  }, [petId, vaccinationId, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const vaccinationData = {
        pet_id: petId,
        user_id: user.id,
        vaccine_name: formData.vaccine_name,
        vaccination_date: formData.vaccination_date,
        expiry_date: formData.expiry_date || null,
        next_due_date: formData.next_due_date,
        clinic_name: formData.clinic_name || null,
        notes: formData.notes || null,
        is_verified: formData.is_verified,
      }

      if (vaccinationId) {
        // Update existing
        const { error: updateError } = await supabase
          .from('vaccinations')
          .update(vaccinationData)
          .eq('id', vaccinationId)
          .eq('user_id', user.id)

        if (updateError) throw updateError
      } else {
        // Create new
        const { error: insertError } = await supabase
          .from('vaccinations')
          .insert([vaccinationData])

        if (insertError) throw insertError
      }

      onSuccess?.()
      router.push(`/pets/${petId}`)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        {vaccinationId ? 'Edit Vaccination' : 'Record Vaccination'}
      </h1>
      {petName && (
        <p className="text-gray-600 mb-8">for {petName}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-red-600">{error}</span>
          </div>
        )}

        {/* Vaccine Name */}
        <div>
          <label htmlFor="vaccine" className="block text-sm font-medium text-gray-700 mb-2">
            Vaccine Type *
          </label>
          <div className="flex gap-2">
            <select
              id="vaccine"
              value={formData.vaccine_name}
              onChange={(e) => {
                if (e.target.value === 'Other') {
                  setFormData({ ...formData, vaccine_name: '' })
                } else {
                  setFormData({ ...formData, vaccine_name: e.target.value })
                }
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="">Select a vaccine</option>
              {COMMON_VACCINES.map((vaccine) => (
                <option key={vaccine} value={vaccine}>
                  {vaccine}
                </option>
              ))}
            </select>
          </div>
          {formData.vaccine_name && (
            <Input
              type="text"
              value={formData.vaccine_name}
              onChange={(e) => setFormData({ ...formData, vaccine_name: e.target.value })}
              placeholder="Enter vaccine name"
              disabled={loading}
              className="mt-2"
            />
          )}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="vaccDate" className="block text-sm font-medium text-gray-700 mb-2">
              Vaccination Date *
            </label>
            <Input
              id="vaccDate"
              type="date"
              value={formData.vaccination_date}
              onChange={(e) => setFormData({ ...formData, vaccination_date: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-2">
              Expiry Date
            </label>
            <Input
              id="expiryDate"
              type="date"
              value={formData.expiry_date}
              onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
              disabled={loading}
            />
          </div>
        </div>

        {/* Next Due Date */}
        <div>
          <label htmlFor="nextDue" className="block text-sm font-medium text-gray-700 mb-2">
            Next Due Date *
          </label>
          <Input
            id="nextDue"
            type="date"
            value={formData.next_due_date}
            onChange={(e) => setFormData({ ...formData, next_due_date: e.target.value })}
            required
            disabled={loading}
          />
        </div>

        {/* Clinic Details */}
        <div>
          <label htmlFor="clinic" className="block text-sm font-medium text-gray-700 mb-2">
            Clinic Name
          </label>
          <Input
            id="clinic"
            type="text"
            value={formData.clinic_name}
            onChange={(e) => setFormData({ ...formData, clinic_name: e.target.value })}
            placeholder="e.g., Happy Paws Veterinary"
            disabled={loading}
          />
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Any additional information about the vaccination"
            disabled={loading}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-4 pt-6">
          <Button
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              vaccinationId ? 'Update Vaccination' : 'Record Vaccination'
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
