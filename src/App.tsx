import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './pages/login'
import Home from './pages/home'
import BookSearch from './pages/bookSearch'
import ReadBooks from './pages/readBooks'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/boooksearch" element={<BookSearch />} />
        <Route path="/read" element={<ReadBooks />} />
      </Routes>
    </Router>
  )
}