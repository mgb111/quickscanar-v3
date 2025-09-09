"use client"

import Link from "next/link"
import Header from "@/components/Header"
import { useEffect, useRef } from "react"

function QRCodeComponent() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  useEffect(() => {
    if (canvasRef.current) {
      // Simple QR code pattern for demo - replace with actual QR generation
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (ctx) {
        // Create a simple QR-like pattern
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, 80, 80)
        ctx.fillStyle = 'black'
        
        // Draw QR pattern (simplified)
        const pattern = [
          [1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,1],
          [1,0,0,0,0,0,1,0,0,1,1,0,0,0,0,0,1],
          [1,0,1,1,1,0,1,0,1,0,1,0,1,1,1,0,1],
          [1,0,1,1,1,0,1,0,0,1,1,0,1,1,1,0,1],
          [1,0,1,1,1,0,1,0,1,0,1,0,1,1,1,0,1],
          [1,0,0,0,0,0,1,0,0,1,1,0,0,0,0,0,1],
          [1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,1],
          [0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
          [1,0,1,0,1,1,1,1,1,0,1,1,0,1,0,1,1],
          [0,1,0,1,0,0,0,1,0,1,0,0,1,0,1,0,0],
          [1,0,1,0,1,1,1,0,1,0,1,1,0,1,0,1,1],
          [0,1,0,1,0,0,0,1,0,1,0,0,1,0,1,0,0],
          [1,0,1,0,1,1,1,0,1,0,1,1,0,1,0,1,1],
          [0,0,0,0,0,0,0,0,1,0,1,0,1,0,1,0,0],
          [1,1,1,1,1,1,1,0,1,0,1,1,0,1,0,1,1],
          [1,0,0,0,0,0,1,0,0,1,0,0,1,0,1,0,0],
          [1,1,1,1,1,1,1,0,1,0,1,1,0,1,0,1,1]
        ]
        
        const cellSize = 4
        pattern.forEach((row, y) => {
          row.forEach((cell, x) => {
            if (cell) {
              ctx.fillRect(x * cellSize + 2, y * cellSize + 2, cellSize, cellSize)
            }
          })
        })
      }
    }
  }, [])
  
  return <canvas ref={canvasRef} width={80} height={80} className="rounded" />
}

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header showSignIn={false} showSignUp={false} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-black mb-4">Try the AR Demo</h1>
        <p className="text-lg text-black/80 mb-8">
          Scan the QR code in the image below with your phone camera. Tap the link that appears, allow
          camera access, and then point your phone back at this same image to see the AR overlay.
        </p>

        <div className="grid gap-8">
          <div className="relative">
            <img
              src="/demo-photo.png"
              alt="Demo photo with QR code"
              className="w-full h-auto rounded-2xl border-2 border-black shadow"
            />
            {/* Smaller QR Code Overlay */}
            <div className="absolute top-4 right-4 bg-white p-2 rounded-lg shadow-lg border border-gray-200">
              <QRCodeComponent />
            </div>
            <p className="text-sm text-black/60 mt-2">
              Scan the small QR code in the top-right corner with your phone camera.
            </p>
          </div>

          <div className="bg-cream rounded-2xl border-2 border-black p-6">
            <h2 className="text-2xl font-bold text-black mb-3">How to view the AR</h2>
            <ol className="list-decimal list-inside space-y-2 text-black/90">
              <li>On your phone, open the camera and scan the QR code in the image above.</li>
              <li>Tap the link to open the AR viewer, then allow camera access.</li>
              <li>Point your phone back at the same photo to trigger the AR experience.</li>
            </ol>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/ar/quick.html"
                className="bg-red-600 text-white px-5 py-3 rounded-lg font-semibold border-2 border-black hover:bg-red-700"
              >
                Open AR Experience on this device
              </Link>
              <a
                href="/demo-photo.png"
                download
                className="px-5 py-3 rounded-lg border-2 border-black hover:bg-white"
              >
                Download Demo Photo
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
