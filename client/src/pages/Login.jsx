import { useState } from 'react'

const CREDS = { username: 'Employeemonitor', password: 'Admin@123' }

function PrideGlobalLogo({ size = 1 }) {
  const w = 220 * size, h = 70 * size
  return (
    <svg width={w} height={h} viewBox="0 0 220 70" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* ── Gold geometric icon ── */}
      {/* Outer border square */}
      <rect x="2" y="2" width="64" height="64" rx="4" stroke="#B8960C" strokeWidth="2.5" fill="none"/>
      {/* Inner divider cross lines */}
      <line x1="34" y1="2" x2="34" y2="66" stroke="#B8960C" strokeWidth="1.2"/>
      <line x1="2" y1="34" x2="66" y2="34" stroke="#B8960C" strokeWidth="1.2"/>

      {/* Top-right quadrant: arc/radio lines */}
      <path d="M36 32 Q44 24 52 20" stroke="#B8960C" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <path d="M36 27 Q46 18 56 14" stroke="#B8960C" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <path d="M36 22 Q47 12 60 9"  stroke="#B8960C" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <circle cx="36" cy="33" r="2.2" fill="#B8960C"/>

      {/* Top-left quadrant: leaf / petal shapes */}
      <path d="M18 28 C14 22 10 16 18 12 C26 8 28 16 24 22 Z" fill="#B8960C" opacity="0.85"/>
      <path d="M12 28 C8 22 6 14 14 10" stroke="#B8960C" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <circle cx="18" cy="28" r="2" fill="#B8960C"/>

      {/* Bottom-left quadrant: wave lines */}
      <path d="M6 42 Q12 38 18 42 Q24 46 30 42" stroke="#B8960C" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <path d="M6 49 Q12 45 18 49 Q24 53 30 49" stroke="#B8960C" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <path d="M6 56 Q12 52 18 56 Q24 60 30 56" stroke="#B8960C" strokeWidth="1.8" fill="none" strokeLinecap="round"/>

      {/* Bottom-right quadrant: downward leaf */}
      <path d="M38 38 C44 38 58 42 58 54 C58 62 48 64 42 58 C36 52 36 42 38 38 Z" fill="#B8960C" opacity="0.85"/>
      <path d="M38 38 L52 58" stroke="#B8960C" strokeWidth="1.2" strokeLinecap="round" opacity="0.6"/>

      {/* ── Text: PRIDE ── */}
      <text x="82" y="44" fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="34" fontWeight="700" fill="#4A1550" letterSpacing="2">PRIDE</text>

      {/* ── Text: — GLOBAL — ── */}
      <line x1="82" y1="56" x2="94" y2="56" stroke="#B8960C" strokeWidth="1.5"/>
      <text x="99" y="61" fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="13" fontWeight="500" fill="#4A1550" letterSpacing="3">GLOBAL</text>
      <line x1="170" y1="56" x2="182" y2="56" stroke="#B8960C" strokeWidth="1.5"/>
    </svg>
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
