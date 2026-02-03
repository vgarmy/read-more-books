export default function ReadBooks() {
  const books = JSON.parse(localStorage.getItem('readBooks') || '[]')

  return (
    <div className="min-h-screen bg-pink-50 px-4 py-6">
      <h1 className="text-2xl text-gray-600 font-extrabold text-center mb-6">
        Böcker jag har läst
      </h1>

      {books.length === 0 ? (
        <p className="text-center text-gray-600">
          Du har inte markerat några böcker som lästa ännu.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {books.map((book: any, i: number) => (
            <div
              key={i}
              className="bg-white rounded-2xl shadow-md p-3 flex flex-col"
            >
              {/* Omslag */}
              {book.cover ? (
                <img
                  src={book.cover}
                  alt={book.title}
                  className="w-full aspect-[3/4] object-cover rounded-xl mb-2"
                />
              ) : (
                <div className="w-full aspect-[3/4] bg-gray-200 rounded-xl mb-2 flex items-center justify-center text-sm text-gray-500">
                  Ingen bild
                </div>
              )}

              {/* Titel */}
              <h2 className="text-sm text-gray-500 font-bold leading-tight line-clamp-2">
                {book.title}
              </h2>

              {/* Författare */}
              <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                {book.author}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}