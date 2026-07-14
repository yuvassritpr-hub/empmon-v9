import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import Dashboard from './pages/Dashboard.jsx'
import EmployeeDetail from './pages/EmployeeDetail.jsx'
import DailyTimeline from './pages/DailyTimeline.jsx'
import SocialAlerts from './pages/SocialAlerts.jsx'

const NAV = [
  { to: '/',        icon: '⊞', label: 'Dashboard'      },
  { to: '/daily',   icon: '⏱', label: 'Daily Timeline'  },
  { to: '/alerts',  icon: '⚠', label: 'Social Alerts'   },
]

function Sidebar() {
  return (
    <aside style={{
      width: 220, minHeight: '100vh', background: 'var(--sidebar)',
      borderRight: '1px solid var(--border)', padding: '20px 0', boxShadow: '2px 0 8px rgba(0,0,0,0.06)',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      position: 'fixed', top: 0, left: 0, zIndex: 100,
    }}>
      <div style={{ padding: '0 20px 24px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>🛡️ EmpMon</div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>W-SAFE REINSURANCE</div>
      </div>
      <nav style={{ padding: '16px 10px', flex: 1 }}>
        {NAV.map(n => (
          <NavLink key={n.to} to={n.to} end={n.to === '/'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', borderRadius: 8, marginBottom: 2,
              color: isActive ? '#fff' : 'var(--text-dim)',
              background: isActive ? 'var(--accent)22' : 'transparent',
              fontWeight: isActive ? 600 : 400,
              textDecoration: 'none', fontSize: 13,
              borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
            })}>
            <span style={{ fontSize: 16 }}>{n.icon}</span>
            {n.label}
          </NavLink>
        ))}
      </nav>
      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text-dim)' }}>
        v9.0 · {new Date().toLocaleDateString('en-IN')}
      </div>
    </aside>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex' }}>
        <Sidebar />
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
