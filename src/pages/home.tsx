import { useNavigate } from 'react-router-dom'

export default function Home() {
  const child = localStorage.getItem('loggedChild')
  const childData = child ? JSON.parse(child) : null
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-pink-100 px-4">
      <h1 className="text-3xl font-bold mb-4">
        Välkommen {childData?.name || 'Barnet'}!
      </h1>
      <p className="text-lg text-center mb-6">
        Här kan ni börja läsa och ha kul tillsammans.
      </p>

      <button
        onClick={() => navigate('/boooksearch')}
        className="bg-blue-400 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-500 transition-colors shadow-lg"
      >
        Sök böcker
      </button>
    </div>
  )
}