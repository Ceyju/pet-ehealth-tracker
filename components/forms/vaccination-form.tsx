'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { AlertCircle, Loader2, Syringe, CalendarIcon } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import { FormSelect } from '@/components/forms/form-select'

interface VaccinationFormProps {
  petId: string
  vaccinationId?: string
  onSuccess?: () => void
}

const COMMON_VACCINES = [
  'DHPP',
  'Rabies',
  'FVRCP',
  'FVRCP booster',
  'FVRCP final booster',
  'FeLV',
  'Bordetella',
  'Leptospirosis',
  'Influenza',
  'Heartworm Test',
  'Other – specify',
]

const CAT_SCHEDULE = [
  { age: '6–8 weeks',           vaccine: 'FVRCP',               note: 'Feline viral rhinotracheitis, calicivirus, panleukopenia' },
  { age: '10–12 weeks',         vaccine: 'FVRCP booster',       note: 'Second dose' },
  { age: '12–16 weeks',         vaccine: 'Rabies',              note: 'First rabies vaccine' },
  { age: '14–16 weeks',         vaccine: 'FVRCP final booster', note: 'Third and final kitten dose' },
  { age: 'Annually thereafter', vaccine: 'FVRCP + Rabies',      note: 'Annual boosters for both' },
]

type VaccineType = 'core' | 'non-core' | 'booster'

// ── reusable calendar popover field ───────────────────────────────────────────
function DatePickerField({
  id,
  label,
  required,
  value,
  onChange,
  disabled,
}: {
  id: string
  label: string
  required?: boolean
  value: string        // "YYYY-MM-DD" or ""
  onChange: (val: string) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected = value ? parseISO(value) : undefined

  return (
    <div ref={ref} className="relative">
      <label htmlFor={id} className="block text-sm font-medium text-white-700 mb-2">
        {label} {required && '*'}
      </label>
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'w-full flex items-center gap-2 px-4 py-2 border border-input rounded-lg bg-transparent text-foreground text-sm shadow-xs',
          'dark:bg-input/30 focus:outline-none focus:ring-2 focus:ring-[#7CA982] focus:border-transparent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          !selected && 'text-gray-400'
        )}
      >
        <CalendarIcon className="w-4 h-4 shrink-0 text-gray-400" />
        {selected ? format(selected, 'PPP') : 'Pick a date'}
      </button>

      {open && (
        <div className="absolute z-50 mt-1 rounded-xl border border-gray-200 bg-white shadow-lg">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(date) => {
              onChange(date ? format(date, 'yyyy-MM-dd') : '')
              setOpen(false)
            }}
            initialFocus
          />
        </div>
      )}
    </div>
  )
}

