import { useEffect, useState } from 'react'

const P = '#4A1550'

function ago(mins) {
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (mins < 1440) return `${Math.floor(mins/60)}h ${mins%60}m ago`
  return `${Math.floor(mins/1440)}d ago`
}

function StatusPill({ status }) {
  const s = {
    Online:  { bg: '#dcfce7', color: '#166534', dot: '#22c55e', label: 'Online'  },
    Idle:    { bg: '#fef9c3', color: '#854d0e', dot: '#eab308', label: 'Idle'    },
    Offline: { bg: '#fee2e2', color: '#991b1b', dot: '#ef4444', label: 'Offline' },
  }[status] || { bg: '#f3f4f6', color: '#6b7280', dot: '#9ca3af', label: status }
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5,
      background: s.bg, color: s.color, borderRadius: 99,
      padding: '3px 10px', fontSize: 11, fontWeight: 700, letterSpacing: 0.3 }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background: s.dot,
        boxShadow: `0 0 0 2px ${s.dot}44` }}/>
      {s.label}
    </span>
  )
}

function BatteryIcon({ pct, charging }) {
  if (pct === null || pct === undefined) return <span style={{ color:'#94a3b8', fontSize:11 }}>Desktop</span>
  const color = pct > 50 ? '#22c55e' : pct > 20 ? '#eab308' : '#ef4444'
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <div style={{ position:'relative', width:32, height:14, border:`2px solid ${color}`, borderRadius:3 }}>
        <div style={{ position:'absolute', right:-5, top:'50%', transform:'translateY(-50%)',
          width:3, height:6, background: color, borderRadius:'0 2px 2px 0' }}/>
        <div style={{ height:'100%', width:`${pct}%`, background: color,
          borderRadius:1, maxWidth:'100%' }}/>
      </div>
      <span style={{ fontSize:12, fontWeight:700, color }}>{pct}%</span>
      {charging && <span style={{ fontSize:11, color:'#f59e0b' }}>⚡</span>}
    </div>
  )
}

function RingChart({ value, max, color, label, sub }) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0
  const r = 26, c = 2 * Math.PI * r
  const dash = pct * c
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
      <div style={{ position:'relative', width:70, height:70 }}>
        <svg width={70} height={70} style={{ transform:'rotate(-90deg)' }}>
          <circle cx={35} cy={35} r={r} fill="none" stroke="#f1f5f9" strokeWidth={6}/>
          <circle cx={35} cy={35} r={r} fill="none" stroke={color} strokeWidth={6}
            strokeDasharray={`${dash} ${c}`} strokeLinecap="round"
            style={{ transition:'stroke-dasharray 0.6s ease' }}/>
        </svg>
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center' }}>
          <span style={{ fontSize:13, fontWeight:800, color }}>{label}</span>
        </div>
      </div>
      <span style={{ fontSize:10, color:'#94a3b8', fontWeight:600, textTransform:'uppercase', letterSpacing:0.5 }}>{sub}</span>
    </div>
  )
}

