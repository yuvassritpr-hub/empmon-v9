import { useState } from 'react'

const CREDS = { username: 'Employeemonitor', password: 'Admin@123' }
const PURPLE = '#4A1550'
const GOLD   = '#B8960C'

export default function Login({ onLogin }) {
  const [u, setU] = useState('')
  const [p, setP] = useState('')
  const [err, setErr] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      if (u === CREDS.username && p === CREDS.password) {
        localStorage.setItem('empmon_auth', '1')
        onLogin()
      } else {
        setErr('Invalid username or password. Please try again.')
        setP('')
        setLoading(false)
      }
    }, 600)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${PURPLE} 0%, #2d0a35 50%, #1a0520 100%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Segoe UI', Arial, sans-serif", position: 'relative', overflow: 'hidden',
    }}>
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes shimmer { 0%{opacity:.3} 50%{opacity:.7} 100%{opacity:.3} }
        .login-input:focus { border-color: ${GOLD} !important; box-shadow: 0 0 0 3px ${GOLD}20 !important; outline: none; }
        .sign-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(184,150,12,0.4) !important; }
        .sign-btn:active { transform: translateY(0); }
        .sign-btn { transition: all .2s; }
      `}</style>

      {/* Background decorative circles */}
      <div style={{ position:'absolute', width:400, height:400, borderRadius:'50%',
        background:`${GOLD}08`, top:-100, right:-100, pointerEvents:'none' }}/>
      <div style={{ position:'absolute', width:300, height:300, borderRadius:'50%',
        background:`${GOLD}05`, bottom:-80, left:-80, pointerEvents:'none' }}/>
      <div style={{ position:'absolute', width:200, height:200, borderRadius:'50%',
        border:`1px solid ${GOLD}15`, top:'20%', left:'10%', pointerEvents:'none',
        animation:'shimmer 4s infinite' }}/>

      {/* Main card */}
      <div style={{
        width: 420, background: '#fff', borderRadius: 20,
        boxShadow: '0 32px 80px rgba(0,0,0,0.4)', overflow: 'hidden',
        position: 'relative', zIndex: 1,
      }}>

        {/* Top banner */}
        <div style={{
          background: `linear-gradient(135deg, ${PURPLE}, #7B3FA0)`,
          padding: '32px 40px 24px', textAlign: 'center',
          position: 'relative',
        }}>
          {/* Gold top line */}
          <div style={{ position:'absolute', top:0, left:0, right:0, height:4,
            background:`linear-gradient(90deg, ${GOLD}, #e8c840, ${GOLD})` }}/>

          {/* Logo */}
          <div style={{ display:'flex', justifyContent:'center', marginBottom: 12,
            animation:'float 4s ease-in-out infinite' }}>
            <div style={{ background:'#fff', borderRadius:12, padding:'10px 18px',
              boxShadow:'0 4px 20px rgba(0,0,0,0.3)' }}>
              <img src="/logo.jpg" alt="Pride Global"
                style={{ height: 56, width:'auto', display:'block' }}/>
            </div>
          </div>

          <div style={{ color:'#fff', fontSize: 11, letterSpacing: 3, fontWeight: 600,
            textTransform:'uppercase', opacity: 0.8, marginTop: 8 }}>
            Employee Monitoring System
          </div>
        </div>

        {/* Form area */}
        <div style={{ padding: '32px 40px 36px' }}>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: PURPLE }}>Welcome Back</h2>
            <p style={{ margin:'4px 0 0', fontSize: 13, color:'#888' }}>Sign in to access the dashboard</p>
          </div>

          <form onSubmit={submit}>
            {/* Username */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display:'block', fontSize: 11, fontWeight: 700,
                color: PURPLE, marginBottom: 7, letterSpacing: 1, textTransform:'uppercase' }}>
                Username
              </label>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)',
                  fontSize:16, opacity:0.4 }}>👤</span>
                <input
                  className="login-input"
                  value={u} onChange={e=>{ setU(e.target.value); setErr('') }}
                  placeholder="Enter your username"
                  autoComplete="username"
                  style={{
                    width:'100%', padding:'12px 14px 12px 40px', boxSizing:'border-box',
                    border:`2px solid #e8e0f0`, borderRadius:10, fontSize:14,
                    color:'#1a1a1a', background:'#faf8fc', transition:'all .2s',
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display:'block', fontSize: 11, fontWeight: 700,
                color: PURPLE, marginBottom: 7, letterSpacing: 1, textTransform:'uppercase' }}>
                Password
              </label>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)',
                  fontSize:16, opacity:0.4 }}>🔒</span>
                <input
                  className="login-input"
                  type={show ? 'text' : 'password'}
                  value={p} onChange={e=>{ setP(e.target.value); setErr('') }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  style={{
                    width:'100%', padding:'12px 44px 12px 40px', boxSizing:'border-box',
                    border:`2px solid #e8e0f0`, borderRadius:10, fontSize:14,
                    color:'#1a1a1a', background:'#faf8fc', transition:'all .2s',
                  }}
                />
                <span onClick={()=>setShow(!show)} style={{
                  position:'absolute', right:13, top:'50%', transform:'translateY(-50%)',
                  cursor:'pointer', fontSize:16, opacity:0.5, userSelect:'none',
                }}>{show ? '🙈' : '👁'}</span>
              </div>
            </div>

            {/* Error */}
            {err && (
              <div style={{
                background:'#fff5f5', border:'1px solid #f5c6c6', borderRadius:10,
                padding:'10px 14px', marginBottom:18, display:'flex', alignItems:'center', gap:8,
              }}>
                <span style={{ fontSize:16 }}>⚠️</span>
                <span style={{ color:'#c0392b', fontSize:13, fontWeight:500 }}>{err}</span>
              </div>
            )}

            {/* Submit */}
            <button type="submit" className="sign-btn" disabled={loading} style={{
              width:'100%', padding:'14px',
              background: loading ? '#ccc' : `linear-gradient(135deg, ${GOLD}, #d4a017)`,
              border:'none', borderRadius:10, color:'#fff',
              fontSize:15, fontWeight:800, cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing:1, boxShadow:`0 4px 16px ${GOLD}40`,
            }}>
              {loading ? '⏳  Signing in...' : '🔑  Sign In'}
            </button>
          </form>

          {/* Footer */}
          <div style={{ textAlign:'center', marginTop:24, paddingTop:20,
            borderTop:`1px solid #f0eaf5` }}>
            <div style={{ fontSize:11, color:'#bbb', letterSpacing:1 }}>
              PRIDE GLOBAL · EMPMON v9.0
            </div>
            <div style={{ fontSize:10, color:'#ddd', marginTop:4 }}>
              Confidential — Authorized Personnel Only
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
