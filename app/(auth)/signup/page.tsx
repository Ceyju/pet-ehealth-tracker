'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/lib/store'
import { AuthFrame, ErrorBox, Field } from '@/components/auth/auth-frame'

export default function SignupPage() {
  const router = useRouter(); const { signup, loading, error } = useAuthStore()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '' }); const [validation, setValidation] = useState('')
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setValidation(''); if (form.password.length < 8) { setValidation('Use at least 8 characters.'); return } if (form.password !== form.confirm) { setValidation('Passwords do not match.'); return } try { await signup(form.email, form.password, form.fullName); router.replace('/dashboard') } catch { /* Store exposes the message. */ } }
  return <AuthFrame eyebrow="Create your account" title="Start a healthier care routine." copy="JoyCare keeps every record owner-maintained and private until you choose to share it."><form onSubmit={submit} className="space-y-4">{(error || validation) && <ErrorBox message={error || validation} />}<Field label="Your name" htmlFor="name"><Input id="name" autoComplete="name" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required className="min-h-12 rounded-2xl" /></Field><Field label="Email" htmlFor="email"><Input id="email" type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required className="min-h-12 rounded-2xl" /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Password" htmlFor="password"><Input id="password" type="password" autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required className="min-h-12 rounded-2xl" placeholder="8+ characters" /></Field><Field label="Confirm" htmlFor="confirm"><Input id="confirm" type="password" autoComplete="new-password" value={form.confirm} onChange={(event) => setForm({ ...form, confirm: event.target.value })} required className="min-h-12 rounded-2xl" placeholder="••••••••" /></Field></div><Button type="submit" disabled={loading} className="min-h-12 w-full rounded-2xl">{loading ? 'Creating account…' : <>Create account<ArrowRight className="size-4" /></>}</Button><p className="pt-2 text-center text-sm text-muted-foreground">Already have an account? <Link href="/login" className="font-semibold text-primary hover:underline">Sign in</Link></p></form></AuthFrame>
}
