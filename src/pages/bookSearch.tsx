import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import KidsNav from './components/kidsNav'
import { FaHome, FaSearch, FaBookOpen, FaSignOutAlt, FaStar, FaRegStar, FaTimes } from 'react-icons/fa'
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
  const [modalBook, setModalBook] = useState<Book | null>(null)
  const [rating, setRating] = useState(0)
  const navigate = useNavigate()
  const [modalVisible, setModalVisible] = useState(false)

  // Show modal with animation
  useEffect(() => {
    if (modalBook) setTimeout(() => setModalVisible(true), 10)
  }, [modalBook])

  const closeModal = () => {
    setModalVisible(false)           // triggers slide-down
    setTimeout(() => {
      setModalBook(null)             // unmount after animation
      setRating(0)
    }, 300) // match Tailwind transition duration
  }

  const normalize = (s: string): string =>
    (s || '').toLowerCase().normalize('NFKD').replace(/[\p{P}\p{S}]+/gu, ' ').replace(/\s+/g, ' ').trim()

  const stripYears = (name: string): string =>
    (name || '').replace(/\s*\(\s*\d{3,4}\s*(?:-\s*\d{2,4})?\s*\)\s*/g, ' ').replace(/,\s*\d{3,4}\s*(?:-\s*\d{2,4})?/g, '').replace(/\s{2,}/g, ' ').replace(/,\s*,/g, ',').trim()

  const tinyNorm = (s?: string): string => (s ?? '').toLowerCase().normalize('NFKD').replace(/\s+/g, ' ').trim()

  const keyFor = (b: Book): string => {
    if (b.isbn && b.isbn.trim() !== '') return `isbn:${b.isbn.trim()}`
    return `ta:${tinyNorm(b.title)}|${tinyNorm(b.author)}`
  }

  useEffect(() => {
    const loadAlreadyRead = async () => {
      const childStr = localStorage.getItem('loggedChild')
      const child = childStr ? JSON.parse(childStr) : null
      if (!child?.id) return

      const { data, error } = await supabase
        .from('child_read_books')
        .select(`books:book_id ( isbn, title, author )`)
        .eq('child_id', child.id)

      if (error) {
        console.warn('[loadAlreadyRead] error:', error)
        return
      }

      const next = new Set<string>()
      for (const row of (data as any[] || [])) {
        let b = row?.books
        if (Array.isArray(b)) b = b[0]
        if (!b) continue
        const k = b?.isbn && String(b.isbn).trim() !== '' ? `isbn:${String(b.isbn).trim()}` : `ta:${tinyNorm(String(b.title))}|${tinyNorm(String(b.author))}`
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
      const response = await fetch(`https://libris.kb.se/xsearch?query=${encodeURIComponent(q)}&format=json&start=1&n=200`)
      const data = await response.json()
      const list = data?.xsearch?.list || []

      const bookRecords = list.filter((rec: any) => rec.type === 'book' && rec.language === 'swe')
      if (bookRecords.length === 0) {
        setError('Inga böcker hittades')
        setLoading(false)
        return
      }

      const results: Book[] = bookRecords
        .map((rec: any): Book => {
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
          const cleanedAuthor = Array.isArray(rawCreator) ? rawCreator.map(stripYears).join(' ; ') : stripYears(rawCreator)

          return { title: rec.title || 'Ingen titel', author: cleanedAuthor, cover: coverUrl, freeUrl: rec?.free?.[0] || undefined, isbn }
        })
        .filter((book: Book) => !!book.cover)
        .filter((book: Book) => {
          const qNorm = normalize(query)
          const titleNorm = normalize(book.title || '')
          const authorNorm = normalize(book.author || '')
          const titleMatch = titleNorm.includes(qNorm)
          const qParts = qNorm.split(' ').filter(Boolean)
          const authorMatch = qParts.length > 0 && qParts.every(part => authorNorm.includes(part))
          return titleMatch || authorMatch
        })

      if (results.length === 0) setError('Inga böcker hittades')
      setBooks(results)
    } catch (err) {
      console.error(err)
      setError('Ett fel uppstod vid sökningen')
    } finally {
      setLoading(false)
    }
  }

  const submitRating = async () => {
    if (!modalBook) return
    if (rating < 1 || rating > 5) {
      alert('Du måste sätta ett betyg mellan 1 och 5 stjärnor')
      return
    }

    const childStr = localStorage.getItem('loggedChild')
    const child = childStr ? JSON.parse(childStr) : null
    if (!child?.id) return

    try {
      let bookId: string | undefined

      if (modalBook.isbn && modalBook.isbn.trim() !== '') {
        const { data: byIsbn } = await supabase.from('books').select('id').eq('isbn', modalBook.isbn).maybeSingle()
        if (byIsbn) bookId = byIsbn.id
      }

      if (!bookId) {
        const base = supabase.from('books').select('id').eq('title', modalBook.title).limit(1)
        const { data: byTitleAuthor } =
          modalBook.author == null
            ? await base.is('author', null).maybeSingle()
            : await base.eq('author', modalBook.author).maybeSingle()
        if (byTitleAuthor) bookId = byTitleAuthor.id
      }

      if (!bookId) {
        const { data: created, error: createErr } = await supabase.from('books').insert({ title: modalBook.title, author: modalBook.author, isbn: modalBook.isbn, cover: modalBook.cover, free_url: modalBook.freeUrl, betyg: rating }).select('id').single()
        if (createErr || !created) throw createErr
        bookId = created.id
      } else {
        await supabase.from('books').update({ betyg: rating }).eq('id', bookId)
      }

      const nowIso = new Date().toISOString()
      await supabase.from('child_read_books').upsert({ child_id: child.id, book_id: bookId, read_at: nowIso }, { onConflict: 'child_id,book_id', ignoreDuplicates: true })

      setAlreadyReadKeys(prev => {
        const next = new Set(prev)
        next.add(keyFor(modalBook))
        return next
      })

      alert(`Boken "${modalBook.title}" sparad som läst med betyg ${rating}!`)
      closeModal() // slide down modal
    } catch (e) {
      console.error(e)
      alert('Ett fel uppstod vid sparandet.')
    }
  }

  const handleLogout = async () => {
    try { await supabase.auth.signOut() } catch (e) { console.error(e) } finally {
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
      <div className="flex flex-col items-center px-8 pb-10">
        <h1 className="text-4xl font-extrabold text-center text-purple-600 mb-6">Sök efter böcker</h1>

        <div className="flex w-full max-w-md mb-4 flex-col gap-3">
          <input type="text" placeholder="Skriv titel eller författare" value={query} onChange={e => setQuery(e.target.value)} className="w-full px-4 py-3 text-black placeholder:text-gray-500 bg-white border-2 border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
        <div className="relative inline-block w-full max-w-md">
          <button
            onClick={async () => { if (!loading) await handleSearch(); }}
            disabled={loading}
            aria-busy={loading}
            aria-disabled={loading}
            aria-live="polite"
            className="relative z-10 inline-flex w-full items-center justify-center gap-2 font-own font-bold uppercase tracking-[0.8px] text-xl leading-5 px-4 py-[13px] rounded-2xl bg-blue-400 text-white transition duration-200 hover:brightness-110 active:translate-y-[1px] shadow-md select-none focus:outline-none disabled:cursor-not-allowed disabled:opacity-80 active:[&+span]:translate-y-[1px]"
          >
            {loading ? (
              <>
                <span className="inline-block h-4 w-4 rounded-full border-2 border-white/80 border-t-transparent animate-spin"></span>
                Laddar
              </>
            ) : (
              <>
                <FaSearch size={18} />
                Sök
              </>
            )}
          </button>
          <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 bottom-[-4px] rounded-2xl bg-blue-300 transition-transform duration-150"></span>
        </div>

        {error && <p className="text-red-500 mt-4">{error}</p>}

        <div className="grid grid-cols-2 gap-4 w-full mt-4 px-1">
          {books.map((book, i) => {
            const isRead = alreadyReadKeys.has(keyFor(book))
            return (
              <div key={i} className="bg-white p-3 rounded-xl shadow flex flex-col items-center">
                {book.cover ? <img src={book.cover} alt={book.title} className="w-full aspect-[3/4] object-cover rounded-lg mb-2" onError={() => setBooks(prev => prev.filter((_, idx) => idx !== i))} /> : <div className="w-full aspect-[3/4] bg-gray-200 rounded-lg mb-2 flex items-center justify-center text-gray-500 text-sm">Ingen bild</div>}
                <p className="font-semibold text-center text-sm text-gray-700 leading-tight line-clamp-2">{book.title}</p>
                <p className="text-xs text-center text-gray-500 line-clamp-1">{book.author}</p>
                {book.freeUrl && <a href={book.freeUrl} target="_blank" rel="noopener noreferrer" className="mt-1 text-xs text-blue-500 underline">Se online</a>}
                {isRead ? <button disabled className="mt-2 w-full bg-gray-300 text-gray-600 text-xs py-1.5 rounded-lg cursor-not-allowed">Redan läst</button> : <button onClick={() => setModalBook(book)} className="mt-2 w-full bg-green-400 text-white text-xs py-1.5 rounded-lg hover:bg-green-500">Jag har läst</button>}
              </div>
            )
          })}
        </div>

        <div className="relative inline-block mt-6 w-full">
          <button onClick={() => navigate('/read-more-books/read')} className="relative z-10 gap-2 w-full inline-flex items-center justify-center font-own font-bold uppercase tracking-[0.8px] text-xl leading-5 px-6 py-[13px] rounded-2xl bg-purple-400 text-white transition duration-200 hover:brightness-110 active:translate-y-[1px] shadow-md select-none focus:outline-none active:[&+span]:translate-y-[1px]">
            <FaBookOpen size={18} />
            Se lästa böcker</button>
          <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 bottom-[-4px] rounded-2xl bg-purple-300 transition-transform duration-150"></span>
        </div>
        {/* MODAL */}
        {modalBook && (
          <div className={`fixed inset-0 flex items-center justify-center bg-black/75 z-50 p-10 transition-opacity duration-300 ${modalVisible ? 'opacity-100' : 'opacity-0'}`}>
            <div className={`bg-white rounded-xl p-8 max-w-sm w-full relative transform transition-transform duration-300 ${modalVisible ? 'translate-y-0' : '-translate-y-full'}`}>
              <button onClick={closeModal} className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"><FaTimes size={20} /></button>
              {modalBook.cover ? <img src={modalBook.cover} alt={modalBook.title} className="w-full aspect-[3/4] object-cover rounded-lg mb-2" /> : <div className="w-full aspect-[3/4] bg-gray-200 rounded-lg mb-2 flex items-center justify-center text-gray-500 text-sm">Ingen bild</div>}
              <h2 className="text-2xl font-bold mb-2 text-gray-600">{modalBook.title}</h2>
              <p className="text-lg text-gray-600 mb-4">{modalBook.author}</p>
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => i < rating ? <FaStar size={50} key={i} className="text-yellow-400 cursor-pointer" onClick={() => setRating(i + 1)} /> : <FaRegStar size={50} key={i} className="text-gray-300 cursor-pointer" onClick={() => setRating(i + 1)} />)}
              </div>
              <button onClick={submitRating} className="w-full bg-blue-400 text-white py-2 rounded-lg hover:bg-blue-500 transition-colors">Spara som läst</button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
