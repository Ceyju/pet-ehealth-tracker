'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'motion/react'
import { CalendarClock, CalendarDays, FileHeart, Plus, Syringe } from 'lucide-react'
import { format, parseISO, startOfDay } from 'date-fns'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { SmoothTabs } from '@/components/ui/smooth-tabs'
import { formatHealthDate, vaccinationStatus } from '@/lib/care'
import type { MedicalRecord, PetSummary, Reminder, VaccinationRecord } from '@/types'

type Tab = 'vaccinations' | 'records' | 'reminders'

const REMINDER_TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
  const hour = Math.floor(index / 2)
  const minute = index % 2 === 0 ? '00' : '30'
  const value = `${String(hour).padStart(2, '0')}:${minute}`
  const label = `${hour % 12 || 12}:${minute} ${hour < 12 ? 'AM' : 'PM'}`
  return { value, label }
})

export default function HealthHubPage() {
  return <Suspense fallback={<div className="grid min-h-64 place-items-center"><div className="size-9 animate-spin rounded-full border-2 border-primary/20 border-t-primary" /></div>}><HealthHubContent /></Suspense>
}

function HealthHubContent() {
  const router = useRouter()
  const params = useSearchParams()
  const user = useAuthStore((state) => state.user)
  const initial = params.get('view') === 'reminders' ? 'reminders' : 'vaccinations'
  const [tab, setTab] = useState<Tab>(initial)
  const [pets, setPets] = useState<PetSummary[]>([])
  const [vaccinations, setVaccinations] = useState<VaccinationRecord[]>([])
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    void (async () => {
      const { data: petRows, error } = await supabase.from('pets').select('id, name, species, breed, photo_url').eq('user_id', user.id).order('name')
      if (cancelled) return
      if (error) { toast.error('Could not load health data'); setLoading(false); return }
      const petList = petRows ?? []
      const ids = petList.map((pet) => pet.id)
      if (!ids.length) { setPets([]); setVaccinations([]); setRecords([]); setReminders([]); setLoading(false); return }
      const [vaccinationResult, recordResult, reminderResult] = await Promise.all([
        supabase.from('vaccinations').select('id, pet_id, vaccine_name, vaccine_type, date_administered, next_due_date, clinic_name, vet_name').in('pet_id', ids).order('next_due_date'),
        supabase.from('medical_records').select('id, pet_id, record_type, title, occurred_on, description, provider_name').in('pet_id', ids).order('occurred_on', { ascending: false }),
        supabase.from('reminders').select('id, pet_id, title, notes, due_at, recurrence, status, channels').eq('user_id', user.id).order('due_at'),
      ])
      if (cancelled) return
      const petMap = new Map(petList.map((pet) => [pet.id, pet]))
      setPets(petList)
      setVaccinations((vaccinationResult.data ?? []).map((item) => ({ ...item, pet: petMap.get(item.pet_id) ?? null })))
      setRecords(recordResult.data ?? []); setReminders(reminderResult.data ?? []); setLoading(false)
    })()
    return () => { cancelled = true }
  }, [user?.id, reloadKey])

  const overdue = useMemo(() => vaccinations.filter((item) => vaccinationStatus(item.next_due_date) === 'overdue').length, [vaccinations])
  const upcoming = useMemo(() => vaccinations.filter((item) => vaccinationStatus(item.next_due_date) === 'due-soon').length, [vaccinations])

  const changeTab = (value: string) => {
    const next = value as Tab
    setTab(next)
    router.replace(next === 'vaccinations' ? '/vaccinations' : `/vaccinations?view=${next}`, { scroll: false })
  }

  return (
    <div className="page-shell space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Across every pet</p><h1 className="page-heading mt-1">Health hub</h1><p className="mt-2 text-sm text-muted-foreground">Vaccinations, medical records, and care reminders.</p></div><HealthQuickAdd pets={pets} defaultTab={tab} onSaved={async () => setReloadKey((value) => value + 1)} /></header>
      <div className="grid grid-cols-3 gap-3">
        <Metric label="Records" value={vaccinations.length + records.length} />
        <Metric label="Due soon" value={upcoming} tone="amber" />
        <Metric label="Overdue" value={overdue} tone="red" />
      </div>
      <SmoothTabs id="health-hub" value={tab} onValueChange={changeTab} tabs={[{ value: 'vaccinations', label: 'Vaccinations', count: vaccinations.length }, { value: 'records', label: 'Records', count: records.length }, { value: 'reminders', label: 'Reminders', count: reminders.length }]} />
      {loading ? <div className="grid min-h-64 place-items-center"><div className="size-9 animate-spin rounded-full border-2 border-primary/20 border-t-primary" /></div> : (
        <motion.section key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }} className="surface overflow-hidden p-2 sm:p-3">
          {tab === 'vaccinations' && <VaccinationList items={vaccinations} />}
          {tab === 'records' && <RecordList items={records} pets={pets} />}
          {tab === 'reminders' && <ReminderList items={reminders} pets={pets} />}
        </motion.section>
      )}
    </div>
  )
}

