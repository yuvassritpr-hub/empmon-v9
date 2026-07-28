import { useEffect, useState } from 'react'

const PURPLE = '#4A1550'
const GREEN  = '#1a7f4b'
const YELLOW = '#d29922'
const RED    = '#c0392b'
const BLUE   = '#1a6fc4'

function StatusBadge({ status }) {
  const cfg = {
    Online:  { bg:'#1a7f4b22', color: GREEN,  border:'#1a7f4b44', dot: GREEN  },
    Idle:    { bg:'#d2992222', color: YELLOW,  border:'#d2992244', dot: YELLOW },
    Offline: { bg:'#c0392b22', color: RED,     border:'#c0392b44', dot: RED    },
  }[status] || { bg:'#88888822', color:'#888', border:'#88888844', dot:'#888' }
  return (
    <span style={{ background: cfg.bg, color: cfg.color, border:`1px solid ${cfg.border}`,
      borderRadius:20, padding:'3px 10px', fontSize:11, fontWeight:700, display:'inline-flex', alignItems:'center', gap:5 }}>
      <span style={{ width:7, height:7, borderRadius:'50%', background: cfg.dot, display:'inline-block' }}/>
      {status}
    </span>
  )
}

function DiskBar({ disk }) {
  const pct = disk.pct_used || 0
  const color = pct > 90 ? RED : pct > 75 ? YELLOW : GREEN
  return (
    <div style={{ marginBottom:6 }}>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:3 }}>
        <span style={{ fontWeight:700 }}>{disk.drive}</span>
        <span style={{ color:'#888' }}>{disk.used_gb}GB / {disk.total_gb}GB ({pct}%)</span>
      </div>
      <div style={{ height:6, background:'#e0e0e0', borderRadius:3, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pct}%`, background: color, borderRadius:3 }}/>
      </div>
    </div>
  )
}

export default function Endpoints() {
  const [endpoints, setEndpoints] = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')

  const load = () => {
    setLoading(true)
    fetch('/api/endpoints').then(r=>r.json()).then(d=>{ setEndpoints(d); setLoading(false) }).catch(()=>setLoading(false))
  }

  useEffect(() => { load(); const t = setInterval(load, 60000); return ()=>clearInterval(t) }, [])

  const filtered = endpoints.filter(e =>
    (e.username||'').toLowerCase().includes(search.toLowerCase()) ||
    (e.computer||'').toLowerCase().includes(search.toLowerCase()) ||
    (e.os_name||'').toLowerCase().includes(search.toLowerCase())
  )

  const online  = endpoints.filter(e=>e.status==='Online').length
  const idle    = endpoints.filter(e=>e.status==='Idle').length
  const offline = endpoints.filter(e=>e.status==='Offline').length

  return (
    <div style={{ background:'#f7f4fa', minHeight:'100vh', padding:28, fontFamily:"'Segoe UI',Arial,sans-serif" }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:800, color:PURPLE, margin:0 }}>🖥️ Endpoint Management Center</h1>
          <p style={{ color:'#888', fontSize:13, margin:'4px 0 0' }}>All employee devices — OS, hardware, disk, status</p>
        </div>
        <button onClick={load} style={{ background:PURPLE, color:'#fff', border:'none', borderRadius:8,
          padding:'8px 16px', fontSize:13, fontWeight:700, cursor:'pointer' }}>🔄 Refresh</button>
      </div>

      {/* Summary tiles */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
        {[
          { label:'Total Devices',   value: endpoints.length, color: PURPLE, icon:'🖥️' },
          { label:'Online Now',      value: online,  color: GREEN,  icon:'🟢' },
          { label:'Idle / Away',     value: idle,    color: YELLOW, icon:'🟡' },
          { label:'Offline',         value: offline, color: RED,    icon:'🔴' },
        ].map(t => (
          <div key={t.label} style={{ background:'#fff', borderRadius:12, padding:'16px 20px',
            boxShadow:'0 2px 12px rgba(74,21,80,0.07)', borderTop:`3px solid ${t.color}` }}>
            <div style={{ fontSize:22, marginBottom:4 }}>{t.icon}</div>
            <div style={{ fontSize:26, fontWeight:800, color:t.color }}>{t.value}</div>
            <div style={{ fontSize:12, color:'#888', marginTop:2 }}>{t.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <input value={search} onChange={e=>setSearch(e.target.value)}
        placeholder="🔍 Search by name, computer or OS..."
        style={{ width:'100%', padding:'10px 14px', border:'2px solid #e8e0f0', borderRadius:10,
          fontSize:13, marginBottom:20, boxSizing:'border-box', outline:'none' }}/>

      {loading ? (
        <div style={{ textAlign:'center', padding:60, color:'#888' }}>Loading endpoints...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:60, color:'#888' }}>
          <div style={{ fontSize:40, marginBottom:8 }}>🖥️</div>
          <div>No endpoints found. Agents will appear here once they send a heartbeat.</div>
          <div style={{ fontSize:12, marginTop:8, color:'#bbb' }}>Make sure agents are updated with the latest version that sends system_info.</div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(380px,1fr))', gap:16 }}>
          {filtered.map(ep => (
            <div key={ep.id} style={{ background:'#fff', borderRadius:14,
              boxShadow:'0 2px 16px rgba(74,21,80,0.08)', overflow:'hidden' }}>
              {/* Header */}
              <div style={{ background: PURPLE, padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:'rgba(255,255,255,0.2)',
                    display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, color:'#fff', fontSize:14 }}>
                    {(ep.username||'?').slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ color:'#fff', fontWeight:700, fontSize:14 }}>{ep.username}</div>
                    <div style={{ color:'rgba(255,255,255,0.7)', fontSize:11 }}>{ep.computer}</div>
                  </div>
                </div>
                <StatusBadge status={ep.status}/>
              </div>

              {/* Body */}
              <div style={{ padding:'16px 18px' }}>
                {/* OS */}
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:0.5, marginBottom:6 }}>Operating System</div>
                  <div style={{ fontSize:13, fontWeight:600, color: PURPLE }}>
                    {ep.os_name ? (
                      ep.os_name.includes('11') ? '🪟 ' : ep.os_name.includes('10') ? '🪟 ' : '💻 '
                    ) : '💻 '}
                    {ep.os_name || <span style={{color:'#bbb'}}>Not detected yet</span>}
                  </div>
                  {ep.os_version && <div style={{ fontSize:11, color:'#aaa', marginTop:2 }}>Version: {ep.os_version}</div>}
                </div>

                {/* CPU + RAM */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
                  <div style={{ background:'#f7f4fa', borderRadius:8, padding:'10px 12px' }}>
                    <div style={{ fontSize:10, fontWeight:700, color:'#888', textTransform:'uppercase', marginBottom:4 }}>CPU</div>
                    <div style={{ fontSize:12, fontWeight:600, lineHeight:1.4 }}>
                      {ep.cpu_name ? ep.cpu_name.replace(/\(R\)|\(TM\)/gi,'').trim() : <span style={{color:'#bbb'}}>—</span>}
                    </div>
                    {ep.cpu_cores > 0 && (
                      <div style={{ fontSize:11, color:'#888', marginTop:3 }}>
                        {ep.cpu_cores} cores / {ep.cpu_threads} threads
                      </div>
                    )}
                  </div>
                  <div style={{ background:'#f7f4fa', borderRadius:8, padding:'10px 12px' }}>
                    <div style={{ fontSize:10, fontWeight:700, color:'#888', textTransform:'uppercase', marginBottom:4 }}>RAM</div>
                    <div style={{ fontSize:18, fontWeight:800, color: PURPLE }}>
                      {ep.ram_total_gb > 0 ? `${ep.ram_total_gb} GB` : <span style={{fontSize:12,color:'#bbb'}}>—</span>}
                    </div>
                  </div>
                </div>

                {/* Serial + IP */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
                  <div>
                    <div style={{ fontSize:10, fontWeight:700, color:'#888', textTransform:'uppercase', marginBottom:3 }}>Serial Number</div>
                    <div style={{ fontSize:12, fontFamily:'monospace', fontWeight:600 }}>{ep.serial || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize:10, fontWeight:700, color:'#888', textTransform:'uppercase', marginBottom:3 }}>Last IP</div>
                    <div style={{ fontSize:12, fontFamily:'monospace' }}>{ep.last_ip || '—'}</div>
                    {ep.last_city && <div style={{ fontSize:11, color:'#888' }}>{ep.last_city}</div>}
                  </div>
                </div>

                {/* Disk */}
                {(ep.disks||[]).length > 0 && (
                  <div>
                    <div style={{ fontSize:11, fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:0.5, marginBottom:8 }}>💾 Storage</div>
                    {ep.disks.map((d,i) => <DiskBar key={i} disk={d}/>)}
                  </div>
                )}

                {/* Last seen */}
                <div style={{ marginTop:12, paddingTop:10, borderTop:'1px solid #f0eaf5', fontSize:11, color:'#aaa' }}>
                  Last heartbeat: {ep.last_seen || 'Never'} · {ep.minsAgo < 60 ? `${ep.minsAgo}m ago` : `${Math.floor(ep.minsAgo/60)}h ago`}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
