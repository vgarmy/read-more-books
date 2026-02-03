import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

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
    const navigate = useNavigate()

    const handleSearch = async () => {
        if (!query) return
        setLoading(true)
        setError('')
        setBooks([])

        try {
            const response = await fetch(
                `https://libris.kb.se/xsearch?query=TIT:"${encodeURIComponent(query)}"&format=json&from=1&to=50`
            )
            const data = await response.json()
            const list = data?.xsearch?.list || []

            // Filtrera så att endast poster med exakt type "book" visas
            const bookRecords = list.filter((rec: any) =>
                rec.type === 'book' && rec.language === 'swe'
            )

            if (bookRecords.length === 0) {
                setError('Inga böcker hittades')
                setLoading(false)
                return
            }
            const results: Book[] = bookRecords
                .map((rec: any) => {
                    let coverUrl: string | undefined
                    const lbId = rec.identifier?.replace('http://libris.kb.se/bib/', '')
                    let isbn: string | undefined
                    if (rec.isbn) isbn = Array.isArray(rec.isbn) ? rec.isbn[0] : rec.isbn

                    if (isbn) {
                        coverUrl = `https://xinfo.libris.kb.se/xinfo/getxinfo?identifier=/PICTURE/bokrondellen/isbn/${isbn}/${isbn}.jpg/record`
                    } else if (lbId) {
                        coverUrl = `https://xinfo.libris.kb.se/xinfo/getxinfo?identifier=/PICTURE/tomasgift/libris-bib/${lbId}/${lbId}/record`
                    }

                    return {
                        title: rec.title || 'Ingen titel',
                        author: rec.creator || rec.publisher?.[0] || 'Ingen författare',
                        cover: coverUrl,
                        freeUrl: rec?.free?.[0] || undefined,
                        isbn,
                    }
                })
                .filter(
                    (book: Book): book is Book & { cover: string } =>
                        typeof book.cover === 'string' && book.cover.length > 0
                )


            setBooks(results)
        } catch (err) {
            console.error(err)
            setError('Ett fel uppstod vid sökningen')
        } finally {
            setLoading(false)
        }
    }

    const handleMarkRead = (book: Book) => {
        const saved = JSON.parse(localStorage.getItem('readBooks') || '[]')
        if (!saved.some((b: Book) => b.title === book.title && b.author === book.author)) {
            localStorage.setItem('readBooks', JSON.stringify([...saved, book]))
            alert(`Boken "${book.title}" sparad som läst!`)
        } else {
            alert(`Du har redan markerat "${book.title}" som läst.`)
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center bg-yellow-50 px-4 py-6">
            <h1 className="text-3xl font-bold mb-6">Sök efter böcker</h1>

            <div className="flex w-full max-w-md mb-4 gap-2">
                <input
                    type="text"
                    placeholder="Skriv titel eller författare"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="flex-1 px-4 py-3 text-black border-2 border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-xl mt-4">
                {books.map((book, i) => (
                    <div
                        key={i}
                        className="bg-white p-4 rounded-2xl shadow-lg flex flex-col items-center"
                    >
                        {book.cover ? (
                            <img
                                src={book.cover}
                                alt={book.title}
                                className="w-32 h-40 object-cover mb-2 rounded-lg"
                                onError={() => {
                                    // Ta bort boken från listan om bilden inte laddas
                                    setBooks(prev => prev.filter((_, idx) => idx !== i))
                                }}
                            />
                        ) : (
                            <div className="w-32 h-40 bg-gray-200 mb-2 rounded-lg flex items-center justify-center text-gray-500">
                                Ingen bild
                            </div>
                        )}
                        <p className="font-bold text-center text-gray-600">{book.title}</p>
                        <p className="text-center text-gray-600">{book.author}</p>
                        {book.freeUrl && (
                            <a
                                href={book.freeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1 text-sm text-blue-500 underline"
                            >
                                Se online
                            </a>
                        )}
                        <button
                            onClick={() => handleMarkRead(book)}
                            className="mt-2 bg-green-400 text-white px-4 py-2 rounded-xl hover:bg-green-500 transition-colors"
                        >
                            Jag har läst
                        </button>
                    </div>
                ))}
            </div>


            <button
                onClick={() => navigate('/read')}
                className="mt-6 bg-purple-400 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-500 transition-colors"
            >
                Se lästa böcker
            </button>
        </div>
    )
}