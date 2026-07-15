import { useState } from 'react'

const CREDS = { username: 'Employeemonitor', password: 'Admin@123' }

export default function Login({ onLogin }) {
  const [u, setU] = useState('')
  const [p, setP] = useState('')
  const [err, setErr] = useState('')
  const [show, setShow] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    if (u === CREDS.username && p === CREDS.password) {
      localStorage.setItem('empmon_auth', '1')
      onLogin()
    } else {
      setErr('Invalid username or password')
      setP('')
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0d1117',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#1c2128', border: '1px solid #30363d',
        borderRadius: 16, padding: '40px 44px', width: 380,
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>
        {/* Pride Global Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 8 }}>
            {/* Gold geometric icon */}
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect x="4" y="4" width="40" height="40" rx="6" fill="#C9A84C" opacity="0.15"/>
              <path d="M8 24 C8 14 14 8 24 8 C34 8 40 14 40 24" stroke="#C9A84C" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
              <path d="M12 28 C12 20 17 15 24 15 C31 15 36 20 36 28" stroke="#C9A84C" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
              <path d="M16 32 C16 26 19 22 24 22 C29 22 32 26 32 32" stroke="#C9A84C" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
              <line x1="8" y1="36" x2="40" y2="36" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round"/>
              <line x1="8" y1="40" x2="40" y2="40" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
            </svg>
            <div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#6B2D8B', letterSpacing: 3, lineHeight: 1 }}>PRIDE</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#C9A84C', letterSpacing: 6, marginTop: 2 }}>GLOBAL</div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: '#7d8590', marginTop: 4 }}>Employee Monitor · Activity Dashboard</div>
        </div>

        <form onSubmit={submit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: '#7d8590', display: 'block', marginBottom: 6, fontWeight: 600 }}>USERNAME</label>
            <input
              value={u} onChange={e => { setU(e.target.value); setErr('') }}
              placeholder="Enter username"
              autoComplete="username"
              style={{
                width: '100%', background: '#0d1117', border: '1px solid #30363d',
                borderRadius: 8, padding: '10px 14px', color: '#e6edf3',
                fontSize: 14, outline: 'none', boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = '#6B2D8B'}
              onBlur={e => e.target.style.borderColor = '#30363d'}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 12, color: '#7d8590', display: 'block', marginBottom: 6, fontWeight: 600 }}>PASSWORD</label>
            <div style={{ position: 'relative' }}>
              <input
                type={show ? 'text' : 'password'}
                value={p} onChange={e => { setP(e.target.value); setErr('') }}
                placeholder="Enter password"
                autoComplete="current-password"
                style={{
                  width: '100%', background: '#0d1117', border: '1px solid #30363d',
                  borderRadius: 8, padding: '10px 42px 10px 14px', color: '#e6edf3',
                  fontSize: 14, outline: 'none', boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = '#6B2D8B'}
                onBlur={e => e.target.style.borderColor = '#30363d'}
              />
              <span onClick={() => setShow(!show)} style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                cursor: 'pointer', color: '#7d8590', fontSize: 16, userSelect: 'none',
              }}>{show ? '🙈' : '👁'}</span>
            </div>
          </div>

          {err && (
            <div style={{
              background: '#f8514918', border: '1px solid #f8514944',
              borderRadius: 8, padding: '8px 12px', marginBottom: 16,
              color: '#f85149', fontSize: 13, textAlign: 'center',
            }}>{err}</div>
          )}

          <button type="submit" style={{
            width: '100%', background: 'linear-gradient(135deg, #6B2D8B, #8B3AAB)',
            border: 'none', borderRadius: 8, padding: '11px',
            color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
            letterSpacing: 0.5,
          }}>Sign In</button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: '#7d8590' }}>
          Pride Global · EmpMon v9.0
        </div>
      </div>
    </div>
  )
}
