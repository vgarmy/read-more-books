import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Scanner } from '@yudiel/react-qr-scanner'
import type { IDetectedBarcode } from '@yudiel/react-qr-scanner'
import { supabase } from '../supabaseClient'
import { FaCamera } from 'react-icons/fa'

export default function Login() {
  const [qrCode, setQrCode] = useState('')
  const [scanning, setScanning] = useState(false)
  const navigate = useNavigate()

  // Gemensam login-funktion
  const handleLogin = async (code: string) => {
    if (!code) return alert('Ingen QR-kod hittad!')

    const { data, error } = await supabase
      .from('children')
      .select('*')
      .eq('qr_code', code)
      .single()

    if (error || !data) {
      alert('QR-koden hittades inte!')
    } else {
      localStorage.setItem('loggedChild', JSON.stringify(data))
      navigate('/home')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-200 via-yellow-100 to-green-200 px-4">
      <div className="w-full max-w-sm bg-white p-6 rounded-3xl shadow-2xl flex flex-col items-center">
        <p className="text-3xl font-bold mb-6 text-pink-500">Logga in med QR</p>

        {/* Textinput för manuell QR-kod */}
        <input
          type="text"
          placeholder="Skriv QR-kod här"
          value={qrCode}
          onChange={(e) => setQrCode(e.target.value)}
          className="w-full px-4 py-3 text-black border-4 border-blue-300 rounded-xl mb-4 focus:outline-none focus:ring-4 focus:ring-pink-300"
        />
        <button
          onClick={() => handleLogin(qrCode)}
          className="w-full bg-yellow-400 text-pink-600 py-3 rounded-xl font-bold hover:bg-yellow-500 mb-6 transition-colors"
        >
          Logga in
        </button>

        {/* Kamera-knapp */}
        {!scanning ? (
          <button
            onClick={() => setScanning(true)}
            className="flex items-center gap-3 bg-blue-400 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-colors"
          >
            <FaCamera size={20} />
            Skanna QR-kod
          </button>
        ) : (
          <div className="w-full rounded-xl overflow-hidden border-4 border-purple-300 shadow-lg">
            <Scanner
              onScan={(detectedCodes: IDetectedBarcode[]) => {
                if (detectedCodes.length > 0) {
                  const scanned = detectedCodes[0].rawValue
                  if (scanned) handleLogin(scanned)
                }
              }}
              onError={(error: unknown) => console.error(error)}
              constraints={{ facingMode: 'environment' }}
              styles={{ video: { width: '100%' } }}
            />
            <button
              onClick={() => setScanning(false)}
              className="mt-2 w-full bg-red-400 hover:bg-red-500 text-white py-2 rounded-xl font-semibold"
            >
              Avbryt
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
