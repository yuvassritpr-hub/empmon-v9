import { useEffect, useState } from 'react'

const P = '#4A1550'

function PinIcon({ size=13, color='#e74c3c' }) {
  return (
    <svg width={size} height={size*1.3} viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{display:'inline-block',verticalAlign:'middle',marginRight:3,flexShrink:0}}>
      <path d="M12 0C7.03 0 3 4.03 3 9c0 6.75 9 18 9 18s9-11.25 9-18c0-4.97-4.03-9-9-9z" fill={color}/>
      <circle cx="12" cy="9" r="3.5" fill="#fff"/>
    </svg>
  )
}

function ago(mins) {
  if (mins < 1)    return 'Just now'
  if (mins < 60)   return `${mins}m ago`
  if (mins < 1440) return `${Math.floor(mins/60)}h ago`
  return `${Math.floor(mins/1440)}d ago`
}

function StatusBadge({ status }) {
  const s = {
    Online:  { bg:'#dcfce7', color:'#166534', dot:'#22c55e' },
    Idle:    { bg:'#fef9c3', color:'#854d0e', dot:'#eab308' },
    Offline: { bg:'#fee2e2', color:'#991b1b', dot:'#ef4444' },
  }[status] || { bg:'#f3f4f6', color:'#6b7280', dot:'#9ca3af' }
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5,
      background:s.bg, color:s.color, borderRadius:99,
      padding:'4px 10px', fontSize:11, fontWeight:700 }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:s.dot }}/>
      {status}
    </span>
  )
}

function BatteryBar({ pct, charging }) {
  if (pct === null || pct === undefined)
    return <span style={{ fontSize:11, color:'#94a3b8' }}>🖥 Desktop</span>
  const color = pct > 50 ? '#22c55e' : pct > 20 ? '#eab308' : '#ef4444'
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
      <div style={{ width:36, height:10, border:`1.5px solid ${color}`, borderRadius:3, position:'relative' }}>
        <div style={{ position:'absolute', right:-4, top:'50%', transform:'translateY(-50%)',
          width:3, height:6, background:color, borderRadius:'0 2px 2px 0' }}/>
        <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:2, maxWidth:'100%' }}/>
      </div>
      <span style={{ fontSize:11, fontWeight:700, color }}>{pct}%</span>
      {charging && <span style={{ fontSize:10 }}>⚡</span>}
    </div>
  )
}

function DiskBar({ disk }) {
  const pct = disk.pct_used || 0
  const color = pct > 90 ? '#ef4444' : pct > 75 ? '#f59e0b' : '#22c55e'
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
        <span style={{ fontSize:12, fontWeight:700, color:'#374151' }}>{disk.drive}</span>
        <span style={{ fontSize:12, color:'#6b7280' }}>{disk.used_gb} GB / {disk.total_gb} GB ({pct}%)</span>
      </div>
      <div style={{ height:6, background:'#e2e8f0', borderRadius:99, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:99 }}/>
      </div>
    </div>
  )
}

