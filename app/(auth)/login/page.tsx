'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/lib/store'
import { AuthFrame, ErrorBox, Field } from '@/components/auth/auth-frame'

export default function LoginPage() {
  return <Suspense fallback={<div className="grid min-h-screen place-items-center"><div className="size-9 animate-spin rounded-full border-2 border-primary/20 border-t-primary" /></div>}><LoginForm /></Suspense>
}

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('')
  const { login, loading, error } = useAuthStore()
  const resetComplete = params.get('reset') === 'success'
  const submit = async (event: React.FormEvent) => { event.preventDefault(); try { await login(email, password); const next = params.get('next'); router.replace(next?.startsWith('/') ? next : '/dashboard') } catch { /* Store exposes the message. */ } }
  return <AuthFrame eyebrow="Welcome back" title="Your pet’s care, all in one calm place." copy="Open today’s care list, update owner-maintained records, and securely share the orange health card."><form onSubmit={submit} className="space-y-4">{resetComplete && <div className="flex gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="mt-0.5 size-4 shrink-0" />Password updated. Sign in with your new password.</div>}{error && <ErrorBox message={error} />}<Field label="Email" htmlFor="email"><Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={loading} className="min-h-12 rounded-2xl" placeholder="you@example.com" /></Field><Field label="Password" htmlFor="password"><Input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required disabled={loading} className="min-h-12 rounded-2xl" placeholder="••••••••" /></Field><div className="-mt-1 text-right"><Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">Forgot password?</Link></div><Button type="submit" disabled={loading} className="min-h-12 w-full rounded-2xl">{loading ? 'Signing in…' : <>Sign in<ArrowRight className="size-4" /></>}</Button><p className="pt-2 text-center text-sm text-muted-foreground">New to JoyCare? <Link href="/signup" className="font-semibold text-primary hover:underline">Create an account</Link></p></form></AuthFrame>
}
