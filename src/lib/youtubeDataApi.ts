const API_BASE = 'https://www.googleapis.com/youtube/v3'

function getApiKey(): string | undefined {
  return import.meta.env.VITE_YOUTUBE_API_KEY
}

export interface VideoDetails {
  videoId: string
  title: string
  channelId: string
  channelTitle: string
  durationSeconds: number
  thumbnail: string
}

export function parseIsoDuration(iso: string): number {
  const match = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/)
  if (!match) return 0
  const hours = Number(match[1] ?? 0)
  const minutes = Number(match[2] ?? 0)
  const seconds = Number(match[3] ?? 0)
  return hours * 3600 + minutes * 60 + seconds
}

interface VideosApiItem {
  id: string
  snippet: { title: string; channelId: string; channelTitle: string; thumbnails: { medium?: { url: string }; default: { url: string } } }
  contentDetails: { duration: string }
}

interface VideosApiResponse {
  items: VideosApiItem[]
}

function mapVideoItem(item: VideosApiItem): VideoDetails {
  return {
    videoId: item.id,
    title: item.snippet.title,
    channelId: item.snippet.channelId,
    channelTitle: item.snippet.channelTitle,
    durationSeconds: parseIsoDuration(item.contentDetails.duration),
    thumbnail: item.snippet.thumbnails.medium?.url ?? item.snippet.thumbnails.default.url,
  }
}

export async function fetchVideoDetailsBatch(videoIds: string[]): Promise<VideoDetails[]> {
  const key = getApiKey()
  if (!key || videoIds.length === 0) return []

  const chunks: string[][] = []
  for (let i = 0; i < videoIds.length; i += 50) {
    chunks.push(videoIds.slice(i, i + 50))
  }

  const results: VideoDetails[] = []
  for (const chunk of chunks) {
    try {
      const params = new URLSearchParams({
        part: 'snippet,contentDetails',
        id: chunk.join(','),
        key,
      })
      const res = await fetch(`${API_BASE}/videos?${params}`)
      if (!res.ok) continue
      const data: VideosApiResponse = await res.json()
      results.push(...data.items.map(mapVideoItem))
    } catch {
      continue
    }
  }
  return results
}

export async function fetchVideoDetails(videoId: string): Promise<VideoDetails | null> {
  const results = await fetchVideoDetailsBatch([videoId])
  return results[0] ?? null
}

export interface ChannelInfo {
  channelId: string
  title: string
  thumbnail: string
}

interface ChannelsApiItem {
  id: string
  snippet: { title: string; thumbnails: { default: { url: string } } }
}

interface ChannelsApiResponse {
  items: ChannelsApiItem[]
}

export async function fetchChannelInfo(channelId: string): Promise<ChannelInfo | null> {
  const key = getApiKey()
  if (!key) return null

  try {
    const res = await fetch(`${API_BASE}/channels?part=snippet&id=${channelId}&key=${key}`)
    if (!res.ok) return null
    const data: ChannelsApiResponse = await res.json()
    const item = data.items[0]
    if (!item) return null
    return {
      channelId: item.id,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.default.url,
    }
  } catch {
    return null
  }
}
