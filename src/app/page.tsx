'use client'

import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

export default function Home() {
  const [serverUrl, setServerUrl] = useState('')

  useEffect(() => {
    // Get the current host for QR code
    const protocol = window.location.protocol
    const host = window.location.hostname
    const port = window.location.port || '3000'
    setServerUrl(`${protocol}//${host}:${port}`)
  }, [])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-6xl font-bold text-gold-400 mb-4">
        Golden Friends
      </h1>
      <p className="text-xl text-gray-300 mb-12">
        Family Feud - Friends Edition
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl w-full">
        {/* TV Display */}
        <a
          href="/tv"
          className="bg-gray-800/50 border border-gold-400/30 rounded-xl p-6 hover:bg-gray-800/70 transition-all hover:scale-105"
        >
          <div className="text-4xl mb-4">📺</div>
          <h2 className="text-2xl font-bold text-gold-400 mb-2">TV Display</h2>
          <p className="text-gray-400">
            Display on the TV
          </p>
        </a>

        {/* Admin Panel */}
        <a
          href="/admin"
          className="bg-gray-800/50 border border-gold-400/30 rounded-xl p-6 hover:bg-gray-800/70 transition-all hover:scale-105"
        >
          <div className="text-4xl mb-4">🎮</div>
          <h2 className="text-2xl font-bold text-gold-400 mb-2">Admin</h2>
          <p className="text-gray-400">
            Game control for the host
          </p>
        </a>

        {/* Buzzer */}
        <a
          href="/buzzer"
          className="bg-gray-800/50 border border-gold-400/30 rounded-xl p-6 hover:bg-gray-800/70 transition-all hover:scale-105"
        >
          <div className="text-4xl mb-4">🔔</div>
          <h2 className="text-2xl font-bold text-gold-400 mb-2">Buzzer</h2>
          <p className="text-gray-400">
            For players
          </p>
        </a>
      </div>

      {/* QR Code for buzzer */}
      {serverUrl && (
        <div className="mt-12 bg-white p-6 rounded-xl">
          <QRCodeSVG
            value={`${serverUrl}/buzzer`}
            size={200}
            level="M"
          />
          <p className="text-gray-800 text-center mt-4 font-medium">
            Scan to join
          </p>
        </div>
      )}
    </main>
  )
}
