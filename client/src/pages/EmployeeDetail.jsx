import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const APP_COLORS = ['#4493f8','#a371f7','#3fb950','#fb8500','#f85149','#d29922','#58a6ff','#bc8cff','#79c0ff','#ffb938']

export default function EmployeeDetail() {
  const { username, computer } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/employee/${username}/${computer}`)
      .then(r=>r.json()).then(d=>{setData(d);setLoading(false)}).catch(()=>setLoading(false))
  }, [username, computer])

  if (loading) return <div style={{padding:40,color:'var(--text-dim)'}}>Loading...</div>
  if (!data) return <div style={{padding:40,color:'var(--red)'}}>Failed to load</div>

  const chartData = (data.topApps||[]).slice(0,8).map(a=>({name:a.app,hours:+(a.secs/3600).toFixed(2)}))

  return (
    <div style={{padding:24}}>
      <div style={{marginBottom:20}}>
        <Link to="/" style={{fontSize:13,color:'var(--text-dim)'}}>← Dashboard</Link>
      </div>

      {/* Profile header */}
      <div style={{
        background:'var(--card)',border:'1px solid var(--border)',
        borderRadius:12,padding:'20px 24px',marginBottom:20,
        display:'flex',alignItems:'center',gap:20,flexWrap:'wrap',
      }}>
        <div style={{
          width:56,height:56,borderRadius:'50%',
          background:'linear-gradient(135deg,var(--accent),var(--purple))',
          display:'flex',alignItems:'center',justifyContent:'center',
          fontWeight:700,fontSize:22,color:'#fff',
        }}>{username.slice(0,2).toUpperCase()}</div>
        <div>
          <h2 style={{fontSize:20,fontWeight:700}}>{username}</h2>
          <div style={{fontSize:13,color:'var(--text-dim)'}}>{computer} · {data.location} · {data.ip}</div>
          <div style={{fontSize:12,color:'var(--text-dim)',marginTop:2}}>Serial: {data.serial}</div>
        </div>
        <div style={{marginLeft:'auto',display:'flex',gap:24,flexWrap:'wrap'}}>
          {[
            {label:'Login',    value:data.firstLogin||'--',   color:'var(--green)'},
            {label:'Shutdown', value:data.lastShutdown||'--', color:'var(--red)'},
            {label:'Active',   value:data.activeToday,        color:'var(--accent)'},
            {label:'Idle',     value:data.idleToday,          color:'var(--yellow)'},
            {label:'Days/Month',value:`${data.daysWorked} days`,color:'var(--text)'},
            {label:'Month Active',value:data.monthActive,      color:'var(--purple)'},
          ].map(s=>(
            <div key={s.label} style={{textAlign:'center'}}>
              <div style={{fontWeight:700,color:s.color,fontSize:15}}>{s.value}</div>
              <div style={{fontSize:11,color:'var(--text-dim)'}}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
        {/* App Usage Chart */}
        <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,padding:20}}>
          <div style={{fontWeight:600,marginBottom:16}}>App Usage Today</div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} layout="vertical" margin={{left:0}}>
                <XAxis type="number" tick={{fontSize:11,fill:'var(--text-dim)'}} />
                <YAxis type="category" dataKey="name" width={80} tick={{fontSize:11,fill:'var(--text)'}} />
                <Tooltip
                  contentStyle={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:8}}
                  formatter={(v)=>[`${v}h`,'Hours']}
                />
                <Bar dataKey="hours" radius={4}>
                  {chartData.map((_,i)=><Cell key={i} fill={APP_COLORS[i%APP_COLORS.length]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div style={{color:'var(--text-dim)',fontSize:13,padding:'20px 0'}}>No app data today</div>}
        </div>

        {/* Browser Sites */}
        <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,padding:20}}>
          <div style={{fontWeight:600,marginBottom:16}}>Browser Sites Today</div>
          {data.browserSites?.length > 0 ? (
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {data.browserSites.slice(0,8).map((s,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:10}}>
                  <div style={{width:6,height:6,borderRadius:'50%',background:APP_COLORS[i%APP_COLORS.length],flexShrink:0}}/>
                  <div style={{flex:1,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.domain}</div>
                  <div style={{fontSize:12,color:'var(--text-dim)',flexShrink:0}}>{Math.floor((s.secs||0)/60)}m</div>
                </div>
              ))}
            </div>
          ) : <div style={{color:'var(--text-dim)',fontSize:13,padding:'20px 0'}}>No browser data yet</div>}
        </div>
      </div>

      {/* Social Media Alerts */}
      {data.socialAlerts?.length > 0 && (
        <div style={{background:'#f8514910',border:'1px solid #f8514933',borderRadius:12,padding:20,marginBottom:20}}>
          <div style={{fontWeight:600,color:'#f87171',marginBottom:12}}>⚠ Social Media Detected</div>
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            {data.socialAlerts.map((s,i)=>(
              <span key={i} style={{background:'#f8514922',color:'#f87171',border:'1px solid #f8514944',
                borderRadius:8,padding:'4px 12px',fontSize:12}}>
                {s.site} · {s.dur}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Calendar */}
      <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,padding:20}}>
        <div style={{fontWeight:600,marginBottom:16}}>Last 30 Days</div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          {(data.cal||[]).map(d=>(
            <div key={d.date} style={{
              background: d.worked ? 'var(--accent)22' : '#ffffff08',
              border: `1px solid ${d.worked ? 'var(--accent)44' : 'var(--border)'}`,
              borderRadius:8,padding:'8px 10px',minWidth:88,
            }}>
              <div style={{fontSize:11,color:'var(--accent)',fontWeight:600}}>{d.day}</div>
              {d.worked ? <>
                <div style={{fontSize:14,fontWeight:700,marginTop:2}}>{d.dec}h</div>
                {d.login!=='--' && <div style={{fontSize:10,color:'var(--green)',marginTop:2}}>▶ {d.login}</div>}
                {d.logout!=='--' && <div style={{fontSize:10,color:'var(--red)'}}>⏹ {d.logout}</div>}
                <div style={{fontSize:10,color:'var(--accent)'}}>Act: {d.active}</div>
                {d.idle!=='0h 00m 00s' && <div style={{fontSize:10,color:'var(--yellow)'}}>Idle: {d.idle}</div>}
              </> : <div style={{fontSize:20,color:'var(--border)',marginTop:4}}>—</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
