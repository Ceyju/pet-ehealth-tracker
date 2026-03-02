import { Card } from '@/components/ui/card'
import { Heart, Syringe } from 'lucide-react'

interface DashboardStatsProps {
  petsCount: number
  vaccinationsCount: number
}

export function DashboardStats({ petsCount, vaccinationsCount }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium">Total Pets</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{petsCount}</p>
          </div>
          <div className="w-12 h-12 bg-[#E0EEC6] rounded-lg flex items-center justify-center">
            <Heart className="w-6 h-6 text-[#243E36]" />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium">Upcoming Vaccinations</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{vaccinationsCount}</p>
          </div>
          <div className="w-12 h-12 bg-[#E0EEC6] rounded-lg flex items-center justify-center">
            <Syringe className="w-6 h-6 text-[#7CA982]" />
          </div>
        </div>
      </Card>
    </div>
  )
}
