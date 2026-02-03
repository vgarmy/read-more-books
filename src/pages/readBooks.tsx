export default function ReadBooks() {
  const books = JSON.parse(localStorage.getItem('readBooks') || '[]')

  return (
    <div className="min-h-screen flex flex-col items-center bg-pink-50 px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">Böcker jag har läst</h1>

      {books.length === 0 ? (
        <p>Du har inte markerat några böcker som lästa ännu.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-xl">
          {books.map((book: any, i: number) => (
            <div
              key={i}
              className="bg-white p-4 rounded-2xl shadow-lg flex flex-col items-center"
            >
              {book.cover ? (
                <img
                  src={book.cover}
                  alt={book.title}
                  className="w-32 h-40 object-cover mb-2 rounded-lg"
                />
              ) : (
                <div className="w-32 h-40 bg-gray-200 mb-2 rounded-lg flex items-center justify-center text-gray-500">
                  Ingen bild
                </div>
              )}
              <h2 className="font-bold text-center">{book.title}</h2>
              <p className="text-center text-gray-600">{book.author}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}