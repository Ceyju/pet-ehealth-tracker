'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'motion/react'
import { ArrowRight, CalendarClock, FileHeart, PawPrint, Plus, Syringe } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { EHealthCarousel } from '@/components/ehealth-carousel'
import type { EHealthPet, EHealthVaccination } from '@/components/ehealth-card'
import { daysUntil, formatHealthDate, vaccinationStatus } from '@/lib/care'
import type { PetSummary, Reminder, VaccinationRecord } from '@/types'

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const [pets, setPets] = useState<PetSummary[]>([])
  const [cards, setCards] = useState<EHealthPet[]>([])
  const [vaccinations, setVaccinations] = useState<VaccinationRecord[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [recentRecordCount, setRecentRecordCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    void (async () => {
      const { data: petRows } = await supabase.from('pets').select('id, user_id, name, species, breed, photo_url, microchip_id, is_dewormed, deworming_date, deworming_location').eq('user_id', user.id).order('created_at', { ascending: false })
      if (cancelled) return
      const list = petRows ?? []
      const ids = list.map((pet) => pet.id)
      if (!ids.length) { setLoading(false); return }
      const [vaccinationResult, reminderResult, recordResult] = await Promise.all([
        supabase.from('vaccinations').select('id, pet_id, vaccine_name, vaccine_type, date_administered, next_due_date, clinic_name, vet_name').in('pet_id', ids).order('next_due_date'),
        supabase.from('reminders').select('id, pet_id, title, notes, due_at, recurrence, status, channels').eq('user_id', user.id).eq('status', 'scheduled').order('due_at').limit(5),
        supabase.from('medical_records').select('id', { count: 'exact', head: true }).in('pet_id', ids),
      ])
      if (cancelled) return
      const summary: PetSummary[] = list.map((pet) => ({ id: pet.id, name: pet.name, species: pet.species, breed: pet.breed, photo_url: pet.photo_url }))
      const petMap = new Map(summary.map((pet) => [pet.id, pet]))
      const vaccines: VaccinationRecord[] = (vaccinationResult.data ?? []).map((item) => ({ ...item, pet: petMap.get(item.pet_id) ?? null }))
      const cardVaccines: Record<string, EHealthVaccination[]> = {}
      for (const item of vaccinationResult.data ?? []) (cardVaccines[item.pet_id] ||= []).push(item)
      setPets(summary); setVaccinations(vaccines); setReminders(reminderResult.data ?? []); setRecentRecordCount(recordResult.count ?? 0)
      setCards(list.map((pet) => ({ id: pet.id, name: pet.name, species: pet.species, breed: pet.breed, microchip_id: pet.microchip_id, photo_url: pet.photo_url, vaccinations: cardVaccines[pet.id] ?? [], is_dewormed: pet.is_dewormed, deworming_date: pet.deworming_date, deworming_location: pet.deworming_location })))
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [user?.id])

  const nextCare = useMemo(() => vaccinations.filter((item) => item.next_due_date).sort((a, b) => new Date(a.next_due_date!).getTime() - new Date(b.next_due_date!).getTime()).slice(0, 4), [vaccinations])
  const overdue = vaccinations.filter((item) => vaccinationStatus(item.next_due_date) === 'overdue').length

  if (loading) return <div className="grid min-h-96 place-items-center"><div className="size-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" /></div>
  return (
    <div className="page-shell space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">{new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())}</p><h1 className="page-heading mt-1">Good to see you{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}.</h1><p className="mt-2 text-sm text-muted-foreground">Here is what needs attention across your pets.</p></div><Button asChild className="ios-control gap-2"><Link href="/vaccinations"><Plus className="size-4" />Add health item</Link></Button></header>

      <section className="grid gap-3 sm:grid-cols-3"><TodayMetric icon={PawPrint} label="Pets" value={pets.length} copy="in your care" /><TodayMetric icon={CalendarClock} label="Upcoming" value={nextCare.filter((item) => vaccinationStatus(item.next_due_date) !== 'overdue').length + reminders.length} copy="care items" /><TodayMetric icon={Syringe} label="Overdue" value={overdue} copy={overdue ? 'needs attention' : 'all caught up'} danger={overdue > 0} /></section>

      {!pets.length ? <section className="surface grid min-h-80 place-items-center px-6 text-center"><div><span className="mx-auto grid size-16 place-items-center rounded-3xl bg-secondary"><PawPrint className="size-7 text-primary" /></span><h2 className="mt-5 text-xl font-semibold">Welcome to JoyCare</h2><p className="mt-2 max-w-md text-sm text-muted-foreground">Add your first pet to begin their owner-maintained health record and care timeline.</p><Button asChild className="ios-control mt-6"><Link href="/pets/new"><Plus className="size-4" />Add first pet</Link></Button></div></section> : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(19rem,.75fr)]">
          <section className="surface overflow-hidden p-4 sm:p-6"><div className="mb-5 flex items-center justify-between"><div><p className="eyebrow">Wallet-ready</p><h2 className="mt-1 text-xl font-semibold">eHealth Card</h2></div><Button asChild variant="ghost" className="rounded-2xl"><Link href="/ehealth-card">Secure sharing<ArrowRight className="size-4" /></Link></Button></div><EHealthCarousel pets={cards} /></section>
          <div className="space-y-6">
            <section className="surface p-4 sm:p-5"><div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Next care</h2><Link href="/vaccinations" className="text-sm font-medium text-primary">View all</Link></div>{nextCare.length ? <div className="divide-y">{nextCare.map((item) => { const days = daysUntil(item.next_due_date); return <Link key={item.id} href={`/pets/${item.pet_id}`} className="flex min-h-16 items-center gap-3 py-2"><span className={`size-2.5 rounded-full ${days !== null && days < 0 ? 'bg-red-500' : days !== null && days <= 30 ? 'bg-amber-500' : 'bg-emerald-500'}`} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.vaccine_name}</p><p className="truncate text-xs text-muted-foreground">{item.pet?.name}</p></div><p className="text-xs text-muted-foreground">{formatHealthDate(item.next_due_date, { month: 'short', day: 'numeric' })}</p></Link>})}</div> : <p className="py-8 text-center text-sm text-muted-foreground">Nothing scheduled yet</p>}</section>
            <section className="surface p-4 sm:p-5"><div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Your pets</h2><Link href="/pets" className="text-sm font-medium text-primary">Manage</Link></div><div className="flex gap-3 overflow-x-auto pb-1">{pets.map((pet) => <Link key={pet.id} href={`/pets/${pet.id}`} className="min-w-24 rounded-2xl p-2 text-center hover:bg-accent"><span className="mx-auto grid size-14 place-items-center overflow-hidden rounded-2xl bg-secondary text-2xl">{pet.photo_url ? <Image src={pet.photo_url} alt={pet.name} width={56} height={56} className="size-full object-cover" /> : pet.species === 'dog' ? '🐶' : pet.species === 'cat' ? '🐱' : '🐾'}</span><span className="mt-2 block truncate text-sm font-medium">{pet.name}</span></Link>)}</div></section>
            <section className="surface flex items-center gap-4 p-4 sm:p-5"><span className="grid size-11 place-items-center rounded-2xl bg-secondary"><FileHeart className="size-5 text-primary" /></span><div className="flex-1"><p className="font-medium">{recentRecordCount} medical records</p><p className="text-xs text-muted-foreground">Owner-maintained documents and notes</p></div><Button asChild variant="ghost" size="icon" className="rounded-xl"><Link href="/vaccinations?view=records" aria-label="View medical records"><ArrowRight className="size-4" /></Link></Button></section>
          </div>
        </div>
      )}
    </div>
  )
}

function TodayMetric({ icon: Icon, label, value, copy, danger }: { icon: typeof PawPrint; label: string; value: number; copy: string; danger?: boolean }) { return <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="surface flex items-center gap-3 p-4"><span className={`grid size-11 place-items-center rounded-2xl ${danger ? 'bg-red-500/10 text-red-600' : 'bg-secondary text-primary'}`}><Icon className="size-5" /></span><div><p className="text-xs font-medium text-muted-foreground">{label}</p><p className={`text-xl font-semibold ${danger ? 'text-red-600' : ''}`}>{value} <span className="text-xs font-normal text-muted-foreground">{copy}</span></p></div></motion.div> }
