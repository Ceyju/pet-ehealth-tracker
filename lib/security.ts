import 'server-only'
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

export function createOpaqueToken(bytes = 32) {
  return randomBytes(bytes).toString('base64url')
}

export function hashToken(token: string) {
  return createHash('sha256').update(token, 'utf8').digest('hex')
}

export function safeSecretEquals(actual: string | null, expected: string | undefined) {
  if (!actual || !expected) return false
  const left = Buffer.from(actual)
  const right = Buffer.from(expected)
  return left.length === right.length && timingSafeEqual(left, right)
}
