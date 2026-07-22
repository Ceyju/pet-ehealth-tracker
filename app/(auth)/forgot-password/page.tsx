'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, MailCheck } from 'lucide-react'
import { AuthFrame, ErrorBox, Field } from '@/components/auth/auth-frame'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { buildRecoveryRedirectUrl, recoveryErrorMessage } from '@/lib/auth-recovery'

function ForgotPasswordForm() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const error = submissionError ?? recoveryErrorMessage(searchParams.get('error'))

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setSubmissionError(null)
    const redirectTo = buildRecoveryRedirectUrl(window.location.origin)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo })
    setLoading(false)
    if (resetError) { setSubmissionError(resetError.message); return }
    setSent(true)
  }

  return (
    <AuthFrame eyebrow="Account recovery" title="Reset your password." copy="We’ll send a secure, single-use recovery link to your JoyCare email address.">
      {sent ? (
        <div className="space-y-5">
          <div className="rounded-3xl border bg-card p-5 text-center"><MailCheck className="mx-auto size-9 text-primary" /><h3 className="mt-3 font-semibold">Check your inbox</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">If an account exists for that email, a password-reset link is on its way. Check spam if it does not arrive shortly.</p></div>
          <Button asChild variant="outline" className="min-h-12 w-full rounded-2xl"><Link href="/login"><ArrowLeft className="size-4" />Back to sign in</Link></Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {error && <ErrorBox message={error} />}
          <Field label="Email" htmlFor="recovery-email"><Input id="recovery-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={loading} className="min-h-12 rounded-2xl" placeholder="you@example.com" /></Field>
          <Button type="submit" disabled={loading} className="min-h-12 w-full rounded-2xl">{loading ? 'Sending…' : 'Send recovery link'}</Button>
          <p className="text-center text-sm"><Link href="/login" className="font-medium text-primary hover:underline">Back to sign in</Link></p>
        </form>
      )}
    </AuthFrame>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordForm />
    </Suspense>
  )
}
