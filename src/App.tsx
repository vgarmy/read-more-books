// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Login from './pages/login'
import Home from './pages/home'
import BookSearch from './pages/bookSearch'
import ReadBooks from './pages/readBooks'
import VarforLasa from './pages/varforLasa'

// Simple login check
const isAuthenticated = () => !!localStorage.getItem('user')

// PrivateRoute wrapper
const PrivateRoute = ({ children }: { children: any }) => {
  const loggedIn = isAuthenticated()
  const location = useLocation()

  if (!loggedIn) {
    // Redirect to login, remember attempted page, replace history
    return <Navigate to="/read-more-books/" state={{ from: location }} replace />
  }

  return children
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/read-more-books/" element={<Login />} />
        <Route path="/read-more-books/varforlasa" element={<ReadBooks />} />

        {/* Protected routes */}
        <Route
          path="/read-more-books/home"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />
        <Route
          path="/read-more-books/read"
          element={
            <PrivateRoute>
              <VarforLasa />
            </PrivateRoute>
          }
        />
        <Route
          path="/read-more-books/booksearch"
          element={
            <PrivateRoute>
              <BookSearch />
            </PrivateRoute>
          }
        />

        {/* Optional: catch-all redirects any unknown route to login */}
        <Route path="*" element={<Navigate to="/read-more-books/" replace />} />
      </Routes>
    </Router>
  )
}