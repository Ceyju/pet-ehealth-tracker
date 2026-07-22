import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Providers } from '@/components/providers'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'JoyCare', template: '%s · JoyCare' },
  description: 'A calm, owner-maintained home for your pet’s health records and care reminders.',
  applicationName: 'JoyCare',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="font-sans"
        style={{
          ['--font-system' as string]:
            "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif",
        }}
      >
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  )
}
