'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AuthFrame, ErrorBox, Field } from '@/components/auth/auth-frame'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [checking, setChecking] = useState(true)
  const [loading, setLoading] = useState(false)
  const [validSession, setValidSession] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void supabase.auth.getUser().then(({ data }) => {
      if (!active) return
      setValidSession(Boolean(data.user))
      setChecking(false)
    })
    return () => { active = false }
  }, [])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    if (password.length < 8) { setError('Use at least 8 characters.'); return }
    if (password !== confirmation) { setError('Passwords do not match.'); return }
    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) { setError(updateError.message); setLoading(false); return }
    await supabase.auth.signOut()
    router.replace('/login?reset=success')
  }

  return (
    <AuthFrame eyebrow="Account recovery" title="Choose a new password." copy="Use a unique password that you do not use for another account.">
      {checking ? <div className="grid min-h-40 place-items-center"><div className="size-9 animate-spin rounded-full border-2 border-primary/20 border-t-primary" /></div> : !validSession ? (
        <div className="space-y-4"><ErrorBox message="This recovery link is invalid or has expired. Request a new one." /><Button asChild className="min-h-12 w-full rounded-2xl"><Link href="/forgot-password">Request another link</Link></Button></div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {error && <ErrorBox message={error} />}
          <Field label="New password" htmlFor="new-password"><Input id="new-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} disabled={loading} className="min-h-12 rounded-2xl" placeholder="At least 8 characters" /></Field>
          <Field label="Confirm password" htmlFor="confirm-password"><Input id="confirm-password" type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required minLength={8} disabled={loading} className="min-h-12 rounded-2xl" placeholder="Repeat your password" /></Field>
          <Button type="submit" disabled={loading} className="min-h-12 w-full rounded-2xl">{loading ? 'Updating…' : 'Update password'}</Button>
        </form>
      )}
    </AuthFrame>
  )
}
