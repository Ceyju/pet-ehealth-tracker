import { afterEach, describe, expect, it } from 'vitest'
import {
  buildRecoveryRedirectUrl,
  recoveryDestination,
  recoveryErrorMessage,
  recoveryLinkError,
} from './auth-recovery'

const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL

afterEach(() => {
  if (originalAppUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL
  else process.env.NEXT_PUBLIC_APP_URL = originalAppUrl
})

describe('password recovery routing', () => {
  it('uses the canonical configured origin for recovery emails', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://joycare-delta.vercel.app/'

    expect(buildRecoveryRedirectUrl('http://localhost:3000')).toBe(
      'https://joycare-delta.vercel.app/auth/callback?next=%2Freset-password',
    )
  })

  it('falls back to the browser origin for local development', () => {
    delete process.env.NEXT_PUBLIC_APP_URL

    expect(buildRecoveryRedirectUrl('http://localhost:3000')).toBe(
      'http://localhost:3000/auth/callback?next=%2Freset-password',
    )
  })

  it('never permits a recovery link to redirect outside the reset screen', () => {
    expect(recoveryDestination('/reset-password')).toBe('/reset-password')
    expect(recoveryDestination('//attacker.example')).toBe('/reset-password')
    expect(recoveryDestination('/dashboard')).toBe('/reset-password')
  })

  it('classifies provider and callback failures without exposing raw errors', () => {
    expect(recoveryLinkError('otp_expired')).toBe('expired-link')
    expect(recoveryLinkError('bad_code_verifier')).toBe('invalid-link')
    expect(recoveryLinkError(null)).toBe('callback-failed')
    expect(recoveryErrorMessage('missing-code')).toContain('incomplete')
  })
})
