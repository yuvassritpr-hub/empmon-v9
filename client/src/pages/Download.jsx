export default function Download() {
  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'#fff', fontFamily:"'Segoe UI',Arial,sans-serif"
    }}>
      <div style={{ textAlign:'center', maxWidth:480, padding:32 }}>

        {/* Logo */}
        <img src="/logo.jpg" alt="Pride Global"
          style={{ height:60, marginBottom:32, objectFit:'contain' }}
          onError={e=>{ e.target.style.display='none' }}
        />

        {/* Title */}
        <h2 style={{ fontSize:18, fontWeight:600, color:'#222', margin:'0 0 28px', lineHeight:1.5 }}>
          Download Employee Monitor Agent as requested by<br/>
          <span style={{ color:'#4A1550' }}>Pride Global IT Admin</span>
        </h2>

        {/* Download button */}
        <a href="/download/agent" style={{ textDecoration:'none' }}>
          <button style={{
            background:'#4A6CF7', color:'#fff', border:'none', borderRadius:6,
            padding:'13px 36px', fontSize:15, fontWeight:600, cursor:'pointer',
            display:'inline-flex', alignItems:'center', gap:10,
          }}>
            Download for Windows
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
        </a>

        {/* Note */}
        <p style={{ marginTop:28, fontSize:13, color:'#888' }}>
          Note: Download the agent only if requested by your IT admin
        </p>

        {/* What it does */}
        <div style={{ marginTop:32, padding:20, background:'#f8f8f8', borderRadius:8, textAlign:'left', fontSize:13, color:'#555', lineHeight:2 }}>
          <div>✅ Runs silently in the background — no window shown</div>
          <div>✅ Tracks active hours and reports to company server</div>
          <div>✅ Starts automatically when Windows boots</div>
          <div>✅ Uses less than 1% CPU</div>
        </div>

      </div>
    </div>
  )
}
