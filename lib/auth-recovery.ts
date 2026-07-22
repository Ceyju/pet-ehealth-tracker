export const RECOVERY_CALLBACK_PATH = '/auth/callback'
export const RESET_PASSWORD_PATH = '/reset-password'

function validOrigin(value: string | undefined) {
  if (!value) return null

  try {
    const url = new URL(value)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return url.origin
  } catch {
    return null
  }
}

export function buildRecoveryRedirectUrl(browserOrigin: string) {
  const origin = validOrigin(process.env.NEXT_PUBLIC_APP_URL) ?? validOrigin(browserOrigin)

  if (!origin) throw new Error('JoyCare application URL is not configured correctly.')

  const callback = new URL(RECOVERY_CALLBACK_PATH, origin)
  callback.searchParams.set('next', RESET_PASSWORD_PATH)
  return callback.toString()
}

export function recoveryDestination(requestedNext: string | null) {
  void requestedNext
  return RESET_PASSWORD_PATH
}

export type RecoveryLinkError = 'expired-link' | 'invalid-link' | 'missing-code' | 'callback-failed'

export function recoveryLinkError(code: string | null | undefined): RecoveryLinkError {
  if (code === 'otp_expired' || code === 'expired') return 'expired-link'
  if (!code) return 'callback-failed'
  return 'invalid-link'
}

export function recoveryErrorMessage(error: string | null) {
  switch (error) {
    case 'expired-link':
      return 'This recovery link has expired. Request a new one and use the newest email.'
    case 'missing-code':
      return 'This recovery link is incomplete. Request a new password-reset email.'
    case 'callback-failed':
      return 'We could not start password recovery. The link may have been used already or opened in a different browser.'
    case 'invalid-link':
      return 'This recovery link is invalid or has already been used. Request a new one.'
    default:
      return null
  }
}
