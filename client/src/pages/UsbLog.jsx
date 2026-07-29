import { useEffect, useState } from 'react'

const PURPLE = '#4A1550'
const RED    = '#c0392b'
const GREEN  = '#1a7f4b'

export default function UsbLog() {
  const [rows, setRows]     = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/usb').then(r => r.json()).then(d => { setRows(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const filtered = rows.filter(r =>
    (r.username||'').toLowerCase().includes(search.toLowerCase()) ||
    (r.label||'').toLowerCase().includes(search.toLowerCase()) ||
    (r.drive||'').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ background: '#f7f4fa', minHeight: '100vh', padding: 28, fontFamily: "'Segoe UI',Arial,sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: PURPLE, margin: 0 }}>🔌 USB Device Log</h1>
          <p style={{ color: '#888', fontSize: 13, margin: '4px 0 0' }}>All USB plug/unplug events across employee devices</p>
        </div>
        <div style={{ background: '#fff', borderRadius: 10, padding: '10px 20px', boxShadow: '0 2px 8px rgba(74,21,80,0.08)', textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: PURPLE }}>{rows.length}</div>
          <div style={{ fontSize: 11, color: '#888' }}>Total Events</div>
        </div>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)}
        placeholder="🔍 Search by employee, drive or label..."
        style={{ width: '100%', padding: '10px 14px', border: '2px solid #e8e0f0', borderRadius: 10,
          fontSize: 13, marginBottom: 20, boxSizing: 'border-box', outline: 'none' }} />

      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 16px rgba(74,21,80,0.08)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: PURPLE, color: '#fff' }}>
              {['Date', 'Time', 'Employee', 'Computer', 'Drive', 'Label', 'Size', 'Action'].map(h => (
                <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontWeight: 700, fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#888' }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#888' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔌</div>
                No USB events found. Events appear when employees plug/unplug USB drives.
              </td></tr>
            ) : filtered.map((r, i) => (
              <tr key={r.id} style={{ background: i % 2 === 0 ? '#fff' : '#faf8fc', borderBottom: '1px solid #f0eaf5' }}>
                <td style={{ padding: '10px 14px', fontWeight: 600 }}>{r.date}</td>
                <td style={{ padding: '10px 14px', color: '#555' }}>{(r.time||'').slice(0,8)}</td>
                <td style={{ padding: '10px 14px', fontWeight: 700, color: PURPLE }}>{r.username}</td>
                <td style={{ padding: '10px 14px', color: '#666', fontSize: 12 }}>{r.computer}</td>
                <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 600 }}>{r.drive || '—'}</td>
                <td style={{ padding: '10px 14px' }}>{r.label || <span style={{ color: '#bbb' }}>—</span>}</td>
                <td style={{ padding: '10px 14px', color: '#666' }}>{r.size_gb > 0 ? `${r.size_gb} GB` : '—'}</td>
                <td style={{ padding: '10px 14px' }}>
                  <span style={{
                    background: r.action === 'connected' ? '#1a7f4b22' : '#c0392b22',
                    color: r.action === 'connected' ? GREEN : RED,
                    border: `1px solid ${r.action === 'connected' ? '#1a7f4b44' : '#c0392b44'}`,
                    borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700
                  }}>
                    {r.action === 'connected' ? '🔌 Connected' : '⏏ Removed'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
