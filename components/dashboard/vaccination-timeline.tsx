import { Check, AlertCircle, Clock } from 'lucide-react'

interface VaccinationEvent {
  id: string
  vaccine_name: string
  vaccination_date: string
  next_due_date: string
  clinic_name?: string
}

interface VaccinationTimelineProps {
  vaccinations: VaccinationEvent[]
}

export function VaccinationTimeline({ vaccinations }: VaccinationTimelineProps) {
  if (vaccinations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600">
        No vaccination records yet
      </div>
    )
  }

  const sortedVaccinations = [...vaccinations].sort(
    (a, b) => new Date(a.vaccination_date).getTime() - new Date(b.vaccination_date).getTime()
  )

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getDaysUntil = (dueDate: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(dueDate)
    due.setHours(0, 0, 0, 0)
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 3600 * 24))
    return diff
  }

  const getStatusIcon = (daysUntil: number) => {
    if (daysUntil < 0) {
      return <AlertCircle className="w-5 h-5 text-red-500" />
    }
    if (daysUntil <= 7) {
      return <Clock className="w-5 h-5 text-orange-500" />
    }
    return <Check className="w-5 h-5 text-green-500" />
  }

  return (
    <div className="relative">
      <div className="space-y-6">
        {sortedVaccinations.map((vaccination, index) => {
          const daysUntil = getDaysUntil(vaccination.next_due_date)

          return (
            <div key={vaccination.id} className="relative flex gap-6">
              {/* Timeline Node */}
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center z-10">
                  {getStatusIcon(daysUntil)}
                </div>
                {index < sortedVaccinations.length - 1 && (
                  <div className="w-0.5 h-24 bg-gray-200 mt-2"></div>
                )}
              </div>

              {/* Timeline Content */}
              <div className="pb-6">
                <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{vaccination.vaccine_name}</h4>
                      {vaccination.clinic_name && (
                        <p className="text-sm text-gray-600">{vaccination.clinic_name}</p>
                      )}
                    </div>
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {formatDate(vaccination.vaccination_date)}
                    </span>
                  </div>

                  <div className="flex gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Vaccinated</p>
                      <p className="font-medium text-gray-900">{formatDate(vaccination.vaccination_date)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Next Due</p>
                      <p className="font-medium text-gray-900">{formatDate(vaccination.next_due_date)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
