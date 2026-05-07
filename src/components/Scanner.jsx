import { useState, useRef } from 'react'
import { lookupISBN, identifyFromPhoto, detectBarcode } from '../api'

export default function Scanner({ onResult, onClose }) {
  const [stage,   setStage]   = useState('choose') // choose | processing | result | error
  const [result,  setResult]  = useState(null)
  const [errMsg,  setErrMsg]  = useState('')
  const barcodeRef            = useRef()
  const photoRef              = useRef()

  async function handleBarcode(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setStage('processing')
    try {
      // 1. Try native BarcodeDetector API
      const code = await detectBarcode(file)
      if (code) {
        const book = await lookupISBN(code)
        if (book) { setResult(book); setStage('result'); return }
      }
      // 2. Fallback: Claude Vision reads the barcode / identifies item
      const b64 = await toBase64(file)
      const res = await identifyFromPhoto(b64)
      if (res) { setResult(res); setStage('result'); return }
      throw new Error('Could not read barcode. Try the photo option instead.')
    } catch (err) { setErrMsg(err.message); setStage('error') }
  }

  async function handlePhoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setStage('processing')
    try {
      const b64 = await toBase64(file)
      const res = await identifyFromPhoto(b64)
      if (!res) throw new Error('Could not identify item. Try a clearer photo of the cover or label.')
      setResult(res); setStage('result')
    } catch (err) { setErrMsg(err.message); setStage('error') }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 300, display: 'flex', alignItems: 'flex-end' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: '22px 22px 0 0', padding: '24px 20px 40px', width: '100%', maxHeight: '85vh', overflowY: 'auto', boxSizing: 'border-box' }}>

        {stage === 'choose' && (
          <>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 6 }}>📷 Add by Camera</div>
            <div style={{ color: '#888', fontSize: 13, marginBottom: 24 }}>Point at a barcode or take a photo of the item</div>

            <button onClick={() => barcodeRef.current.click()} style={scanBtn('#667eea')}>
              <span style={{ fontSize: 32 }}>📊</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Scan Barcode / ISBN</div>
                <div style={{ fontSize: 12, opacity: .85 }}>Best for books — auto-fills title, author & cover</div>
              </div>
            </button>
            <input ref={barcodeRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleBarcode} />

            <button onClick={() => photoRef.current.click()} style={{ ...scanBtn('#43C6AC'), marginTop: 10 }}>
              <span style={{ fontSize: 32 }}>🖼️</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Take a Photo</div>
                <div style={{ fontSize: 12, opacity: .85 }}>Toys, games, art supplies — Claude identifies it</div>
              </div>
            </button>
            <input ref={photoRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handlePhoto} />

            <button onClick={onClose}
              style={{ width: '100%', marginTop: 16, background: '#f3f0ff', border: 'none', borderRadius: 14, padding: 14, color: '#667eea', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              Cancel — add manually instead
            </button>
          </>
        )}

        {stage === 'processing' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Identifying item…</div>
            <div style={{ color: '#888', fontSize: 13, marginTop: 6 }}>This takes a few seconds</div>
          </div>
        )}

        {stage === 'result' && result && (
          <>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 16 }}>✅ Found it!</div>
            {result.imageUrl && <img src={result.imageUrl} alt="" style={{ width: 80, height: 110, objectFit: 'cover', borderRadius: 8, marginBottom: 12 }} />}
            <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 4 }}>{result.name}</div>
            {result.author && <div style={{ color: '#888', fontSize: 13, marginBottom: 4 }}>{result.author}</div>}
            <div style={{ fontSize: 13, color: '#667eea', fontWeight: 600, marginBottom: 4 }}>{result.category}</div>
            {result.notes && <div style={{ fontSize: 12, color: '#888', marginBottom: 16 }}>{result.notes}</div>}
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button onClick={() => setStage('choose')}
                style={{ flex: 1, background: '#f3f0ff', border: 'none', borderRadius: 14, padding: 14, color: '#667eea', fontWeight: 700, cursor: 'pointer' }}>
                Try again
              </button>
              <button onClick={() => onResult(result)}
                style={{ flex: 2, background: '#667eea', border: 'none', borderRadius: 14, padding: 14, color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
                Use this →
              </button>
            </div>
          </>
        )}

        {stage === 'error' && (
          <>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>😕 Couldn't identify</div>
            <div style={{ color: '#888', fontSize: 13, marginBottom: 24 }}>{errMsg}</div>
            <button onClick={() => setStage('choose')}
              style={{ width: '100%', background: '#667eea', border: 'none', borderRadius: 14, padding: 14, color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginBottom: 10 }}>
              Try again
            </button>
            <button onClick={onClose}
              style={{ width: '100%', background: '#f3f0ff', border: 'none', borderRadius: 14, padding: 14, color: '#667eea', fontWeight: 700, cursor: 'pointer' }}>
              Add manually instead
            </button>
          </>
        )}
      </div>
    </div>
  )
}

const scanBtn = color => ({
  display: 'flex', alignItems: 'center', gap: 16, width: '100%',
  background: color, border: 'none', borderRadius: 16, padding: '16px 18px',
  color: '#fff', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
})

async function toBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload  = () => res(r.result.split(',')[1])
    r.onerror = rej
    r.readAsDataURL(file)
  })
}
