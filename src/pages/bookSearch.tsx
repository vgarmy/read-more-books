import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import KidsNav from './components/kidsNav'
import { FaHome, FaSearch, FaBookOpen } from 'react-icons/fa'
import { supabase } from '../supabaseClient'

interface Book {
  title: string
  author?: string
  cover?: string
  freeUrl?: string
  isbn?: string
}

export default function BookSearch() {
  const [query, setQuery] = useState('')
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [alreadyReadKeys, setAlreadyReadKeys] = useState<Set<string>>(new Set())
  const navigate = useNavigate()

  // --- Hjälpare: punktuations/diakritik/whitespace-okänslig jämförelse ---
  const normalize = (s: string) =>
    (s || '')
      .toLowerCase()
      .normalize('NFKD')                // normalisera diakritik
      .replace(/[\p{P}\p{S}]+/gu, ' ')  // ta bort interpunktion/symboler → mellanslag
      .replace(/\s+/g, ' ')             // komprimera whitespace
      .trim()

  // --- Hjälpare: ta bort årtal ur skaparnamn (”1907-2002”, ”1907-”, parentessvarianter) ---
  const stripYears = (name: string) =>
    (name || '')
      .replace(/\s*\(\s*\d{3,4}\s*(?:-\s*\d{2,4})?\s*\)\s*/g, ' ')
      .replace(/,\s*\d{3,4}\s*(?:-\s*\d{2,4})?/g, '')
      .replace(/\s{2,}/g, ' ')
      .replace(/,\s*,/g, ',')
      .trim()

  // --- Nyckelbygge för "redan läst": ISBN om finns, annars title|author normaliserat ---
  const tinyNorm = (s?: string) =>
    (s ?? '').toLowerCase().normalize('NFKD').replace(/\s+/g, ' ').trim()

  const keyFor = (b: Book) => {
    if (b.isbn && b.isbn.trim() !== '') return `isbn:${b.isbn.trim()}`
    return `ta:${tinyNorm(b.title)}|${tinyNorm(b.author)}`
  }

  // --- Ladda redan lästa böcker för inloggat barn ---
  useEffect(() => {
    const loadAlreadyRead = async () => {
      const childStr = localStorage.getItem('loggedChild')
      const child = childStr ? JSON.parse(childStr) : null
      if (!child?.id) return

      const { data, error } = await supabase
        .from('child_read_books')
        .select(`
          books:book_id (
            isbn, title, author
          )
        `)
        .eq('child_id', child.id)

      if (error) {
        console.warn('[loadAlreadyRead] error:', error)
        return
      }

      const next = new Set<string>()
      for (const row of (data as any[] || [])) {
        let b = row?.books
        // Defensive: om relationen skulle komma som array, ta första
        if (Array.isArray(b)) b = b[0]
        if (!b) continue

        const k =
          b?.isbn && String(b.isbn).trim() !== ''
            ? `isbn:${String(b.isbn).trim()}`
            : `ta:${tinyNorm(String(b.title))}|${tinyNorm(String(b.author))}`
        next.add(k)
      }
      setAlreadyReadKeys(next)
    }

    loadAlreadyRead()
  }, [])

  const handleSearch = async () => {
    if (!query) return
    setLoading(true)
    setError('')
    setBooks([])

    try {
      const q = `${query}*`

      const response = await fetch(
        `https://libris.kb.se/xsearch?query=${encodeURIComponent(q)}&format=json&start=1&n=200`
      )

      const data = await response.json()
      const list = data?.xsearch?.list || []

      // Behåll: endast böcker på svenska
      const bookRecords = list.filter(
        (rec: any) => rec.type === 'book' && rec.language === 'swe'
      )

      if (bookRecords.length === 0) {
        setError('Inga böcker hittades')
        setLoading(false)
        return
      }

      const results: Book[] = bookRecords
        .map((rec: any) => {
          const lbId = rec.identifier?.replace('http://libris.kb.se/bib/', '')
          let isbn: string | undefined
          if (rec.isbn) isbn = Array.isArray(rec.isbn) ? rec.isbn[0] : rec.isbn

          let coverUrl: string | undefined
          if (isbn) {
            coverUrl = `https://xinfo.libris.kb.se/xinfo/getxinfo?identifier=/PICTURE/bokrondellen/isbn/${isbn}/${isbn}.jpg/record`
          } else if (lbId) {
            coverUrl = `https://xinfo.libris.kb.se/xinfo/getxinfo?identifier=/PICTURE/tomasgift/libris-bib/${lbId}/${lbId}/record`
          }

          const rawCreator = rec.creator ?? rec.publisher?.[0] ?? 'Ingen författare'
          const cleanedAuthor = Array.isArray(rawCreator)
            ? rawCreator.map(stripYears).join(' ; ')
            : stripYears(rawCreator)

          return {
            title: rec.title || 'Ingen titel',
            author: cleanedAuthor,
            cover: coverUrl,
            freeUrl: rec?.free?.[0] || undefined,
            isbn,
          }
        })
        .filter((book: Book & { cover: string }) => !!book.cover)
        .filter((book: Book & { cover: string }) => {
          const qNorm = normalize(query)
          const titleNorm = normalize(book.title || '')
          const authorNorm = normalize(book.author || '')

          const titleMatch = titleNorm.includes(qNorm)
          const qParts = qNorm.split(' ').filter(Boolean)
          const authorMatch =
            qParts.length > 0 && qParts.every(part => authorNorm.includes(part))

          return titleMatch || authorMatch
        })

      if (results.length === 0) {
        setError('Inga böcker hittades')
      }

      setBooks(results)
    } catch (err) {
      console.error(err)
      setError('Ett fel uppstod vid sökningen')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkRead = async (book: Book) => {
    // Inloggat barn
    const childStr = localStorage.getItem('loggedChild')
    const child = childStr ? JSON.parse(childStr) : null
    if (!child?.id) {
      alert('Inget barn är inloggat – logga in först.')
      return
    }

    // Redan läst? Avsluta direkt
    const k = keyFor(book)
    if (alreadyReadKeys.has(k)) {
      alert('Den här boken är redan markerad som läst.')
      return
    }

    try {
      // 1) Försök hitta bok via ISBN först (om finns)
      let bookId: string | undefined

      if (book.isbn && book.isbn.trim() !== '') {
        const { data: byIsbn } = await supabase
          .from('books')
          .select('id')
          .eq('isbn', book.isbn)
          .maybeSingle()
        if (byIsbn) bookId = byIsbn.id
      }

      // 2) Om ingen ISBN-match, (title, author)
      if (!bookId) {
        const base = supabase.from('books').select('id').eq('title', book.title).limit(1)
        const { data: byTitleAuthor } =
          book.author == null
            ? await base.is('author', null).maybeSingle()
            : await base.eq('author', book.author).maybeSingle()
        if (byTitleAuthor) bookId = byTitleAuthor.id
      }

      // 3) Skapa boken om den inte finns
      if (!bookId) {
        const { data: created, error: createErr } = await supabase
          .from('books')
          .insert({
            title: book.title,
            author: book.author,
            isbn: book.isbn,
            cover: book.cover,
            free_url: book.freeUrl,
          })
          .select('id')
          .single()

        if (createErr || !created) {
          console.error(createErr)
          alert('Kunde inte spara boken.')
          return
        }
        bookId = created.id
      }

      // 4) Koppla barn ↔ bok (idempotent), sätt read_at explicit
      const nowIso = new Date().toISOString()
      const { error: linkErr } = await supabase
        .from('child_read_books')
        .upsert(
          { child_id: child.id, book_id: bookId, read_at: nowIso },
          { onConflict: 'child_id,book_id', ignoreDuplicates: true }
        )

      if (linkErr) {
        console.error('[child_read_books upsert] error:', linkErr)
        alert('Boken är redan markerad som läst, eller så uppstod ett fel.')
        return
      }

      // ✅ Lägg till nyckeln så knappen uppdateras till "Redan läst"
      setAlreadyReadKeys(prev => {
        const next = new Set(prev)
        next.add(k)
        return next
      })

      alert(`Boken "${book.title}" sparad som läst!`)
    } catch (e) {
      console.error(e)
      alert('Ett fel uppstod vid sparandet.')
    }
  }

  // Menylänkar för denna sida: Home, BookSearch, ReadBooks
  const menuItems = [
    { to: '/home', label: 'Hem', icon: <FaHome /> },
    { to: '/booksearch', label: 'Sök efter böcker', icon: <FaSearch /> },
    { to: '/read', label: 'Böcker jag har läst', icon: <FaBookOpen /> },
  ]

  return (
    <div className="min-h-screen bg-pink-100">
      <KidsNav items={menuItems} title="VI LÄSER!" />
      <div className="flex flex-col items-center px-4 py-6">
        <h1 className="text-3xl font-bold mb-6">Sök efter böcker</h1>

        <div className="flex w-full max-w-md mb-4 gap-2">
          <input
            type="text"
            placeholder="Skriv titel eller författare"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 px-4 py-3 text-black placeholder:text-gray-500 bg-white border-2 border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={handleSearch}
            className="bg-blue-400 text-white px-4 py-3 rounded-xl font-semibold hover:bg-blue-500 transition-colors"
          >
            Sök
          </button>
        </div>

        {loading && <p>Laddar...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {/* MOBIL: alltid 2 per rad */}
        <div className="grid grid-cols-2 gap-4 w-full mt-4 px-1">
          {books.map((book, i) => {
            const isRead = alreadyReadKeys.has(keyFor(book))
            return (
              <div
                key={i}
                className="bg-white p-3 rounded-xl shadow flex flex-col items-center"
              >
                {book.cover ? (
                  <img
                    src={book.cover}
                    alt={book.title}
                    className="w-full aspect-[3/4] object-cover rounded-lg mb-2"
                    onError={() => {
                      // Ta bort boken från listan om bilden inte laddas
                      setBooks(prev => prev.filter((_, idx) => idx !== i))
                    }}
                  />
                ) : (
                  <div className="w-full aspect-[3/4] bg-gray-200 rounded-lg mb-2 flex items-center justify-center text-gray-500 text-sm">
                    Ingen bild
                  </div>
                )}

                <p className="font-semibold text-center text-sm text-gray-700 leading-tight line-clamp-2">
                  {book.title}
                </p>
                <p className="text-xs text-center text-gray-500 line-clamp-1">
                  {book.author}
                </p>

                {book.freeUrl && (
                  <a
                    href={book.freeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 text-xs text-blue-500 underline"
                  >
                    Se online
                  </a>
                )}

                {isRead ? (
                  <button
                    disabled
                    className="mt-2 w-full bg-gray-300 text-gray-600 text-xs py-1.5 rounded-lg cursor-not-allowed"
                    title="Den här boken är redan markerad som läst"
                  >
                    Redan läst
                  </button>
                ) : (
                  <button
                    onClick={() => handleMarkRead(book)}
                    className="mt-2 w-full bg-green-400 text-white text-xs py-1.5 rounded-lg hover:bg-green-500"
                  >
                    Jag har läst
                  </button>
                )}
              </div>
            )
          })}
        </div>

        <button
          onClick={() => navigate('/read')}
          className="mt-6 bg-purple-400 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-500 transition-colors"
        >
          Se lästa böcker
        </button>
      </div>
    </div>
  )
}