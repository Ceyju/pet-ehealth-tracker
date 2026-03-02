'use client'

import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import Image from 'next/image'
import { CheckCircle, XCircle, ShieldCheck, PawPrint } from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
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
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function vaccineStatus(nextDue: string | null): 'valid' | 'expired' {
  if (!nextDue) return 'expired'
  return new Date(nextDue) >= new Date() ? 'valid' : 'expired'
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}

/** Derive vet / clinic from the most recent vaccination */
function deriveFooter(vaccinations: EHealthVaccination[]) {
  const sorted = [...vaccinations].sort(
    (a, b) => new Date(b.date_administered).getTime() - new Date(a.date_administered).getTime(),
  )
  const latest = sorted[0]
  return {
    vet: latest?.vet_name || null,
    clinic: latest?.clinic_name || null,
  }
}

/* ------------------------------------------------------------------ */
/*  Inline QR canvas component                                        */
/* ------------------------------------------------------------------ */
function QRCanvas({ value, size = 120 }: { value: string; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!ref.current) return
    QRCode.toCanvas(ref.current, value, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: size,
      color: { dark: '#1f2937', light: '#ffffff' },
    }).catch(console.error)
  }, [value, size])

  return <canvas ref={ref} className="rounded-lg" />
}

/* ------------------------------------------------------------------ */
/*  Main card                                                          */
/* ------------------------------------------------------------------ */
export function EHealthCard({ pet, userId }: { pet: EHealthPet; userId: string }) {
  const qrValue =
    typeof window !== 'undefined'
      ? `${window.location.origin}/qr/${pet.id}?user=${userId}`
      : `https://app/qr/${pet.id}?user=${userId}`

  const { vet, clinic } = deriveFooter(pet.vaccinations)

  return (
    <div
      className="w-full max-w-md mx-auto select-none"
      role="article"
      aria-label={`eHealth vaccination card for ${pet.name}`}
    >
      {/* ---- outer frame (orange border effect) ---- */}
      <div className="rounded-2xl border-4 border-orange-400 bg-white shadow-xl overflow-hidden">
        {/* ---- header ---- */}
        <div className="flex items-center justify-between bg-linear-to-r from-orange-400 to-orange-500 px-5 py-3">
          <span className="text-white font-extrabold tracking-wider text-lg flex items-center gap-1">
            <PawPrint className="w-5 h-5" aria-hidden />
            JOYCARE
          </span>
          <span className="text-white text-sm font-semibold tracking-wide uppercase">
            Vaccination Card
          </span>
        </div>

        {/* ---- pet info ---- */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-dashed border-orange-200">
          <div className="space-y-1 min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">
              Pet&apos;s Name
            </p>
            <p className="text-xl font-extrabold text-gray-900 uppercase truncate">
              {pet.name}
            </p>
            {pet.microchip_id && (
              <>
                <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium mt-2">
                  Microchip No.
                </p>
                <p className="font-mono text-sm text-gray-700">{pet.microchip_id}</p>
              </>
            )}
          </div>

          {/* pet avatar */}
          <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-orange-300 shrink-0 ml-4 bg-gray-100">
            {pet.photo_url ? (
              <Image
                src={pet.photo_url}
                alt={pet.name}
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl bg-orange-50">
                {pet.species?.toLowerCase() === 'dog' ? '🐶' : pet.species?.toLowerCase() === 'cat' ? '🐱' : '🐾'}
              </div>
            )}
          </div>
        </div>

        {/* ---- vaccinations list ---- */}
        <div className="px-5 py-4 space-y-3 border-b border-dashed border-orange-200">
          {pet.vaccinations.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              No vaccinations recorded yet
            </p>
          ) : (
            pet.vaccinations.map((v) => {
              const status = vaccineStatus(v.next_due_date)
              const isValid = status === 'valid'
              return (
                <div
                  key={v.id}
                  className="flex items-center justify-between"
                >
                  <p className="font-semibold text-gray-800 text-sm">{v.vaccine_name}</p>
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    {isValid ? (
                      <>
                        <span className="text-gray-400 uppercase text-[10px]">Valid until:</span>
                        <span className="text-green-600">{formatDate(v.next_due_date)}</span>
                        <CheckCircle className="w-4 h-4 text-green-500" aria-label="Valid" />
                      </>
                    ) : (
                      <>
                        <span className="text-gray-400 uppercase text-[10px]">Expired:</span>
                        <span className="text-red-500">{formatDate(v.next_due_date)}</span>
                        <XCircle className="w-4 h-4 text-red-400" aria-label="Expired" />
                      </>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* ---- vet / clinic footer ---- */}
        {(vet || clinic) && (
          <div className="grid grid-cols-2 gap-4 px-5 py-3 border-b border-dashed border-orange-200 text-xs text-gray-600">
            {vet && (
              <div>
                <p className="uppercase text-[10px] tracking-wider text-gray-400 font-medium mb-0.5">
                  Administered
                </p>
                <p className="font-semibold text-gray-800">{vet}</p>
              </div>
            )}
            {clinic && (
              <div>
                <p className="uppercase text-[10px] tracking-wider text-gray-400 font-medium mb-0.5">
                  Veterinary Clinic
                </p>
                <p className="font-semibold text-gray-800">{clinic}</p>
              </div>
            )}
          </div>
        )}

        {/* ---- QR code + verified badge ---- */}
        <div className="flex flex-col items-center py-5 gap-2">
          <QRCanvas value={qrValue} size={120} />
          <div className="flex items-center gap-1 text-green-600 text-xs font-semibold mt-1">
            <ShieldCheck className="w-4 h-4" />
            Vet Verified
          </div>
        </div>
      </div>
    </div>
  )
}
