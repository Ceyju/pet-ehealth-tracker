'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import QRCode from 'qrcode'
import { CheckCircle, Info, LockKeyhole, PawPrint, XCircle } from 'lucide-react'
import { formatHealthDate, vaccinationStatus } from '@/lib/care'

export interface EHealthVaccination {
  id: string
  vaccine_name: string
  next_due_date: string | null
  date_administered: string
  clinic_name: string | null
  vet_name: string | null
}

export interface EHealthPet {
  id: string
  name: string
  species: string
  breed: string | null
  microchip_id: string | null
  photo_url: string | null
  vaccinations: EHealthVaccination[]
  is_dewormed: boolean
  deworming_date: string | null
  deworming_location: string | null
}

function nextDewormingStatus(value: string | null) {
  if (!value) return null
  const next = new Date(`${value.slice(0, 10)}T00:00:00`)
  next.setMonth(next.getMonth() + 6)
  const days = Math.ceil((next.getTime() - Date.now()) / 86_400_000)
  return { next, overdue: days < 0, soon: days >= 0 && days <= 30 }
}

function QRCanvas({ value }: { value: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (!ref.current) return
    void QRCode.toCanvas(ref.current, value, {
      errorCorrectionLevel: 'H', margin: 1, width: 120,
      color: { dark: '#1f2937', light: '#ffffff' },
    })
  }, [value])
  return <canvas ref={ref} className="rounded-lg" aria-label="Secure share QR code" />
}

export function EHealthCard({ pet, shareUrl }: { pet: EHealthPet; shareUrl?: string | null }) {
  const latestVaccination = [...pet.vaccinations].sort(
    (a, b) => new Date(b.date_administered).getTime() - new Date(a.date_administered).getTime(),
  )[0]
  const deworming = nextDewormingStatus(pet.deworming_date)

  return (
    <article className="mx-auto w-full max-w-md select-none" aria-label={`Owner-maintained health card for ${pet.name}`}>
      <div className="overflow-hidden rounded-2xl border-4 border-orange-400 bg-white text-gray-900 shadow-xl">
        <header className="flex items-center justify-between bg-linear-to-r from-orange-400 to-orange-500 px-5 py-3 text-white">
          <span className="flex items-center gap-1 text-lg font-extrabold tracking-wider"><PawPrint className="size-5" />JOYCARE</span>
          <span className="text-sm font-semibold uppercase tracking-wide">Health Card</span>
        </header>

        <section className="flex items-start justify-between border-b border-dashed border-orange-200 px-5 py-4">
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Pet’s name</p>
            <p className="truncate text-xl font-extrabold uppercase">{pet.name}</p>
            <p className="text-sm capitalize text-gray-500">{pet.species}{pet.breed ? ` · ${pet.breed}` : ''}</p>
            {pet.microchip_id && <><p className="mt-2 text-[11px] font-medium uppercase tracking-wider text-gray-400">Microchip</p><p className="break-all font-mono text-sm text-gray-700">{pet.microchip_id}</p></>}
          </div>
          <div className="ml-4 size-20 shrink-0 overflow-hidden rounded-xl border-2 border-orange-300 bg-orange-50">
            {pet.photo_url ? <Image src={pet.photo_url} alt={pet.name} width={80} height={80} className="size-full object-cover" /> : <div className="grid size-full place-items-center text-3xl">{pet.species.toLowerCase() === 'dog' ? '🐶' : pet.species.toLowerCase() === 'cat' ? '🐱' : '🐾'}</div>}
          </div>
        </section>

        <section className="space-y-3 border-b border-dashed border-orange-200 px-5 py-4" aria-label="Vaccinations">
          {pet.vaccinations.length === 0 ? <p className="py-4 text-center text-sm text-gray-400">No vaccinations recorded yet</p> : pet.vaccinations.map((vaccination) => {
            const status = vaccinationStatus(vaccination.next_due_date)
            const current = status !== 'overdue' && status !== 'unscheduled'
            return (
              <div key={vaccination.id} className="flex items-start justify-between gap-3">
                <p className="min-w-0 break-words text-sm font-semibold text-gray-800">{vaccination.vaccine_name}</p>
                <div className={`flex shrink-0 items-center gap-1 text-right text-xs font-medium ${current ? 'text-green-600' : 'text-red-500'}`}>
                  <span><span className="block text-[9px] uppercase text-gray-400">{current ? 'Valid until' : status === 'overdue' ? 'Expired' : 'Due date'}</span>{formatHealthDate(vaccination.next_due_date, { month: 'short', year: 'numeric' })}</span>
                  {current ? <CheckCircle className="size-4" aria-label="Current" /> : <XCircle className="size-4" aria-label="Needs attention" />}
                </div>
              </div>
            )
          })}
        </section>

        <section className="border-b border-dashed border-orange-200 px-5 py-3">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-gray-400">Deworming</p>
          {pet.is_dewormed ? (
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3 text-sm"><span className="flex items-center gap-1.5 font-semibold text-green-700"><CheckCircle className="size-4" />Recorded</span><span className="text-right text-xs text-gray-600">{formatHealthDate(pet.deworming_date)}{pet.deworming_location && <span className="block text-gray-400">{pet.deworming_location}</span>}</span></div>
              {deworming && <div className={`flex justify-between rounded-lg px-2 py-1.5 text-xs ${deworming.overdue ? 'bg-red-50 text-red-600' : deworming.soon ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}><span className="font-medium">{deworming.overdue ? 'Deworming overdue' : 'Next deworming'}</span><span className="font-semibold">{formatHealthDate(deworming.next.toISOString())}</span></div>}
            </div>
          ) : <span className="flex items-center gap-1.5 text-sm font-medium text-amber-700"><XCircle className="size-4" />Not recorded</span>}
        </section>

        {(latestVaccination?.vet_name || latestVaccination?.clinic_name) && (
          <section className="grid grid-cols-2 gap-4 border-b border-dashed border-orange-200 px-5 py-3 text-xs">
            <div><p className="mb-0.5 text-[10px] font-medium uppercase tracking-wider text-gray-400">Provider</p><p className="font-semibold text-gray-800">{latestVaccination.vet_name || 'Not listed'}</p></div>
            <div><p className="mb-0.5 text-[10px] font-medium uppercase tracking-wider text-gray-400">Clinic</p><p className="font-semibold text-gray-800">{latestVaccination.clinic_name || 'Not listed'}</p></div>
          </section>
        )}

        <footer className="flex flex-col items-center gap-2 py-5">
          {shareUrl ? <QRCanvas value={shareUrl} /> : <div className="grid size-[120px] place-items-center rounded-xl border border-dashed border-orange-200 bg-orange-50 text-orange-700"><div className="text-center"><LockKeyhole className="mx-auto mb-1 size-5" /><span className="text-[10px] font-semibold">Private</span></div></div>}
          <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-gray-600"><Info className="size-4" />Owner-maintained record</div>
          {!shareUrl && <p className="px-5 text-center text-[10px] text-gray-400">Create a revocable share link to activate this QR.</p>}
        </footer>
      </div>
    </article>
  )
}
