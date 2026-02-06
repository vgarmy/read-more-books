import { useEffect, useMemo, useState } from 'react'
import KidsNav from './components/kidsNav'
import { FaHome, FaSearch, FaBookOpen, FaStar, FaRegStar, FaSignOutAlt, FaTrash } from 'react-icons/fa'
import { supabase } from '../supabaseClient'

type BookRow = {
  id: string
  title: string
  author?: string | null
  cover?: string | null
  isbn?: string | null
  free_url?: string | null
  betyg: number
}

type RawReadRow = {
  read_at: string
  books: BookRow | BookRow[] | null
}

type ReadItem = {
  read_at: string
  books: BookRow | null
}




function StarRating({ rating }: { rating: number }) {
  const max = 5
  return (
    <div className="flex items-center gap-1" aria-label={`Betyg ${rating} av 5`}>
      {Array.from({ length: max }).map((_, i) =>
        i < rating ? (
          <FaStar key={i} className="text-yellow-400" />
        ) : (
          <FaRegStar key={i} className="text-gray-300" />
        )
      )}
    </div>
  )
}


export default function ReadBooks() {
  const [items, setItems] = useState<ReadItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const childStr = localStorage.getItem('loggedChild')
  const child = childStr ? JSON.parse(childStr) : null


  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (!child?.id) {
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
            id, title, author, cover, isbn, free_url, betyg
          )
        `)
        .eq('child_id', child.id)
        .order('read_at', { ascending: false })

      if (cancelled) return

      if (error) {
        console.error(error)
        setError('Kunde inte hämta lästa böcker.')
      } else {
        const rows = (data ?? []) as RawReadRow[]
        const normalized: ReadItem[] = rows.map(r => {
          const b = Array.isArray(r.books) ? (r.books[0] ?? null) : r.books ?? null
          return { read_at: r.read_at, books: b }
        })
        setItems(normalized.filter(r => !!r.books))
      }
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [child?.id])

  const books = useMemo(() => items.map(i => i.books!).filter(Boolean), [items])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.error('Logout error', e)
    } finally {
      // Clear all user-related storage
      localStorage.removeItem('loggedChild')
      localStorage.removeItem('user') // important for PrivateRoute

      // Completely replace history entry so back button can't return
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
      <div className="px-8 pb-10">
        <h1 className="text-4xl font-extrabold text-center text-purple-600 mb-6">Böcker jag har läst</h1>

        {loading && <p className="text-center text-gray-600">Laddar...</p>}
        {!loading && error && <p className="text-center text-red-500">{error}</p>}
        {!loading && !error && books.length === 0 && (
          <p className="text-center text-gray-600">Du har inte markerat några böcker som lästa ännu.</p>
        )}

        {!loading && !error && books.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            {books.map((book) => (
              <div key={book.id} className="bg-white rounded-2xl shadow-md p-3 flex flex-col relative">
                {/* REMOVE BUTTON */}
                <button
                  onClick={async () => {
                    if (!child?.id) return
                    const confirmDelete = window.confirm(`Vill du ta bort "${book.title}" från lästa böcker?`)
                    if (!confirmDelete) return

                    try {
                      const { error } = await supabase
                        .from('child_read_books')
                        .delete()
                        .eq('child_id', child.id)
                        .eq('book_id', book.id)

                      if (error) {
                        console.error(error)
                        alert('Kunde inte ta bort boken.')
                        return
                      }

                      setItems(prev => prev.filter(i => i.books?.id !== book.id))
                    } catch (e) {
                      console.error(e)
                      alert('Ett fel uppstod vid borttagning.')
                    }
                  }}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                  title="Ta bort bok"
                >
                  <FaTrash />
                </button>

                {book.cover ? (
                  <img src={book.cover} alt={book.title ?? 'Bokomslag'} className="w-full aspect-[3/4] object-cover rounded-md mb-2" />
                ) : (
                  <div className="w-full aspect-[3/4] bg-gray-200 rounded-xl mb-2 flex items-center justify-center text-sm text-gray-500">
                    Ingen bild
                  </div>
                )}
                <h2 className="text-sm text-gray-700 font-bold leading-tight line-clamp-2">{book.title}</h2>
                <p className="text-xs text-gray-500 mt-1 line-clamp-1">{book.author}</p>
                <div className="flex items-center gap-1 mt-1">
                  <StarRating rating={book.betyg} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}