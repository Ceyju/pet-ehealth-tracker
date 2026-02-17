'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { Button } from '@/components/ui/button'
import { Download, Copy, Loader2 } from 'lucide-react'

interface QRCodeGeneratorProps {
  petId: string
  petName: string
  userId: string
}

export function QRCodeGenerator({ petId, petName, userId }: QRCodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const qrValue = `${typeof window !== 'undefined' ? window.location.origin : ''}/qr/${petId}?user=${userId}`

  useEffect(() => {
    const generateQR = async () => {
      if (canvasRef.current) {
        try {
          await QRCode.toCanvas(canvasRef.current, qrValue, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            quality: 0.95,
            margin: 1,
            width: 300,
            color: {
              dark: '#1f2937',
              light: '#ffffff',
            },
          })
        } catch (err) {
          console.error('Error generating QR code:', err)
        } finally {
          setLoading(false)
        }
      }
    }

    generateQR()
  }, [qrValue])

  const handleDownload = () => {
    if (canvasRef.current) {
      const link = document.createElement('a')
      link.href = canvasRef.current.toDataURL()
      link.download = `${petName}-qr-code.png`
      link.click()
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(qrValue)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {loading && (
        <div className="flex items-center justify-center w-80 h-80 bg-gray-100 rounded-lg">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      )}

      {!loading && (
        <>
          <canvas
            ref={canvasRef}
            className="border-4 border-gray-200 rounded-lg shadow-lg"
          />

          <p className="text-sm text-gray-600 text-center">
            Scan this QR code to view {petName}'s health records
          </p>

          <div className="flex gap-3">
            <Button
              onClick={handleDownload}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button
              variant="outline"
              onClick={handleCopy}
            >
              <Copy className="w-4 h-4 mr-2" />
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
