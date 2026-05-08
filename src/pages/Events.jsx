import { useState, useEffect } from 'react'
import { api } from '../api'

const BRANCHES = ['All','Redmond','Kirkland','Bellevue','Sammamish','Woodinville','Eastside']

export default function Events() {
  const [events,  setEvents]  = useState([])
  const [loading, setLoading] = useState(false)
  const [lastRef, setLastRef] = useState(null)
  const [filter,  setFilter]  = useState('All')

  async function load(refresh = false) {
    setLoading(true)
    try {
      const res = refresh ? await api.refreshEvents() : await api.events()
      setEvents(res.events || [])
      setLastRef(res.lastRefresh || Date.now())
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = filter === 'All' ? events : events.filter(e => e.branch === filter)
  const nextWeek = getNextWeekLabel()

  return (
    <div style={{ padding: '14px 14px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>🗓 Kids Events</div>
        <button onClick={() => load(true)} disabled={loading}
          style={{ background: '#ede9ff', border: 'none', borderRadius: 20, padding: '6px 14px', cursor: 'pointer', color: '#667eea', fontWeight: 700, fontSize: 12 }}>
          {loading ? '...' : '🔄 Refresh'}
        </button>
      </div>

      <div style={{ color: '#888', fontSize: 11, marginBottom: 12 }}>
        {nextWeek} · Ages 5–12 · KCLS + ParentMap Eastside
        {lastRef && ` · Updated ${Math.floor((Date.now()-Number(lastRef))/3600000)}h ago`}
      </div>

      {/* Branch filter */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 14 }}>
        {BRANCHES.map(b => (
          <button key={b} onClick={() => setFilter(b)}
            style={{ background: filter===b ? '#667eea' : '#ede9ff', color: filter===b ? '#fff' : '#667eea', border: 'none', borderRadius: 20, padding: '5px 12px', cursor: 'pointer', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap', flexShrink: 0 }}>
            {b}
          </button>
        ))}
      </div>

      {loading && <div style={{ color: '#aaa', textAlign: 'center', padding: 30 }}>Loading events…</div>}

      {!loading && filtered.length === 0 && (
        <div style={{ color: '#aaa', textAlign: 'center', padding: 30, fontSize: 14 }}>
          No events found. Try refreshing or a different branch.
        </div>
      )}

      {/* Table */}
      {!loading && filtered.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff' }}>
                {['Event','Date','Time','Branch','Source'].map(h => (
                  <th key={h} style={{ padding: '10px 10px', textAlign: 'left', fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((ev, i) => (
                <tr key={ev.id} style={{ background: i % 2 === 0 ? '#fff' : '#f8f7ff', borderBottom: '1px solid #ede9ff' }}>
                  <td style={{ padding: '10px 10px' }}>
                    <a href={ev.url} target="_blank" rel="noopener noreferrer"
                      style={{ color: '#667eea', fontWeight: 600, textDecoration: 'none' }}>
                      {ev.title}
                    </a>
                    {ev.description && <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{ev.description.slice(0,80)}…</div>}
                  </td>
                  <td style={{ padding: '10px 10px', whiteSpace: 'nowrap', color: '#555' }}>
                    {formatDate(ev.date)}
                  </td>
                  <td style={{ padding: '10px 10px', whiteSpace: 'nowrap', color: '#555' }}>
                    {ev.time ? formatTime(ev.time) : '—'}
                  </td>
                  <td style={{ padding: '10px 10px', whiteSpace: 'nowrap' }}>
                    <span style={{ background: '#ede9ff', color: '#667eea', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>
                      📍 {ev.branch}
                    </span>
                  </td>
                  <td style={{ padding: '10px 10px', whiteSpace: 'nowrap' }}>
                    <span style={{ background: ev.source==='KCLS' ? '#e0f0ff' : '#ffe0ef', color: ev.source==='KCLS' ? '#2193B0' : '#FF6584', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>
                      {ev.source}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function getNextWeekLabel() {
  const now = new Date()
  const toMonday = now.getDay() === 0 ? 1 : 8 - now.getDay()
  const monday = new Date(now); monday.setDate(now.getDate() + toMonday)
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6)
  const fmt = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `Next week: ${fmt(monday)} – ${fmt(sunday)}`
}

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatTime(t) {
  if (!t) return '—'
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${ampm}`
}
