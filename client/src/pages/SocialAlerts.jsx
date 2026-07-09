import { useEffect, useState } from 'react'

const SITE_ICON = {
  'youtube':'▶️','instagram':'📸','facebook':'💬','whatsapp':'📱',
  'twitter':'🐦','x.com':'🐦','tiktok':'🎵','netflix':'🎬',
  'spotify':'🎧','discord':'💬','reddit':'🔴','telegram':'✈️',
}
function siteIcon(domain) {
  for (const [k,v] of Object.entries(SITE_ICON)) if (domain.includes(k)) return v
  return '🌐'
}
function siteCategory(domain) {
  if (['youtube','netflix','hotstar','spotify'].some(k=>domain.includes(k))) return {label:'Entertainment',color:'#fb8500'}
  if (['whatsapp','telegram','discord'].some(k=>domain.includes(k))) return {label:'Messaging',color:'#a371f7'}
  return {label:'Social Media',color:'#f85149'}
}

export default function SocialAlerts() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/alerts').then(r=>r.json()).then(d=>{setData(d);setLoading(false)}).catch(()=>setLoading(false))
  }, [])

  if (loading) return <div style={{padding:40,color:'var(--text-dim)'}}>Loading...</div>
  if (!data) return <div style={{padding:40,color:'var(--red)'}}>Failed to load</div>

  return (
    <div style={{padding:24}}>
      <div style={{marginBottom:24}}>
        <h1 style={{fontSize:20,fontWeight:700}}>⚠ Social Media Alerts</h1>
        <div style={{fontSize:12,color:'var(--text-dim)',marginTop:2}}>
          {data.today} · Detected from Chrome/Edge browser history
        </div>
      </div>

      {!data.alerts?.length && (
        <div style={{textAlign:'center',padding:60,color:'var(--text-dim)'}}>
          <div style={{fontSize:40,marginBottom:12}}>✅</div>
          <div style={{color:'var(--green)',fontWeight:600}}>No social media detected today</div>
          <div style={{fontSize:12,marginTop:8}}>Browser history scanned every 5 minutes via agent heartbeat</div>
        </div>
      )}

      {(data.alerts||[]).map(a=>(
        <div key={`${a.username}-${a.computer}`} style={{
          background:'var(--card)', border:'1px solid #f8514933',
          borderRadius:12, marginBottom:16, overflow:'hidden',
        }}>
          <div style={{
            background:'#f8514910', display:'flex', alignItems:'center',
            gap:14, padding:'12px 20px', borderBottom:'1px solid #f8514922',
          }}>
            <div style={{
              width:36,height:36,borderRadius:'50%',
              background:'#f8514933',display:'flex',alignItems:'center',
              justifyContent:'center',fontWeight:700,color:'#f85149',fontSize:14,
            }}>{a.username.slice(0,2).toUpperCase()}</div>
            <div>
              <span style={{fontWeight:700,color:'#f87171'}}>{a.username}</span>
              <span style={{fontSize:12,color:'var(--text-dim)',marginLeft:10}}>{a.computer}</span>
            </div>
            <div style={{marginLeft:'auto',background:'#f85149',color:'#fff',
              fontSize:11,fontWeight:700,borderRadius:6,padding:'3px 10px'}}>
              ⚠ {a.sites.length} site{a.sites.length!==1?'s':''}
            </div>
          </div>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{borderBottom:'1px solid var(--border)'}}>
                {['Site','Time Spent','Category'].map(h=>(
                  <th key={h} style={{padding:'8px 20px',textAlign:'left',fontSize:12,color:'var(--text-dim)',fontWeight:600}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {a.sites.map((s,i)=>{
                const cat = siteCategory(s.domain)
                return (
                  <tr key={i} style={{borderBottom:'1px solid var(--border)20'}}>
                    <td style={{padding:'10px 20px',fontWeight:600}}>
                      {siteIcon(s.domain)} {s.domain}
                    </td>
                    <td style={{padding:'10px 20px',color:'#f87171',fontWeight:600}}>{s.dur}</td>
                    <td style={{padding:'10px 20px'}}>
                      <span style={{color:cat.color,fontSize:12}}>{cat.label}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ))}

      {data.clean?.length > 0 && (
        <div style={{marginTop:24}}>
          <div style={{fontSize:12,color:'var(--text-dim)',marginBottom:8}}>✅ Clean employees (no social media):</div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {data.clean.map(u=>(
              <span key={u} style={{background:'#3fb95022',color:'var(--green)',
                border:'1px solid #3fb95044',borderRadius:6,padding:'3px 12px',fontSize:12}}>
                ✓ {u}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
