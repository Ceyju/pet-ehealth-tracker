'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'motion/react'
import { ArrowRight, Edit2, PawPrint, Plus, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import type { PetSummary } from '@/types'

export default function PetsPage() {
  const user = useAuthStore((state) => state.user)
  const [pets, setPets] = useState<PetSummary[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [deletePet, setDeletePet] = useState<PetSummary | null>(null)

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    void (async () => {
      const { data, error } = await supabase.from('pets').select('id, name, species, breed, photo_url').eq('user_id', user.id).order('created_at', { ascending: false })
      if (cancelled) return
      if (error) toast.error('Could not load pets')
      setPets(data ?? []); setLoading(false)
    })()
    return () => { cancelled = true }
  }, [user?.id])

  const filtered = useMemo(() => pets.filter((pet) => `${pet.name} ${pet.species} ${pet.breed || ''}`.toLowerCase().includes(query.toLowerCase())), [pets, query])
  const confirmDelete = async () => {
    if (!deletePet || !user?.id) return
    const { error } = await supabase.from('pets').delete().eq('id', deletePet.id).eq('user_id', user.id)
    if (error) toast.error(error.message)
    else { setPets((current) => current.filter((pet) => pet.id !== deletePet.id)); toast.success(`${deletePet.name} was removed`) }
    setDeletePet(null)
  }

  return (
    <div className="page-shell space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Your family</p><h1 className="page-heading mt-1">Pets</h1><p className="mt-2 text-sm text-muted-foreground">Health summaries and records for every animal in your care.</p></div><Button asChild className="ios-control gap-2"><Link href="/pets/new"><Plus className="size-4" />Add pet</Link></Button></header>
      {pets.length > 3 && <div className="relative max-w-md"><Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search pets" className="min-h-12 rounded-2xl bg-card pl-11" /></div>}
      {loading ? <div className="grid min-h-64 place-items-center"><div className="size-9 animate-spin rounded-full border-2 border-primary/20 border-t-primary" /></div> : !pets.length ? <section className="surface grid min-h-80 place-items-center px-6 text-center"><div><span className="mx-auto grid size-16 place-items-center rounded-3xl bg-secondary"><PawPrint className="size-7 text-primary" /></span><h2 className="mt-5 text-xl font-semibold">Add your first pet</h2><p className="mt-2 text-sm text-muted-foreground">JoyCare will organize their vaccinations, records, reminders, and secure health card.</p><Button asChild className="ios-control mt-6"><Link href="/pets/new"><Plus className="size-4" />Add pet</Link></Button></div></section> : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((pet, index) => <motion.article key={pet.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className="surface group overflow-hidden"><Link href={`/pets/${pet.id}`} className="block"><div className="relative h-48 bg-secondary">{pet.photo_url ? <Image src={pet.photo_url} alt={pet.name} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" /> : <div className="grid size-full place-items-center text-6xl">{pet.species === 'dog' ? '🐶' : pet.species === 'cat' ? '🐱' : '🐾'}</div>}<span className="absolute left-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-xs font-medium capitalize text-white backdrop-blur">{pet.species}</span></div><div className="flex items-center gap-3 p-5"><div className="min-w-0 flex-1"><h2 className="truncate text-xl font-semibold">{pet.name}</h2><p className="truncate text-sm text-muted-foreground">{pet.breed || 'Breed not set'}</p></div><ArrowRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1" /></div></Link><div className="flex gap-2 border-t p-3"><Button asChild variant="ghost" className="flex-1 rounded-xl"><Link href={`/pets/${pet.id}/edit`}><Edit2 className="size-4" />Edit</Link></Button><Button variant="ghost" size="icon" className="rounded-xl text-destructive hover:text-destructive" onClick={() => setDeletePet(pet)} aria-label={`Delete ${pet.name}`}><Trash2 className="size-4" /></Button></div></motion.article>)}</div>
      )}
      {!loading && pets.length > 0 && filtered.length === 0 && <p className="py-16 text-center text-sm text-muted-foreground">No pets match “{query}”.</p>}
      <AlertDialog open={Boolean(deletePet)} onOpenChange={(open) => !open && setDeletePet(null)}><AlertDialogContent className="rounded-3xl"><AlertDialogHeader><AlertDialogTitle>Remove {deletePet?.name}?</AlertDialogTitle><AlertDialogDescription>This permanently deletes the pet and linked vaccinations, records, reminders, and share links.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove pet</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  )
}
