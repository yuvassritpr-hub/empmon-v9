import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const PURPLE = '#4A1550'
const GOLD   = '#B8960C'
const GREEN  = '#1a7f4b'
const RED    = '#c0392b'
const YELLOW = '#d29922'
const BLUE   = '#1a5fa8'

const STATUS_COLOR = { Online: '#1a7f4b', Idle: '#d29922', Offline: '#c0392b' }
const APP_COLORS = ['#4A1550','#B8960C','#1a7f4b','#1a5fa8','#c0392b','#d29922','#7B3FA0','#2980b9']

function StatCard({ label, value, color, icon, sub }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12, padding: '20px 24px',
      flex: 1, minWidth: 150, boxShadow: '0 2px 12px rgba(74,21,80,0.08)',
      borderTop: `4px solid ${color}`, position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ fontSize: 28, fontWeight: 800, color, letterSpacing: -1 }}>{value}</div>
      <div style={{ fontSize: 13, color: '#666', marginTop: 4, fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{sub}</div>}
      <div style={{ position: 'absolute', right: 16, top: 16, fontSize: 26, opacity: 0.15 }}>{icon}</div>
    </div>
  )
}

function StatusBadge({ status }) {
  const color = STATUS_COLOR[status] || '#999'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: color + '15', color, border: `1px solid ${color}40`,
      borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700,
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: '50%', background: color, display: 'inline-block',
        animation: status === 'Online' ? 'pulse 2s infinite' : 'none',
      }}/>
      {status}
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

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#f7f4fa' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
        <div style={{ color: PURPLE, fontWeight: 600 }}>Loading dashboard...</div>
      </div>
    </div>
  )

  const pieData = [
    { name: 'Online',  value: data?.online  || 0 },
    { name: 'Idle',    value: data?.idle    || 0 },
    { name: 'Offline', value: data?.offline || 0 },
  ].filter(d => d.value > 0)

  const filtered = (data?.employees || []).filter(e =>
    !search || e.username.toLowerCase().includes(search.toLowerCase()) ||
    e.computer.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ background: '#f7f4fa', minHeight: '100vh', padding: 28 }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        .emp-row:hover { background: #f0eaf5 !important; }
        .emp-row { transition: background .15s; }
      `}</style>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 24, flexWrap:'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: PURPLE, margin: 0 }}>Employee Activity Dashboard</h1>
          <div style={{ fontSize: 12, color: '#888', marginTop: 3 }}>
            {new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
            {' · '}Auto-refresh every 60s
          </div>
        </div>
        <div style={{ display:'flex', gap: 8, alignItems:'center', flexWrap:'wrap' }}>
          <select id="reportMonth" defaultValue={new Date().toISOString().slice(0,7)}
            style={{ background:'#fff', border:`1px solid ${PURPLE}40`, color: PURPLE,
              borderRadius: 8, padding:'7px 12px', fontSize: 12, cursor:'pointer', fontWeight: 600 }}>
            {Array.from({length:6},(_,i)=>{
              const d=new Date(); d.setMonth(d.getMonth()-i);
              const v=d.toISOString().slice(0,7);
              return <option key={v} value={v}>{v}</option>
            })}
          </select>
          <a href="#" onClick={e=>{e.preventDefault();const m=document.getElementById('reportMonth').value;window.open(`/api/report/excel?month=${m}`,'_blank')}}
            style={{ background: GREEN, color:'#fff', borderRadius: 8,
              padding:'7px 16px', fontSize: 12, fontWeight: 700, textDecoration:'none' }}>
            ↓ Excel
          </a>
          <a href="#" onClick={e=>{e.preventDefault();const m=document.getElementById('reportMonth').value;window.open(`/api/report/pdf?month=${m}`,'_blank')}}
            style={{ background: RED, color:'#fff', borderRadius: 8,
              padding:'7px 16px', fontSize: 12, fontWeight: 700, textDecoration:'none' }}>
            ↓ PDF
          </a>
          <button onClick={load} style={{
            background: '#fff', border:`1px solid ${PURPLE}40`, color: PURPLE,
            borderRadius: 8, padding:'7px 14px', cursor:'pointer', fontSize: 12, fontWeight: 600,
          }}>↻ Refresh</button>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display:'flex', gap: 16, marginBottom: 24, flexWrap:'wrap' }}>
        <StatCard label="Total Employees" value={data?.total||0}      color={PURPLE} icon="👥" />
        <StatCard label="Online Now"       value={data?.online||0}     color={GREEN}  icon="🟢" sub="Active in last 10 min" />
        <StatCard label="Idle"             value={data?.idle||0}       color={YELLOW} icon="⏸" sub="Inactive 10-30 min" />
        <StatCard label="Offline"          value={data?.offline||0}    color={RED}    icon="🔴" sub="No activity 30+ min" />
        <StatCard label="Total Active Today" value={data?.totalActive||'0h'} color={BLUE} icon="⏱" />
      </div>

      {/* Chart + Search Row */}
      <div style={{ display:'flex', gap: 16, marginBottom: 24, alignItems:'flex-start', flexWrap:'wrap' }}>
        {pieData.length > 0 && (
          <div style={{ background:'#fff', borderRadius: 12, padding: 20, width: 200, flexShrink: 0,
            boxShadow:'0 2px 12px rgba(74,21,80,0.08)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: PURPLE, marginBottom: 8 }}>Status Overview</div>
            <ResponsiveContainer width="100%" height={130}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value">
                  {pieData.map(entry => <Cell key={entry.name} fill={STATUS_COLOR[entry.name]}/>)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border:`1px solid ${PURPLE}20`, fontSize: 12 }}/>
              </PieChart>
            </ResponsiveContainer>
            {pieData.map(d => (
              <div key={d.name} style={{ display:'flex', alignItems:'center', gap: 6, fontSize: 12, marginTop: 4 }}>
                <span style={{ width:10, height:10, borderRadius:2, background: STATUS_COLOR[d.name], display:'inline-block' }}/>
                <span style={{ color:'#555' }}>{d.name}:</span> <strong>{d.value}</strong>
              </div>
            ))}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 200 }}>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="🔍  Search by employee name or computer..."
            style={{ width:'100%', background:'#fff', border:`1px solid ${PURPLE}30`,
              borderRadius: 10, padding:'10px 16px', color:'#333', fontSize: 13,
              outline:'none', boxShadow:'0 2px 8px rgba(74,21,80,0.06)', boxSizing:'border-box' }}
          />
        </div>
      </div>

      {/* Employee Table */}
      <div style={{ background:'#fff', borderRadius: 14, boxShadow:'0 2px 16px rgba(74,21,80,0.08)', overflow:'hidden' }}>
        {/* Table Header */}
        <div style={{ display:'grid', gridTemplateColumns:'44px 200px 120px 100px 120px 160px 140px 130px 80px',
          padding:'12px 20px', background: PURPLE, color:'#fff', fontSize: 11, fontWeight: 700,
          letterSpacing: 0.5, gap: 8 }}>
          <div></div>
          <div>EMPLOYEE</div>
          <div>STATUS</div>
          <div>LOGIN</div>
          <div>ACTIVE / IDLE</div>
          <div>PRODUCTIVITY</div>
          <div>TOP APPS</div>
          <div>LOCATION / IP</div>
          <div>ACTION</div>
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign:'center', padding: '60px 0', color:'#999' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
            <div style={{ fontWeight: 600, color: PURPLE }}>No employees found</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Deploy agents on employee PCs to start monitoring</div>
          </div>
        )}

        {filtered.map((e, idx) => (
          <div key={`${e.username}-${e.computer}`}
            className="emp-row"
            style={{
              display:'grid', gridTemplateColumns:'44px 200px 120px 100px 120px 160px 140px 130px 80px',
              padding:'14px 20px', gap: 8, alignItems:'center',
              borderBottom: idx < filtered.length-1 ? `1px solid ${PURPLE}10` : 'none',
              background: e.socialSites?.length ? '#fff5f5' : '#fff',
            }}>

            {/* Avatar */}
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: `linear-gradient(135deg, ${PURPLE}, #7B3FA0)`,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontWeight: 700, fontSize: 13, color:'#fff', flexShrink: 0,
            }}>{e.username.slice(0,2).toUpperCase()}</div>

            {/* Name + PC */}
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color:'#1a1a1a' }}>
                {e.username}
                {e.socialSites?.length > 0 && (
                  <span style={{ marginLeft: 6, background: RED, color:'#fff',
                    fontSize: 9, fontWeight: 700, borderRadius: 4, padding:'1px 5px' }}>⚠ SOCIAL</span>
                )}
                {e.fileSharingSites?.length > 0 && (
                  <span style={{ marginLeft: 4, background: '#e67e22', color:'#fff',
                    fontSize: 9, fontWeight: 700, borderRadius: 4, padding:'1px 5px' }}>📤 FILE</span>
                )}
              </div>
              <div style={{ fontSize: 11, color:'#888', marginTop: 1 }}>{e.computer}</div>
              {e.serial && e.serial !== 'N/A' && <div style={{ fontSize: 10, color:'#bbb' }}>S/N: {e.serial}</div>}
            </div>

            {/* Status */}
            <div>
              <StatusBadge status={e.status}/>
              {e.vpnOn && <div style={{ fontSize: 10, color:'#e67e22', marginTop: 3 }}>🔒 VPN</div>}
            </div>

            {/* Login / Shutdown */}
            <div>
              <div style={{ fontSize: 12, color: GREEN, fontWeight: 600 }}>▶ {e.firstLogin||'--'}</div>
              <div style={{ fontSize: 12, color: RED }}>⏹ {e.lastShutdown||'--'}</div>
            </div>

            {/* Active / Idle */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color:'#1a1a1a' }}>{e.activeToday}</div>
              <div style={{ fontSize: 11, color:'#888' }}>Idle: {e.idleToday}</div>
              <div style={{ fontSize: 10, color:'#bbb', marginTop: 1 }}>🔒{e.lockCount||0} 🔓{e.unlockCount||0}</div>
            </div>

            {/* Productivity Bar */}
            <div>
              <div style={{ height: 7, borderRadius: 4, overflow:'hidden', background:'#eee', marginBottom: 5 }}>
                <div style={{ display:'flex', height:'100%' }}>
                  <div style={{ width:`${e.workPct||0}%`, background: GREEN }}/>
                  <div style={{ width:`${e.commsPct||0}%`, background: BLUE }}/>
                  <div style={{ width:`${e.nonworkPct||0}%`, background: RED }}/>
                </div>
              </div>
              <div style={{ display:'flex', gap: 6, fontSize: 10 }}>
                <span style={{ color: GREEN }}>W:{e.workPct||0}%</span>
                <span style={{ color: BLUE }}>C:{e.commsPct||0}%</span>
                <span style={{ color: RED }}>N:{e.nonworkPct||0}%</span>
              </div>
            </div>

            {/* Top Apps */}
            <div style={{ display:'flex', gap: 4, flexWrap:'wrap' }}>
              {(e.top5||[]).slice(0,3).map((a,i)=>(
                <span key={i} style={{ fontSize: 10, padding:'2px 7px', borderRadius: 5,
                  background: APP_COLORS[i]+'15', color: APP_COLORS[i],
                  border:`1px solid ${APP_COLORS[i]}30`, fontWeight: 600 }}>{a.app}</span>
              ))}
            </div>

            {/* Location + IP */}
            <div>
              <div style={{ fontSize: 11, color:'#555' }}>📍 {e.location||'--'}</div>
              <div style={{ fontSize: 10, color:'#888', fontFamily:'monospace' }}>🌐 {e.ip||'--'}</div>
            </div>

            {/* View Button */}
            <Link to={`/employee/${encodeURIComponent(e.username)}/${encodeURIComponent(e.computer)}`}
              style={{ background: PURPLE, color:'#fff', borderRadius: 8,
                padding:'6px 14px', fontSize: 12, fontWeight: 700,
                textDecoration:'none', textAlign:'center', whiteSpace:'nowrap' }}>
              View →
            </Link>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ textAlign:'center', marginTop: 24, fontSize: 11, color:'#bbb' }}>
        Pride Global · Employee Monitor v9.0 · Confidential — HR & Management Use Only
      </div>
    </div>
  )
}