function DetailModal({ ep, onClose }) {
  if (!ep) return null
  const cpuShort = (ep.cpu_name||'').replace(/\(R\)|\(TM\)/gi,'').trim()
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:1000,
      display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
      onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:560,
        maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.25)' }}
        onClick={e=>e.stopPropagation()}>

        {/* Modal header */}
        <div style={{ background:`linear-gradient(135deg,${P},#7c3aed)`,
          borderRadius:'20px 20px 0 0', padding:'20px 24px',
          display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:48, height:48, borderRadius:14, background:'rgba(255,255,255,0.2)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontWeight:900, color:'#fff', fontSize:18 }}>
              {(ep.username||'?').slice(0,2).toUpperCase()}
            </div>
            <div>
              <div style={{ color:'#fff', fontWeight:800, fontSize:17 }}>{ep.username}</div>
              <div style={{ color:'rgba(255,255,255,0.65)', fontSize:12 }}>{ep.computer}</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <StatusBadge status={ep.status}/>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.2)', border:'none',
              color:'#fff', width:30, height:30, borderRadius:8, cursor:'pointer',
              fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
          </div>
        </div>

        <div style={{ padding:24 }}>
          {/* OS */}
          <div style={{ background:'#f8fafc', borderRadius:12, padding:'14px 16px', marginBottom:16,
            display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ fontSize:28 }}>{ep.os_name?.includes('11') ? '🪟' : '💻'}</span>
            <div>
              <div style={{ fontWeight:700, fontSize:14, color:'#1e293b' }}>{ep.os_name || 'Unknown OS'}</div>
              {ep.os_version && <div style={{ fontSize:12, color:'#94a3b8' }}>Version: {ep.os_version}</div>}
            </div>
          </div>

          {/* Hardware row */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:16 }}>
            {[
              { label:'CPU Cores',   value: ep.cpu_cores   > 0 ? ep.cpu_cores   : '—', icon:'⚙️' },
              { label:'Threads',     value: ep.cpu_threads > 0 ? ep.cpu_threads : '—', icon:'🔧' },
              { label:'RAM',         value: ep.ram_total_gb > 0 ? `${ep.ram_total_gb} GB` : '—', icon:'🧠' },
            ].map(item => (
              <div key={item.label} style={{ background:'#f8fafc', borderRadius:12,
                padding:'14px 16px', textAlign:'center' }}>
                <div style={{ fontSize:22, marginBottom:4 }}>{item.icon}</div>
                <div style={{ fontWeight:800, fontSize:18, color:P }}>{item.value}</div>
                <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>{item.label}</div>
              </div>
            ))}
          </div>

          {/* CPU name */}
          {cpuShort && (
            <div style={{ background:'#f8fafc', borderRadius:10, padding:'10px 16px',
              fontSize:12, color:'#475569', marginBottom:16, textAlign:'center' }}>
              ⚙️ {cpuShort}
            </div>
          )}

          {/* Battery */}
          {ep.battery_pct !== null && ep.battery_pct !== undefined ? (
            <div style={{ background:'#f8fafc', borderRadius:12, padding:'14px 16px', marginBottom:16 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#64748b', marginBottom:10 }}>🔋 Battery</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {/* Charge % */}
                <div style={{ background:'#fff', borderRadius:10, padding:'10px 12px' }}>
                  <div style={{ fontSize:10, color:'#94a3b8', fontWeight:700, textTransform:'uppercase', marginBottom:6 }}>Charge</div>
                  <BatteryBar pct={ep.battery_pct} charging={ep.battery_charging}/>
                  {ep.battery_status_text && (
                    <div style={{ fontSize:10, color:'#64748b', marginTop:4 }}>{ep.battery_status_text}</div>
                  )}
                </div>
                {/* Health */}
                <div style={{ background:'#fff', borderRadius:10, padding:'10px 12px' }}>
                  <div style={{ fontSize:10, color:'#94a3b8', fontWeight:700, textTransform:'uppercase', marginBottom:6 }}>Health</div>
                  {ep.battery_health !== null && ep.battery_health !== undefined ? (() => {
                    const h = ep.battery_health
                    const hColor = h >= 80 ? '#22c55e' : h >= 60 ? '#f59e0b' : '#ef4444'
                    const hLabel = h >= 80 ? 'Good' : h >= 60 ? 'Fair' : 'Poor'
                    return (
                      <div>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <div style={{ width:'100%', height:6, background:'#e2e8f0', borderRadius:99 }}>
                            <div style={{ height:'100%', width:`${h}%`, background:hColor, borderRadius:99 }}/>
                          </div>
                          <span style={{ fontSize:12, fontWeight:800, color:hColor, minWidth:36 }}>{h}%</span>
                        </div>
                        <div style={{ fontSize:10, color:hColor, fontWeight:700, marginTop:3 }}>{hLabel}</div>
                      </div>
                    )
                  })() : <span style={{ fontSize:11, color:'#bbb' }}>Not available</span>}
                </div>
              </div>
              {ep.battery_model && (
                <div style={{ marginTop:8, fontSize:11, color:'#94a3b8' }}>Model: {ep.battery_model}</div>
              )}
            </div>
          ) : (
            <div style={{ background:'#f8fafc', borderRadius:12, padding:'12px 16px',
              marginBottom:16, fontSize:12, color:'#94a3b8' }}>🖥️ Desktop — No battery</div>
          )}

          {/* Antivirus */}
          <div style={{ background:'#f8fafc', borderRadius:12, padding:'14px 16px', marginBottom:16 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#64748b', marginBottom:10 }}>🛡️ Security</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div style={{ background:'#fff', borderRadius:10, padding:'10px 12px' }}>
                <div style={{ fontSize:10, color:'#94a3b8', fontWeight:700, textTransform:'uppercase', marginBottom:4 }}>Antivirus</div>
                <div style={{ fontSize:12, fontWeight:700, color:'#1e293b' }}>{ep.antivirus_name || 'Windows Defender'}</div>
                <div style={{ marginTop:5, display:'flex', gap:6, flexWrap:'wrap' }}>
                  {ep.antivirus_enabled === true  && <span style={{ fontSize:10, fontWeight:700, background:'#dcfce7', color:'#166534', borderRadius:4, padding:'2px 6px' }}>✅ Active</span>}
                  {ep.antivirus_enabled === false && <span style={{ fontSize:10, fontWeight:700, background:'#fee2e2', color:'#991b1b', borderRadius:4, padding:'2px 6px' }}>❌ Disabled</span>}
                  {ep.antivirus_updated === true  && <span style={{ fontSize:10, fontWeight:700, background:'#dcfce7', color:'#166534', borderRadius:4, padding:'2px 6px' }}>✅ Updated</span>}
                  {ep.antivirus_updated === false && <span style={{ fontSize:10, fontWeight:700, background:'#fef3c7', color:'#92400e', borderRadius:4, padding:'2px 6px' }}>⚠️ Outdated</span>}
                </div>
              </div>
              <div style={{ background:'#fff', borderRadius:10, padding:'10px 12px' }}>
                <div style={{ fontSize:10, color:'#94a3b8', fontWeight:700, textTransform:'uppercase', marginBottom:4 }}>Real-Time Protection</div>
                {ep.wd_rtp === true  && <div style={{ fontSize:13, fontWeight:800, color:'#22c55e' }}>✅ ON</div>}
                {ep.wd_rtp === false && <div style={{ fontSize:13, fontWeight:800, color:'#ef4444' }}>❌ OFF</div>}
                {ep.wd_rtp === null  && <div style={{ fontSize:12, color:'#94a3b8' }}>—</div>}
                {ep.wd_def_date && <div style={{ fontSize:10, color:'#94a3b8', marginTop:4 }}>Defs: {ep.wd_def_date.slice(0,10)}</div>}
              </div>
            </div>
          </div>

          {/* Network */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
            {[
              { label:'IP Address', value: ep.last_ip   || '—', icon:'🌐', mono:true },
              { label:'Location',   value: ep.last_city || '—', icon:'📍' },
              { label:'Serial No.', value: ep.serial    || '—', icon:'🔖', mono:true },
              { label:'Last Seen',  value: ago(ep.minsAgo),     icon:'🕐' },
            ].map(item => (
              <div key={item.label} style={{ background:'#f8fafc', borderRadius:12, padding:'12px 14px' }}>
                <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8',
                  textTransform:'uppercase', letterSpacing:0.5, marginBottom:4 }}>
                  {item.icon} {item.label}
                </div>
                <div style={{ fontSize:12, fontWeight:600, color:'#1e293b',
                  fontFamily: item.mono ? 'monospace' : 'inherit' }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* Disks */}
          {(ep.disks||[]).length > 0 && (
            <div style={{ background:'#f8fafc', borderRadius:12, padding:'14px 16px' }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#64748b', marginBottom:12 }}>💾 Storage</div>
              {ep.disks.map((d,i) => <DiskBar key={i} disk={d}/>)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Endpoints() {
  const [endpoints, setEndpoints] = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filter, setFilter]       = useState('All')
  const [selected, setSelected]   = useState(null)

  const load = () => {
    setLoading(true)
    fetch('/api/endpoints').then(r=>r.json()).then(d=>{ setEndpoints(d); setLoading(false) }).catch(()=>setLoading(false))
  }

  useEffect(() => { load(); const t = setInterval(load, 60000); return ()=>clearInterval(t) }, [])

  const counts = { Online:0, Idle:0, Offline:0 }
  endpoints.forEach(e => { if (counts[e.status]!==undefined) counts[e.status]++ })

  const filtered = endpoints.filter(e => {
    const q = search.toLowerCase()
    const matchSearch = (e.username||'').toLowerCase().includes(q) ||
      (e.computer||'').toLowerCase().includes(q) ||
      (e.serial||'').toLowerCase().includes(q) ||
      (e.os_name||'').toLowerCase().includes(q)
    const matchFilter = filter === 'All' || e.status === filter
    return matchSearch && matchFilter
  })

  return (
    <div style={{ background:'#f8f7fc', minHeight:'100vh', padding:28,
      fontFamily:"'Segoe UI',system-ui,sans-serif" }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:900, color:P, margin:0 }}>🖥️ Endpoint Management</h1>
          <p style={{ color:'#94a3b8', fontSize:13, margin:'4px 0 0' }}>All employee devices — hardware, status & details</p>
        </div>
        <button onClick={load} style={{ background:P, color:'#fff', border:'none',
          borderRadius:10, padding:'9px 18px', fontSize:13, fontWeight:700, cursor:'pointer' }}>
          🔄 Refresh
        </button>
      </div>

      {/* Summary tiles */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
        {[
          { label:'Total',   value:endpoints.length, color:P,         key:'All'     },
          { label:'Online',  value:counts.Online,    color:'#22c55e', key:'Online'  },
          { label:'Idle',    value:counts.Idle,      color:'#eab308', key:'Idle'    },
          { label:'Offline', value:counts.Offline,   color:'#ef4444', key:'Offline' },
        ].map(t => (
          <div key={t.key} onClick={() => setFilter(filter===t.key ? 'All' : t.key)}
            style={{ background:'#fff', borderRadius:14, padding:'16px 20px', cursor:'pointer',
              borderTop:`3px solid ${t.color}`,
              boxShadow: filter===t.key
                ? `0 0 0 2px ${t.color}, 0 4px 16px ${t.color}22`
                : '0 1px 4px rgba(0,0,0,0.07)',
              transition:'box-shadow 0.2s' }}>
            <div style={{ fontSize:26, fontWeight:900, color:t.color }}>{t.value}</div>
            <div style={{ fontSize:12, color:'#94a3b8', marginTop:2 }}>{t.label} Devices</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <input value={search} onChange={e=>setSearch(e.target.value)}
        placeholder="🔍 Search by name, computer, serial or OS..."
        style={{ width:'100%', padding:'10px 14px', border:'2px solid #e2e8f0',
          borderRadius:10, fontSize:13, marginBottom:16, boxSizing:'border-box',
          outline:'none', background:'#fff' }}/>

      {/* Table */}
      <div style={{ background:'#fff', borderRadius:16,
        boxShadow:'0 1px 4px rgba(0,0,0,0.07)', overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead>
            <tr style={{ background:P }}>
              {['Employee / Device','Serial No.','Status','OS','CPU / RAM','Battery','IP / Location','Security','Action'].map(h => (
                <th key={h} style={{ padding:'12px 16px', textAlign:'left',
                  color:'#fff', fontWeight:700, fontSize:11,
                  textTransform:'uppercase', letterSpacing:0.5, whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign:'center', padding:48, color:'#94a3b8' }}>
                Loading devices...
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign:'center', padding:60, color:'#94a3b8' }}>
                <div style={{ fontSize:36, marginBottom:8 }}>🖥️</div>
                <div style={{ fontWeight:600 }}>No devices found</div>
                <div style={{ fontSize:12, marginTop:4 }}>Agents appear here once they send a heartbeat</div>
              </td></tr>
            ) : filtered.map((ep, i) => (
              <tr key={ep.id} style={{ borderBottom:'1px solid #f1f5f9',
                background: i%2===0 ? '#fff' : '#fafafa',
                transition:'background 0.15s' }}
                onMouseEnter={e=>e.currentTarget.style.background='#f5f3ff'}
                onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'#fff':'#fafafa'}>

                {/* Employee */}
                <td style={{ padding:'14px 16px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:36, height:36, borderRadius:10, flexShrink:0,
                      background:`linear-gradient(135deg,${P},#7c3aed)`,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontWeight:800, color:'#fff', fontSize:13 }}>
                      {(ep.username||'?').slice(0,2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight:700, color:'#1e293b' }}>{ep.username}</div>
                      <div style={{ fontSize:11, color:'#94a3b8' }}>{ep.computer}</div>
                    </div>
                  </div>
                </td>

                {/* Serial */}
                <td style={{ padding:'14px 16px' }}>
                  <span style={{ fontFamily:'monospace', fontSize:12,
                    background:'#f1f5f9', padding:'3px 8px', borderRadius:6,
                    color:'#475569', fontWeight:600 }}>
                    {ep.serial || '—'}
                  </span>
                </td>

                {/* Status */}
                <td style={{ padding:'14px 16px' }}>
                  <div>
                    <StatusBadge status={ep.status}/>
                    <div style={{ fontSize:10, color:'#94a3b8', marginTop:4 }}>{ago(ep.minsAgo)}</div>
                  </div>
                </td>

                {/* OS */}
                <td style={{ padding:'14px 16px' }}>
                  <div style={{ fontSize:12, fontWeight:600, color:'#374151' }}>
                    {ep.os_name?.includes('11') ? '🪟 ' : ep.os_name?.includes('10') ? '🪟 ' : '💻 '}
                    {ep.os_name || <span style={{ color:'#bbb' }}>—</span>}
                  </div>
                  {ep.os_version && <div style={{ fontSize:10, color:'#94a3b8' }}>{ep.os_version}</div>}
                </td>

                {/* CPU / RAM */}
                <td style={{ padding:'14px 16px' }}>
                  {ep.cpu_cores > 0 ? (
                    <div>
                      <div style={{ fontSize:11, fontWeight:700, color:'#374151' }}>
                        {ep.cpu_cores}C / {ep.cpu_threads}T
                      </div>
                      <div style={{ fontSize:11, color:'#94a3b8' }}>
                        RAM: {ep.ram_total_gb > 0 ? `${ep.ram_total_gb} GB` : '—'}
                      </div>
                    </div>
                  ) : <span style={{ color:'#bbb' }}>—</span>}
                </td>

                {/* Battery */}
                <td style={{ padding:'14px 16px' }}>
                  <BatteryBar pct={ep.battery_pct} charging={ep.battery_charging}/>
                  {ep.battery_health !== null && ep.battery_health !== undefined && (() => {
                    const h = ep.battery_health
                    const hColor = h >= 80 ? '#22c55e' : h >= 60 ? '#f59e0b' : '#ef4444'
                    const hLabel = h >= 80 ? 'Good' : h >= 60 ? 'Fair' : 'Poor'
                    return <div style={{ fontSize:10, color:hColor, fontWeight:700, marginTop:3 }}>❤️ {h}% {hLabel}</div>
                  })()}
                  {ep.battery_status_text && (
                    <div style={{ fontSize:10, color:'#94a3b8', marginTop:2 }}>{ep.battery_status_text}</div>
                  )}
                </td>

                {/* IP / Location */}
                <td style={{ padding:'14px 16px' }}>
                  <div style={{ fontSize:12, fontFamily:'monospace', color:'#374151', fontWeight:600 }}>
                    {ep.last_ip || '—'}
                  </div>
                  <div style={{ fontSize:11, color:'#94a3b8', display:'flex', alignItems:'center' }}>
                    {ep.last_city ? <><PinIcon color="#e74c3c" size={11}/>{ep.last_city}</> : ''}
                  </div>
                </td>

                {/* Security */}
                <td style={{ padding:'14px 16px' }}>
                  {ep.antivirus_name && <div style={{ fontSize:11, fontWeight:600, color:'#374151' }}>🛡️ {ep.antivirus_name}</div>}
                  {ep.wd_rtp === true  && <div style={{ fontSize:10, color:'#22c55e', fontWeight:700, marginTop:2 }}>✅ RTP On</div>}
                  {ep.wd_rtp === false && <div style={{ fontSize:10, color:'#ef4444', fontWeight:700, marginTop:2 }}>❌ RTP Off</div>}
                  {ep.antivirus_updated === false && <div style={{ fontSize:10, color:'#f59e0b', fontWeight:700, marginTop:2 }}>⚠️ Outdated</div>}
                </td>

                {/* Action */}
                <td style={{ padding:'14px 16px' }}>
                  <button onClick={() => setSelected(ep)}
                    style={{ background:P, color:'#fff', border:'none',
                      borderRadius:8, padding:'7px 16px', fontSize:12,
                      fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>
                    View →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail modal */}
      <DetailModal ep={selected} onClose={() => setSelected(null)}/>
    </div>
  )
}
