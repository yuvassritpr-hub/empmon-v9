import { useEffect, useState } from 'react'

const HOURS = Array.from({length:13}, (_,i) => i*2)

function pctToTime(pct) {
  const totalMin = Math.round(pct / 100 * 1440)
  const h = Math.floor(totalMin / 60), m = totalMin % 60
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`
}

export default function DailyTimeline() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/daily').then(r=>r.json()).then(d=>{setData(d);setLoading(false)}).catch(()=>setLoading(false))
  }, [])

  if (loading) return <div style={{padding:40,color:'var(--text-dim)'}}>Loading...</div>
  if (!data) return <div style={{padding:40,color:'var(--red)'}}>Failed to load</div>

  return (
    <div style={{padding:24}}>
      <div style={{marginBottom:24}}>
        <h1 style={{fontSize:20,fontWeight:700}}>⏱ Daily Timeline</h1>
        <div style={{fontSize:12,color:'var(--text-dim)',marginTop:2}}>{data.today} · 12AM to 11:59PM activity</div>
      </div>

      {/* Hour ruler */}
      <div style={{marginBottom:8,paddingLeft:220}}>
        <div style={{position:'relative',height:20}}>
          {HOURS.map(h=>(
            <span key={h} style={{
              position:'absolute', left:`${h/24*100}%`,
              fontSize:10, color:'var(--text-dim)', transform:'translateX(-50%)',
            }}>{String(h).padStart(2,'0')}:00</span>
          ))}
        </div>
      </div>

      {!data.employees?.length && (
        <div style={{textAlign:'center',padding:60,color:'var(--text-dim)'}}>
          <div style={{fontSize:40,marginBottom:12}}>📊</div>
          No employee data for today yet.
        </div>
      )}

      {(data.employees||[]).map(e => (
        <div key={`${e.username}-${e.computer}`} style={{
          background:'var(--card)', border:'1px solid var(--border)',
          borderRadius:12, marginBottom:12, overflow:'hidden',
        }}>
          {/* Header */}
          <div style={{
            display:'flex', alignItems:'center', gap:16,
            padding:'14px 20px', borderBottom:'1px solid var(--border)',
            flexWrap:'wrap',
          }}>
            <div style={{
              width:36,height:36,borderRadius:'50%',flexShrink:0,
              background:'linear-gradient(135deg,var(--accent),var(--purple))',
              display:'flex',alignItems:'center',justifyContent:'center',
              fontWeight:700,color:'#fff',fontSize:14,
            }}>{e.username.slice(0,2).toUpperCase()}</div>
            <div>
              <div style={{fontWeight:700}}>{e.username}</div>
              <div style={{fontSize:12,color:'var(--text-dim)'}}>{e.computer}</div>
            </div>
            <div style={{marginLeft:'auto',display:'flex',gap:20,flexWrap:'wrap'}}>
              {[
                {label:'Login',  value: e.loginT||'—',  color:'var(--green)'},
                {label:'Shutdown',value:e.logoutT||'—', color:'var(--red)'},
                {label:'Active', value:e.totalActive,   color:'var(--accent)'},
                {label:'Idle',   value:e.totalIdle,     color:'var(--yellow)'},
                {label:'Session',value:e.totalSession,  color:'var(--text)'},
              ].map(s=>(
                <div key={s.label} style={{textAlign:'center'}}>
                  <div style={{fontWeight:700,color:s.color,fontSize:14}}>{s.value}</div>
                  <div style={{fontSize:11,color:'var(--text-dim)'}}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div style={{padding:'16px 20px'}}>
            <div style={{display:'flex',gap:0,alignItems:'center'}}>
              {/* Name label */}
              <div style={{width:0,flexShrink:0}}/>
              {/* Bar */}
              <div style={{flex:1,position:'relative',height:32,background:'#0d1117',borderRadius:6,overflow:'hidden'}}>
                {/* Session span */}
                {e.loginPct != null && e.logoutPct != null && (
                  <div style={{
                    position:'absolute',top:0,height:'100%',
                    left:`${e.loginPct}%`,width:`${e.logoutPct-e.loginPct}%`,
                    border:'1px solid rgba(68,147,248,.3)',borderRadius:4,
                    boxSizing:'border-box',pointerEvents:'none',
                  }}/>
                )}
                {/* Segments */}
                {(e.segments||[]).map((seg,i)=>(
                  <div key={i} title={`${seg.app} (${pctToTime(seg.left)} - ${pctToTime(seg.left+seg.width)})`}
                    style={{
                      position:'absolute',top:2,height:'calc(100% - 4px)',
                      left:`${seg.left}%`,width:`${seg.width}%`,
                      background: seg.cls==='active'
                        ? 'linear-gradient(90deg,#1f6feb,#4493f8)'
                        : 'linear-gradient(90deg,#9e6a03,#d29922)',
                      borderRadius:2,opacity:seg.cls==='active'?1:0.7,
                      cursor:'pointer',
                    }}/>
                ))}
                {/* Login marker */}
                {e.loginPct!=null && (
                  <div style={{position:'absolute',top:0,left:`${e.loginPct}%`,height:'100%',
                    width:2,background:'var(--green)',transform:'translateX(-50%)'}}
                    title={`Login: ${e.loginT}`}/>
                )}
                {/* Logout marker */}
                {e.logoutPct!=null && (
                  <div style={{position:'absolute',top:0,left:`${e.logoutPct}%`,height:'100%',
                    width:2,background:'var(--red)',transform:'translateX(-50%)'}}
                    title={`Shutdown: ${e.logoutT}`}/>
                )}
              </div>
            </div>
            {/* Marker labels */}
            <div style={{position:'relative',height:18,marginTop:4}}>
              {e.loginPct!=null && (
                <div style={{position:'absolute',left:`${e.loginPct}%`,transform:'translateX(-50%)',
                  fontSize:10,color:'var(--green)',fontWeight:700,whiteSpace:'nowrap'}}>
                  ▶ {e.loginT}
                </div>
              )}
              {e.logoutPct!=null && (
                <div style={{position:'absolute',left:`${e.logoutPct}%`,transform:'translateX(-50%)',
                  fontSize:10,color:'var(--red)',fontWeight:700,whiteSpace:'nowrap'}}>
                  ⏹ {e.logoutT}
                </div>
              )}
              {(e.locks||[]).map((lk,i)=>lk.pct!=null&&(
                <div key={i} style={{position:'absolute',left:`${lk.pct}%`,transform:'translateX(-50%)',
                  fontSize:10,color:'var(--text-dim)',whiteSpace:'nowrap'}}>🔒</div>
              ))}
            </div>
            {/* Legend */}
            <div style={{display:'flex',gap:16,marginTop:8,fontSize:11,color:'var(--text-dim)'}}>
              <span><span style={{display:'inline-block',width:10,height:10,borderRadius:2,background:'#4493f8',marginRight:4}}/>Active</span>
              <span><span style={{display:'inline-block',width:10,height:10,borderRadius:2,background:'#d29922',marginRight:4}}/>Idle</span>
              <span><span style={{display:'inline-block',width:2,height:10,background:'var(--green)',marginRight:4,verticalAlign:'middle'}}/>Login</span>
              <span><span style={{display:'inline-block',width:2,height:10,background:'var(--red)',marginRight:4,verticalAlign:'middle'}}/>Shutdown</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
