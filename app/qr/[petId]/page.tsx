import Link from 'next/link'
import { Link2Off } from 'lucide-react'

export default function LegacyQrPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <section className="surface max-w-md p-8 text-center">
        <Link2Off className="mx-auto mb-4 size-10 text-muted-foreground" />
        <h1 className="text-xl font-semibold">This old QR link is no longer active</h1>
        <p className="mt-2 text-sm text-muted-foreground">For privacy, JoyCare now uses revocable share links instead of pet and owner IDs.</p>
        <Link href="/ehealth-card" className="mt-6 inline-flex min-h-11 items-center rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground">Create a secure share</Link>
      </section>
    </main>
  )
}
