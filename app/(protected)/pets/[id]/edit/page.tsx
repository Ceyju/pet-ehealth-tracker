import { PetForm } from '@/components/forms/pet-form'

export default function EditPetPage({ params }: { params: { id: string } }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PetForm petId={params.id} />
    </div>
  )
}
