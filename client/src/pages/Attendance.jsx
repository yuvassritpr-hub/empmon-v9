import { useEffect, useState } from 'react'

const PURPLE = '#4A1550'
const GREEN  = '#1a7f4b'
const YELLOW = '#d29922'
const RED    = '#c0392b'
const GREY   = '#aaa'

function monthOptions() {
  const opts = []
  const now = new Date()
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const val = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
    const label = d.toLocaleString('en-IN', { month: 'long', year: 'numeric' })
    opts.push({ val, label })
  }
  return opts
}

function StatusCell({ info }) {
  if (!info) return <td style={{ padding: '8px 6px', textAlign: 'center', background: '#f5f5f5', color: '#ccc', fontSize: 11 }}>—</td>
  const { status, login, logout } = info
  const cfg = {
    Present: { bg: '#1a7f4b15', color: GREEN,  border: '#1a7f4b33' },
    Late:    { bg: '#d2992215', color: YELLOW, border: '#d2992233' },
    Absent:  { bg: '#c0392b10', color: RED,    border: '#c0392b22' },
  }[status] || { bg: '#f5f5f5', color: GREY, border: '#ddd' }

  return (
    <td style={{ padding: '6px 4px', textAlign: 'center', background: cfg.bg, border: `1px solid ${cfg.border}` }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: cfg.color }}>
        {status === 'Absent' ? '✕' : '✓'} {status}
      </div>
      {status !== 'Absent' && (
        <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>
          {login}{logout !== '--' ? ` – ${logout}` : ''}
        </div>
      )}
    </td>
  )
}

export default function Attendance() {
  const months = monthOptions()
  const [month, setMonth]   = useState(months[0].val)
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  const load = (m) => {
    setLoading(true)
    fetch(`/api/attendance?month=${m}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load(month) }, [month])

  const days = data?.days || []
  const employees = data?.employees || []

  // Summary counts
  const today = new Date().toISOString().slice(0, 10)
  const presentToday = employees.filter(e => e.attendance[today]?.status !== 'Absent').length
  const lateToday    = employees.filter(e => e.attendance[today]?.status === 'Late').length

  return (
    <div style={{ background: '#f7f4fa', minHeight: '100vh', padding: 28, fontFamily: "'Segoe UI',Arial,sans-serif" }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: PURPLE, margin: 0 }}>📅 Attendance Report</h1>
          <p style={{ color: '#888', fontSize: 13, margin: '4px 0 0' }}>Monthly login/logout attendance for all employees</p>
        </div>
        <select value={month} onChange={e => setMonth(e.target.value)}
          style={{ padding: '8px 14px', border: '2px solid #e8e0f0', borderRadius: 8,
            fontSize: 13, fontWeight: 600, color: PURPLE, background: '#fff', cursor: 'pointer' }}>
          {months.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
        </select>
      </div>

      {/* Summary tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Employees', value: employees.length, color: PURPLE, icon: '👥' },
          { label: 'Working Days',    value: days.length,      color: '#1a6fc4', icon: '📆' },
          { label: 'Present Today',   value: presentToday,     color: GREEN,  icon: '✅' },
          { label: 'Late Today',      value: lateToday,        color: YELLOW, icon: '⏰' },
        ].map(t => (
          <div key={t.label} style={{ background: '#fff', borderRadius: 12, padding: '16px 20px',
            boxShadow: '0 2px 12px rgba(74,21,80,0.07)', borderTop: `3px solid ${t.color}` }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{t.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: t.color }}>{t.value}</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{t.label}</div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { color: GREEN,  label: '✓ Present — on time' },
          { color: YELLOW, label: '✓ Late — login after 9:30 AM' },
          { color: RED,    label: '✕ Absent — no login detected' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: l.color, fontWeight: 600 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: l.color, display: 'inline-block' }}/>
            {l.label}
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>Loading attendance...</div>
      ) : employees.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>No data for this month.</div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: 14, boxShadow: '0 2px 16px rgba(74,21,80,0.08)' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: 12, minWidth: '100%', background: '#fff' }}>
            <thead>
              <tr style={{ background: PURPLE, color: '#fff' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, fontSize: 12,
                  position: 'sticky', left: 0, background: PURPLE, zIndex: 2, minWidth: 130 }}>
                  Employee
                </th>
                {days.map(ds => {
                  const d = new Date(ds)
                  const dayName = d.toLocaleString('en-IN', { weekday: 'short' })
                  const dayNum  = d.getDate()
                  return (
                    <th key={ds} style={{ padding: '8px 4px', textAlign: 'center', fontWeight: 600,
                      minWidth: 72, borderLeft: '1px solid rgba(255,255,255,0.15)' }}>
                      <div style={{ fontSize: 10, opacity: 0.8 }}>{dayName}</div>
                      <div style={{ fontSize: 13 }}>{dayNum}</div>
                    </th>
                  )
                })}
                <th style={{ padding: '12px 10px', textAlign: 'center', fontWeight: 700, fontSize: 12, minWidth: 80 }}>Present</th>
                <th style={{ padding: '12px 10px', textAlign: 'center', fontWeight: 700, fontSize: 12, minWidth: 60 }}>Late</th>
                <th style={{ padding: '12px 10px', textAlign: 'center', fontWeight: 700, fontSize: 12, minWidth: 60 }}>%</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp, ei) => {
                const presentDays = days.filter(ds => emp.attendance[ds]?.status !== 'Absent').length
                const lateDays    = days.filter(ds => emp.attendance[ds]?.status === 'Late').length
                const pct = days.length > 0 ? Math.round((presentDays / days.length) * 100) : 0
                const pctColor = pct >= 90 ? GREEN : pct >= 75 ? YELLOW : RED
                return (
                  <tr key={emp.username} style={{ borderBottom: '1px solid #f0eaf5' }}>
                    <td style={{ padding: '10px 16px', fontWeight: 700, color: PURPLE,
                      position: 'sticky', left: 0, background: ei % 2 === 0 ? '#fff' : '#faf8fc',
                      borderRight: '2px solid #e8e0f0', zIndex: 1 }}>
                      {emp.username}
                    </td>
                    {days.map(ds => <StatusCell key={ds} info={emp.attendance[ds]} />)}
                    <td style={{ padding: '10px 10px', textAlign: 'center', fontWeight: 800, color: GREEN }}>{presentDays}</td>
                    <td style={{ padding: '10px 10px', textAlign: 'center', fontWeight: 700, color: lateToday > 0 ? YELLOW : '#888' }}>{lateDays}</td>
                    <td style={{ padding: '10px 10px', textAlign: 'center', fontWeight: 800, color: pctColor }}>{pct}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
