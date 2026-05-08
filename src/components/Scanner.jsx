import { useState, useRef } from 'react'
import { lookupISBN, identifyFromPhoto, detectBarcode } from '../api'

export default function Scanner({ onResult, onClose }) {
  const [stage,  setStage]  = useState('choose')
  const [result, setResult] = useState(null)
  const [errMsg, setErrMsg] = useState('')
  const barcodeRef          = useRef()
  const photoRef            = useRef()

  async function handleBarcode(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setStage('processing')
    try {
      const code = await detectBarcode(file)
      if (code) {
        const book = await lookupISBN(code)
        if (book) { setResult(book); setStage('result'); return }
      }
      // Fallback: Claude Vision
      const b64 = await toBase64(file)
      const res  = await identifyFromPhoto(b64)
      if (res) { setResult(res); setStage('result'); return }
      throw new Error('Could not read barcode. Try the photo option.')
    } catch (err) { setErrMsg(err.message); setStage('error') }
  }

  async function handlePhoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setStage('processing')
    try {
      const b64 = await toBase64(file)
      const res  = await identifyFromPhoto(b64)
      if (!res) throw new Error('Could not identify item. Try a clearer photo.')
      setResult(res); setStage('result')
    } catch (err) { setErrMsg(err.message); setStage('error') }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:300, display:'flex', alignItems:'flex-end' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'#fff', borderRadius:'22px 22px 0 0', padding:'24px 20px 40px', width:'100%', maxHeig
