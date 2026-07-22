'use client'

import { useEffect, useState } from 'react'
import { Copy, Link2, Plus, ShieldCheck, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { EHealthPet } from '@/components/ehealth-card'
import type { ShareLink } from '@/types'

export function ShareControls({ pets, onShareCreated }: { pets: EHealthPet[]; onShareCreated: (petId: string, url: string) => void }) {
  const [open, setOpen] = useState(false)
  const [petId, setPetId] = useState(pets[0]?.id ?? '')
  const [expiry, setExpiry] = useState('7d')
  const [links, setLinks] = useState<ShareLink[]>([])
  const [busy, setBusy] = useState(false)
  const [latestUrl, setLatestUrl] = useState('')

  const load = async () => {
    const response = await fetch('/api/share-links', { cache: 'no-store' })
    if (response.ok) setLinks((await response.json()).data ?? [])
  }
  useEffect(() => { void load() }, [])

  const createShare = async () => {
    setBusy(true)
    try {
      const response = await fetch('/api/share-links', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ petId, expiry, allowedSections: ['identity', 'vaccinations', 'deworming'] }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not create share')
      setLatestUrl(result.url)
      onShareCreated(petId, result.url)
      await navigator.clipboard.writeText(result.url)
      toast.success('Secure link created and copied')
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not create share')
    } finally { setBusy(false) }
  }

  const revoke = async (id: string) => {
    const response = await fetch(`/api/share-links/${id}`, { method: 'DELETE' })
    if (response.ok) { toast.success('Share revoked'); await load() }
    else toast.error('Could not revoke share')
  }

  return (
    <div className="surface p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="font-semibold">Secure sharing</p><p className="text-sm text-muted-foreground">Links reveal the owner-maintained card only and can be revoked.</p></div>
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild><Button className="ios-control gap-2"><Plus className="size-4" />Create share</Button></DrawerTrigger>
          <DrawerContent className="mx-auto max-w-xl rounded-t-[2rem]">
            <DrawerHeader className="text-left"><DrawerTitle>Create a secure card link</DrawerTitle><DrawerDescription>The QR activates only for this random, revocable link.</DrawerDescription></DrawerHeader>
            <div className="grid gap-5 px-4 py-3">
              <div className="grid gap-2"><Label>Pet</Label><Select value={petId} onValueChange={setPetId}><SelectTrigger className="min-h-11 rounded-2xl"><SelectValue /></SelectTrigger><SelectContent>{pets.map((pet) => <SelectItem key={pet.id} value={pet.id}>{pet.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid gap-2"><Label>Expires</Label><Select value={expiry} onValueChange={setExpiry}><SelectTrigger className="min-h-11 rounded-2xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="24h">In 24 hours</SelectItem><SelectItem value="7d">In 7 days</SelectItem><SelectItem value="30d">In 30 days</SelectItem><SelectItem value="never">When I revoke it</SelectItem></SelectContent></Select></div>
              {latestUrl && <div className="rounded-2xl bg-secondary p-3 text-sm"><p className="mb-1 font-medium">New link</p><p className="break-all text-muted-foreground">{latestUrl}</p><Button variant="ghost" size="sm" className="mt-2 gap-2" onClick={() => navigator.clipboard.writeText(latestUrl)}><Copy className="size-4" />Copy again</Button></div>}
            </div>
            <DrawerFooter><Button onClick={createShare} disabled={busy || !petId} className="min-h-12 rounded-2xl">{busy ? 'Creating…' : 'Create and copy link'}</Button></DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
      <div className="mt-4 space-y-2">
        {links.filter((link) => !link.revoked_at).slice(0, 4).map((link) => {
          const pet = pets.find((item) => item.id === link.pet_id)
          return <div key={link.id} className="flex min-h-14 items-center gap-3 rounded-2xl bg-secondary/60 px-3"><ShieldCheck className="size-4 text-primary" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{pet?.name || 'Pet'} share</p><p className="text-xs text-muted-foreground">{link.expires_at ? `Expires ${new Date(link.expires_at).toLocaleString()}` : 'No automatic expiry'}</p></div><Button variant="ghost" size="icon" className="size-10 rounded-xl text-destructive" onClick={() => revoke(link.id)} aria-label={`Revoke ${pet?.name || 'pet'} share`}><Trash2 className="size-4" /></Button></div>
        })}
        {!links.some((link) => !link.revoked_at) && <div className="flex items-center gap-2 rounded-2xl border border-dashed p-4 text-sm text-muted-foreground"><Link2 className="size-4" />No active shares</div>}
      </div>
    </div>
  )
}