function DiskBar({ disk }) {
  const pct = disk.pct_used || 0
  const color = pct > 90 ? '#ef4444' : pct > 75 ? '#f59e0b' : '#22c55e'
  return (
    <div style={{ marginBottom:8 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
        <span style={{ fontSize:11, fontWeight:700, color:'#374151' }}>{disk.drive}</span>
        <span style={{ fontSize:11, color:'#94a3b8' }}>{disk.used_gb}GB / {disk.total_gb}GB</span>
      </div>
      <div style={{ height:5, background:'#e2e8f0', borderRadius:99, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pct}%`, background: color,
          borderRadius:99, transition:'width 0.5s' }}/>
      </div>
      <div style={{ textAlign:'right', fontSize:10, color, fontWeight:700, marginTop:2 }}>{pct}%</div>
    </div>
  )
}

function DeviceCard({ ep }) {
  const [tab, setTab] = useState('hw')
  const cpuShort = (ep.cpu_name||'').replace(/\(R\)|\(TM\)|Intel|Core|Processor/gi,'').replace(/\s+/g,' ').trim()

  return (
    <div style={{ background:'#fff', borderRadius:16, overflow:'hidden',
      boxShadow:'0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(74,21,80,0.06)',
      border:'1px solid #f1e8f7', display:'flex', flexDirection:'column' }}>

      {/* Top bar */}
      <div style={{ background:`linear-gradient(135deg, ${P} 0%, #7c3aed 100%)`,
        padding:'16px 18px', display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ width:42, height:42, borderRadius:12, background:'rgba(255,255,255,0.15)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontWeight:800, color:'#fff', fontSize:16, letterSpacing:-0.5 }}>
          {(ep.username||'?').slice(0,2).toUpperCase()}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ color:'#fff', fontWeight:800, fontSize:14, letterSpacing:-0.2 }}>{ep.username}</div>
          <div style={{ color:'rgba(255,255,255,0.6)', fontSize:11, marginTop:1,
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ep.computer}</div>
        </div>
        <StatusPill status={ep.status}/>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:'1px solid #f1f5f9', background:'#fafafa' }}>
        {[['hw','Hardware'],['net','Network'],['disk','Storage']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            flex:1, padding:'9px 0', fontSize:11, fontWeight: tab===k ? 700 : 500,
            color: tab===k ? P : '#94a3b8',
            borderBottom: tab===k ? `2px solid ${P}` : '2px solid transparent',
            background:'none', border:'none', borderBottom: tab===k ? `2px solid ${P}` : '2px solid transparent',
            cursor:'pointer', transition:'color 0.15s',
          }}>{l}</button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ padding:'16px 18px', flex:1 }}>
        {tab === 'hw' && (
          <div>
            {/* OS */}
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
              background:'#f8fafc', borderRadius:10, marginBottom:12 }}>
              <span style={{ fontSize:22 }}>{ep.os_name?.includes('11') ? '🪟' : ep.os_name?.includes('10') ? '🪟' : '💻'}</span>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:'#1e293b' }}>{ep.os_name || 'Unknown OS'}</div>
                {ep.os_version && <div style={{ fontSize:11, color:'#94a3b8' }}>Build {ep.os_version}</div>}
              </div>
            </div>

            {/* CPU + RAM rings */}
            <div style={{ display:'flex', justifyContent:'space-around', padding:'8px 0 12px' }}>
              <RingChart value={ep.cpu_cores||0} max={16} color="#7c3aed"
                label={ep.cpu_cores > 0 ? `${ep.cpu_cores}C` : '—'} sub="CPU Cores"/>
              <RingChart value={ep.cpu_threads||0} max={32} color="#0ea5e9"
                label={ep.cpu_threads > 0 ? `${ep.cpu_threads}T` : '—'} sub="Threads"/>
              <RingChart value={ep.ram_total_gb||0} max={64} color="#10b981"
                label={ep.ram_total_gb > 0 ? `${ep.ram_total_gb}G` : '—'} sub="RAM"/>
            </div>

            {/* CPU name */}
            {cpuShort && (
              <div style={{ fontSize:11, color:'#64748b', textAlign:'center',
                padding:'6px 10px', background:'#f8fafc', borderRadius:8, marginBottom:12 }}>
                {cpuShort}
              </div>
            )}

            {/* Battery */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'10px 12px', background:'#f8fafc', borderRadius:10 }}>
              <span style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:0.4 }}>Battery</span>
              <BatteryIcon pct={ep.battery_pct} charging={ep.battery_charging}/>
            </div>
          </div>
        )}

        {tab === 'net' && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[
              { icon:'🌐', label:'IP Address', value: ep.last_ip || '—' },
              { icon:'📍', label:'Location',   value: ep.last_city || '—' },
              { icon:'🔖', label:'Serial',     value: ep.serial || '—' },
            ].map(row => (
              <div key={row.label} style={{ display:'flex', alignItems:'center', gap:12,
                padding:'10px 12px', background:'#f8fafc', borderRadius:10 }}>
                <span style={{ fontSize:18, width:24, textAlign:'center' }}>{row.icon}</span>
                <div>
                  <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:0.5 }}>{row.label}</div>
                  <div style={{ fontSize:12, fontWeight:600, color:'#1e293b', fontFamily: row.label==='IP Address'||row.label==='Serial' ? 'monospace' : 'inherit' }}>{row.value}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'disk' && (
          <div>
            {(ep.disks||[]).length === 0
              ? <div style={{ textAlign:'center', padding:20, color:'#94a3b8', fontSize:12 }}>No disk data yet</div>
              : (ep.disks||[]).map((d,i) => <DiskBar key={i} disk={d}/>)
            }
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding:'10px 18px', borderTop:'1px solid #f1f5f9',
        display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontSize:10, color:'#94a3b8' }}>Last seen</span>
        <span style={{ fontSize:11, fontWeight:600, color: ep.minsAgo < 5 ? '#22c55e' : ep.minsAgo < 60 ? '#f59e0b' : '#ef4444' }}>
          {ago(ep.minsAgo)}
        </span>
      </div>
    </div>
  )
}

