import Link from 'next/link'
import { AlertCircle, PawPrint } from 'lucide-react'
import { Label } from '@/components/ui/label'

export function AuthFrame({ eyebrow, title, copy, children }: { eyebrow: string; title: string; copy: string; children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden overflow-hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-2 text-lg font-semibold"><span className="grid size-10 place-items-center rounded-2xl bg-white/12"><PawPrint className="size-5" /></span>JoyCare</div>
        <div className="relative z-10 max-w-xl"><p className="text-xs font-semibold uppercase tracking-[.18em] text-primary-foreground/60">Owner-maintained health</p><h1 className="mt-4 text-5xl font-semibold tracking-[-.04em]">Care feels lighter when everything has a place.</h1><p className="mt-5 max-w-lg text-lg leading-8 text-primary-foreground/70">Records, reminders, secure sharing, and every pet’s story—organized without the noise.</p></div>
        <p className="text-sm text-primary-foreground/50">Private by default · Revocable sharing · Telegram reminders</p>
        <div className="absolute -right-36 -top-36 size-[32rem] rounded-full bg-white/5 blur-3xl" /><div className="absolute -bottom-48 -left-24 size-[30rem] rounded-full bg-emerald-300/10 blur-3xl" />
      </section>
      <section className="grid place-items-center px-4 py-10 sm:px-8"><div className="w-full max-w-md"><Link href="/" className="mb-10 flex items-center gap-2 text-lg font-semibold lg:hidden"><span className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground"><PawPrint className="size-5" /></span>JoyCare</Link><p className="eyebrow">{eyebrow}</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h2><p className="mb-8 mt-3 text-sm leading-6 text-muted-foreground">{copy}</p>{children}</div></section>
    </main>
  )
}

export function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) { return <div className="grid gap-2"><Label htmlFor={htmlFor}>{label}</Label>{children}</div> }
export function ErrorBox({ message }: { message: string }) { return <div className="flex gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"><AlertCircle className="mt-0.5 size-4 shrink-0" />{message}</div> }
