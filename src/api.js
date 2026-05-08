import { API_URL, ANTHROPIC_KEY, ACCESS_TOKEN } from './config'

// ── Apps Script API ────────────────────────────────────────────────────────

async function call(action, params = {}, body = null) {
  const url = new URL(API_URL)
  url.searchParams.set('action', action)
  url.searchParams.set('token', ACCESS_TOKEN)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)))

  // Apps Script requires text/plain to avoid CORS preflight failure
  const opts = body
    ? { method: 'POST', redirect: 'follow', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ action, token: ACCESS_TOKEN, ...body }) }
    : { method: 'GET',  redirect: 'follow' }

  const res  = await fetch(url.toString(), opts)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data
}

export const api = {
  activities:      ()     => call('getActivities'),
  addActivity:     (d)    => call('addActivity',       {}, d),
  updateActivity:  (d)    => call('updateActivity',    {}, d),
  archiveActivity: (id)   => call('archiveActivity',   {}, { id }),
  logs:            (p={}) => call('getLogs',            p),
  logActivity:     (d)    => call('logActivity',       {}, d),
  recommendations: (p={}) => call('getRecommendations', p),
  events:          ()     => call('getEvents'),
  refreshEvents:   ()     => call('refreshEvents',     {}, {}),
}

// ── Google Books lookup (free, no key needed) ──────────────────────────────

export async function lookupISBN(isbn) {
  const clean = isbn.replace(/[^0-9X]/gi, '')
  const res   = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=isbn:${clean}&maxResults=1`
  )
  const data  = await res.json()
  if (!data.items?.length) return null
  const info  = data.items[0].volumeInfo
  return {
    name:        info.title || '',
    author:      info.authors?.join(', ') || '',
    imageUrl:    (info.imageLinks?.thumbnail || '').replace('http:', 'https:'),
    isbn:        clean,
    category:    'Books',
    subcategory: info.categories?.[0] || '',
    notes:       info.description?.slice(0, 120) || '',
    source:      'google_books',
  }
}

// ── Claude Vision — identifies toys, games, books from a photo ────────────

export async function identifyFromPhoto(base64jpeg) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-api-key':         ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/jpeg', data: base64jpeg },
          },
          {
            type: 'text',
            text: 'Identify this children\'s item. Return ONLY a raw JSON object (no markdown): ' +
              '{"name":"exact product name","category":"Books|Board Games|Construction/STEM Toys|Art|Outdoor|Classes",' +
              '"subcategory":"brief type e.g. Science, Lego, Puzzle","author":"if a book, else empty",' +
              '"notes":"one sentence description"}',
          },
        ],
      }],
    }),
  })
  const data = await res.json()
  const text = data.content?.[0]?.text || '{}'
  try { return JSON.parse(text.replace(/```json|```/g, '').trim()) }
  catch { return null }
}

// ── Native barcode detection (Chrome on Android, Edge) ────────────────────

export async function detectBarcode(imageFile) {
  if (!('BarcodeDetector' in window)) return null
  try {
    const detector = new BarcodeDetector({
      formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'],
    })
    const bitmap  = await createImageBitmap(imageFile)
    const results = await detector.detect(bitmap)
    return results.length ? results[0].rawValue : null
  } catch { return null }
}
