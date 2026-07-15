import type { VercelRequest, VercelResponse } from '@vercel/node'

const API_BASE = 'https://www.googleapis.com/youtube/v3'

const ALLOWED_ENDPOINTS = new Set(['search', 'videos', 'channels', 'playlistItems'])

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const key = process.env.YOUTUBE_API_KEY
  if (!key) {
    res.status(500).json({ error: 'ยังไม่ได้ตั้งค่า YouTube API Key บนเซิร์ฟเวอร์' })
    return
  }

  const endpoint = req.query.endpoint
  if (typeof endpoint !== 'string' || !ALLOWED_ENDPOINTS.has(endpoint)) {
    res.status(400).json({ error: 'endpoint ไม่ถูกต้อง' })
    return
  }

  const params = new URLSearchParams()
  for (const [name, value] of Object.entries(req.query)) {
    if (name === 'endpoint' || value === undefined) continue
    params.set(name, Array.isArray(value) ? value[0] : value)
  }
  params.set('key', key)

  try {
    const upstream = await fetch(`${API_BASE}/${endpoint}?${params}`)
    const data = await upstream.text()
    res.status(upstream.status)
    res.setHeader('Content-Type', 'application/json')
    res.send(data)
  } catch (err) {
    console.error(`[YouTube API proxy] เรียก ${endpoint} ไม่สำเร็จ:`, err)
    res.status(502).json({ error: 'เชื่อมต่อ YouTube ไม่สำเร็จ ลองใหม่อีกครั้ง' })
  }
}
