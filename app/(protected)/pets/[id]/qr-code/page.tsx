import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

export default async function PetQrPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <div className="page-shell max-w-2xl space-y-6"><Link href={`/pets/${id}`} className="inline-flex min-h-11 items-center gap-2 rounded-2xl px-3 text-sm font-medium text-muted-foreground hover:bg-accent"><ArrowLeft className="size-4" />Back to pet</Link><section className="surface grid place-items-center px-6 py-14 text-center"><span className="grid size-14 place-items-center rounded-2xl bg-secondary"><ShieldCheck className="size-6 text-primary" /></span><h1 className="mt-4 text-2xl font-semibold">QR sharing is now secure</h1><p className="mt-2 max-w-md text-sm text-muted-foreground">Create a time-limited, revocable link from the eHealth Card screen. The QR will appear on the retained orange card after creation.</p><Link href="/ehealth-card" className="mt-6 inline-flex min-h-11 items-center rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground">Open secure sharing</Link></section></div>
}
