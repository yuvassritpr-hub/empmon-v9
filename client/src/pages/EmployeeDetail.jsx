import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const APP_COLORS = ['#4493f8','#a371f7','#3fb950','#fb8500','#f85149','#d29922','#58a6ff','#bc8cff','#79c0ff','#ffb938']

function TitlePanel({ label, color, pct, apps, titles }) {
  return (
    <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,padding:20}}>
      {/* Header with % bar */}
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:14,flexWrap:'wrap'}}>
        <span style={{width:10,height:10,borderRadius:2,background:color,display:'inline-block',flexShrink:0}}/>
        <span style={{fontWeight:700,color,fontSize:14}}>{label} · {pct}%</span>
        <div style={{flex:1,minWidth:80,height:6,background:'var(--border)',borderRadius:3,overflow:'hidden'}}>
          <div style={{height:'100%',width:`${pct}%`,background:color,borderRadius:3}}/>
        </div>
      </div>
      {/* App badges row */}
      {apps.length > 0 && (
        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:14}}>
          {apps.map((a,i)=>(
            <span key={i} style={{fontSize:11,padding:'2px 8px',borderRadius:6,
              background:color+'22',color,border:`1px solid ${color}44`}}>
              {a.app} · {a.dur}
            </span>
          ))}
        </div>
      )}
      {/* Window title list */}
      {titles.length > 0 ? titles.map((t,i)=>(
        <div key={i} style={{marginBottom:8}}>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:2,gap:8}}>
            <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1,title:t.title}}>{t.title}</span>
            <span style={{color:'var(--text-dim)',flexShrink:0,fontSize:11}}>{t.dur} · {t.pct}%</span>
          </div>
          <div style={{height:4,background:'var(--border)',borderRadius:2,overflow:'hidden'}}>
            <div style={{height:'100%',width:`${t.pct}%`,background:color,borderRadius:2,opacity:0.8}}/>
          </div>
        </div>
      )) : <div style={{color:'var(--text-dim)',fontSize:12}}>No activity</div>}
    </div>
  )
}

