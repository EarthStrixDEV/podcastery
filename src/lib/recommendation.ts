import type { PlayHistoryEntry } from '@/hooks/usePlayHistory'
import { searchVideos, type SearchResultItem } from '@/lib/youtubeDataApi'

const HALF_LIFE_MS = 14 * 24 * 60 * 60 * 1000 // 14 วัน
const RECOMMEND_COUNT = 10
const MAX_SOURCE_CHANNELS = 3

const FALLBACK_KEYWORDS = [
  'เพลงฮิต',
  'พอดแคสต์',
  'ข่าวล่าสุด',
  'สารคดี',
  'ตลกขำขัน',
  'เพลงสากล',
  'เรื่องเล่า',
]

interface ChannelScore {
  channelTitle: string
  score: number
}

function scoreChannels(history: PlayHistoryEntry[]): ChannelScore[] {
  const now = Date.now()
  const byChannel = new Map<string, number>()

  for (const entry of history) {
    const age = now - entry.playedAt
    const recencyWeight = Math.pow(0.5, age / HALF_LIFE_MS)
    byChannel.set(entry.channelTitle, (byChannel.get(entry.channelTitle) ?? 0) + recencyWeight)
  }

  return Array.from(byChannel.entries())
    .map(([channelTitle, score]) => ({ channelTitle, score }))
    .sort((a, b) => b.score - a.score)
}

/** สุ่มเลือก n รายการแบบไม่ซ้ำ ถ่วงน้ำหนักตาม score (weighted sampling without replacement) */
function weightedSampleWithoutReplacement<T extends { score: number }>(items: T[], n: number): T[] {
  const pool = [...items]
  const picked: T[] = []

  while (pool.length > 0 && picked.length < n) {
    const totalWeight = pool.reduce((sum, item) => sum + item.score, 0)
    if (totalWeight <= 0) {
      picked.push(...pool.splice(0, n - picked.length))
      break
    }
    let roll = Math.random() * totalWeight
    let index = 0
    for (; index < pool.length; index++) {
      roll -= pool[index].score
      if (roll <= 0) break
    }
    const [chosen] = pool.splice(Math.min(index, pool.length - 1), 1)
    picked.push(chosen)
  }

  return picked
}

function pickFallbackKeywords(count: number): string[] {
  const shuffled = [...FALLBACK_KEYWORDS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export interface RecommendationResult {
  clips: SearchResultItem[]
  sources: string[]
}

/**
 * สุ่มคลิปแนะนำโดยอิงน้ำหนักจาก play history:
 * score(channel) = sum(0.5 ^ (อายุของแต่ละครั้งที่ฟัง / 14 วัน))
 * สุ่มเลือก channel แบบ weighted-random-without-replacement แล้วยิง YouTube Search API ต่อ channel
 * ถ้ายังไม่มี history เลย ใช้ fallback keyword pool แทน
 */
export async function getRecommendedClips(history: PlayHistoryEntry[]): Promise<RecommendationResult> {
  const channelScores = scoreChannels(history)
  const usesFallback = channelScores.length === 0

  const sources = usesFallback
    ? pickFallbackKeywords(MAX_SOURCE_CHANNELS)
    : weightedSampleWithoutReplacement(channelScores, MAX_SOURCE_CHANNELS).map((c) => c.channelTitle)

  const resultsPerSource = await Promise.all(
    sources.map((source) => searchVideos(source).catch(() => [] as SearchResultItem[]))
  )

  const seen = new Set<string>()
  const merged: SearchResultItem[] = []
  for (const results of shuffle(resultsPerSource)) {
    for (const item of shuffle(results)) {
      if (seen.has(item.videoId)) continue
      seen.add(item.videoId)
      merged.push(item)
    }
  }

  return { clips: merged.slice(0, RECOMMEND_COUNT), sources }
}