function Metric({ label, value, tone }: { label: string; value: number; tone?: 'amber' | 'red' }) {
  return <div className="surface p-4"><p className="text-xs font-medium text-muted-foreground">{label}</p><p className={tone === 'red' ? 'mt-1 text-2xl font-semibold text-red-600' : tone === 'amber' ? 'mt-1 text-2xl font-semibold text-amber-600' : 'mt-1 text-2xl font-semibold'}>{value}</p></div>
}

function Empty({ icon: Icon, title, copy }: { icon: typeof Syringe; title: string; copy: string }) {
  return <div className="grid place-items-center px-5 py-16 text-center"><span className="grid size-14 place-items-center rounded-2xl bg-secondary"><Icon className="size-6 text-primary" /></span><h2 className="mt-4 font-semibold">{title}</h2><p className="mt-1 max-w-sm text-sm text-muted-foreground">{copy}</p></div>
}

function VaccinationList({ items }: { items: VaccinationRecord[] }) {
  if (!items.length) return <Empty icon={Syringe} title="No vaccinations yet" copy="Record the first vaccination from the Add health item button." />
  return <div className="divide-y">{items.map((item) => { const status = vaccinationStatus(item.next_due_date); return <div key={item.id} className="flex min-h-20 items-center gap-3 px-3 py-3"><span className={`size-2.5 rounded-full ${status === 'overdue' ? 'bg-red-500' : status === 'due-soon' ? 'bg-amber-500' : 'bg-emerald-500'}`} /><div className="min-w-0 flex-1"><p className="truncate font-medium">{item.vaccine_name}</p><p className="text-sm text-muted-foreground">{item.pet?.name || 'Pet'} · Owner reported</p></div><div className="text-right"><p className="text-sm font-medium">{formatHealthDate(item.next_due_date)}</p><p className="text-xs capitalize text-muted-foreground">{status.replace('-', ' ')}</p></div></div> })}</div>
}

function RecordList({ items, pets }: { items: MedicalRecord[]; pets: PetSummary[] }) {
  if (!items.length) return <Empty icon={FileHeart} title="No medical records yet" copy="Add checkups, lab work, dental care, or other owner-maintained notes." />
  return <div className="divide-y">{items.map((item) => <div key={item.id} className="flex min-h-20 items-center gap-3 px-3 py-3"><span className="grid size-10 place-items-center rounded-xl bg-secondary"><FileHeart className="size-4 text-primary" /></span><div className="min-w-0 flex-1"><p className="truncate font-medium">{item.title}</p><p className="text-sm text-muted-foreground">{pets.find((pet) => pet.id === item.pet_id)?.name || 'Pet'} · {item.record_type.replace('_', ' ')}</p></div><p className="text-sm text-muted-foreground">{formatHealthDate(item.occurred_on)}</p></div>)}</div>
}

function ReminderList({ items, pets }: { items: Reminder[]; pets: PetSummary[] }) {
  if (!items.length) return <Empty icon={CalendarClock} title="No reminders scheduled" copy="Create a one-time or recurring reminder and optionally deliver it through Telegram." />
  const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const timeFormatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' })
  return <div className="divide-y">{items.map((item) => { const dueAt = new Date(item.due_at); return <div key={item.id} className="flex min-h-20 items-center gap-3 px-3 py-3"><span className="grid size-10 place-items-center rounded-xl bg-secondary"><CalendarClock className="size-4 text-primary" /></span><div className="min-w-0 flex-1"><p className="truncate font-medium">{item.title}</p><p className="text-sm text-muted-foreground">{pets.find((pet) => pet.id === item.pet_id)?.name || 'All pets'} · {item.recurrence === 'none' ? 'One time' : item.recurrence}</p></div><div className="shrink-0 text-right"><p className="text-sm font-medium">{dateFormatter.format(dueAt)}</p><p className="text-xs text-muted-foreground">{timeFormatter.format(dueAt)} · <span className="capitalize">{item.status}</span></p></div></div> })}</div>
}

