import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import KidsNav from './components/kidsNav'
import { FaHome, FaSearch, FaBookOpen, FaSignOutAlt } from 'react-icons/fa'
import { supabase } from '../supabaseClient'
import challenges from './components/reading_challenges.json'

type BookRow = {
  id: string
  title: string
  author?: string | null
  cover?: string | null
  isbn?: string | null
  free_url?: string | null
}

type RawReadRow = {
  read_at: string
  books: BookRow | BookRow[] | null
}

/** Stabil “dagens utmaning” baserat på YYYY-MM-DD (samma val hela dagen). */
function pickDailyChallenge<T>(items: T[]): T | null {
  if (!items || items.length === 0) return null
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = today.getMonth() + 1
  const dd = today.getDate()
  const key = Number(`${yyyy}${mm.toString().padStart(2, '0')}${dd.toString().padStart(2, '0')}`)
  const idx = key % items.length
  return items[idx]
}

export default function Home() {
  const childStr = localStorage.getItem('loggedChild')
  const childData = childStr ? JSON.parse(childStr) : null
  const navigate = useNavigate()

  const [recentBooks, setRecentBooks] = useState<BookRow[]>([])
  const [monthlyCounts, setMonthlyCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const todaysChallenge = useMemo(() => pickDailyChallenge(challenges), [])

  useEffect(() => {
    let cancelled = false

    const loadRecent = async () => {
      if (!childData?.id) {
        setError('Inget barn är inloggat – logga in först.')
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')

      const { data, error } = await supabase
        .from('child_read_books')
        .select(`
          read_at,
          books:book_id (
            id, title, author, cover, isbn, free_url
          )
        `)
        .eq('child_id', childData.id)
        .order('read_at', { ascending: false })
        .limit(3)

      if (cancelled) return

      if (error) {
        console.error('[Home loadRecent] error:', error)
        setError('Kunde inte hämta senaste lästa böcker.')
        setRecentBooks([])
      } else {
        const rows = (data ?? []) as RawReadRow[]
        const books = rows
          .map(r => (Array.isArray(r.books) ? r.books[0] ?? null : r.books))
          .filter((b): b is BookRow => !!b)
        setRecentBooks(books)

        // --- Monthly counter ---
        const allCounts: Record<string, number> = {}
        const { data: allRead, error: allErr } = await supabase
          .from('child_read_books')
          .select('read_at')
          .eq('child_id', childData.id)

        if (!allErr && allRead) {
          (allRead as { read_at: string }[]).forEach(r => {
            const date = new Date(r.read_at)
            const monthKey = date.toLocaleString('sv-SE', { month: 'long', year: 'numeric' })
            allCounts[monthKey] = (allCounts[monthKey] || 0) + 1
          })
        }

        setMonthlyCounts(allCounts)
      }
      setLoading(false)
    }

    loadRecent()
    return () => {
      cancelled = true
    }
  }, [childData?.id])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.error('Logout error', e)
    } finally {
      localStorage.removeItem('loggedChild')
      localStorage.removeItem('user')
      window.location.replace('/read-more-books')
    }
  }

  const menuItems = [
    { to: '/read-more-books/home', label: 'Hem', icon: <FaHome /> },
    { to: '/read-more-books/booksearch', label: 'Sök efter böcker', icon: <FaSearch /> },
    { to: '/read-more-books/read', label: 'Böcker jag har läst', icon: <FaBookOpen /> },
    { action: handleLogout, label: 'Logga ut', icon: <FaSignOutAlt /> },
  ]

  return (
    <div className="min-h-screen bg-pink-100">
      <KidsNav items={menuItems} title="VI LÄSER!" />

      <div className="px-8 pb-10 flex flex-col items-center justify-start">
        <h1 className="text-4xl font-extrabold text-center text-purple-600 mb-6">
          Välkommen {childData?.name || 'Barnet'}! 🎉
        </h1>
        <p className="text-lg text-purple-600 mb-6 text-center">
          Här kan ni börja läsa och ha kul tillsammans.
        </p>

        {/* Primär CTA */}
    <div className="relative inline-block w-full max-w-xs mb-6">
    <button onClick={() => navigate('/read-more-books/booksearch')} aria-label="Sök böcker"
    className="relative z-10 inline-flex w-full items-center justify-center gap-2 font-own font-bold uppercase tracking-[0.8px] text-xl leading-5 px-6 py-[13px] rounded-2xl bg-[#1899D6] text-white transition duration-200 hover:brightness-110 active:translate-y-[1px] shadow-lg disabled:cursor-default disabled:opacity-70 select-none focus:outline-none active:[&+span]:translate-y-[1px]">
      <FaSearch size={18} />
      Sök böcker</button>
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 bottom-[-4px] rounded-2xl bg-[#1CB0F6] transition-transform duration-150"></span>
      </div>

        {/* --- Monthly counter --- */}
        <div className="w-full max-w-md mb-6 p-4 bg-white rounded-2xl shadow-sm">
          {Object.keys(monthlyCounts).length === 0 ? (
            <p className="text-sm text-gray-500">Inga böcker lästa ännu.</p>
          ) : (
            <ul className="text-sm text-gray-700 space-y-1">
              {Object.entries(monthlyCounts).map(([month, count]) => (
                <div className='text-center'>
                  <h2 className="text-base font-semibold text-gray-700 mb-2">Böcker lästa {month}</h2>
                  <li key={month}>
                    <span className="font-semibold text-4xl">{count}</span>
                  </li>
                </div>
              ))}
            </ul>

          )}
        </div>

        {/* Senaste tre lästa */}
        <div className="w-full max-w-md">
          <h2 className="text-base font-semibold text-gray-700 mb-3">Senaste lästa</h2>

          {loading && <div className="text-sm text-gray-500">Laddar...</div>}
          {!loading && error && <div className="text-sm text-red-500">{error}</div>}

          {!loading && !error && recentBooks.length === 0 ? (
            <div className="text-sm text-gray-500">
              Inga lästa böcker ännu – börja med att söka upp en bok 👇
            </div>
          ) : (
            !loading &&
            !error && (
              <div className="grid grid-cols-3 gap-3">
                {recentBooks.map(book => (
                  <div key={book.id} className="w-full">
                    {book.cover ? (
                      <img
                        src={book.cover}
                        alt={book.title || 'Bokomslag'}
                        className="w-full aspect-[3/4] object-cover rounded-md shadow-lg"
                      />
                    ) : (
                      <div className="w-full aspect-[3/4] rounded-2xl bg-gray-200 shadow-inner flex items-center justify-center text-[11px] text-gray-500">
                        Ingen bild
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Dagens läsutmaning */}
        <div className="w-full max-w-md mt-6 p-4 bg-white rounded-2xl shadow-sm">
          {todaysChallenge ? (
            <>
              <p className="text-sm text-gray-700">
                🔖 <span className="font-semibold">Dagens läsutmaning:</span> {todaysChallenge.title}
              </p>
              <p className="text-xs text-gray-600 mt-1">{todaysChallenge.description}</p>
              <div className="mt-2 text-[11px] text-gray-500">
                ⏱ {todaysChallenge.duration} • 👶 {todaysChallenge.ageRange}
              </div>
              {todaysChallenge.tips && (
                <div className="mt-2 text-[11px] text-gray-500">
                  💡 <span className="font-medium">Tips:</span> {todaysChallenge.tips}
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-700">
              🔖 <span className="font-semibold">Dagens läsutmaning:</span> Läs i 5 minuter och säg ett ord från bilden.
            </p>
          )}
        </div>
      </div>

      {/* Infosektion – oförändrad */}
      <div className="px-8 pt-6 pb-10 max-w-xl mx-auto">
        <h1 className="text-4xl font-extrabold text-center text-purple-600 mb-6">
          Högläsning i förskolan
        </h1>
        <div className="space-y-4 text-slate-800 leading-relaxed text-lg">
          <p>
            Förskolan arbetar aktivt med högläsning eftersom det är en viktig del av barns språkutveckling och lärande. När barn får lyssna på sagor och berättelser tränar de sitt ordförråd, sin förståelse och sin förmåga att uttrycka tankar och känslor.
          </p>
          <p>
            Högläsning ger barn tillgång till texter och berättelser som de ännu inte själva kan läsa, vilket stärker fantasin och förståelsen för världen runt omkring dem.
          </p>
          <p>
            Läroplanen betonar också att barn ska få möta olika former av texter och kulturella uttryck. Genom högläsning lär de sig att text har ett syfte, att berättelser följer en struktur och att böcker kan ge både kunskap och glädje.
          </p>
          <p>
            Föräldrar har en viktig roll i detta. Att läsa tillsammans hemma, även bara några minuter om dagen, ger barnet extra möjlighet att utveckla språk och nyfikenhet på böcker. Det blir också en mysig stund av närhet och trygghet.
          </p>
          <p className="font-medium">
            Vi uppmuntrar er att läsa tillsammans med era barn, prata om bilder och handlingar, och skapa små <em>”jag-och-du-ögonblick”</em> som stärker språket och relationen ❤️
          </p>
        </div>
      </div>
    </div>
  )
}