export default function Endpoints() {
  const [endpoints, setEndpoints] = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filter, setFilter]       = useState('All')

  const load = () => {
    setLoading(true)
    fetch('/api/endpoints').then(r=>r.json()).then(d=>{ setEndpoints(d); setLoading(false) }).catch(()=>setLoading(false))
  }

  useEffect(() => { load(); const t = setInterval(load, 60000); return ()=>clearInterval(t) }, [])

  const counts = { Online: 0, Idle: 0, Offline: 0 }
  endpoints.forEach(e => { if (counts[e.status] !== undefined) counts[e.status]++ })

  const filtered = endpoints.filter(e => {
    const matchSearch = (e.username||'').toLowerCase().includes(search.toLowerCase()) ||
      (e.computer||'').toLowerCase().includes(search.toLowerCase()) ||
      (e.os_name||'').toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'All' || e.status === filter
    return matchSearch && matchFilter
  })

  return (
    <div style={{ background:'#f8f7fc', minHeight:'100vh', padding:28, fontFamily:"'Segoe UI',system-ui,sans-serif" }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:900, color: P, margin:0, letterSpacing:-0.5 }}>
            Endpoint Management
          </h1>
          <p style={{ color:'#94a3b8', fontSize:13, margin:'4px 0 0' }}>
            Real-time hardware & status for all employee devices
          </p>
        </div>
        <button onClick={load} style={{ display:'flex', alignItems:'center', gap:6,
          background: P, color:'#fff', border:'none', borderRadius:10,
          padding:'9px 18px', fontSize:13, fontWeight:700, cursor:'pointer' }}>
          🔄 Refresh
        </button>
      </div>

      {/* Summary bar */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
        {[
          { label:'Total Devices', value: endpoints.length, color: P,        icon:'🖥️', key:'All'     },
          { label:'Online',        value: counts.Online,    color:'#22c55e',  icon:'🟢', key:'Online'  },
          { label:'Idle',          value: counts.Idle,      color:'#eab308',  icon:'🟡', key:'Idle'    },
          { label:'Offline',       value: counts.Offline,   color:'#ef4444',  icon:'🔴', key:'Offline' },
        ].map(t => (
          <div key={t.key} onClick={() => setFilter(filter === t.key ? 'All' : t.key)}
            style={{ background:'#fff', borderRadius:14, padding:'18px 20px', cursor:'pointer',
              boxShadow: filter===t.key ? `0 0 0 2px ${t.color}, 0 4px 20px ${t.color}22` : '0 1px 3px rgba(0,0,0,0.07)',
              borderTop:`3px solid ${t.color}`, transition:'box-shadow 0.2s' }}>
            <div style={{ fontSize:20, marginBottom:6 }}>{t.icon}</div>
            <div style={{ fontSize:28, fontWeight:900, color: t.color, letterSpacing:-1 }}>{t.value}</div>
            <div style={{ fontSize:12, color:'#94a3b8', marginTop:2, fontWeight:500 }}>{t.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position:'relative', marginBottom:20 }}>
        <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', fontSize:14 }}>🔍</span>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Search by name, computer or OS..."
          style={{ width:'100%', padding:'11px 14px 11px 38px', border:'2px solid #e2e8f0',
            borderRadius:12, fontSize:13, boxSizing:'border-box', outline:'none',
            background:'#fff', color:'#1e293b', transition:'border-color 0.2s' }}
          onFocus={e=>e.target.style.borderColor=P} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
      </div>

      {/* Cards */}
      {loading ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:16 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ background:'#fff', borderRadius:16, height:300,
              boxShadow:'0 1px 3px rgba(0,0,0,0.06)', animation:'pulse 1.5s infinite' }}/>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:80, color:'#94a3b8' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🖥️</div>
          <div style={{ fontSize:16, fontWeight:700, color:'#64748b' }}>No devices found</div>
          <div style={{ fontSize:13, marginTop:6 }}>Agents will appear here once they send a heartbeat</div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:16 }}>
          {filtered.map(ep => <DeviceCard key={ep.id} ep={ep}/>)}
        </div>
      )}
    </div>
  )
}
