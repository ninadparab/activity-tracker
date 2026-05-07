import { useApp } from '../App'
import { CAT_META } from '../App'

function daysSince(iso) { return iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 86400000) : 999 }
function isArchived(a)  { return a.archived === true || a.archived === 'TRUE' || a.archived === 'true' }

export default function Dashboard() {
  const { activities, logs } = useApp()
  const active = activities.filter(a => !isArchived(a))

  const lastDone = {}
  for (const lg of logs) {
    if (!lastDone[lg.activityId] || lg.date > lastDone[lg.activityId]) lastDone[lg.activityId] = lg.date
  }

  const neglected = active
    .map(a => ({ ...a, ds: daysSince(lastDone[a.id]), ratio: daysSince(lastDone[a.id]) / (parseFloat(a.frequencyDays) || 14) }))
    .filter(a => a.ratio >= 1)
    .sort((x, y) => y.ratio - x.ratio)

  // This week
  const cut7 = new Date(); cut7.setDate(cut7.getDate() - 7)
  const recentLogs = logs.filter(l => new Date(l.date) >= cut7)
  const doneWk  = new Set(recentLogs.map(l => l.activityId)).size

  // Streak
  let streak = 0
  const logDates = new Set(logs.map(l => l.date))
  const d = new Date()
  while (true) {
    const ds = d.toISOString().split('T')[0]
    if (logDates.has(ds)) { streak++; d.setDate(d.getDate() - 1) } else break
  }

  // Category counts last 30 days
  const cut30 = new Date(); cut30.setDate(cut30.getDate() - 30)
  const catCounts = Object.fromEntries(Object.keys(CAT_META).map(k => [k, 0]))
  for (const lg of logs.filter(l => new Date(l.date) >= cut30)) {
    const act = active.find(a => String(a.id) === String(lg.activityId))
    if (act) catCounts[act.category] = (catCounts[act.category] || 0) + 1
  }
  const maxCount = Math.max(...Object.values(catCounts), 1)

  // Who logged this week
  const byUser = {}
  for (const lg of recentLogs) byUser[lg.user] = (byUser[lg.user] || 0) + 1

  return (
    <div style={{ padding: '14px 14px 0' }}>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 14 }}>📊 Dashboard</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        {[['Activities', active.length, '🎯'], ['Done this week', doneWk, '✅'], ['Overdue', neglected.length, '⚠️'], ['Day streak', streak, '🔥']].map(([lb, v, ic]) => (
          <div key={lb} style={{ background: '#fff', border: '1.5px solid #ede9ff', borderRadius: 16, padding: '14px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 26 }}>{ic}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#667eea', lineHeight: 1.1 }}>{v}</div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>{lb}</div>
          </div>
        ))}
      </div>

      {Object.keys(byUser).length > 0 && (
        <div style={{ background: '#fff', border: '1.5px solid #ede9ff', borderRadius: 16, padding: '14px 16px', marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#555', marginBottom: 10 }}>This Week — Logged By</div>
          <div style={{ display: 'flex', gap: 20 }}>
            {Object.entries(byUser).map(([u, cnt]) => (
              <div key={u} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24 }}>{u === 'Dad' ? '👨' : u === 'Mom' ? '👩' : '👧'}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#667eea' }}>{cnt}</div>
                <div style={{ fontSize: 11, color: '#888' }}>{u}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ background: '#fff', border: '1.5px solid #ede9ff', borderRadius: 16, padding: '14px 16px', marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#555', marginBottom: 12 }}>Activity Mix — Last 30 Days</div>
        {Object.entries(CAT_META).map(([cat, meta]) => (
          <div key={cat} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
              <span>{meta.icon} {cat}</span>
              <span style={{ color: '#888' }}>{catCounts[cat] || 0}×</span>
            </div>
            <div style={{ background: '#f3f0ff', borderRadius: 20, height: 10 }}>
              <div style={{ background: meta.color, width: `${((catCounts[cat] || 0) / maxCount) * 100}%`, minWidth: catCounts[cat] > 0 ? 6 : 0, height: '100%', borderRadius: 20, transition: 'width .5s' }} />
            </div>
          </div>
        ))}
      </div>

      {neglected.length > 0 && (
        <div style={{ background: '#fffbeb', border: '2px solid #fcd34d', borderRadius: 16, padding: 14, marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#92400e', marginBottom: 10 }}>⚠️ Neglected ({neglected.length})</div>
          {neglected.slice(0, 10).map(a => {
            const meta = CAT_META[a.category] || { icon: '✨' }
            return (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{meta.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{a.name}</div>
                    <div style={{ fontSize: 11, color: '#888' }}>Every {a.frequencyDays}d · {Math.round(a.ratio)}× overdue</div>
                  </div>
                </div>
                <span style={{ fontSize: 11, background: '#fde68a', color: '#92400e', borderRadius: 20, padding: '3px 9px', fontWeight: 600 }}>
                  {a.ds >= 999 ? 'Never' : `${a.ds}d`}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
