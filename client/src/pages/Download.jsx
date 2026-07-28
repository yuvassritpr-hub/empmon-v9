export default function Download() {
  const SERVER = 'https://empmon-v9.onrender.com'

  return (
    <div style={{ background:'#f7f4fa', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Segoe UI',Arial,sans-serif", padding:24 }}>
      <div style={{ maxWidth:520, width:'100%' }}>

        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <img src="/logo.jpg" alt="Pride Global" style={{ height:48, marginBottom:16 }} onError={e=>e.target.style.display='none'}/>
          <h1 style={{ fontSize:24, fontWeight:800, color:'#4A1550', margin:0 }}>Employee Monitor Agent</h1>
          <p style={{ color:'#888', fontSize:14, marginTop:8 }}>Installs silently and runs in the background.<br/>No window shown. Connects to your company server automatically.</p>
        </div>

        {/* Download card */}
        <div style={{ background:'#fff', borderRadius:16, boxShadow:'0 4px 32px rgba(74,21,80,0.12)', padding:32, marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:24, padding:16, background:'#f7f4fa', borderRadius:10 }}>
            <div style={{ fontSize:40 }}>🖥️</div>
            <div>
              <div style={{ fontWeight:700, fontSize:15, color:'#4A1550' }}>EmpMonAgent.exe</div>
              <div style={{ fontSize:12, color:'#888', marginTop:3 }}>Windows 10 / 11 · Runs silently in background</div>
              <div style={{ fontSize:12, color:'#1a7f4b', marginTop:2 }}>✓ Connects to: {SERVER}</div>
            </div>
          </div>

          <a href="/download/agent" style={{ display:'block', textDecoration:'none' }}>
            <button style={{
              width:'100%', padding:'14px', background:'#4A1550', color:'#fff',
              border:'none', borderRadius:10, fontSize:16, fontWeight:700, cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center', gap:10,
            }}>
              <span style={{ fontSize:20 }}>⬇️</span> Download for Windows
            </button>
          </a>

          <div style={{ marginTop:20, fontSize:13, color:'#555', lineHeight:2 }}>
            <div style={{ fontWeight:700, color:'#4A1550', marginBottom:8 }}>📋 Setup Instructions</div>
            <div>1. Click <strong>Download for Windows</strong> above</div>
            <div>2. Save <code style={{ background:'#f0eaf5', padding:'1px 6px', borderRadius:4 }}>EmpMonAgent.exe</code> to <code style={{ background:'#f0eaf5', padding:'1px 6px', borderRadius:4 }}>C:\EmpMonitor\</code></div>
            <div>3. Double-click to run — no installation needed</div>
            <div>4. The agent starts automatically at Windows login</div>
            <div>5. A green ✅ will appear on the dashboard within 2 minutes</div>
          </div>
        </div>

        {/* Info boxes */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
          {[
            { icon:'🔒', title:'Secure', desc:'Data sent only to your company server' },
            { icon:'🤫', title:'Silent', desc:'No popup, no tray icon, runs in background' },
            { icon:'⚡', title:'Lightweight', desc:'Uses less than 1% CPU and 30MB RAM' },
            { icon:'🔄', title:'Auto-start', desc:'Starts automatically when Windows boots' },
          ].map(b => (
            <div key={b.title} style={{ background:'#fff', borderRadius:10, padding:'14px 16px', boxShadow:'0 2px 8px rgba(74,21,80,0.06)' }}>
              <div style={{ fontSize:20, marginBottom:4 }}>{b.icon}</div>
              <div style={{ fontWeight:700, fontSize:13, color:'#4A1550' }}>{b.title}</div>
              <div style={{ fontSize:11, color:'#888', marginTop:2 }}>{b.desc}</div>
            </div>
          ))}
        </div>

        <div style={{ textAlign:'center', fontSize:11, color:'#bbb' }}>
          Pride Global · Employee Activity Monitor · v9
        </div>
      </div>
    </div>
  )
}
