import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const STATUS_COLOR = { Online: '#3fb950', Idle: '#d29922', Offline: '#f85149' }
const APP_COLORS = ['#4493f8','#a371f7','#3fb950','#fb8500','#f85149','#d29922','#58a6ff','#bc8cff']

function StatCard({ label, value, color }) {
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '18px 24px', flex: 1, minWidth: 140,
    }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: color||'var(--text)' }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>{label}</div>
    </div>
  )
}

function StatusDot({ status }) {
  const color = STATUS_COLOR[status] || '#7d8590'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%', background: color,
        boxShadow: status === 'Online' ? `0 0 6px ${color}` : 'none',
        display: 'inline-block',
        animation: status === 'Online' ? 'pulse 2s infinite' : 'none',
      }} />
      <span style={{ color, fontSize: 12, fontWeight: 600 }}>{status}</span>
    </span>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = () => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load(); const t = setInterval(load, 60000); return () => clearInterval(t) }, [])

  if (loading) return <div style={{ padding: 40, color: 'var(--text-dim)' }}>Loading...</div>
  if (!data) return <div style={{ padding: 40, color: 'var(--red)' }}>Failed to load</div>

  const pieData = [
    { name: 'Online', value: data.online },
    { name: 'Idle', value: data.idle },
    { name: 'Offline', value: data.offline },
  ].filter(d => d.value > 0)

  const filtered = (data.employees||[]).filter(e =>
    !search || e.username.toLowerCase().includes(search.toLowerCase()) ||
    e.computer.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ padding: 24 }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Employee Dashboard</h1>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
            {new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
            {' · '}Auto-refresh every 60s
          </div>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <select id="reportMonth" defaultValue={new Date().toISOString().slice(0,7)}
            style={{background:'var(--card)',border:'1px solid var(--border)',color:'var(--text)',
              borderRadius:8,padding:'6px 10px',fontSize:12,cursor:'pointer'}}>
            {Array.from({length:6},(_,i)=>{
              const d=new Date(); d.setMonth(d.getMonth()-i);
              const v=d.toISOString().slice(0,7);
              return <option key={v} value={v}>{v}</option>
            })}
          </select>
          <a href="#" onClick={e=>{e.preventDefault();const m=document.getElementById('reportMonth').value;window.open(`/api/report/excel?month=${m}`,'_blank')}}
            style={{background:'#1e6e2e',border:'1px solid #2ea043',color:'#fff',borderRadius:8,
              padding:'6px 14px',fontSize:12,fontWeight:600,textDecoration:'none',whiteSpace:'nowrap'}}>
            📥 Excel
          </a>
          <a href="#" onClick={e=>{e.preventDefault();const m=document.getElementById('reportMonth').value;window.open(`/api/report/pdf?month=${m}`,'_blank')}}
            style={{background:'#8b1a1a',border:'1px solid #c0392b',color:'#fff',borderRadius:8,
              padding:'6px 14px',fontSize:12,fontWeight:600,textDecoration:'none',whiteSpace:'nowrap'}}>
            📄 PDF
          </a>
          <button onClick={load} style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            color: 'var(--text)', borderRadius: 8, padding: '6px 14px',
            cursor: 'pointer', fontSize: 13,
          }}>⟳ Refresh</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <StatCard label="Total Employees" value={data.total} color="var(--accent)" />
        <StatCard label="Online Now" value={data.online} color="var(--green)" />
        <StatCard label="Idle" value={data.idle} color="var(--yellow)" />
        <StatCard label="Offline" value={data.offline} color="var(--text-dim)" />
        <StatCard label="Total Active Today" value={data.totalActive} color="var(--purple)" />
      </div>

      <div style={{ display: 'flex', gap: 20, marginBottom: 24, alignItems: 'flex-start' }}>
        {/* Pie chart */}
        {pieData.length > 0 && (
          <div style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 12, padding: 20, width: 200, flexShrink: 0,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Status Overview</div>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value">
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLOR[entry.name]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection:'column', gap: 4, marginTop: 4 }}>
              {pieData.map(d => (
                <div key={d.name} style={{ display:'flex', alignItems:'center', gap: 6, fontSize: 12 }}>
                  <span style={{ width:10, height:10, borderRadius:2, background: STATUS_COLOR[d.name], display:'inline-block' }}/>
                  {d.name}: <strong>{d.value}</strong>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <div style={{ flex: 1 }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Search employee or computer..."
            style={{
              width: '100%', background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '8px 14px', color: 'var(--text)', fontSize: 13,
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Employee Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.length === 0 && (
          <div style={{ textAlign:'center', padding: 60, color:'var(--text-dim)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
            No employee data yet. Deploy agents on employee PCs.
          </div>
        )}
        {filtered.map(e => (
          <div key={`${e.username}-${e.computer}`} style={{
            background: 'var(--card)', border: `1px solid ${e.socialSites?.length ? '#f85149' : 'var(--border)'}`,
            borderRadius: 12, padding: '16px 20px',
            display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
          }}>
            {/* Avatar */}
            <div style={{
              width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
              background: `linear-gradient(135deg, var(--accent), var(--purple))`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 16, color: '#fff',
            }}>{e.username.slice(0,2).toUpperCase()}</div>

            {/* Name + PC */}
            <div style={{ minWidth: 140 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>
                {e.username}
                {e.socialSites?.length > 0 && (
                  <Link to="/alerts" style={{ marginLeft: 8, background:'var(--red)', color:'#fff',
                    fontSize: 10, fontWeight: 700, borderRadius: 4, padding: '1px 6px', textDecoration:'none' }}>
                    ⚠ SOCIAL
                  </Link>
                )}
                {e.fileSharingSites?.length > 0 && (
                  <Link to={`/employee/${encodeURIComponent(e.username)}/${encodeURIComponent(e.computer)}`} style={{ marginLeft: 4, background:'var(--orange)', color:'#fff',
                    fontSize: 10, fontWeight: 700, borderRadius: 4, padding: '1px 6px', textDecoration:'none' }}>
                    📤 FILE SHARE
                  </Link>
                )}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{e.computer}</div>
            </div>

            {/* Status */}
            <div style={{ minWidth: 90 }}>
              <StatusDot status={e.status} />
              <div style={{ fontSize: 11, color:'var(--text-dim)', marginTop:3 }}>
                {e.vpnOn && <span style={{ color:'var(--orange)' }}>🔒 {e.vpnSoftware||'VPN'}</span>}
              </div>
            </div>

            {/* Login / Shutdown */}
            <div style={{ minWidth: 100 }}>
              <div style={{ fontSize: 12 }}>
                <span style={{ color:'var(--green)' }}>▶ {e.firstLogin || '--'}</span>
              </div>
              <div style={{ fontSize: 12 }}>
                <span style={{ color:'var(--red)' }}>⏹ {e.lastShutdown || '--'}</span>
              </div>
            </div>

            {/* Active / Idle */}
            <div style={{ minWidth: 110 }}>
              <div style={{ fontSize: 12 }}>Active: <strong style={{ color:'var(--green)' }}>{e.activeToday}</strong></div>
              <div style={{ fontSize: 12, color:'var(--text-dim)' }}>Idle: {e.idleToday}</div>
              <div style={{ fontSize: 11, color:'var(--text-dim)', marginTop:2 }}>
                🔒 {e.lockCount||0}x &nbsp; 🔓 {e.unlockCount||0}x
              </div>
            </div>

            {/* Work % bar */}
            <div style={{ minWidth: 140 }}>
              <div style={{ fontSize: 11, color:'var(--text-dim)', marginBottom:4 }}>Productivity</div>
              <div style={{ display:'flex', height:8, borderRadius:4, overflow:'hidden', width:'100%', background:'var(--border)' }}>
                <div style={{ width:`${e.workPct||0}%`, background:'var(--green)' }} title={`Work ${e.workPct}%`}/>
                <div style={{ width:`${e.commsPct||0}%`, background:'var(--accent)' }} title={`Comms ${e.commsPct}%`}/>
                <div style={{ width:`${e.nonworkPct||0}%`, background:'var(--red)' }} title={`Non-work ${e.nonworkPct}%`}/>
              </div>
              <div style={{ display:'flex', gap:8, marginTop:3, fontSize:10 }}>
                <span style={{color:'var(--green)'}}>Work {e.workPct||0}%</span>
                <span style={{color:'var(--accent)'}}>Comms {e.commsPct||0}%</span>
                <span style={{color:'var(--red)'}}>Other {e.nonworkPct||0}%</span>
              </div>
            </div>

            {/* Top Apps */}
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ fontSize: 11, color:'var(--text-dim)', marginBottom: 4 }}>Top Apps</div>
              <div style={{ display:'flex', gap: 6, flexWrap:'wrap' }}>
                {(e.top5||[]).slice(0,3).map((a,i) => (
                  <span key={i} style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 6,
                    background: APP_COLORS[i]+'22', color: APP_COLORS[i],
                    border: `1px solid ${APP_COLORS[i]}44`,
                  }}>{a.app}</span>
                ))}
              </div>
            </div>

            {/* Location + Serial + IP */}
            <div style={{ fontSize: 12, minWidth: 130 }}>
              <div style={{ color:'var(--text-dim)' }}>📍 {e.location}</div>
              <div style={{ color:'var(--text-dim)', fontSize:11 }}>🖥 {e.serial}</div>
              <div style={{ color:'var(--text-dim)', fontSize:11 }}>🌐 {e.ip}</div>
            </div>

            {/* View button */}
            <Link to={`/employee/${encodeURIComponent(e.username)}/${encodeURIComponent(e.computer)}`} style={{
              background: 'var(--accent)22', border: '1px solid var(--accent)44',
              color: 'var(--accent)', borderRadius: 8, padding: '6px 16px',
              fontSize: 13, fontWeight: 600, textDecoration: 'none', flexShrink: 0,
            }}>View →</Link>
          </div>
        ))}
      </div>
    </div>
  )
}
