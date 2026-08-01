import { useEffect, useState } from 'react'

const PURPLE = '#4A1550'
const GREEN  = '#1a7f4b'
const YELLOW = '#d29922'
const RED    = '#c0392b'

function monthOptions() {
  const opts = []
  const now = new Date()
  for (let i = 1; i <= 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const val = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
    const label = d.toLocaleString('en-IN', { month: 'long', year: 'numeric' })
    opts.push({ val, label })
  }
  return opts
}

function Badge({ text, color }) {
  if (!text || text === 'None' || text === 'N/A') return <span style={{ color: '#bbb', fontSize: 11 }}>—</span>
  return <span style={{ fontSize: 11, color }}>{text}</span>
}

export default function MonthlyReport() {
  const months = monthOptions()
  const [month, setMonth] = useState(months[0].val)
  const [data, setData]   = useState(null)
  const [loading, setLoading] = useState(false)

  const load = (m) => {
    setLoading(true)
    setData(null)
    fetch(`/api/report/monthly?month=${m}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load(month) }, [month])

  const rows = data?.report || []

  return (
    <div style={{ background: '#f7f4fa', minHeight: '100vh', padding: 28, fontFamily: "'Segoe UI',Arial,sans-serif" }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: PURPLE, margin: 0 }}>📋 Monthly Report</h1>
          <p style={{ color: '#888', fontSize: 13, margin: '4px 0 0' }}>Full employee activity, apps, social media, storage & battery per month</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select value={month} onChange={e => { setMonth(e.target.value); load(e.target.value) }}
            style={{ padding: '8px 14px', border: '2px solid #e8e0f0', borderRadius: 8, fontSize: 13, fontWeight: 600, color: PURPLE, background: '#fff', cursor: 'pointer' }}>
            {months.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
          </select>
          <a href={`/api/report/excel?month=${month}`}
            style={{ padding: '8px 16px', background: GREEN, color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            ⬇ Excel
          </a>
          <a href={`/api/report/pdf?month=${month}`} target="_blank" rel="noreferrer"
            style={{ padding: '8px 16px', background: '#c0392b', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            ⬇ PDF
          </a>
        </div>
      </div>

      {/* Summary tiles */}
      {!loading && rows.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Total Employees', value: rows.length, color: PURPLE, icon: '👥' },
            { label: 'Report Month', value: month, color: '#1a6fc4', icon: '📅' },
            { label: 'Social Media Alerts', value: rows.filter(r => r['Social Media Alerts'] !== 'None').length, color: YELLOW, icon: '⚠' },
            { label: 'File Sharing Detected', value: rows.filter(r => r['File Sharing Sites'] !== 'None').length, color: RED, icon: '📤' },
          ].map(t => (
            <div key={t.label} style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 2px 12px rgba(74,21,80,0.07)', borderTop: `3px solid ${t.color}` }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{t.icon}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: t.color }}>{t.value}</div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{t.label}</div>
            </div>
          ))}
        </div>
      )}

      {loading && <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>Loading report...</div>}

      {!loading && rows.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>No data for this month.</div>
      )}

      {!loading && rows.map((r, i) => (
        <div key={i} style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 16px rgba(74,21,80,0.08)', marginBottom: 20, overflow: 'hidden' }}>
          {/* Employee header */}
          <div style={{ background: PURPLE, color: '#fff', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <span style={{ fontWeight: 800, fontSize: 16 }}>{r['Employee Name']}</span>
              <span style={{ fontSize: 12, opacity: 0.7, marginLeft: 12 }}>{r['System Name']}</span>
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 12, opacity: 0.9 }}>
              <span>📅 {r['Days Worked']} days worked</span>
              <span>⏱ {r['Total Active Time']} active</span>
              <span>🔢 {r['Serial Number']}</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0 }}>

            {/* System Info */}
            <Section title="💻 System Info" color="#f0eaf8">
              <Row label="OS" value={r['OS']} />
              <Row label="Storage" value={r['Storage']} />
              <Row label="Battery" value={r['Battery Health']}
                color={r['Battery Health']?.includes('N/A') ? '#aaa' :
                  parseInt(r['Battery Health']) >= 80 ? GREEN : parseInt(r['Battery Health']) >= 60 ? YELLOW : RED} />
              <Row label="Location" value={r['Location']} />
              <Row label="IP" value={r['IP Address']} mono />
            </Section>

            {/* App Activity */}
            <Section title="🖥 App Activity" color="#f4faf0">
              <Row label="Top Apps" value={r['Top Applications']} />
              <Row label="Work Apps" value={r['Work Details']} color={GREEN} />
              <Row label="Work %" value={r['Work %']} color={GREEN} />
              <Row label="Comms" value={r['Comms Details']} />
              <Row label="Non-Work %" value={r['Non-Work %']} color={parseInt(r['Non-Work %']) > 20 ? RED : YELLOW} />
            </Section>

            {/* Alerts */}
            <Section title="⚠ Alerts & Sharing" color="#fff8f0">
              <Row label="Social Media" value={r['Social Media Alerts']}
                color={r['Social Media Alerts'] !== 'None' ? RED : GREEN} />
              <Row label="File Sharing" value={r['File Sharing Sites']}
                color={r['File Sharing Sites'] !== 'None' ? RED : GREEN} />
              <Row label="Email Accounts" value={r['Email Accounts Used']} />
            </Section>

          </div>
        </div>
      ))}

      <div style={{ marginTop: 8, padding: '12px 18px', background: '#f0eaf8', borderRadius: 10, fontSize: 12, color: '#7B3FA0', borderLeft: '3px solid #7B3FA0' }}>
        ⏰ Full monthly report auto-generates on the <strong>9th of every month at 9:00 AM IST</strong> via cloud scheduler.
      </div>
    </div>
  )
}

function Section({ title, color, children }) {
  return (
    <div style={{ background: color, padding: '14px 18px', borderRight: '1px solid #f0eaf5' }}>
      <div style={{ fontWeight: 700, fontSize: 12, color: PURPLE, marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  )
}

function Row({ label, value, color, mono }) {
  return (
    <div style={{ marginBottom: 7 }}>
      <span style={{ fontSize: 10, color: '#999', display: 'block' }}>{label}</span>
      <span style={{ fontSize: 12, color: color || '#333', fontFamily: mono ? 'monospace' : 'inherit', wordBreak: 'break-word' }}>
        {value || '—'}
      </span>
    </div>
  )
}
