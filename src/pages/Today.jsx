import { useState, useEffect } from 'react'
import { useApp } from '../App'
import { CAT_META } from '../App'
import { api } from '../api'

function daysSince(iso) {
  if (!iso) return 999
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
}
function isArchived(a) {
  return a.archived === true || a.archived === 'TRUE' || a.archived === 'true'
}

export default function Today() {
  const { user, activities, logs, logItem, isRO } = useApp()
  const [picks,   setPicks]   = useState([])
  const [loading, setLoading] = useState(false)

  const todayStr    = new Date().toISOString().split('T')[0]
  const loggedToday = new Set(logs.filter(l => l.date === todayStr).map(l => String(l.activityId)))

  const lastDone = {}
  for (const lg of logs) {
    if (!lastDone[lg.activityId] || lg.date > lastDone[lg.activityId]) lastDone[lg.activityId] = lg.date
  }

  const active    = activities.filter(a => !isArchived(a))
  const neglected = active
    .map(a => ({ ...a, ds: daysSince(lastDone[a.id]), ratio: daysSince(lastDone[a.id]) / (parseFloat(a.frequencyDays) || 14) }))
    .filter(a => a.ratio >= 1)
    .sort((x, y) => y.ratio - x.ratio)

  async function fetchPicks() {
    setLoading(true)
    try {
      const res = await api.recommendations({ user, count: 3 })
      setPicks(res.picks || [])
    } catch {
      setPicks(neglected.slice(0, 3))
    }
    setLoading(false)
  }

  useEffect(() => { if (activities.length) fetchPicks() }, [activities.length])

  const dateLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div style={{ padding: '14px 14px 0' }}>
      <div style={{ color: '#888', fontSize: 12, marginBottom: 12 }}>{dateLabel}</div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: '#333' }}>What should we do today?</div>
        <button onClick={fetchPicks} disabled={loading}
          style={{ background: '#ede9ff', border: 'none', borderRadius: 20, padding: '6px 14px', cursor: 'pointer', color: '#667eea', fontWeight: 700, fontSize: 12 }}>
          {loading ? '...' : '🔀 Shuffle'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {picks.map(act => {
          const done = loggedToday.has(String(act.id))
          const ds   = act._daysSince ?? daysSince(lastDone[act.id])
          const meta = CAT_META[act.category] || { icon: '✨', color: '#888' }
          return (
            <div key={act.id} style={{ background: done ? '#f0fff4' : '#fff', border: `2px solid ${done ? '#68d391' : meta.color}`, borderRadius: 18, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 2px 10px rgba(0,0,0,.05)' }}>
              {act.imageUrl
                ? <img src={act.imageUrl} alt="" style={{ width: 48, height: 62, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                : <span style={{ fontSize: 34 }}>{meta.icon}</span>}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#222' }}>{act.name}</div>
                {act.author && <div style={{ fontSize: 11, color: '#aaa' }}>{act.author}</div>}
                <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>
                  {ds >= 999 ? 'Never done yet' : `Last done ${ds} day${ds === 1 ? '' : 's'} ago`}
                </div>
                <div style={{ fontSize: 11, color: meta.color, fontWeight: 600, marginTop: 2 }}>
                  {act.category} · Every {act.frequencyDays} days
                </div>
              </div>
              {!isRO && (
                <button onClick={() => !done && logItem(act.id)}
                  style={{ background: done ? '#68d391' : '#667eea', border: 'none', borderRadius: 12, padding: '9px 14px', color: '#fff', fontWeight: 700, cursor: done ? 'default' : 'pointer', fontSize: 13, flexShrink: 0 }}>
                  {done ? '✓ Done' : 'Log it'}
                </button>
              )}
            </div>
          )
        })}
        {!loading && picks.length === 0 && (
          <div style={{ color: '#aaa', textAlign: 'center', padding: 30, fontSize: 14 }}>
            Add some activities to get started!
          </div>
        )}
      </div>

      {neglected.length > 0 && (
        <div style={{ background: '#fffbeb', border: '2px solid #fcd34d', borderRadius: 18, padding: 16, marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#92400e', marginBottom: 10 }}>
            ⚠️ Overdue — haven't done these in a while
          </div>
          {neglected.slice(0, 6).map(a => {
            const meta = CAT_META[a.category] || { icon: '✨' }
            return (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{meta.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{a.name}</div>
                    <div style={{ fontSize: 11, color: '#888' }}>Every {a.frequencyDays}d · {Math.round(a.ratio)}× overdue</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, background: '#fde68a', color: '#92400e', borderRadius: 20, padding: '3px 9px', fontWeight: 600 }}>
                    {a.ds >= 999 ? 'Never' : `${a.ds}d ago`}
                  </span>
                  {!isRO && (
                    <button onClick={() => logItem(a.id)}
                      style={{ background: '#667eea', border: 'none', borderRadius: 10, padding: '5px 10px', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                      Log
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
