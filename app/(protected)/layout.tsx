'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { Navigation } from '@/components/navigation'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, loading } = useAuthStore()

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center" role="status" aria-label="Loading JoyCare">
        <div className="size-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="pb-28 pt-16 md:pb-8 md:pt-24">{children}</main>
    </div>
  )
}
