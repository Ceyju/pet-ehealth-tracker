'use client'

import { useState, useCallback, useEffect } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { EHealthCard, type EHealthPet } from '@/components/ehealth-card'
import { cn } from '@/lib/utils'

interface EHealthCarouselProps {
  pets: EHealthPet[]
  userId: string
}

export function EHealthCarousel({ pets, userId }: EHealthCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'center',
    loop: false,
    skipSnaps: false,
  })

  const [selectedIndex, setSelectedIndex] = useState(0)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
    setCanPrev(emblaApi.canScrollPrev())
    setCanNext(emblaApi.canScrollNext())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
    // Run once after subscribing
    const raf = requestAnimationFrame(onSelect)
    return () => {
      cancelAnimationFrame(raf)
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onSelect)
    }
  }, [emblaApi, onSelect])

  if (pets.length === 0) return null

  // Single pet — no carousel needed
  if (pets.length === 1) {
    return <EHealthCard pet={pets[0]} userId={userId} />
  }

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Embla viewport */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {pets.map((pet) => (
            <div key={pet.id} className="flex-[0_0_100%] min-w-0 px-1">
              <EHealthCard pet={pet} userId={userId} />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation arrows */}
      <button
        onClick={() => emblaApi?.scrollPrev()}
        disabled={!canPrev}
        aria-label="Previous pet"
        className={cn(
          'absolute top-1/2 -left-12 -translate-y-1/2 w-9 h-9 rounded-full bg-white border border-gray-200 shadow flex items-center justify-center transition-opacity',
          !canPrev && 'opacity-30 cursor-not-allowed',
        )}
      >
        <ChevronLeft className="w-5 h-5 text-gray-700" />
      </button>

      <button
        onClick={() => emblaApi?.scrollNext()}
        disabled={!canNext}
        aria-label="Next pet"
        className={cn(
          'absolute top-1/2 -right-12 -translate-y-1/2 w-9 h-9 rounded-full bg-white border border-gray-200 shadow flex items-center justify-center transition-opacity',
          !canNext && 'opacity-30 cursor-not-allowed',
        )}
      >
        <ChevronRight className="w-5 h-5 text-gray-700" />
      </button>

      {/* Dots */}
      <div className="flex justify-center gap-2 mt-4">
        {pets.map((pet, i) => (
          <button
            key={pet.id}
            onClick={() => emblaApi?.scrollTo(i)}
            aria-label={`Go to ${pet.name}`}
            className={cn(
              'w-2.5 h-2.5 rounded-full transition-colors',
              i === selectedIndex
                ? 'bg-orange-500'
                : 'bg-gray-300 hover:bg-gray-400',
            )}
          />
        ))}
      </div>
    </div>
  )
}
