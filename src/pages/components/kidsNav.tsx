import { useState, useEffect, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FaBars, FaTimes } from 'react-icons/fa'

type NavItem = {
  to: string
  label: string
  icon?: ReactNode
}

type KidsNavProps = {
  items: NavItem[]
  title?: string
}

export default function KidsNav({ items, title = 'VI LÄSER!' }: KidsNavProps) {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  // (Valfritt) Lås body-scroll när menyn är öppen
  useEffect(() => {
    const body = document.body
    if (open) body.classList.add('overflow-hidden')
    else body.classList.remove('overflow-hidden')
    return () => body.classList.remove('overflow-hidden')
  }, [open])

  return (
    <header className="sticky top-0 z-50">
      <div className="relative">
        {/* 🎨 Gradient + nästan platt våg som klipper (under är 100% transparent) */}
        <div className="absolute inset-x-0 top-0 -z-10">
          <svg
            aria-hidden="true"
            viewBox="0 0 1440 160"
            preserveAspectRatio="none"
            className="block w-full h-28 md:h-32 lg:h-36 drop-shadow-xl"
          >
            <defs>
              <linearGradient id="kidsGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"  stopColor="#f9a8d4" /> {/* pink-300 */}
                <stop offset="50%" stopColor="#fde68a" /> {/* amber-200 */}
                <stop offset="100%" stopColor="#6ee7b7" />{/* emerald-300 */}
              </linearGradient>

              {/* Minimal amplitud: 92–108–100 → nästan rakt men organiskt */}
              <clipPath id="waveClip" clipPathUnits="userSpaceOnUse">
                <path d="
                  M0,0
                  H1440
                  V100
                  C1200,92 960,108 720,100
                  480,92 240,108 0,100
                  Z
                " />
              </clipPath>
            </defs>

            {/* Ingen rx → övre högra hörnet är helt rakt */}
            <rect width="1440" height="160" fill="url(#kidsGrad)" clipPath="url(#waveClip)" />
          </svg>
        </div>

        {/* Topprad: Titel + hamburgare */}
        <nav className="px-4 pt-5 pb-7 flex items-center justify-between select-none">
          <Link to="/home" className="group" aria-label={`${title} startsida`}>
            <h1 className="text-2xl font-extrabold tracking-wide text-fuchsia-700 drop-shadow-sm -skew-x-3 group-hover:skew-x-0 transition">
              <span className="inline-block">{title}</span>
            </h1>
          </Link>

          <button
            onClick={() => setOpen(v => !v)}
            aria-expanded={open}
            aria-controls="kidsnav-menu"
            aria-label={open ? 'Stäng meny' : 'Öppna meny'}
            className="p-2 rounded-xl bg-white/70 backdrop-blur shadow-md hover:bg-white active:scale-95 transition"
          >
            <span className="sr-only">{open ? 'Stäng meny' : 'Öppna meny'}</span>
            <div className="text-fuchsia-700 text-xl">
              {open ? <FaTimes /> : <FaBars />}
            </div>
          </button>
        </nav>
      </div>

      {/* Rullgardinsmeny med mjuk slide */}
      <div
        id="kidsnav-menu"
        className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-out origin-top
                    ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="min-h-0">
          <div className="px-4 pb-4">
            <ul className="bg-white rounded-3xl shadow-xl p-3 space-y-2 border border-white/60">
              {items.map((item) => {
                const active = location.pathname === item.to
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 px-3 py-3 rounded-2xl transition shadow-sm active:scale-95
                        ${active
                          ? 'bg-fuchsia-50 text-fuchsia-700 ring-2 ring-fuchsia-200'
                          : 'bg-gradient-to-r from-amber-50 to-emerald-50 text-slate-700 hover:from-amber-100 hover:to-emerald-100'
                        }`}
                    >
                      {/* Om du skickar med icon i items syns den här */}
                      {item.icon ? <span className="text-lg">{item.icon}</span> : null}
                      <span className="font-semibold">{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>
    </header>
  )
}