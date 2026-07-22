import 'server-only'

const buckets = new Map<string, { count: number; resetsAt: number }>()

export function allowPublicShareRead(key: string, limit = 60, windowMs = 60_000) {
  const now = Date.now()
  const bucket = buckets.get(key)
  if (!bucket || bucket.resetsAt <= now) {
    buckets.set(key, { count: 1, resetsAt: now + windowMs })
    return true
  }
  if (bucket.count >= limit) return false
  bucket.count += 1
  return true
}
