import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { recoveryDestination, recoveryLinkError } from '@/lib/auth-recovery'

function errorRedirect(origin: string, error: string) {
  const destination = new URL('/forgot-password', origin)
  destination.searchParams.set('error', error)
  return NextResponse.redirect(destination)
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = recoveryDestination(url.searchParams.get('next'))

  const providerError = url.searchParams.get('error_code') ?? url.searchParams.get('error')
  if (providerError) return errorRedirect(url.origin, recoveryLinkError(providerError))

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(new URL(next, url.origin))
    return errorRedirect(url.origin, recoveryLinkError(error.code))
  }

  return errorRedirect(url.origin, 'missing-code')
}
