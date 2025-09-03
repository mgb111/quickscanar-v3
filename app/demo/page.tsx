"use client"

import Link from "next/link"
import Header from "@/components/Header"

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
          <div>
            <img
              src="/demo-photo.png"
              alt="Demo photo with QR code"
              className="w-full h-auto rounded-2xl border-2 border-black shadow"
            />
            <p className="text-sm text-black/60 mt-2">
              If the image doesn’t load, please upload your file to <code>public/demo-photo.png</code>.
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
