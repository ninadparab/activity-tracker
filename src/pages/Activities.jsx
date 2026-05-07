import { useState } from 'react'
import { useApp } from '../App'
import { CAT_META } from '../App'
import ActivityForm from '../components/ActivityForm'

function daysSince(iso) { return iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 86400000) : 999 }
function isArchived(a)  { return a.archived === true || a.archived === 'TRUE' || a.archived === 'true' }

export default function Activities() {
  const { activities, logs, isRO, removeItem } = useApp()
  const [filterCat,    setFilter]   = useState('All')
  const [showForm,     setShowForm] = useState(false)
  const [editItem,     setEditItem] = useState(null)
  const [showArchived, setShowArch] = useState(false)

  const lastDone = {}
  for (const lg of logs) {
    if (!lastDone[lg.activityId] || lg.date > lastDone[lg.activityId]) lastDone[lg.activityId] = lg.date
  }

  const cats     = ['All', ...Object.keys(CAT_META)]
  const active   = activities.filter(a => !isArchived(a) && (filterCat === 'All' || a.category === filterCat))
  const archived = activities.filter(a => isArchived(a))

  return (
    <div style={{ padding: '14px 14px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>All Items ({active.length})</div>
        {!isRO && (
          <button onClick={() => { setEditItem(null); setShowForm(true) }}
            style={{ background: '#667eea', color: '#fff', border: 'none', borderRadius: 20, padding: '7px 16px', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
            + Add
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 12 }}>
        {cats.map(c => {
          const meta = CAT_META[c] || {}
          return (
            <button key={c} onClick={() => setFilter(c)}
              style={{ background: filterCat === c ? '#667eea' : '#ede9ff', color: filterCat === c ? '#fff' : '#667eea', border: 'none', borderRadius: 20, padding: '5px 12px', cursor: 'pointer', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap', flexShrink: 0 }}>
              {c === 'All' ? '✨ All' : `${meta.icon} ${c}`}
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {active.map(act => {
          const meta = CAT_META[act.category] || { icon: '✨', color: '#888' }
          const ds   = daysSince(lastDone[act.id])
          const over = ds > (parseFloat(act.frequencyDays) || 14)
          return (
            <div key={act.id} style={{ background: '#fff', border: `1.5px solid ${over ? '#fca5a5' : '#ede9ff'}`, borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              {act.imageUrl
                ? <img src={act.imageUrl} alt="" style={{ width: 40, height: 52, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                : <span style={{ fontSize: 26, flexShrink: 0 }}>{meta.icon}</span>}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{act.name}</div>
                {act.author && <div style={{ fontSize: 11, color: '#aaa' }}>{act.author}</div>}
                <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                  Every {act.frequencyDays}d · {'⭐'.repeat(Number(act.importance) || 3)} · {ds >= 999 ? 'Never done' : `${ds}d ago`}
                </div>
              </div>
              {!isRO && (
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => { setEditItem(act); setShowForm(true) }}
                    style={{ background: '#ede9ff', border: 'none', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 12, color: '#667eea' }}>Edit</button>
                  <button onClick={() => removeItem(act.id)}
                    style={{ background: '#fff1f2', border: 'none', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 12, color: '#e11d48' }}>Archive</button>
                </div>
              )}
            </div>
          )
        })}
        {active.length === 0 && (
          <div style={{ color: '#aaa', textAlign: 'center', padding: 30, fontSize: 14 }}>No items in this category.</div>
        )}
      </div>

      {archived.length > 0 && (
        <div style={{ marginTop: 20, marginBottom: 20 }}>
          <button onClick={() => setShowArch(s => !s)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: 13, padding: 0 }}>
            {showArchived ? '▲' : '▶'} Archived ({archived.length})
          </button>
          {showArchived && archived.map(act => (
            <div key={act.id} style={{ background: '#f9f9f9', border: '1px solid #eee', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, opacity: .65 }}>
              <span style={{ fontSize: 20 }}>{CAT_META[act.category]?.icon || '✨'}</span>
              <span style={{ flex: 1, fontSize: 13, color: '#888' }}>{act.name}</span>
            </div>
          ))}
        </div>
      )}

      {showForm && <ActivityForm item={editItem} onClose={() => { setShowForm(false); setEditItem(null) }} />}
    </div>
  )
}
