import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Home() {
  const child = localStorage.getItem('loggedChild')
  const childData = child ? JSON.parse(child) : null
  const navigate = useNavigate()

  // Hämta lästa böcker och plocka de tre senaste (senast tillagda)
  const recentBooks = useMemo(() => {
    try {
      const list = JSON.parse(localStorage.getItem('readBooks') || '[]')
      if (!Array.isArray(list)) return []
      return list.slice(-3).reverse()
    } catch {
      return []
    }
  }, [])

  const firstRecent = recentBooks[0]

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-pink-100 px-4">
      <h1 className="text-3xl font-bold mb-2">Välkommen {childData?.name || 'Barnet'}! 🎉</h1>
      <p className="text-lg text-center mb-6">Här kan ni börja läsa och ha kul tillsammans.</p>

      {/* Primär CTA */}
      <button onClick={() => navigate('/boooksearch')} className="w-full max-w-xs bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg active:scale-95 transition mb-6">
        Sök böcker
      </button>

      {/* Snabbt: Fortsätt läsa om det finns något nyligen läst */}
      {firstRecent && (
        <button onClick={() => navigate('/readbooks')} className="w-full max-w-xs bg-yellow-400 text-pink-700 px-6 py-3 rounded-xl font-bold shadow-md active:scale-95 transition mb-6">
          Fortsätt läsa: {firstRecent.title?.slice(0, 28) || 'bok'} →
        </button>
      )}

      {/* Senaste tre lästa – endast omslag, rundade hörn */}
      <div className="w-full max-w-md">
        <h2 className="text-base font-semibold text-gray-700 mb-3">Senaste lästa</h2>

        {recentBooks.length === 0 ? (
          <div className="text-sm text-gray-500">Inga lästa böcker ännu – börja med att söka upp en bok 👇</div>
        ) : (
          <div className="flex items-stretch gap-3 overflow-x-auto no-scrollbar">
            {recentBooks.map((book: any, i: number) => (
              <div key={i} className="shrink-0">
                {book.cover ? (
                  <img src={book.cover} alt={book.title || 'Bokomslag'} className="w-24 aspect-[3/4] object-cover rounded-2xl shadow-md" />
                ) : (
                  <div className="w-24 aspect-[3/4] rounded-2xl bg-gray-200 shadow-inner flex items-center justify-center text-[11px] text-gray-500">Ingen bild</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Liten kul idé: “Dagens läsutmaning” */}
      <div className="w-full max-w-md mt-6 p-4 bg-white rounded-2xl shadow-sm">
        <p className="text-sm text-gray-700">
          🔖 <span className="font-semibold">Dagens läsutmaning:</span> Läs 10 minuter och berätta din favoritdel! Klara det? Ge en high five ✋
        </p>
      </div>
    </div>
  )
}