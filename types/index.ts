export interface Pet {
  id: string
  name: string
  species: string
  breed: string | null
  photo_url: string | null
}

export interface Vaccination {
  id: string
  pet_id: string
  vaccine_name: string
  next_due_date: string
  pet: Pet | null
}

// Raw shape Supabase returns before normalization (pet comes back as an array)
export type VaccinationRow = Omit<Vaccination, 'pet'> & {
  pet: Pet[] | Pet | null
}
