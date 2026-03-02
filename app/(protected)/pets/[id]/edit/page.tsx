'use client'

import { use } from 'react'
import { PetForm } from '@/components/forms/pet-form'

export default function EditPetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PetForm petId={id} />
    </div>
  )
}
