'use client'

import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import { Copy, Download } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export function QRCodeGenerator({ shareUrl, petName }: { shareUrl: string; petName: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (!canvasRef.current) return
    void QRCode.toCanvas(canvasRef.current, shareUrl, { errorCorrectionLevel: 'H', margin: 1, width: 300, color: { dark: '#1f2937', light: '#ffffff' } })
  }, [shareUrl])
  const download = () => {
    if (!canvasRef.current) return
    const anchor = document.createElement('a'); anchor.href = canvasRef.current.toDataURL('image/png'); anchor.download = `${petName}-joycare-share.png`; anchor.click()
  }
  const copy = async () => { await navigator.clipboard.writeText(shareUrl); toast.success('Share link copied') }
  return <div className="flex flex-col items-center gap-5"><canvas ref={canvasRef} className="rounded-2xl border-4 border-white shadow-lg" aria-label={`Secure QR share for ${petName}`} /><p className="max-w-sm text-center text-sm text-muted-foreground">This QR uses a revocable random link and never contains owner or pet database IDs.</p><div className="flex gap-2"><Button onClick={download}><Download className="size-4" />Download</Button><Button variant="outline" onClick={copy}><Copy className="size-4" />Copy link</Button></div></div>
}
