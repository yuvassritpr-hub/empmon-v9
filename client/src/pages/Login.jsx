import { useState } from 'react'

const CREDS = { username: 'Employeemonitor', password: 'Admin@123' }

function PrideGlobalLogo() {
  return (
    <img src="/logo.jpg" alt="Pride Global" style={{ width: 200, height: 'auto', display: 'block', margin: '0 auto' }} />
  )
}

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
      flexDirection: 'column', gap: 32,
    }}>
      <PrideGlobalLogo size={1.2} />

      <div style={{
        background: '#1c2128', border: '1px solid #30363d',
        borderRadius: 16, padding: '36px 44px', width: 380,
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#e6edf3', marginBottom: 4 }}>Employee Monitor</div>
          <div style={{ fontSize: 12, color: '#7d8590' }}>Sign in to your account</div>
        </div>

        <form onSubmit={submit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, color: '#7d8590', display: 'block', marginBottom: 6, fontWeight: 600, letterSpacing: 1 }}>USERNAME</label>
            <input
              value={u} onChange={e => { setU(e.target.value); setErr('') }}
              placeholder="Enter username"
              autoComplete="username"
              style={{
                width: '100%', background: '#0d1117', border: '1px solid #30363d',
                borderRadius: 8, padding: '10px 14px', color: '#e6edf3',
                fontSize: 14, outline: 'none', boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = '#4A1550'}
              onBlur={e => e.target.style.borderColor = '#30363d'}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 11, color: '#7d8590', display: 'block', marginBottom: 6, fontWeight: 600, letterSpacing: 1 }}>PASSWORD</label>
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
                onFocus={e => e.target.style.borderColor = '#4A1550'}
                onBlur={e => e.target.style.borderColor = '#30363d'}
              />
              <span onClick={() => setShow(!show)} style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                cursor: 'pointer', color: '#7d8590', fontSize: 15, userSelect: 'none',
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
            width: '100%',
            background: 'linear-gradient(135deg, #4A1550, #6B2580)',
            border: 'none', borderRadius: 8, padding: '11px',
            color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
          }}>Sign In</button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: '#7d8590' }}>
          Pride Global · EmpMon v9.0
        </div>
      </div>
    </div>
  )
}
