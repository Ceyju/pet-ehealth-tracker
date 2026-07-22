'use client'

import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { EHealthCard, type EHealthPet } from '@/components/ehealth-card'
import { cn } from '@/lib/utils'

export function EHealthCarousel({ pets, shareUrls = {} }: { pets: EHealthPet[]; shareUrls?: Record<string, string> }) {
  const [emblaRef, api] = useEmblaCarousel({ align: 'center', loop: false, skipSnaps: false })
  const [selected, setSelected] = useState(0)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)
  const sync = useCallback(() => {
    if (!api) return
    setSelected(api.selectedScrollSnap()); setCanPrev(api.canScrollPrev()); setCanNext(api.canScrollNext())
  }, [api])
  useEffect(() => {
    if (!api) return
    api.on('select', sync); api.on('reInit', sync)
    const frame = requestAnimationFrame(sync)
    return () => { cancelAnimationFrame(frame); api.off('select', sync); api.off('reInit', sync) }
  }, [api, sync])
  if (!pets.length) return null
  if (pets.length === 1) return <EHealthCard pet={pets[0]} shareUrl={shareUrls[pets[0].id]} />
  return (
    <div className="relative mx-auto max-w-lg">
      <div ref={emblaRef} className="overflow-hidden"><div className="flex">{pets.map((pet) => <div key={pet.id} className="min-w-0 flex-[0_0_100%] px-1"><EHealthCard pet={pet} shareUrl={shareUrls[pet.id]} /></div>)}</div></div>
      <button onClick={() => api?.scrollPrev()} disabled={!canPrev} aria-label="Previous pet" className={cn('absolute left-0 top-1/2 grid size-11 -translate-x-1/3 -translate-y-1/2 place-items-center rounded-full border bg-background shadow-md sm:-left-7', !canPrev && 'pointer-events-none opacity-30')}><ChevronLeft className="size-5" /></button>
      <button onClick={() => api?.scrollNext()} disabled={!canNext} aria-label="Next pet" className={cn('absolute right-0 top-1/2 grid size-11 translate-x-1/3 -translate-y-1/2 place-items-center rounded-full border bg-background shadow-md sm:-right-7', !canNext && 'pointer-events-none opacity-30')}><ChevronRight className="size-5" /></button>
      <div className="mt-4 flex justify-center gap-2">{pets.map((pet, index) => <button key={pet.id} onClick={() => api?.scrollTo(index)} aria-label={`Show ${pet.name}`} className={cn('h-2 rounded-full transition-all', index === selected ? 'w-6 bg-orange-500' : 'w-2 bg-muted-foreground/30')} />)}</div>
    </div>
  )
}