export default function EmployeeDetail() {
  const { username, computer } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(null)
  const [dayData, setDayData] = useState(null)
  const [dayLoading, setDayLoading] = useState(false)
  const drillRef = useRef(null)

  useEffect(() => {
    fetch(`/api/employee/${encodeURIComponent(username)}/${encodeURIComponent(computer)}`)
      .then(r=>r.json()).then(d=>{setData(d);setLoading(false)}).catch(()=>setLoading(false))
  }, [username, computer])

  const loadDay = useCallback((date) => {
    if (selectedDate === date) { setSelectedDate(null); setDayData(null); return }
    setSelectedDate(date)
    setDayLoading(true)
    fetch(`/api/employee/${encodeURIComponent(username)}/${encodeURIComponent(computer)}?date=${date}`)
      .then(r=>r.json()).then(d=>{
        setDayData(d);setDayLoading(false);
        setTimeout(()=>drillRef.current?.scrollIntoView({behavior:'smooth',block:'start'}),100)
      }).catch(()=>setDayLoading(false))
  }, [username, computer, selectedDate])

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

      {/* Login / Shutdown / Lock / Unlock times */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
        {[
          { label:'Login Times',    times: data.loginTimes||[],    color:'var(--green)',  icon:'▶' },
          { label:'Shutdown Times', times: data.shutdownTimes||[], color:'var(--red)',    icon:'⏹' },
          { label:'Lock Times',     times: data.lockTimes||[],     color:'var(--yellow)', icon:'🔒' },
          { label:'Unlock Times',   times: data.unlockTimes||[],   color:'var(--accent)', icon:'🔓' },
        ].map(({label,times,color,icon})=>(
          <div key={label} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,padding:16}}>
            <div style={{fontSize:12,fontWeight:700,color,marginBottom:10}}>{icon} {label}</div>
            {times.length > 0
              ? <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                  {times.map((t,i)=>(
                    <span key={i} style={{fontSize:12,padding:'3px 8px',borderRadius:6,
                      background:color+'18',color,border:`1px solid ${color}33`,fontWeight:600}}>
                      {t}
                    </span>
                  ))}
                </div>
              : <div style={{fontSize:12,color:'var(--text-dim)'}}>—</div>
            }
          </div>
        ))}
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

      {/* Work / Comms / Non-work Details (ActivityWatch style) */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        {/* Work Details */}
        <TitlePanel
          label="Work Details" color="var(--green)" pct={data.workPct||0}
          apps={data.workApps||[]} titles={data.workTitleList||[]}
        />
        {/* Comms Details */}
        <TitlePanel
          label="Comms Details" color="var(--accent)" pct={data.commsPct||0}
          apps={data.commsApps||[]} titles={data.commsTitleList||[]}
        />
      </div>

      {/* Gmail Accounts + Top Tabs + File Sharing */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,marginBottom:20}}>

        {/* Gmail / Email Accounts */}
        <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,padding:20}}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:12}}>📧 Email Accounts Used</div>
          {(data.gmailList||[]).length > 0 ? (data.gmailList||[]).map((g,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:8,padding:'6px 10px',
              background:'#4493f818',borderRadius:8,border:'1px solid #4493f830'}}>
              <span>📬</span>
              <div style={{flex:1,overflow:'hidden'}}>
                <div style={{fontSize:12,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{g.email}</div>
                <div style={{fontSize:11,color:'var(--text-dim)'}}>{g.dur}</div>
              </div>
              {i===0 && <span style={{fontSize:10,background:'var(--accent)',color:'#fff',borderRadius:4,padding:'1px 5px',flexShrink:0}}>Top</span>}
            </div>
          )) : <div style={{color:'var(--text-dim)',fontSize:12}}>No email accounts detected</div>}
        </div>

        {/* Most Used Browser Tabs */}
        <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,padding:20}}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:12}}>🌐 Most Used Browser Tabs</div>
          {(data.topTabs||[]).length > 0 ? (data.topTabs||[]).map((t,i)=>(
            <div key={i} style={{marginBottom:8}}>
              <div style={{display:'flex',justifyContent:'space-between',gap:8,fontSize:12,marginBottom:2}}>
                <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>{t.title}</span>
                <span style={{color:'var(--text-dim)',flexShrink:0,fontSize:11}}>{t.dur}</span>
              </div>
              <div style={{height:3,background:'var(--border)',borderRadius:2,overflow:'hidden'}}>
                <div style={{height:'100%',width:`${Math.round(t.secs/((data.topTabs[0]?.secs)||1)*100)}%`,background:'var(--accent)',borderRadius:2}}/>
              </div>
            </div>
          )) : <div style={{color:'var(--text-dim)',fontSize:12}}>No browser tab data</div>}
        </div>

        {/* File Sharing Alerts */}
        <div style={{background:'var(--card)',border:`1px solid ${(data.fileSharingSites||[]).length?'#fb850044':'var(--border)'}`,borderRadius:12,padding:20}}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:12,color:(data.fileSharingSites||[]).length?'var(--orange)':'var(--text)'}}>
            📤 File Sharing Sites
          </div>
          {(data.fileSharingSites||[]).length > 0 ? (data.fileSharingSites||[]).map((s,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:8,padding:'6px 10px',
              background:'#fb850018',borderRadius:8,border:'1px solid #fb850030'}}>
              <span>📁</span>
              <div>
                <div style={{fontSize:12,fontWeight:600}}>{s.domain}</div>
                <div style={{fontSize:11,color:'var(--text-dim)'}}>{s.dur}</div>
              </div>
            </div>
          )) : <div style={{color:'var(--green)',fontSize:12}}>✓ No file sharing detected</div>}
        </div>
      </div>

      {/* Non-Work / Social */}
      {((data.nonworkTitleList||[]).length > 0 || (data.socialAlerts||[]).length > 0) && (
        <div style={{background:'var(--card)',border:'1px solid #f8514933',borderRadius:12,padding:20,marginBottom:20}}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:14,flexWrap:'wrap'}}>
            <span style={{width:10,height:10,borderRadius:2,background:'var(--red)',display:'inline-block',flexShrink:0}}/>
            <span style={{fontWeight:700,color:'var(--red)',fontSize:14}}>Non-Work / Social · {data.nonworkPct||0}%</span>
            <div style={{flex:1,minWidth:80,height:6,background:'var(--border)',borderRadius:3,overflow:'hidden'}}>
              <div style={{height:'100%',width:`${data.nonworkPct||0}%`,background:'var(--red)',borderRadius:3}}/>
            </div>
          </div>
          <div style={{display:'flex',gap:20,flexWrap:'wrap'}}>
            {/* App summary */}
            <div style={{minWidth:160}}>
              {(data.nonworkApps||[]).map((a,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                  <span style={{fontSize:10,background:'#f8514922',color:'#f87171',border:'1px solid #f8514944',borderRadius:4,padding:'1px 6px',flexShrink:0}}>{a.app}</span>
                  <span style={{fontSize:12,color:'var(--text-dim)'}}>{a.dur}</span>
                </div>
              ))}
            </div>
            {/* Title list */}
            <div style={{flex:1}}>
              {(data.nonworkTitleList||[]).map((t,i)=>(
                <div key={i} style={{marginBottom:7}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:2,gap:8}}>
                    <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>{t.title}</span>
                    <span style={{color:'var(--text-dim)',flexShrink:0,fontSize:11}}>{t.dur} · {t.pct}%</span>
                  </div>
                  <div style={{height:4,background:'var(--border)',borderRadius:2,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${t.pct}%`,background:'var(--red)',borderRadius:2}}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {(data.socialAlerts||[]).length > 0 && (
            <div style={{marginTop:12,paddingTop:12,borderTop:'1px solid #f8514933',display:'flex',gap:8,flexWrap:'wrap'}}>
              <span style={{fontSize:11,color:'var(--red)',fontWeight:600}}>⚠ Social sites:</span>
              {data.socialAlerts.map((s,i)=>(
                <span key={i} style={{background:'#f8514922',color:'#f87171',border:'1px solid #f8514944',borderRadius:6,padding:'2px 10px',fontSize:11}}>
                  {s.site} · {s.dur}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Calendar — click any day to see full details */}
      <style>{`
        .cal-tile:hover { filter: brightness(1.3); transform: scale(1.05) !important; }
        .cal-tile { transition: all .15s ease; }
      `}</style>
      <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,padding:20}}>
        <div style={{fontWeight:600,marginBottom:4}}>Last 30 Days — <span style={{color:'var(--accent)',fontWeight:400,fontSize:12}}>click any date to see that day's data</span></div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:12}}>
          {(data.cal||[]).map(d=>{
            const isSelected = selectedDate === d.date
            return (
              <div key={d.date} className="cal-tile"
                onClick={() => loadDay(d.date)}
                style={{
                  background: isSelected ? '#4493f8' : d.worked ? 'var(--accent)22' : '#ffffff08',
                  border: `2px solid ${isSelected ? '#4493f8' : d.worked ? 'var(--accent)66' : 'var(--border)'}`,
                  borderRadius:8, padding:'8px 10px', minWidth:88,
                  cursor:'pointer',
                  transform: isSelected ? 'scale(1.06)' : 'scale(1)',
                  boxShadow: isSelected ? '0 4px 16px rgba(68,147,248,.4)' : 'none',
                }}>
                <div style={{fontSize:11,fontWeight:700,color: isSelected ? '#fff' : d.worked ? 'var(--accent)' : 'var(--text-dim)'}}>{d.day}</div>
                {d.worked ? <>
                  <div style={{fontSize:14,fontWeight:700,marginTop:2,color: isSelected ? '#fff' : 'var(--text)'}}>{d.dec}h</div>
                  {d.login!=='--' && <div style={{fontSize:10,color: isSelected ? '#cfffcf' : 'var(--green)',marginTop:2}}>▶ {d.login}</div>}
                  {d.logout!=='--' && <div style={{fontSize:10,color: isSelected ? '#ffc8c8' : 'var(--red)'}}>⏹ {d.logout}</div>}
                  <div style={{fontSize:10,color: isSelected ? '#c8e8ff' : 'var(--accent)'}}>Act: {d.active}</div>
                </> : <div style={{fontSize:11,color:'var(--text-dim)',marginTop:6}}>no data</div>}
              </div>
            )
          })}
        </div>
      </div>

      {/* IP History Table */}
      {(data.cal||[]).some(d=>d.ips?.length>0) && (
        <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,padding:20,marginTop:16}}>
          <div style={{fontWeight:600,marginBottom:12}}>🌐 IP & Location History — Last 30 Days</div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead>
                <tr style={{borderBottom:'1px solid var(--border)'}}>
                  {['Date','Day','IP Address','Location'].map(h=>(
                    <th key={h} style={{textAlign:'left',padding:'6px 12px',color:'var(--text-dim)',fontWeight:600,whiteSpace:'nowrap'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data.cal||[]).filter(d=>d.worked||d.ips?.length>0).map((d,i)=>(
                  <tr key={d.date} style={{borderBottom:'1px solid var(--border)',background:i%2===0?'transparent':'#ffffff05'}}>
                    <td style={{padding:'6px 12px',color:'var(--accent)',fontWeight:600}}>{d.date}</td>
                    <td style={{padding:'6px 12px',color:'var(--text-dim)'}}>{d.day}</td>
                    <td style={{padding:'6px 12px'}}>
                      {d.ips?.length>0
                        ? d.ips.map((ip,j)=>(
                            <span key={j} style={{display:'inline-block',marginRight:6,padding:'2px 8px',
                              background:'#4493f818',border:'1px solid #4493f833',borderRadius:4,
                              color:'var(--text)',fontFamily:'monospace'}}>{ip}</span>
                          ))
                        : <span style={{color:'var(--text-dim)'}}>—</span>}
                    </td>
                    <td style={{padding:'6px 12px',color:'var(--text-dim)'}}>{d.location||'—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Day drill-down panel */}
      {selectedDate && (
        <div ref={drillRef} style={{background:'var(--card)',border:'2px solid var(--accent)',borderRadius:12,padding:20,marginTop:16}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
            <div>
              <span style={{fontWeight:700,fontSize:15}}>📅 {selectedDate}</span>
              <span style={{fontSize:12,color:'var(--text-dim)',marginLeft:10}}>Detailed breakdown for this day</span>
            </div>
            <button onClick={()=>{setSelectedDate(null);setDayData(null)}} style={{
              background:'transparent',border:'1px solid var(--border)',color:'var(--text-dim)',
              borderRadius:6,padding:'4px 10px',cursor:'pointer',fontSize:12
            }}>✕ Close</button>
          </div>
          {dayLoading && <div style={{color:'var(--text-dim)'}}>Loading...</div>}
          {dayData && !dayLoading && (
            <>
              {/* Day stats */}
              <div style={{display:'flex',gap:20,flexWrap:'wrap',marginBottom:16,paddingBottom:16,borderBottom:'1px solid var(--border)'}}>
                {[
                  {label:'Login',    value:dayData.firstLogin||'--',  color:'var(--green)'},
                  {label:'Shutdown', value:dayData.lastShutdown||'--',color:'var(--red)'},
                  {label:'Active',   value:dayData.activeToday,       color:'var(--accent)'},
                  {label:'Idle',     value:dayData.idleToday,         color:'var(--yellow)'},
                  {label:'Work',     value:(dayData.workPct||0)+'%',  color:'var(--green)'},
                  {label:'Comms',    value:(dayData.commsPct||0)+'%', color:'var(--accent)'},
                  {label:'Non-Work', value:(dayData.nonworkPct||0)+'%',color:'var(--red)'},
                ].map(s=>(
                  <div key={s.label} style={{textAlign:'center'}}>
                    <div style={{fontWeight:700,color:s.color,fontSize:15}}>{s.value}</div>
                    <div style={{fontSize:11,color:'var(--text-dim)'}}>{s.label}</div>
                  </div>
                ))}
                <div style={{marginLeft:'auto',display:'flex',flexDirection:'column',gap:4,alignItems:'flex-end'}}>
                  {dayData.ip && dayData.ip!=='N/A' && <div style={{fontSize:12,color:'var(--text-dim)'}}>🌐 IP: <strong style={{color:'var(--text)'}}>{dayData.ip}</strong></div>}
                  {dayData.location && dayData.location!=='N/A' && <div style={{fontSize:12,color:'var(--text-dim)'}}>📍 <strong style={{color:'var(--text)'}}>{dayData.location}</strong></div>}
                </div>
              </div>
              {/* Day work + comms details */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                <div>
                  <div style={{fontWeight:700,color:'var(--green)',fontSize:12,marginBottom:8}}>Work Details</div>
                  {(dayData.workTitleList||[]).length > 0
                    ? (dayData.workTitleList||[]).map((t,i)=>(
                        <div key={i} style={{marginBottom:6}}>
                          <div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:2,gap:8}}>
                            <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>{t.title}</span>
                            <span style={{color:'var(--text-dim)',flexShrink:0}}>{t.dur}</span>
                          </div>
                          <div style={{height:3,background:'var(--border)',borderRadius:2,overflow:'hidden'}}>
                            <div style={{height:'100%',width:`${t.pct}%`,background:'var(--green)',borderRadius:2}}/>
                          </div>
                        </div>
                      ))
                    : <div style={{color:'var(--text-dim)',fontSize:12}}>No work activity</div>}
                </div>
                <div>
                  <div style={{fontWeight:700,color:'var(--accent)',fontSize:12,marginBottom:8}}>Comms Details</div>
                  {(dayData.commsTitleList||[]).length > 0
                    ? (dayData.commsTitleList||[]).map((t,i)=>(
                        <div key={i} style={{marginBottom:6}}>
                          <div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:2,gap:8}}>
                            <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>{t.title}</span>
                            <span style={{color:'var(--text-dim)',flexShrink:0}}>{t.dur}</span>
                          </div>
                          <div style={{height:3,background:'var(--border)',borderRadius:2,overflow:'hidden'}}>
                            <div style={{height:'100%',width:`${t.pct}%`,background:'var(--accent)',borderRadius:2}}/>
                          </div>
                        </div>
                      ))
                    : <div style={{color:'var(--text-dim)',fontSize:12}}>No comms activity</div>}
                </div>
              </div>
              {/* Day top apps */}
              {(dayData.topApps||[]).length > 0 && (
                <div style={{marginTop:14,paddingTop:14,borderTop:'1px solid var(--border)'}}>
                  <div style={{fontWeight:700,fontSize:12,marginBottom:8}}>Top Apps</div>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                    {dayData.topApps.map((a,i)=>(
                      <span key={i} style={{fontSize:11,padding:'2px 10px',borderRadius:6,
                        background:APP_COLORS[i%APP_COLORS.length]+'22',color:APP_COLORS[i%APP_COLORS.length],
                        border:`1px solid ${APP_COLORS[i%APP_COLORS.length]}44`}}>
                        {a.app} · {a.dur}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {/* Day social alerts */}
              {(dayData.socialAlerts||[]).length > 0 && (
                <div style={{marginTop:14,paddingTop:14,borderTop:'1px solid #f8514933'}}>
                  <div style={{fontWeight:700,fontSize:12,color:'var(--red)',marginBottom:8}}>⚠ Social Media Alerts</div>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                    {dayData.socialAlerts.map((s,i)=>(
                      <span key={i} style={{background:'#f8514922',color:'#f87171',
                        border:'1px solid #f8514944',borderRadius:6,padding:'3px 10px',fontSize:12,fontWeight:600}}>
                        {s.site} · {s.dur}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {/* Day shutdown times */}
              {(dayData.shutdownTimes||[]).length > 0 && (
                <div style={{marginTop:14,paddingTop:14,borderTop:'1px solid var(--border)'}}>
                  <div style={{fontWeight:700,fontSize:12,color:'var(--red)',marginBottom:8}}>⏹ Shutdown Times</div>
                  <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                    {dayData.shutdownTimes.map((t,i)=>(
                      <span key={i} style={{background:'#f8514918',color:'var(--red)',
                        border:'1px solid #f8514933',borderRadius:6,padding:'3px 10px',fontSize:12,fontWeight:600}}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
