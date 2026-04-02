import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Home from './pages/Home'
import Compiler from './pages/Compiler'
import ASTPage from './pages/ASTPage'
import History from './pages/History'
import Settings from './pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        <Sidebar />
        <main style={{ flex: 1, overflow: 'hidden', background: 'var(--bg)' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/compiler" element={<Compiler />} />
            <Route path="/ast" element={<ASTPage />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
