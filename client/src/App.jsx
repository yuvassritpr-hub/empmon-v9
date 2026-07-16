import { useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard.jsx'
import EmployeeDetail from './pages/EmployeeDetail.jsx'
import DailyTimeline from './pages/DailyTimeline.jsx'
import SocialAlerts from './pages/SocialAlerts.jsx'
import Login from './pages/Login.jsx'

const NAV = [
  { to: '/',       icon: '⊞', label: 'Dashboard'     },
  { to: '/daily',  icon: '⏱', label: 'Daily Timeline' },
  { to: '/alerts', icon: '⚠', label: 'Social Alerts'  },
]

function PrideGlobalLogo() {
  return (
    <svg width="180" height="54" viewBox="0 0 220 70" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="64" height="64" rx="4" stroke="#B8960C" strokeWidth="2.5" fill="none"/>
      <line x1="34" y1="2" x2="34" y2="66" stroke="#B8960C" strokeWidth="1.2"/>
      <line x1="2" y1="34" x2="66" y2="34" stroke="#B8960C" strokeWidth="1.2"/>
      <path d="M36 32 Q44 24 52 20" stroke="#B8960C" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <path d="M36 27 Q46 18 56 14" stroke="#B8960C" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <path d="M36 22 Q47 12 60 9"  stroke="#B8960C" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <circle cx="36" cy="33" r="2.2" fill="#B8960C"/>
      <path d="M18 28 C14 22 10 16 18 12 C26 8 28 16 24 22 Z" fill="#B8960C" opacity="0.85"/>
      <path d="M12 28 C8 22 6 14 14 10" stroke="#B8960C" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <circle cx="18" cy="28" r="2" fill="#B8960C"/>
      <path d="M6 42 Q12 38 18 42 Q24 46 30 42" stroke="#B8960C" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <path d="M6 49 Q12 45 18 49 Q24 53 30 49" stroke="#B8960C" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <path d="M6 56 Q12 52 18 56 Q24 60 30 56" stroke="#B8960C" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <path d="M38 38 C44 38 58 42 58 54 C58 62 48 64 42 58 C36 52 36 42 38 38 Z" fill="#B8960C" opacity="0.85"/>
      <text x="82" y="44" fontFamily="Georgia,'Times New Roman',serif" fontSize="34" fontWeight="700" fill="#4A1550" letterSpacing="2">PRIDE</text>
      <line x1="82" y1="56" x2="94" y2="56" stroke="#B8960C" strokeWidth="1.5"/>
      <text x="99" y="61" fontFamily="Georgia,'Times New Roman',serif" fontSize="13" fontWeight="500" fill="#4A1550" letterSpacing="3">GLOBAL</text>
      <line x1="170" y1="56" x2="182" y2="56" stroke="#B8960C" strokeWidth="1.5"/>
    </svg>
  )
}

function Sidebar({ onLogout }) {
  return (
    <aside style={{
      width: 220, minHeight: '100vh', background: 'var(--sidebar)',
      borderRight: '1px solid var(--border)', padding: '20px 0',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      position: 'fixed', top: 0, left: 0, zIndex: 100,
    }}>
      <div style={{ padding: '12px 14px 16px', borderBottom: '1px solid var(--border)' }}>
        <PrideGlobalLogo />
      </div>

      <nav style={{ padding: '16px 10px', flex: 1 }}>
        {NAV.map(n => (
          <NavLink key={n.to} to={n.to} end={n.to === '/'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', borderRadius: 8, marginBottom: 2,
              color: isActive ? '#fff' : 'var(--text-dim)',
              background: isActive ? '#7B3FA022' : 'transparent',
              fontWeight: isActive ? 600 : 400,
              textDecoration: 'none', fontSize: 13,
              borderLeft: isActive ? '3px solid #7B3FA0' : '3px solid transparent',
            })}>
            <span style={{ fontSize: 16 }}>{n.icon}</span>
            {n.label}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '14px 18px', borderTop: '1px solid var(--border)' }}>
        <button onClick={onLogout} style={{
          width: '100%', background: 'transparent', border: '1px solid var(--border)',
          color: 'var(--text-dim)', borderRadius: 8, padding: '7px',
          cursor: 'pointer', fontSize: 12, marginBottom: 8,
        }}>🚪 Logout</button>
        <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>
          v9.0 · {new Date().toLocaleDateString('en-IN')}
        </div>
      </div>
    </aside>
  )
}

export default function App() {
  const [auth, setAuth] = useState(!!localStorage.getItem('empmon_auth'))

  const logout = () => {
    localStorage.removeItem('empmon_auth')
    setAuth(false)
  }

  if (!auth) return <Login onLogin={() => setAuth(true)} />

  return (
    <BrowserRouter>
      <div style={{ display: 'flex' }}>
        <Sidebar onLogout={logout} />
        <main style={{ marginLeft: 220, flex: 1, minHeight: '100vh' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/employee/:username/:computer" element={<EmployeeDetail />} />
            <Route path="/daily" element={<DailyTimeline />} />
            <Route path="/alerts" element={<SocialAlerts />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
