import { Check, AlertCircle, Clock, ShieldCheck } from 'lucide-react'

interface VaccinationEvent {
  id: string
  vaccine_name: string
  vaccine_type?: string | null
  date_administered: string
  expiry_date?: string | null
  next_due_date: string
  clinic_name?: string | null
  vet_name?: string | null
  batch_number?: string | null
  notes?: string | null
  is_verified?: boolean
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

  const sorted = [...vaccinations].sort(
    (a, b) => new Date(a.date_administered).getTime() - new Date(b.date_administered).getTime()
  )

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getDaysUntil = (dueDate: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(dueDate)
    due.setHours(0, 0, 0, 0)
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 3600 * 24))
  }

  const getStatus = (daysUntil: number) => {
    if (daysUntil < 0)  return { icon: <AlertCircle className="w-5 h-5 text-red-500" />,    label: 'Overdue',  color: 'text-red-600',    bg: 'bg-red-50 border-red-200' }
    if (daysUntil <= 7) return { icon: <Clock className="w-5 h-5 text-orange-500" />,        label: 'Due soon', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' }
    return               { icon: <Check className="w-5 h-5 text-green-500" />,               label: 'Up to date', color: 'text-green-600', bg: 'bg-green-50 border-green-200' }
  }

  return (
    <div className="relative">
      <div className="space-y-6">
        {sorted.map((v, index) => {
          const daysUntil = getDaysUntil(v.next_due_date)
          const status = getStatus(daysUntil)

          return (
            <div key={v.id} className="relative flex gap-6">
              {/* Timeline Node */}
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center z-10">
                  {status.icon}
                </div>
                {index < sorted.length - 1 && (
                  <div className="w-0.5 flex-1 min-h-[3rem] bg-gray-200 mt-2" />
                )}
              </div>

              {/* Card */}
              <div className="flex-1 pb-6">
                <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900">{v.vaccine_name}</h4>
                      {v.is_verified && (
                        <span title="Verified by vet" className="text-[#7CA982]">
                          <ShieldCheck className="w-4 h-4" />
                        </span>
                      )}
                      {v.vaccine_type && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#E0EEC6] text-[#243E36] capitalize">
                          {v.vaccine_type}
                        </span>
                      )}
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded border ${status.bg} ${status.color}`}>
                      {status.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                    <div>
                      <p className="text-gray-500">Administered</p>
                      <p className="font-medium text-gray-900">{formatDate(v.date_administered)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Next Due</p>
                      <p className={`font-medium ${daysUntil < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                        {formatDate(v.next_due_date)}
                      </p>
                    </div>
                    {v.expiry_date && (
                      <div>
                        <p className="text-gray-500">Expires</p>
                        <p className="font-medium text-gray-900">{formatDate(v.expiry_date)}</p>
                      </div>
                    )}
                    {v.clinic_name && (
                      <div>
                        <p className="text-gray-500">Clinic</p>
                        <p className="font-medium text-gray-900">{v.clinic_name}</p>
                      </div>
                    )}
                    {v.vet_name && (
                      <div>
                        <p className="text-gray-500">Veterinarian</p>
                        <p className="font-medium text-gray-900">{v.vet_name}</p>
                      </div>
                    )}
                    {v.batch_number && (
                      <div>
                        <p className="text-gray-500">Batch / Lot</p>
                        <p className="font-medium text-gray-900">{v.batch_number}</p>
                      </div>
                    )}
                  </div>

                  {v.notes && (
                    <p className="mt-3 text-sm text-gray-500 italic border-t border-gray-100 pt-2">
                      {v.notes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}