function HealthQuickAdd({ pets, defaultTab, onSaved }: { pets: PetSummary[]; defaultTab: Tab; onSaved: () => Promise<void> }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [kind, setKind] = useState<Tab>(defaultTab)
  const [petId, setPetId] = useState(pets[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [time, setTime] = useState('09:00')
  const [notes, setNotes] = useState('')
  const [attachment, setAttachment] = useState<File | null>(null)
  const save = async () => {
    if (kind === 'vaccinations') { setOpen(false); router.push(petId ? `/pets/${petId}/vaccinations/new` : '/pets/new'); return }
    const reminderDueAt = kind === 'reminders' ? new Date(`${date}T${time}:00`) : null
    if (kind === 'reminders' && (!date || !time || !reminderDueAt || Number.isNaN(reminderDueAt.getTime()))) {
      toast.error('Choose a valid reminder date and time')
      return
    }
    if (reminderDueAt && reminderDueAt <= new Date()) {
      toast.error('Reminder time must be in the future')
      return
    }
    const endpoint = kind === 'records' ? '/api/records' : '/api/reminders'
    const body = kind === 'records' ? { petId, recordType: 'other', title, occurredOn: date, description: notes } : { petId: petId || null, title, dueAt: reminderDueAt!.toISOString(), notes, recurrence: 'none', channels: ['in_app', 'telegram'] }
    const response = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
    const result = await response.json()
    if (!response.ok) { toast.error(result.error || 'Could not save'); return }
    if (kind === 'records' && attachment && result.data?.id) {
      const upload = new FormData(); upload.set('file', attachment)
      const uploadResponse = await fetch(`/api/records/${result.data.id}/attachments`, { method: 'POST', body: upload })
      if (!uploadResponse.ok) { const uploadResult = await uploadResponse.json(); toast.error(uploadResult.error || 'Record saved, but the attachment failed') }
    }
    toast.success(kind === 'records' ? 'Record added' : 'Reminder scheduled'); setTitle(''); setNotes(''); setAttachment(null); setOpen(false); await onSaved()
  }
  return <Drawer open={open} onOpenChange={setOpen}><DrawerTrigger asChild><Button className="ios-control gap-2"><Plus className="size-4" />Add health item</Button></DrawerTrigger><DrawerContent className="mx-auto max-w-xl rounded-t-[2rem]"><DrawerHeader className="text-left"><DrawerTitle>Add health item</DrawerTitle><DrawerDescription>Choose what you want to record for your pet.</DrawerDescription></DrawerHeader><div className="grid gap-4 px-4"><div className="grid gap-2"><Label>Type</Label><Select value={kind} onValueChange={(value) => setKind(value as Tab)}><SelectTrigger className="min-h-11 rounded-2xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="vaccinations">Vaccination</SelectItem><SelectItem value="records">Medical record</SelectItem><SelectItem value="reminders">Reminder</SelectItem></SelectContent></Select></div><div className="grid gap-2"><Label>Pet</Label><Select value={petId} onValueChange={setPetId}><SelectTrigger className="min-h-11 rounded-2xl"><SelectValue placeholder="Choose a pet" /></SelectTrigger><SelectContent>{pets.map((pet) => <SelectItem value={pet.id} key={pet.id}>{pet.name}</SelectItem>)}</SelectContent></Select></div>{kind !== 'vaccinations' && <><div className="grid gap-2"><Label>Title</Label><Input className="min-h-11 rounded-2xl" value={title} onChange={(event) => setTitle(event.target.value)} /></div>{kind === 'records' ? <div className="grid gap-2"><Label>Date</Label><Input type="date" className="min-h-11 rounded-2xl" value={date} onChange={(event) => setDate(event.target.value)} /></div> : <ReminderDateTimeField date={date} time={time} onDateChange={setDate} onTimeChange={setTime} />}<div className="grid gap-2"><Label>Notes</Label><Textarea className="rounded-2xl" value={notes} onChange={(event) => setNotes(event.target.value)} /></div>{kind === 'records' && <div className="grid gap-2"><Label htmlFor="record-file">Attachment (optional)</Label><Input id="record-file" type="file" accept="application/pdf,image/jpeg,image/png" className="min-h-11 rounded-2xl" onChange={(event) => setAttachment(event.target.files?.[0] ?? null)} /><p className="text-xs text-muted-foreground">Private PDF, JPEG, or PNG up to 10 MB.</p></div>}</>}</div><DrawerFooter><Button className="min-h-12 rounded-2xl" disabled={!petId || (kind !== 'vaccinations' && !title.trim())} onClick={save}>{kind === 'vaccinations' ? 'Continue' : 'Save'}</Button></DrawerFooter></DrawerContent></Drawer>
}

function ReminderDateTimeField({ date, time, onDateChange, onTimeChange }: { date: string; time: string; onDateChange: (value: string) => void; onTimeChange: (value: string) => void }) {
  const [calendarOpen, setCalendarOpen] = useState(false)
  const selected = date ? parseISO(date) : undefined

  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
      <div className="grid gap-2">
        <Label>Due date</Label>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" className="min-h-11 justify-start rounded-2xl px-3 text-left font-normal">
              <CalendarDays className="mr-2 size-4 text-muted-foreground" />
              {selected ? format(selected, 'PPP') : 'Choose a date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto rounded-2xl p-0" align="start">
            <Calendar
              mode="single"
              selected={selected}
              onSelect={(nextDate) => {
                if (nextDate) onDateChange(format(nextDate, 'yyyy-MM-dd'))
                setCalendarOpen(false)
              }}
              disabled={{ before: startOfDay(new Date()) }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="reminder-time">Time</Label>
        <Select value={time} onValueChange={onTimeChange}>
          <SelectTrigger id="reminder-time" className="min-h-11 w-full rounded-2xl">
            <SelectValue placeholder="Choose a time" />
          </SelectTrigger>
          <SelectContent position="popper" className="max-h-72">
            {REMINDER_TIME_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
