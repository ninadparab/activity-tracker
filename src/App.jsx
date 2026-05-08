import { useState, useEffect, createContext, useContext } from 'react'
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { api } from './api'
import { APP_PIN } from './config'
import Today      from './pages/Today'
import Activities from './pages/Activities'
import Dashboard  from './pages/Dashboard'
import Events     from './pages/Events'

export const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)

export const CAT_META = {
  'Books':                  { icon: '📚', color: '#6C63FF' },
  'Board Games':            { icon: '🎲', color: '#FF6584' },
  'Construction/STEM Toys': { icon: '🔧', color: '#43C6AC' },
  'Classes':                { icon: '🏫', color: '#2193B0' },
  'Outdoor':                { icon: '🌳', color: '#56AB2F' },
  'Art':                    { icon: '🎨', color: '#FFB347' },
}

const USERS = [
  { id: 'Dad',      emoji: '👨', role: 'admin'    },
  { id: 'Mom',      emoji: '👩', role: 'admin'    },
  { id: 'Daughter', emoji: '👧', role: 'readonly' },
]

export default function App() {
  const [user, setUser]   = useState(() => localStorage.getItem('ktrk_user'))
  const [acts, setActs]   = useState([])
  const [logs, setLogs]   = useState([])
  const [busy, setBusy]   = useState(false)
  const [toast, setToast] = useState(null)

  const isRO = USERS.find(u => u.id === user)?.role === 'readonly'

  // ── PIN gate ───────────────────────────────────────────────────────────────
  const [pinOk,    setPinOk]    = useState(() => localStorage.getItem('ktrk_pin') === APP_PIN)
  const [pinInput, setPinInput] = useState('')
  const [pinErr,   setPinErr]   = useState(false)

  function checkPin() {
    if (pinInput.trim() === APP_PIN) {
      localStorage.setItem('ktrk_pin', APP_PIN)
      setPinOk(true)
    } else {
      setPinErr(true)
      setPinInput('')
      setTimeout(() => setPinErr(false), 1800)
    }
  }

  if (!pinOk) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: '36px 28px', maxWidth: 300, width: '90%', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🔒</div>
        <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 800, color: '#333' }}>Family Tracker</h2>
        <p style={{ color: '#888', fontSize: 13, marginBottom: 24 }}>Enter your family PIN to continue</p>
        <input
          type="password"
          value={pinInput}
          onChange={e => setPinInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && checkPin()}
          placeholder="Enter PIN"
          autoFocus
          style={{ width: '100%', border: `2px solid ${pinErr ? '#e53e3e' : '#ede9ff'}`, borderRadius: 12, padding: '12px 14px', fontSize: 18, textAlign: 'center', letterSpacing: 6, boxSizing: 'border-box', outline: 'none', marginBottom: 12, fontFamily: 'inherit' }}
        />
        {pinErr && <div style={{ color: '#e53e3e', fontSize: 13, marginBottom: 10 }}>Incorrect PIN — try again</div>}
        <button onClick={checkPin}
          style={{ width: '100%', background: '#667eea', border: 'none', borderRadius: 14, padding: 14, color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
          Continue →
        </button>
      </div>
    </div>
  )

  // ── User selector ──────────────────────────────────────────────────────────
  if (!user) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: '32px 28px', maxWidth: 320, width: '90%' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 52 }}>🌟</div>
          <h1 style={{ margin: '8px 0 4px', fontSize: 22, fontWeight: 800, color: '#333' }}>Activity Tracker</h1>
          <p style={{ color: '#888', fontSize: 13, margin: 0 }}>Who's using the app?</p>
        </div>
        {USERS.map(u => (
          <button key={u.id}
            onClick={() => { setUser(u.id); localStorage.setItem('ktrk_user', u.id) }}
            style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', marginBottom: 10, background: '#f8f7ff', border: '2px solid #ede9ff', borderRadius: 16, padding: '14px 16px', cursor: 'pointer', fontFamily: 'inherit' }}>
            <span style={{ fontSize: 28 }}>{u.emoji}</span>
            <span style={{ flex: 1, textAlign: 'left', fontSize: 16, fontWeight: 700, color: '#333' }}>{u.id}</span>
            {u.role === 'readonly' && <span style={{ fontSize: 11, color: '#aaa' }}>View only</span>}
          </button>
        ))}
      </div>
    </div>
  )

  // ── Main app ───────────────────────────────────────────────────────────────
  function flash(msg, err = false) {
    setToast({ msg, err })
    setTimeout(() => setToast(null), 2800)
  }

  async function refresh() {
    setBusy(true)
    try {
      const [a, l] = await Promise.all([api.activities(), api.logs({ days: 120 })])
      setActs(Array.isArray(a) ? a : [])
      setLogs(Array.isArray(l) ? l : [])
    } catch (e) { flash(e.message, true) }
    setBusy(false)
  }

  async function logItem(activityId) {
    if (isRO) return
    try { await api.logActivity({ activityId, user }); flash('✅ Logged!'); refresh() }
    catch (e) { flash(e.message, true) }
  }

  async function saveItem(item) {
    if (isRO) return
    try {
      item.id ? await api.updateActivity(item) : await api.addActivity({ ...item, addedBy: user })
      flash(item.id ? '✅ Updated' : '✅ Added')
      refresh()
    } catch (e) { flash(e.message, true) }
  }

  async function removeItem(id) {
    if (isRO) return
    try { await api.archiveActivity(id); flash('Archived'); refresh() }
    catch (e) { flash(e.message, true) }
  }

  useEffect(() => { refresh() }, [user])

  const ctx = { user, isRO, activities: acts, logs, busy, logItem, saveItem, removeItem, refresh, flash }

  return (
    <Ctx.Provider value={ctx}>
      <BrowserRouter basename="/activity-tracker">
        <div style={{ maxWidth: 640, margin: '0 auto', minHeight: '100vh', background: '#f8f7ff', fontFamily: "'Segoe UI',system-ui,sans-serif", paddingBottom: 72 }}>

          <header style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>🌟 Activity Tracker</div>
              <div style={{ fontSize: 11, opacity: .75 }}>{user}{isRO ? ' · view only' : ''}</div>
            </div>
            <button onClick={() => { setUser(null); localStorage.removeItem('ktrk_user') }}
              style={{ background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', borderRadius: 20, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
              Switch
            </button>
          </header>

          {busy && <div style={{ height: 3, background: 'rgba(102,126,234,.4)' }} />}

          <Routes>
            <Route path="/"           element={<Today />} />
            <Route path="/activities" element={<Activities />} />
            <Route path="/dashboard"  element={<Dashboard />} />
            <Route path="/events"     element={<Events />} />
            <Route path="*"           element={<Navigate to="/" replace />} />
          </Routes>

          <nav style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 640, background: '#fff', borderTop: '1px solid #eee', display: 'flex', zIndex: 50 }}>
            {[['/', '🌟', 'Today'], ['/activities', '📋', 'Items'], ['/dashboard', '📊', 'Stats'], ['/events', '🗓', 'Events']].map(([to, ic, lb]) => (
              <NavLink key={to} to={to} end={to === '/'}
                style={({ isActive }) => ({ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '10px 0 8px', color: isActive ? '#667eea' : '#aaa', fontWeight: isActive ? 700 : 400, fontSize: 11, textDecoration: 'none' })}>
                <span style={{ fontSize: 22 }}>{ic}</span>{lb}
              </NavLink>
            ))}
          </nav>

          {toast && (
            <div style={{ position: 'fixed', top: 70, left: '50%', transform: 'translateX(-50%)', background: toast.err ? '#e53e3e' : '#1a1a2e', color: '#fff', borderRadius: 20, padding: '10px 20px', fontSize: 14, zIndex: 200, boxShadow: '0 4px 20px rgba(0,0,0,.2)', whiteSpace: 'nowrap' }}>
              {toast.msg}
            </div>
          )}
        </div>
      </BrowserRouter>
    </Ctx.Provider>
  )
}
