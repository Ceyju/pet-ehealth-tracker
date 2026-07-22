'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Download, Link2, LogOut, Moon, Send, Sun, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function SettingsPage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { user, setUser, logout } = useAuthStore()
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [telegram, setTelegram] = useState<{ connected_at: string | null; telegram_username: string | null } | null>(null)
  const [form, setForm] = useState({ full_name: user?.full_name || '', phone: user?.phone || '', timezone: user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' })

  useEffect(() => {
    if (!user?.id) return
    const load = async () => {
      const { data } = await supabase.from('telegram_connections').select('connected_at, telegram_username').eq('user_id', user.id).is('revoked_at', null).maybeSingle()
      setTelegram(data)
    }
    void load()
  }, [user?.id])

  const saveProfile = async () => {
    if (!user) return
    setSaving(true)
    const { error } = await supabase.from('profiles').update(form).eq('id', user.id)
    setSaving(false)
    if (error) toast.error(error.message)
    else { setUser({ ...user, ...form }); toast.success('Profile updated') }
  }
  const connectTelegram = async () => {
    const response = await fetch('/api/telegram/connect', { method: 'POST' })
    const result = await response.json()
    if (!response.ok) { toast.error(result.error || 'Telegram is unavailable'); return }
    window.open(result.url, '_blank', 'noopener,noreferrer')
    toast.info('Press Start in Telegram to finish connecting')
  }
  const disconnectTelegram = async () => {
    const response = await fetch('/api/telegram/connect', { method: 'DELETE' })
    if (response.ok) { setTelegram(null); toast.success('Telegram disconnected') }
  }
  const signOut = async () => { await logout(); router.replace('/login') }
  const deleteAccount = async () => {
    setDeleting(true)
    const response = await fetch('/api/account', { method: 'DELETE' })
    const result = await response.json()
    if (!response.ok) { toast.error(result.error || 'Could not delete account'); setDeleting(false); return }
    await logout(); router.replace('/signup')
  }

  return (
    <div className="page-shell max-w-4xl space-y-6">
      <header><p className="eyebrow">Your account</p><h1 className="page-heading mt-1">Settings</h1><p className="mt-2 text-sm text-muted-foreground">Profile, appearance, reminders, sharing, and privacy.</p></header>

      <section className="surface p-5 sm:p-6"><h2 className="font-semibold">Profile</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Name"><Input className="min-h-11 rounded-2xl" value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} /></Field><Field label="Email"><Input className="min-h-11 rounded-2xl" value={user?.email || ''} disabled /></Field><Field label="Phone"><Input className="min-h-11 rounded-2xl" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Field><Field label="Timezone"><Input className="min-h-11 rounded-2xl" value={form.timezone} onChange={(event) => setForm({ ...form, timezone: event.target.value })} /></Field></div><Button className="ios-control mt-5" disabled={saving} onClick={saveProfile}>{saving ? 'Saving…' : 'Save profile'}</Button></section>

      <section className="surface p-5 sm:p-6"><h2 className="font-semibold">Appearance</h2><p className="mt-1 text-sm text-muted-foreground">JoyCare follows your device by default.</p><div className="mt-4 max-w-xs"><Select value={theme || 'system'} onValueChange={setTheme}><SelectTrigger className="min-h-11 rounded-2xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="system">System</SelectItem><SelectItem value="light"><span className="flex items-center gap-2"><Sun className="size-4" />Light</span></SelectItem><SelectItem value="dark"><span className="flex items-center gap-2"><Moon className="size-4" />Dark</span></SelectItem></SelectContent></Select></div></section>

      <section className="surface p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="flex items-center gap-2 font-semibold"><Send className="size-4 text-primary" />Telegram reminders</h2><p className="mt-1 text-sm text-muted-foreground">{telegram?.connected_at ? `Connected${telegram.telegram_username ? ` as @${telegram.telegram_username}` : ''}` : 'Connect the JoyCare bot for private care-date reminders.'}</p></div>{telegram?.connected_at ? <Button variant="outline" className="ios-control" onClick={disconnectTelegram}>Disconnect</Button> : <Button className="ios-control" onClick={connectTelegram}>Connect Telegram</Button>}</div></section>

      <section className="surface divide-y overflow-hidden"><SettingsLink href="/ehealth-card" icon={Link2} title="Active share links" copy="Create and revoke QR card access" /><button onClick={() => window.location.assign('/api/account')} className="flex min-h-20 w-full items-center gap-3 px-5 text-left hover:bg-accent"><Download className="size-5 text-primary" /><span><span className="block font-medium">Export my data</span><span className="block text-sm text-muted-foreground">Download a JSON copy of your JoyCare records</span></span></button><button onClick={signOut} className="flex min-h-20 w-full items-center gap-3 px-5 text-left hover:bg-accent"><LogOut className="size-5 text-primary" /><span><span className="block font-medium">Sign out</span><span className="block text-sm text-muted-foreground">End this session on this device</span></span></button></section>

      <section className="surface border-destructive/25 p-5 sm:p-6"><h2 className="font-semibold text-destructive">Delete account</h2><p className="mt-1 text-sm text-muted-foreground">Permanently remove your profile, pets, records, reminders, shares, and login.</p><Dialog><DialogTrigger asChild><Button variant="outline" className="ios-control mt-4 border-destructive/30 text-destructive hover:text-destructive"><Trash2 className="size-4" />Delete my account</Button></DialogTrigger><DialogContent className="rounded-3xl"><DialogHeader><DialogTitle>Delete JoyCare account?</DialogTitle><DialogDescription>This cannot be undone. Download your data first if you need a copy.</DialogDescription></DialogHeader><DialogFooter><Button variant="destructive" disabled={deleting} onClick={deleteAccount}>{deleting ? 'Deleting…' : 'Permanently delete'}</Button></DialogFooter></DialogContent></Dialog></section>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="grid gap-2"><Label>{label}</Label>{children}</div> }
function SettingsLink({ href, icon: Icon, title, copy }: { href: string; icon: typeof Link2; title: string; copy: string }) { return <Link href={href} className="flex min-h-20 items-center gap-3 px-5 hover:bg-accent"><Icon className="size-5 text-primary" /><span><span className="block font-medium">{title}</span><span className="block text-sm text-muted-foreground">{copy}</span></span></Link> }
