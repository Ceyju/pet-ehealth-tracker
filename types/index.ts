export interface PetSummary {
  id: string
  name: string
  species: string
  breed: string | null
  photo_url: string | null
}

export interface PetHealthProfile extends PetSummary {
  user_id: string
  date_of_birth: string | null
  weight: number | null
  microchip_id: string | null
  medical_notes: string | null
  is_dewormed: boolean
  deworming_date: string | null
  deworming_location: string | null
}

export interface VaccinationRecord {
  id: string
  pet_id: string
  vaccine_name: string
  vaccine_type?: string
  date_administered?: string
  next_due_date: string | null
  clinic_name?: string | null
  vet_name?: string | null
  provenance?: 'owner_reported'
  pet: PetSummary | null
}

export interface MedicalRecord {
  id: string
  pet_id: string
  record_type: string
  title: string
  occurred_on: string
  description: string | null
  provider_name: string | null
}

export interface RecordAttachment {
  id: string
  record_id: string
  storage_path: string
  mime_type: string
  byte_size: number
  original_name: string
}

export interface Reminder {
  id: string
  pet_id: string | null
  title: string
  notes: string | null
  due_at: string
  recurrence: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
  status: 'scheduled' | 'completed' | 'dismissed'
  channels: string[]
}

export interface TimelineEvent {
  id: string
  type: 'vaccination' | 'medical_record' | 'reminder'
  title: string
  date: string
  description?: string | null
}

export interface ShareLink {
  id: string
  pet_id: string
  allowed_sections: string[]
  expires_at: string | null
  revoked_at: string | null
  last_accessed_at: string | null
  created_at: string
}

export interface TelegramConnection {
  connected_at: string | null
  telegram_username: string | null
  revoked_at: string | null
}

// Backward-compatible names for existing screens during the additive rollout.
export type Pet = PetSummary
export type Vaccination = VaccinationRecord
export type VaccinationRow = Omit<Vaccination, 'pet'> & { pet: PetSummary[] | PetSummary | null }
