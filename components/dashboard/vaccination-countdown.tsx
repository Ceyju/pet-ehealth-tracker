import { useMemo } from 'react'
import Link from 'next/link'
import { AlertCircle, CheckCircle, Clock } from 'lucide-react'

interface Vaccination {
  id: string
  pet_id: string
  vaccine_name: string
  next_due_date: string
  pet: {
    id: string
    name: string
    species: string
  }
}

export function VaccinationCountdown({ vaccination }: { vaccination: Vaccination }) {
  const { daysUntil, status, badgeClass } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dueDate = new Date(vaccination.next_due_date)
    dueDate.setHours(0, 0, 0, 0)
    const timeDiff = dueDate.getTime() - today.getTime()
    const daysUntil = Math.ceil(timeDiff / (1000 * 3600 * 24))

    let status = 'upcoming'
    let badgeClass = 'bg-blue-100 text-blue-700'

    if (daysUntil < 0) {
      status = 'overdue'
      badgeClass = 'bg-red-100 text-red-700'
    } else if (daysUntil <= 7) {
      status = 'urgent'
      badgeClass = 'bg-orange-100 text-orange-700'
    } else if (daysUntil <= 30) {
      status = 'soon'
      badgeClass = 'bg-yellow-100 text-yellow-700'
    }

    return { daysUntil, status, badgeClass }
  }, [vaccination.next_due_date])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getStatusLabel = () => {
    if (daysUntil < 0) {
      return `Overdue by ${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? 's' : ''}`
    } else if (daysUntil === 0) {
      return 'Due today'
    } else if (daysUntil === 1) {
      return 'Due tomorrow'
    } else {
      return `Due in ${daysUntil} days`
    }
  }

  return (
    <Link href={`/pets/${vaccination.pet_id}`}>
      <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-gray-50 transition-colors cursor-pointer">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="font-semibold text-gray-900">{vaccination.vaccine_name}</p>
            <p className="text-sm text-gray-600 mt-1">{vaccination.pet.name} ({vaccination.pet.species})</p>
            <p className="text-xs text-gray-500 mt-2">Due: {formatDate(vaccination.next_due_date)}</p>
          </div>

          <div className="flex flex-col items-end gap-2 ml-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${badgeClass}`}>
              {status === 'overdue' && <AlertCircle className="w-4 h-4" />}
              {status === 'urgent' && <Clock className="w-4 h-4" />}
              {status === 'soon' && <Clock className="w-4 h-4" />}
              {status === 'upcoming' && <CheckCircle className="w-4 h-4" />}
              {getStatusLabel()}
            </span>

            <span className="text-2xl font-bold text-gray-900">
              {daysUntil < 0 ? '-' : ''}{Math.abs(daysUntil)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
