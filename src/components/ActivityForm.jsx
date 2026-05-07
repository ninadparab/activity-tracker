import { useState } from 'react'
import { useApp } from '../App'
import { CAT_META } from '../App'
import Scanner from './Scanner'

const CATS = ['Books', 'Board Games', 'Construction/STEM Toys', 'Classes', 'Outdoor', 'Art']
const lbl  = { display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6 }
const inp  = { width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '10px 12px', fontSize: 14, marginBottom: 16, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }

export default function ActivityForm({ item, onClose }) {
  const { saveItem } = useApp()
  const [showScanner, setShowScanner] = useState(false)
  const [f, setF] = useState(item
    ? { ...item }
    : { name: '', category: 'Books', subcategory: '', importance: 3, frequencyDays: 14, notes: '', author: '', imageUrl: '', isbn: '', source: 'manual' }
  )
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  function handleScanResult(data) {
    setF(p => ({ ...p, ...data }))
    setShowScanner(false)
  }

  async function handleSave() {
    if (!f.name.trim()) return
    await saveItem(f)
    onClose()
  }

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}
        onClick={e => e.target === e.currentTarget && onClose()}>
        <div style={{ background: '#fff', borderRadius: '22px 22px 0 0', padding: '24px 20px 40px', width: '100%', maxHeight: '92vh', overflowY: 'auto', boxSizing: 'border-box' }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{item ? 'Edit Item' : 'Add New Item'}</div>
            {!item && (
              <button onClick={() => setShowScanner(true)}
                style={{ background: '#667eea', border: 'none', borderRadius: 20, padding: '7px 14px', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                📷 Scan
              </button>
            )}
          </div>

          {f.imageUrl && (
            <img src={f.imageUrl} alt="" style={{ width: 60, height: 80, objectFit: 'cover', borderRadius: 8, marginBottom: 12 }} />
          )}

          <label style={lbl}>Name</label>
          <input value={f.name} onChange={e => set('name', e.target.value)} style={inp} placeholder="e.g. Harry Potter and the Sorcerer's Stone" />

          <label style={lbl}>Author / Brand (optional)</label>
          <input value={f.author || ''} onChange={e => set('author', e.target.value)} style={inp} placeholder="e.g. J.K. Rowling, LEGO" />

          <label style={lbl}>Category</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>
            {CATS.map(c => {
              const meta = CAT_META[c] || { icon: '✨', color: '#888' }
              return (
                <button key={c} onClick={() => set('category', c)}
                  style={{ background: f.category === c ? meta.color : '#f3f0ff', color: f.category === c ? '#fff' : meta.color, border: 'none', borderRadius: 20, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                  {meta.icon} {c}
                </button>
              )
            })}
          </div>

          <label style={lbl}>Subcategory / Type (optional)</label>
          <input value={f.subcategory || ''} onChange={e => set('subcategory', e.target.value)} style={inp} placeholder="e.g. Science, Puzzle, Lego Technic" />

          <label style={lbl}>Importance</label>
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => set('importance', n)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 26, opacity: f.importance >= n ? 1 : .2, padding: '2px 4px' }}>
                ⭐
              </button>
            ))}
          </div>

          <label style={lbl}>How often should we do this? (every N days)</label>
          <input type="number" value={f.frequencyDays} min={1}
            onChange={e => set('frequencyDays', Math.max(1, parseInt(e.target.value) || 1))} style={inp} />

          <label style={lbl}>Notes (optional)</label>
          <input value={f.notes || ''} onChange={e => set('notes', e.target.value)} style={inp} placeholder="Any notes…" />

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button onClick={onClose}
              style={{ flex: 1, background: '#f3f0ff', border: 'none', borderRadius: 14, padding: 14, color: '#667eea', fontWeight: 700, cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={handleSave}
              style={{ flex: 2, background: f.name.trim() ? '#667eea' : '#c4b5fd', border: 'none', borderRadius: 14, padding: 14, color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
              {item ? 'Save Changes' : 'Add Item'}
            </button>
          </div>
        </div>
      </div>

      {showScanner && <Scanner onResult={handleScanResult} onClose={() => setShowScanner(false)} />}
    </>
  )
}
