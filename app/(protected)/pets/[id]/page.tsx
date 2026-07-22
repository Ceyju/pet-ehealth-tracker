'use client'

import { use, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'motion/react'
import { ArrowLeft, CalendarClock, Edit2, FileHeart, Heart, QrCode, Syringe } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { SmoothTabs } from '@/components/ui/smooth-tabs'
import { formatHealthDate, vaccinationStatus } from '@/lib/care'
import type { MedicalRecord, PetHealthProfile, Reminder, VaccinationRecord } from '@/types'

type Section = 'overview' | 'vaccinations' | 'records' | 'reminders' | 'timeline'

export default function PetDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const user = useAuthStore((state) => state.user)
  const [pet, setPet] = useState<PetHealthProfile | null>(null)
  const [vaccinations, setVaccinations] = useState<VaccinationRecord[]>([])
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [section, setSection] = useState<Section>('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user?.id) return
    const load = async () => {
      const petResult = await supabase.from('pets').select('*').eq('id', id).eq('user_id', user.id).maybeSingle()
      if (petResult.error || !petResult.data) { setError('Pet not found'); setLoading(false); return }
      setPet(petResult.data as PetHealthProfile)
      const [vaccinationResult, recordResult, reminderResult] = await Promise.all([
        supabase.from('vaccinations').select('id, pet_id, vaccine_name, vaccine_type, date_administered, next_due_date, clinic_name, vet_name').eq('pet_id', id).order('date_administered', { ascending: false }),
        supabase.from('medical_records').select('id, pet_id, record_type, title, occurred_on, description, provider_name').eq('pet_id', id).order('occurred_on', { ascending: false }),
        supabase.from('reminders').select('id, pet_id, title, notes, due_at, recurrence, status, channels').eq('pet_id', id).order('due_at'),
      ])
      const summary = { id: petResult.data.id, name: petResult.data.name, species: petResult.data.species, breed: petResult.data.breed, photo_url: petResult.data.photo_url }
      setVaccinations((vaccinationResult.data ?? []).map((item) => ({ ...item, pet: summary })))
      setRecords(recordResult.data ?? []); setReminders(reminderResult.data ?? []); setLoading(false)
    }
    void load()
  }, [id, user?.id])

  const timeline = useMemo(() => [
    ...vaccinations.map((item) => ({ id: item.id, type: 'Vaccination', title: item.vaccine_name, date: item.date_administered || item.next_due_date || '' })),
    ...records.map((item) => ({ id: item.id, type: item.record_type.replace('_', ' '), title: item.title, date: item.occurred_on })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [vaccinations, records])

  if (loading) return <div className="grid min-h-96 place-items-center"><div className="size-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" /></div>
  if (!pet || error) return <div className="page-shell"><section className="surface p-8 text-center text-destructive">{error || 'Pet not found'}</section></div>

  return (
    <div className="page-shell space-y-6">
      <Link href="/pets" className="inline-flex min-h-11 items-center gap-2 rounded-2xl px-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"><ArrowLeft className="size-4" />All pets</Link>
      <section className="surface overflow-hidden">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-7">
          <div className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-3xl bg-secondary text-4xl">{pet.photo_url ? <Image src={pet.photo_url} alt={pet.name} width={96} height={96} className="size-full object-cover" /> : pet.species === 'dog' ? '🐶' : pet.species === 'cat' ? '🐱' : '🐾'}</div>
          <div className="min-w-0 flex-1"><p className="eyebrow capitalize">{pet.species}{pet.breed ? ` · ${pet.breed}` : ''}</p><h1 className="mt-1 truncate text-3xl font-semibold tracking-tight">{pet.name}</h1><p className="mt-2 text-sm text-muted-foreground">{vaccinations.length} vaccinations · {records.length} records · {reminders.filter((item) => item.status === 'scheduled').length} reminders</p></div>
          <div className="flex gap-2"><Button asChild variant="outline" className="ios-control"><Link href={`/pets/${pet.id}/qr-code`}><QrCode className="size-4" /><span className="sr-only sm:not-sr-only">Share</span></Link></Button><Button asChild className="ios-control"><Link href={`/pets/${pet.id}/edit`}><Edit2 className="size-4" />Edit</Link></Button></div>
        </div>
        <div className="overflow-x-auto border-t p-3 sm:px-6"><SmoothTabs id={`pet-${id}`} value={section} onValueChange={(value) => setSection(value as Section)} tabs={[{ value: 'overview', label: 'Overview' }, { value: 'vaccinations', label: 'Vaccinations', count: vaccinations.length }, { value: 'records', label: 'Records', count: records.length }, { value: 'reminders', label: 'Reminders', count: reminders.length }, { value: 'timeline', label: 'Timeline' }]} /></div>
      </section>

      <motion.section key={section} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="surface p-5 sm:p-6">
        {section === 'overview' && <Overview pet={pet} nextVaccination={vaccinations.find((item) => vaccinationStatus(item.next_due_date) !== 'overdue')} />}
        {section === 'vaccinations' && <ItemSection icon={Syringe} empty="No vaccinations recorded" action={<Button asChild size="sm"><Link href={`/pets/${id}/vaccinations/new`}>Add vaccination</Link></Button>}>{vaccinations.map((item) => <HealthRow key={item.id} title={item.vaccine_name} meta={`${formatHealthDate(item.date_administered || null)} · Owner reported`} date={formatHealthDate(item.next_due_date)} />)}</ItemSection>}
        {section === 'records' && <ItemSection icon={FileHeart} empty="No medical records added" action={<Button asChild size="sm"><Link href="/vaccinations?view=records">Add record</Link></Button>}>{records.map((item) => <HealthRow key={item.id} title={item.title} meta={item.provider_name || item.record_type.replace('_', ' ')} date={formatHealthDate(item.occurred_on)} />)}</ItemSection>}
        {section === 'reminders' && <ItemSection icon={CalendarClock} empty="No reminders scheduled" action={<Button asChild size="sm"><Link href="/vaccinations?view=reminders">Add reminder</Link></Button>}>{reminders.map((item) => <HealthRow key={item.id} title={item.title} meta={`${item.recurrence === 'none' ? 'One time' : item.recurrence} · ${item.status}`} date={new Date(item.due_at).toLocaleString()} />)}</ItemSection>}
        {section === 'timeline' && <ItemSection icon={Heart} empty="No activity yet">{timeline.map((item) => <HealthRow key={`${item.type}-${item.id}`} title={item.title} meta={item.type} date={formatHealthDate(item.date)} />)}</ItemSection>}
      </motion.section>
    </div>
  )
}

function Overview({ pet, nextVaccination }: { pet: PetHealthProfile; nextVaccination?: VaccinationRecord }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><OverviewFact label="Birthday" value={formatHealthDate(pet.date_of_birth)} /><OverviewFact label="Weight" value={pet.weight ? `${pet.weight} kg` : 'Not set'} /><OverviewFact label="Microchip" value={pet.microchip_id || 'Not set'} /><OverviewFact label="Next care" value={nextVaccination ? `${nextVaccination.vaccine_name} · ${formatHealthDate(nextVaccination.next_due_date)}` : 'Nothing scheduled'} /></div>
}
function OverviewFact({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-secondary/60 p-4"><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-1 break-words text-sm font-semibold">{value}</p></div> }
function ItemSection({ icon: Icon, empty, action, children }: { icon: typeof Heart; empty: string; action?: React.ReactNode; children: React.ReactNode }) { const has = Array.isArray(children) ? children.length > 0 : Boolean(children); return <div><div className="mb-3 flex justify-end">{action}</div>{has ? <div className="divide-y">{children}</div> : <div className="grid place-items-center py-14 text-center"><Icon className="mb-3 size-8 text-muted-foreground" /><p className="text-sm text-muted-foreground">{empty}</p></div>}</div> }
function HealthRow({ title, meta, date }: { title: string; meta: string; date: string }) { return <div className="flex min-h-18 items-center gap-3 py-3"><div className="min-w-0 flex-1"><p className="truncate font-medium">{title}</p><p className="truncate text-sm capitalize text-muted-foreground">{meta}</p></div><p className="max-w-36 text-right text-sm text-muted-foreground">{date}</p></div> }
