// src/pages/Login.tsx
import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Scanner } from '@yudiel/react-qr-scanner'
import type { IDetectedBarcode } from '@yudiel/react-qr-scanner'
import { supabase } from '../supabaseClient'
import { FaCamera, FaBookOpen, FaSignInAlt } from 'react-icons/fa'
import KidsNav from './components/kidsNav'

export default function Login() {
  const [qrCode, setQrCode] = useState('')
  const [scanning, setScanning] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as any)?.from?.pathname || '/read-more-books/home'

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
      // Save the logged-in child to localStorage
      localStorage.setItem('loggedChild', JSON.stringify(data))
      localStorage.setItem('user', 'true') // Required for route protection
      navigate(from, { replace: true }) // Redirect to intended page
    }
  }

  // ✅ Endast en länk i menyn för denna sida
  const loginOnlyMenu = [
    { to: '/read-more-books/', label: 'Login', icon: <FaSignInAlt /> },
    { to: '/read-more-books/varforlasa', label: 'Varför läsa', icon: <FaBookOpen /> }
  ]

  useEffect(() => {
    // Force reset history to ensure back/forward can't go to old protected pages
    window.history.pushState(null, '', window.location.href)
  }, [])

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-pink-200 via-yellow-100 to-green-200">
      {/* Meny med enbart "Login" */}
      <KidsNav items={loginOnlyMenu} title="VI LÄSER!" />

      <main className="px-4 pb-10 flex items-start justify-center">
        <section className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-6">
          <h1 className="text-4xl font-extrabold text-center text-pink-500 mb-6">
            Logga in med QR
          </h1>

          <input
            type="text"
            placeholder="Skriv QR-kod här"
            value={qrCode}
            onChange={(e) => setQrCode(e.target.value)}
            className="w-full px-4 py-3 text-base rounded-xl border-2 border-pink-200 text-black focus:outline-none focus:ring-4 focus:ring-pink-200 mb-4"
            inputMode="text"
            autoCapitalize="off"
            autoCorrect="off"
            aria-label="QR-kod"
          />

          <div className="relative inline-block w-full mb-6">
            {/* Bottenplattan, ligger bakom knappen */}
            <span
              aria-hidden="true"
              className="
      pointer-events-none absolute inset-x-0 top-0 bottom-[-4px]
      rounded-2xl bg-[#FDE047]
      transition-transform duration-150
    "
            />

            {/* Själva knappen */}
            <button
              onClick={() => handleLogin(qrCode)}
              aria-label="Logga in"
              className="
      relative z-10 inline-flex w-full items-center justify-center gap-2 align-middle whitespace-nowrap font-sans font-bold uppercase tracking-[0.8px] text-xl leading-5 py-[13px] px-4 rounded-2xl bg-[#FACC15] text-pink-700
      transition duration-200 hover:brightness-110 active:translate-y-[1px] shadow-md disabled:cursor-default disabled:opacity-70 select-none focus:outline-none font-own"
            >
              <FaSignInAlt size={18} /> Logga in
            </button>
          </div>

          {!scanning ? (
            <div className="relative inline-block w-full">
              {/* Plattan bakom knappen */}
              <span
                aria-hidden="true"
                className="
      pointer-events-none absolute inset-x-0 top-0 -bottom-1  /* 1 = 4px om din root-font är 16px */
      rounded-2xl bg-[#1CB0F6]
    "
              />

              {/* Själva knappen överst */}
              <button
                onClick={() => setScanning(true)}
                aria-label="Starta kamera för att skanna QR-kod"
                className={[
                  "relative z-10 inline-flex w-full items-center justify-center gap-2 align-middle whitespace-nowrap",
                  "font-sans font-bold uppercase tracking-[0.8px] text-xl leading-5",
                  "py-[13px] px-4 rounded-2xl text-white bg-[#1899D6]",
                  "transition duration-200 hover:brightness-110 active:translate-y-[1px]",
                  "disabled:cursor-default disabled:opacity-70",
                  "select-none focus:outline-none font-own"
                ].join(" ")}
              >
                <FaCamera size={18} />
                Skanna QR-kod
              </button>
            </div>
          ) : (
            <div className="w-full mt-4">
              <div className="rounded-2xl overflow-hidden border-2 border-purple-300 shadow-md">
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
              </div>

              <button
                onClick={() => setScanning(false)}
                className="w-full mt-3 bg-red-400 text-white py-2.5 rounded-xl font-semibold shadow-md active:scale-95 transition"
              >
                Avbryt
              </button>
            </div>
          )}
        </section>
      </main>

      <section className="px-6 pt-6 pb-10 max-w-xl mx-auto" style={{ paddingBottom: 'calc(40px + env(safe-area-inset-bottom, 0px))' }}>
        <h2 className="text-4xl font-semibold text-slate-800 mb-4">En bok idag – tusen ord imorgon</h2>
        <div className="space-y-3 text-slate-700 leading-relaxed">
          <p>Att läsa för barn mellan <strong>0–5 år</strong> är lite som magi i pyjamas. Du behöver inga superkrafter – bara din röst och en bok.</p>
          <p>När ni läser tillsammans växer barnets språk, fantasi och trygghet <span className="text-slate-600">(och ja… ibland somnar de snabbare också 😉).</span></p>
          <p>Det måste inte vara långt, pedagogiskt eller perfekt. En favoritbok om och om igen? <strong>Helt okej. </strong> Fem minuter i soffan? <strong>Räcker långt.</strong></p>
          <p>Varje saga är ett litet <em>”jag‑och‑du‑ögonblick” </em> som bygger minnen – och en stark grund för framtiden ❤️</p>
          <p className="font-medium">Så ta en bok, kryp nära<br />och låt vardagen pausa en stund.</p>
        </div>
      </section>
    </div>
  )
}