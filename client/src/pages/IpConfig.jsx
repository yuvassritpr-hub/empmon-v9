import { useEffect, useState } from 'react'

const PURPLE = '#4A1550'
const GREEN  = '#1a7f4b'
const RED    = '#c0392b'
const GOLD   = '#B8960C'

const COUNTRIES = [
  'India','Kenya','Ghana','Cameroon','UAE (Dubai)','Singapore',
  'Nigeria','South Africa','UK','USA','Other'
]

export default function IpConfig() {
  const [configs, setConfigs] = useState([])
  const [form, setForm] = useState({ ip_prefix:'', location_name:'', country:'India', is_office:true })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const load = () => fetch('/api/ipconfig').then(r=>r.json()).then(setConfigs).catch(()=>{})

  useEffect(() => { load() }, [])

  const save = async (e) => {
    e.preventDefault()
    if (!form.ip_prefix || !form.location_name) return setMsg('Please fill IP and Location name')
    setSaving(true); setMsg('')
    try {
      const r = await fetch('/api/ipconfig', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) })
      const d = await r.json()
      if (d.status === 'ok') { setMsg('✅ Saved!'); setForm({ ip_prefix:'', location_name:'', country:'India', is_office:true }); load() }
      else setMsg('❌ Error: ' + d.error)
    } catch { setMsg('❌ Failed to save') }
    setSaving(false)
  }

  const del = async (id) => {
    if (!window.confirm('Delete this IP config?')) return
    await fetch(`/api/ipconfig/${id}`, { method:'DELETE' })
    load()
  }

  return (
    <div style={{ background:'#f7f4fa', minHeight:'100vh', padding:28, fontFamily:"'Segoe UI',Arial,sans-serif" }}>
      <h1 style={{ fontSize:20, fontWeight:800, color:PURPLE, margin:'0 0 6px' }}>🌍 IP Location Config</h1>
      <p style={{ color:'#888', fontSize:13, margin:'0 0 24px' }}>
        Map office IP addresses to locations. The system will automatically show the correct office name for each employee.
      </p>

      {/* How it works */}
      <div style={{ background:'#fff8e1', border:`1px solid ${GOLD}44`, borderRadius:12, padding:16, marginBottom:24 }}>
        <div style={{ fontWeight:700, color:GOLD, marginBottom:8 }}>📖 How to use</div>
        <div style={{ fontSize:13, color:'#555', lineHeight:1.8 }}>
          1. Go to any office PC → open browser → visit <strong>whatismyip.com</strong><br/>
          2. Note the IP address shown (e.g. <code>106.219.165.174</code>)<br/>
          3. Enter the <strong>first 3 parts</strong> as prefix (e.g. <code>106.219.</code>) to match all IPs from that office<br/>
          4. Or enter the <strong>full IP</strong> if the office has a fixed/static IP<br/>
          5. Click Save — done! All employees using that IP will show the correct location.
        </div>
      </div>

      {/* Add new */}
      <div style={{ background:'#fff', borderRadius:14, boxShadow:'0 2px 16px rgba(74,21,80,0.08)', padding:24, marginBottom:24 }}>
        <div style={{ fontWeight:700, color:PURPLE, marginBottom:16, fontSize:15 }}>➕ Add Office IP</div>
        <form onSubmit={save}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 160px 140px auto', gap:12, alignItems:'end', flexWrap:'wrap' }}>

            <div>
              <label style={{ fontSize:11, fontWeight:700, color:PURPLE, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>IP Address / Prefix</label>
              <input value={form.ip_prefix} onChange={e=>setForm({...form,ip_prefix:e.target.value})}
                placeholder="e.g. 106.219. or 103.216.179.14"
                style={{ width:'100%', padding:'10px 12px', border:`2px solid #e8e0f0`, borderRadius:8, fontSize:13, boxSizing:'border-box' }}/>
              <div style={{ fontSize:10, color:'#999', marginTop:3 }}>Use prefix (106.219.) for dynamic IPs, full IP for static</div>
            </div>

            <div>
              <label style={{ fontSize:11, fontWeight:700, color:PURPLE, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>Office / Location Name</label>
              <input value={form.location_name} onChange={e=>setForm({...form,location_name:e.target.value})}
                placeholder="e.g. Pride Global Mumbai"
                style={{ width:'100%', padding:'10px 12px', border:`2px solid #e8e0f0`, borderRadius:8, fontSize:13, boxSizing:'border-box' }}/>
            </div>

            <div>
              <label style={{ fontSize:11, fontWeight:700, color:PURPLE, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>Country</label>
              <select value={form.country} onChange={e=>setForm({...form,country:e.target.value})}
                style={{ width:'100%', padding:'10px 12px', border:`2px solid #e8e0f0`, borderRadius:8, fontSize:13, boxSizing:'border-box' }}>
                {COUNTRIES.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize:11, fontWeight:700, color:PURPLE, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>Type</label>
              <select value={form.is_office} onChange={e=>setForm({...form,is_office:e.target.value==='true'})}
                style={{ width:'100%', padding:'10px 12px', border:`2px solid #e8e0f0`, borderRadius:8, fontSize:13, boxSizing:'border-box' }}>
                <option value="true">🏢 Office</option>
                <option value="false">🏠 Home/Remote</option>
              </select>
            </div>

            <button type="submit" disabled={saving}
              style={{ padding:'10px 20px', background:PURPLE, color:'#fff', border:'none', borderRadius:8,
                fontWeight:700, fontSize:13, cursor:'pointer', whiteSpace:'nowrap' }}>
              {saving ? 'Saving...' : '💾 Save'}
            </button>
          </div>
          {msg && <div style={{ marginTop:12, fontSize:13, color: msg.startsWith('✅') ? GREEN : RED }}>{msg}</div>}
        </form>
      </div>

      {/* Existing configs */}
      <div style={{ background:'#fff', borderRadius:14, boxShadow:'0 2px 16px rgba(74,21,80,0.08)', overflow:'hidden' }}>
        <div style={{ padding:'14px 20px', background:PURPLE, color:'#fff', fontWeight:700, fontSize:13 }}>
          📋 Configured IP Locations ({configs.length})
        </div>
        {configs.length === 0 ? (
          <div style={{ padding:40, textAlign:'center', color:'#999' }}>
            <div style={{ fontSize:36, marginBottom:8 }}>🌍</div>
            <div>No IP configs yet. Add your office IPs above.</div>
          </div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ borderBottom:`2px solid #f0eaf5` }}>
                {['IP / Prefix','Location Name','Country','Type','Action'].map(h=>(
                  <th key={h} style={{ textAlign:'left', padding:'10px 16px', color:'#888', fontWeight:600, fontSize:11, textTransform:'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {configs.map((c,i)=>(
                <tr key={c.id} style={{ borderBottom:`1px solid #f0eaf5`, background: i%2===0 ? '#fff' : '#faf8fc' }}>
                  <td style={{ padding:'12px 16px', fontFamily:'monospace', fontWeight:700, color:PURPLE }}>{c.ip_prefix}</td>
                  <td style={{ padding:'12px 16px', fontWeight:600 }}>{c.location_name}</td>
                  <td style={{ padding:'12px 16px', color:'#666' }}>{c.country||'—'}</td>
                  <td style={{ padding:'12px 16px' }}>
                    <span style={{
                      background: c.is_office ? '#1a7f4b22' : '#fb850022',
                      color: c.is_office ? GREEN : '#e67e22',
                      border: `1px solid ${c.is_office ? '#1a7f4b44' : '#fb850044'}`,
                      borderRadius:20, padding:'3px 10px', fontSize:11, fontWeight:700
                    }}>{c.is_office ? '🏢 Office' : '🏠 Home/Remote'}</span>
                  </td>
                  <td style={{ padding:'12px 16px' }}>
                    <button onClick={()=>del(c.id)}
                      style={{ background:RED, color:'#fff', border:'none', borderRadius:6,
                        padding:'4px 12px', fontSize:11, cursor:'pointer', fontWeight:700 }}>
                      🗑 Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ marginTop:20, fontSize:11, color:'#bbb', textAlign:'center' }}>
        Changes take effect immediately — no restart needed.
      </div>
    </div>
  )
}
