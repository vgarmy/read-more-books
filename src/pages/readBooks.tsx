import { useEffect, useMemo, useState } from 'react'
import KidsNav from './components/kidsNav'
import { FaHome, FaSearch, FaBookOpen } from 'react-icons/fa'
import { supabase } from '../supabaseClient'

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

type ReadItem = {
  read_at: string
  books: BookRow | null
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
            id, title, author, cover, isbn, free_url
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

  const menuItems = [
    { to: '/home', label: 'Hem', icon: <FaHome /> },
    { to: '/booksearch', label: 'Sök efter böcker', icon: <FaSearch /> },
    { to: '/read', label: 'Böcker jag har läst', icon: <FaBookOpen /> },
  ]

  return (
    <div className="min-h-screen bg-pink-100">
      <KidsNav items={menuItems} title="VI LÄSER!" />
      <div className="px-4 py-6">
        <h1 className="text-2xl text-gray-600 font-extrabold text-center mb-6">Böcker jag har läst</h1>

        {loading && <p className="text-center text-gray-600">Laddar...</p>}
        {!loading && error && <p className="text-center text-red-500">{error}</p>}
        {!loading && !error && books.length === 0 && (
          <p className="text-center text-gray-600">Du har inte markerat några böcker som lästa ännu.</p>
        )}

        {!loading && !error && books.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            {books.map((book) => (
              <div key={book.id} className="bg-white rounded-2xl shadow-md p-3 flex flex-col">
                {book.cover ? (
                  <img src={book.cover} alt={book.title ?? 'Bokomslag'} className="w-full aspect-[3/4] object-cover rounded-md mb-2" />
                ) : (
                  <div className="w-full aspect-[3/4] bg-gray-200 rounded-xl mb-2 flex items-center justify-center text-sm text-gray-500">
                    Ingen bild
                  </div>
                )}
                <h2 className="text-sm text-gray-700 font-bold leading-tight line-clamp-2">{book.title}</h2>
                <p className="text-xs text-gray-500 mt-1 line-clamp-1">{book.author}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}