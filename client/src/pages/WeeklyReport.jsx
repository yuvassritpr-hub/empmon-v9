import { useEffect, useState } from 'react'

const PURPLE = '#4A1550'
const GREEN  = '#1a7f4b'
const YELLOW = '#d29922'
const RED    = '#c0392b'

function getWeekRange(offsetWeeks = 0) {
  const now = new Date()
  const day = now.getDay() // 0=Sun
  const mon = new Date(now)
  mon.setDate(now.getDate() - ((day + 6) % 7) + offsetWeeks * 7)
  mon.setHours(0, 0, 0, 0)
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  const fmt = d => d.toISOString().slice(0, 10)
  return { start: fmt(mon), end: fmt(sun) }
}

function weekOptions() {
  const opts = []
  for (let i = 0; i >= -7; i--) {
    const { start, end } = getWeekRange(i)
    const label = i === 0 ? `This week (${start} – ${end})` : i === -1 ? `Last week (${start} – ${end})` : `${start} – ${end}`
    opts.push({ value: i, label })
  }
  return opts
}

export default function WeeklyReport() {
  const [weekOffset, setWeekOffset] = useState(-1)
  const [report, setReport]   = useState(null)
  const [loading, setLoading] = useState(false)

  const loadReport = async (offset) => {
    setLoading(true)
    setReport(null)
    try {
      const { start, end } = getWeekRange(offset)
      const month = start.slice(0, 7)
      const [attRes, dashRes] = await Promise.all([
        fetch(`/api/attendance?month=${month}`).then(r => r.json()),
        fetch('/api/dashboard').then(r => r.json()),
      ])
      const days = attRes?.days || []
      const employees = attRes?.employees || []
      const weekDays = days.filter(d => d >= start && d <= end)

      const rows = employees.map(emp => {
        const present = weekDays.filter(d => emp.attendance[d]?.status !== 'Absent').length
        const late    = weekDays.filter(d => emp.attendance[d]?.status === 'Late').length
        const absent  = weekDays.length - present
        const pct     = weekDays.length > 0 ? Math.round((present / weekDays.length) * 100) : 0
        return { ...emp, present, late, absent, pct, weekDays }
      }).sort((a, b) => b.pct - a.pct)

      setReport({ start, end, weekDays, rows, totalEmployees: employees.length, generatedAt: new Date().toLocaleString('en-IN') })
    } catch (e) {
      setReport({ error: 'Failed to load report. Please try again.' })
    }
    setLoading(false)
  }

  useEffect(() => { loadReport(weekOffset) }, [weekOffset])

  const avgPct = report?.rows?.length
    ? Math.round(report.rows.reduce((s, r) => s + r.pct, 0) / report.rows.length)
    : 0

  return (
    <div style={{ background: '#f7f4fa', minHeight: '100vh', padding: 28, fontFamily: "'Segoe UI',Arial,sans-serif" }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: PURPLE, margin: 0 }}>📊 Weekly Report</h1>
          <p style={{ color: '#888', fontSize: 13, margin: '4px 0 0' }}>Employee attendance & activity summary by week</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select value={weekOffset} onChange={e => setWeekOffset(Number(e.target.value))}
            style={{ padding: '8px 14px', border: '2px solid #e8e0f0', borderRadius: 8, fontSize: 13, fontWeight: 600, color: PURPLE, background: '#fff', cursor: 'pointer' }}>
            {weekOptions().map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button onClick={() => loadReport(weekOffset)}
            style={{ padding: '8px 16px', background: PURPLE, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>Generating report...</div>}
      {report?.error && <div style={{ textAlign: 'center', padding: 60, color: RED }}>{report.error}</div>}

      {report && !report.error && !loading && (
        <>
          {/* Summary tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
            {[
              { label: 'Total Employees', value: report.totalEmployees, color: PURPLE, icon: '👥' },
              { label: 'Working Days',    value: report.weekDays.length, color: '#1a6fc4', icon: '📆' },
              { label: 'Avg Attendance',  value: `${avgPct}%`, color: avgPct >= 90 ? GREEN : avgPct >= 75 ? YELLOW : RED, icon: '✅' },
              { label: 'Report Period',   value: `${report.start.slice(5)} – ${report.end.slice(5)}`, color: '#7B3FA0', icon: '📅' },
            ].map(t => (
              <div key={t.label} style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 2px 12px rgba(74,21,80,0.07)', borderTop: `3px solid ${t.color}` }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{t.icon}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: t.color }}>{t.value}</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{t.label}</div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 16px rgba(74,21,80,0.08)', overflow: 'hidden', overflowX: 'auto' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0eaf5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, color: PURPLE, fontSize: 14 }}>Employee Breakdown</span>
              <span style={{ fontSize: 11, color: '#aaa' }}>Generated: {report.generatedAt}</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: PURPLE, color: '#fff' }}>
                  <th style={{ padding: '11px 16px', textAlign: 'left', fontWeight: 700, fontSize: 12 }}>Employee</th>
                  {report.weekDays.map(d => {
                    const dt = new Date(d)
                    return (
                      <th key={d} style={{ padding: '8px 10px', textAlign: 'center', fontSize: 11, minWidth: 70 }}>
                        <div style={{ opacity: 0.8 }}>{dt.toLocaleString('en-IN', { weekday: 'short' })}</div>
                        <div>{dt.getDate()}</div>
                      </th>
                    )
                  })}
                  <th style={{ padding: '11px 10px', textAlign: 'center', fontSize: 12 }}>Present</th>
                  <th style={{ padding: '11px 10px', textAlign: 'center', fontSize: 12 }}>Late</th>
                  <th style={{ padding: '11px 10px', textAlign: 'center', fontSize: 12 }}>%</th>
                </tr>
              </thead>
              <tbody>
                {report.rows.map((emp, ei) => {
                  const pctColor = emp.pct >= 90 ? GREEN : emp.pct >= 75 ? YELLOW : RED
                  return (
                    <tr key={emp.username} style={{ background: ei % 2 === 0 ? '#fff' : '#faf8fc', borderBottom: '1px solid #f0eaf5' }}>
                      <td style={{ padding: '10px 16px', fontWeight: 700, color: PURPLE }}>
                        {emp.username}
                        <div style={{ fontSize: 11, color: '#aaa', fontWeight: 400 }}>{emp.computer}</div>
                      </td>
                      {emp.weekDays.map(d => {
                        const info = emp.attendance[d]
                        const present = info && info.status !== 'Absent'
                        return (
                          <td key={d} style={{ padding: '8px 6px', textAlign: 'center', background: present ? '#1a7f4b08' : '#c0392b06' }}>
                            {present ? (
                              <>
                                <div style={{ fontSize: 11, fontWeight: 700, color: info.status === 'Late' ? YELLOW : GREEN }}>✓</div>
                                <div style={{ fontSize: 10, color: '#555' }}>{(info.login||'').slice(0,5)}</div>
                              </>
                            ) : (
                              <div style={{ fontSize: 12, color: RED, fontWeight: 700 }}>✕</div>
                            )}
                          </td>
                        )
                      })}
                      <td style={{ padding: '10px', textAlign: 'center', fontWeight: 800, color: GREEN }}>{emp.present}</td>
                      <td style={{ padding: '10px', textAlign: 'center', fontWeight: 700, color: emp.late > 0 ? YELLOW : '#aaa' }}>{emp.late}</td>
                      <td style={{ padding: '10px', textAlign: 'center', fontWeight: 800, color: pctColor }}>{emp.pct}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Auto-schedule note */}
          <div style={{ marginTop: 16, padding: '12px 18px', background: '#f0eaf8', borderRadius: 10, fontSize: 12, color: '#7B3FA0', borderLeft: '3px solid #7B3FA0' }}>
            ⏰ This report auto-generates every <strong>Monday at 9:00 AM IST</strong> via cloud scheduler. View logs at{' '}
            <a href="https://claude.ai/code/routines/trig_015wtT5hVdRqdpyHQtkS2mKH" target="_blank" rel="noreferrer" style={{ color: PURPLE }}>Claude Routines</a>
          </div>
        </>
      )}
    </div>
  )
}
