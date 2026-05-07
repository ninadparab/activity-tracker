import { useState, useEffect } from 'react'
import { api } from '../api'

const BRANCHES = ['All', 'Redmond', 'Kirkland', 'Bellevue', 'Sammamish', 'Woodinville', 'Eastside']

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

  const filtered  = filter === 'All' ? events : events.filter(e => e.branch === filter)
  const refreshAgeH = lastRef ? Math.floor((Date.now() - Number(lastRef)) / 3600000) : null

  return (
    <div style={{ padding: '14px 14px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>🗓 Local Events</div>
        <button onClick={() => load(true)} disabled={loading}
          style={{ background: '#ede9ff', border: 'none', borderRadius: 20, padding: '6px 14px', cursor: 'pointer', color: '#667eea', fontWeight: 700, fontSize: 12 }}>
          {loading ? '...' : '🔄 Refresh'}
        </button>
      </div>

      {refreshAgeH !== null && (
        <div style={{ color: '#aaa', fontSize: 11, marginBottom: 12 }}>
          Refreshed {refreshAgeH < 1 ? 'just now' : `${refreshAgeH}h ago`} · KCLS + ParentMap Eastside
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 14 }}>
        {BRANCHES.map(b => (
          <button key={b} onClick={() => setFilter(b)}
            style={{ background: filter === b ? '#667eea' : '#ede9ff', color: filter === b ? '#fff' : '#667eea', border: 'none', borderRadius: 20, padding: '5px 12px', cursor: 'pointer', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap', flexShrink: 0 }}>
            {b}
          </button>
        ))}
      </div>

      {loading && <div style={{ color: '#aaa', textAlign: 'center', padding: 30 }}>Loading events…</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(ev => (
          <a key={ev.id} href={ev.url} target="_blank" rel="noopener noreferrer"
            style={{ background: '#fff', border: '1.5px solid #ede9ff', borderRadius: 16, padding: '14px 16px', textDecoration: 'none', display: 'block' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#222', marginBottom: 6 }}>{ev.title}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {ev.date && <span style={{ fontSize: 11, color: '#667eea', background: '#ede9ff', borderRadius: 20, padding: '2px 8px' }}>📅 {ev.date}</span>}
                  <span style={{ fontSize: 11, color: '#fff', background: ev.source === 'KCLS' ? '#2193B0' : '#FF6584', borderRadius: 20, padding: '2px 8px' }}>{ev.source}</span>
                  {ev.branch && <span style={{ fontSize: 11, color: '#888', background: '#f3f3f3', borderRadius: 20, padding: '2px 8px' }}>📍 {ev.branch}</span>}
                </div>
              </div>
              <span style={{ fontSize: 18, color: '#ccc', flexShrink: 0 }}>→</span>
            </div>
          </a>
        ))}
        {!loading && filtered.length === 0 && (
          <div style={{ color: '#aaa', textAlign: 'center', padding: 30, fontSize: 14 }}>
            No events found. Try refreshing or selecting a different branch.
          </div>
        )}
      </div>
    </div>
  )
}
