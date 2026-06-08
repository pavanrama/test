import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { ArchitecturePage } from './pages/ArchitecturePage'
import { AccountingSuitePage } from './pages/AccountingSuitePage'
import { HomePage } from './pages/HomePage'
import { PricingPage } from './pages/PricingPage'

const navItems = [
  { path: '/', label: 'Home' },
  { path: '/architecture', label: 'Architecture' },
  { path: '/app', label: 'Accounting Suite' },
  { path: '/pricing', label: 'Pricing' },
]

function App() {
  return (
    <div className="site-shell">
      <header className="topbar">
        <div>
          <p className="brand-mark">Ledgerly</p>
          <p className="brand-subtitle">Bookkeeping + Accounting Platform</p>
        </div>
        <nav>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              end={item.path === '/'}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/architecture" element={<ArchitecturePage />} />
        <Route path="/app" element={<AccountingSuitePage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <footer className="footer">
        <p>
          Built as a complete accounting website blending best ideas from QuickBooks, Xero,
          FreshBooks, Wave, and Zoho Books.
        </p>
      </footer>
    </div>
  )
}

export default App
