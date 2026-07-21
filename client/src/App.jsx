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
    <img src="/logo.jpg" alt="Pride Global" style={{ width: 180, height: 'auto', display: 'block' }} />
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