// ── main component ─────────────────────────────────────────────────────────────
export function VaccinationForm({ petId, vaccinationId, onSuccess }: VaccinationFormProps) {
  const router = useRouter()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [petName, setPetName] = useState<string | null>(null)
  const [petSpecies, setPetSpecies] = useState<string | null>(null)
  const [isCustomVaccine, setIsCustomVaccine] = useState(false)
  const [dropdownValue, setDropdownValue] = useState('')

  const [formData, setFormData] = useState({
    vaccine_name: '',
    vaccine_type: 'core' as VaccineType,
    date_administered: format(new Date(), 'yyyy-MM-dd'),
    expiry_date: '',
    next_due_date: format(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    clinic_name: '',
    vet_name: '',
    batch_number: '',
    notes: '',
  })

  const prefillVaccine = (name: string) => {
    setIsCustomVaccine(false)
    setDropdownValue(name)
    setFormData((prev) => ({ ...prev, vaccine_name: name }))
    document.getElementById('vaccine-form-section')?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (!user) return

    const fetchPet = async () => {
      const { data } = await supabase
        .from('pets')
        .select('name, species')
        .eq('id', petId)
        .eq('user_id', user.id)
        .single()

      setPetName(data?.name || null)
      setPetSpecies(data?.species?.toLowerCase() || null)
    }

    fetchPet()

    if (vaccinationId) {
      const fetchVaccination = async () => {
        const { data } = await supabase
          .from('vaccinations')
          .select('*')
          .eq('id', vaccinationId)
          .single()

        if (data) {
          const isKnown = COMMON_VACCINES.includes(data.vaccine_name)
          setDropdownValue(isKnown ? data.vaccine_name : 'Other – specify')
          setIsCustomVaccine(!isKnown)
          setFormData({
            vaccine_name: data.vaccine_name,
            vaccine_type: data.vaccine_type ?? 'core',
            date_administered: data.date_administered,
            expiry_date: data.expiry_date ?? '',
            next_due_date: data.next_due_date ?? '',
            clinic_name: data.clinic_name ?? '',
            vet_name: data.vet_name ?? '',
            batch_number: data.batch_number ?? '',
            notes: data.notes ?? '',
          })
        }
      }

      fetchVaccination()
    }
  }, [petId, vaccinationId, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (!formData.vaccine_name.trim()) {
      setError('Choose a vaccine or enter a custom vaccine name.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const legacyStatus = !formData.next_due_date
        ? 'completed'
        : formData.next_due_date < format(new Date(), 'yyyy-MM-dd')
          ? 'overdue'
          : 'upcoming'
      const vaccinationData = {
        pet_id: petId,
        vaccine_name: formData.vaccine_name,
        vaccine_type: formData.vaccine_type,
        date_administered: formData.date_administered,
        expiry_date: formData.expiry_date || null,
        next_due_date: formData.next_due_date || null,
        clinic_name: formData.clinic_name || null,
        vet_name: formData.vet_name || null,
        batch_number: formData.batch_number || null,
        notes: formData.notes || null,
        status: legacyStatus,
        is_verified: false,
      }

      if (vaccinationId) {
        const { error: updateError } = await supabase
          .from('vaccinations')
          .update(vaccinationData)
          .eq('id', vaccinationId)
          .eq('pet_id', petId)
          .select('id')
          .single()

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('vaccinations')
          .insert([vaccinationData])
          .select('id')
          .single()

        if (insertError) throw insertError
      }

      onSuccess?.()
      router.push(`/pets/${petId}`)
      router.refresh()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-white-900 mb-2">
        {vaccinationId ? 'Edit Vaccination' : 'Record Vaccination'}
      </h1>
      {petName && (
        <p className="text-white-600 mb-6">for {petName.toUpperCase()}</p>
      )}

      {/* Cat Vaccination Schedule */}
      {petSpecies === 'cat' && !vaccinationId && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Syringe className="w-4 h-4 text-[#7CA982]" />
            <h2 className="text-sm font-semibold text-white-900 uppercase tracking-wide">
              Recommended Cat Vaccination Schedule
            </h2>
          </div>
          <div className="border border-[#E0EEC6] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#E0EEC6]">
                  <th className="text-left px-4 py-2 font-medium text-[#243E36]">Age</th>
                  <th className="text-left px-4 py-2 font-medium text-[#243E36]">Vaccine</th>
                  <th className="text-left px-4 py-2 font-medium text-[#243E36] hidden sm:table-cell">Notes</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {CAT_SCHEDULE.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#F1F7ED]'}>
                    <td className="px-4 py-2 font-medium text-gray-700 whitespace-nowrap">{row.age}</td>
                    <td className="px-4 py-2 text-gray-900">{row.vaccine}</td>
                    <td className="px-4 py-2 text-gray-500 hidden sm:table-cell">{row.note}</td>
                    <td className="px-4 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => prefillVaccine(row.vaccine)}
                        className="text-xs text-[#7CA982] hover:text-[#243E36] font-medium underline-offset-2 hover:underline"
                      >
                        Use
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-2">Choose Use to pre-fill the form below with that vaccine.</p>
        </div>
      )}

      <form id="vaccine-form-section" onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
            <span className="text-sm text-red-600">{error}</span>
          </div>
        )}

        {/* Vaccine Name */}
        <div>
          <FormSelect
            id="vaccine"
            label="Vaccine Name"
            value={dropdownValue}
            onChange={(val) => {
              setDropdownValue(val)
              if (val === 'Other – specify') {
                setIsCustomVaccine(true)
                setFormData((prev) => ({ ...prev, vaccine_name: '' }))
              } else {
                setIsCustomVaccine(false)
                setFormData((prev) => ({ ...prev, vaccine_name: val }))
              }
            }}
            options={COMMON_VACCINES.map((vaccine) => ({ label: vaccine, value: vaccine }))}
            placeholder="Select a vaccine"
            required
            searchable
            searchPlaceholder="Search vaccines…"
            disabled={loading}
          />

          {isCustomVaccine && (
            <Input
              type="text"
              value={formData.vaccine_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, vaccine_name: e.target.value }))}
              placeholder="Enter vaccine name"
              required
              disabled={loading}
              className="mt-2"
              autoFocus
            />
          )}
        </div>

        {/* Vaccine Type */}
        <div>
          <FormSelect
            id="vaccineType"
            label="Vaccine Type"
            value={formData.vaccine_type}
            onChange={(value) => setFormData((prev) => ({ ...prev, vaccine_type: value as VaccineType }))}
            options={[
              { label: 'Core', value: 'core' },
              { label: 'Non-core', value: 'non-core' },
              { label: 'Booster', value: 'booster' },
            ]}
            required
            disabled={loading}
          />
        </div>

        {/* Dates — all three use Calendar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DatePickerField
            id="dateAdministered"
            label="Date Administered"
            required
            value={formData.date_administered}
            onChange={(val) => setFormData((prev) => ({ ...prev, date_administered: val }))}
            disabled={loading}
          />

          <DatePickerField
            id="expiryDate"
            label="Expiry Date"
            value={formData.expiry_date}
            onChange={(val) => setFormData((prev) => ({ ...prev, expiry_date: val }))}
            disabled={loading}
          />

          <DatePickerField
            id="nextDue"
            label="Next Due Date"
            value={formData.next_due_date}
            onChange={(val) => setFormData((prev) => ({ ...prev, next_due_date: val }))}
            disabled={loading}
          />
        </div>

        {/* Clinic & Vet */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="clinic" className="block text-sm font-medium text-white-700 mb-2">
              Clinic Name
            </label>
            <Input
              id="clinic"
              type="text"
              value={formData.clinic_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, clinic_name: e.target.value }))}
              placeholder="e.g., Happy Paws Veterinary"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="vetName" className="block text-sm font-medium text-white-700 mb-2">
              Veterinarian Name
            </label>
            <Input
              id="vetName"
              type="text"
              value={formData.vet_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, vet_name: e.target.value }))}
              placeholder="e.g., Dr. Santos"
              disabled={loading}
            />
          </div>
        </div>

        {/* Batch Number */}
        <div>
          <label htmlFor="batchNumber" className="block text-sm font-medium text-white-700 mb-2">
            Batch / Lot Number
          </label>
          <Input
            id="batchNumber"
            type="text"
            value={formData.batch_number}
            onChange={(e) => setFormData((prev) => ({ ...prev, batch_number: e.target.value }))}
            placeholder="e.g., A1234B"
            disabled={loading}
          />
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-white-700 mb-2">
            Notes
          </label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder="Any additional information about the vaccination"
            disabled={loading}
            rows={4}
            className="w-full px-4 py-2 border border-white-300 rounded-lg focus:ring-2 focus:ring-[#7CA982] focus:border-transparent"
          />
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
