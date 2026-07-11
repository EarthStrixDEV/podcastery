import { useCallback } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'

const STORAGE_KEY = 'podcastery:play-history'
const MAX_ENTRIES = 200

export interface PlayHistoryEntry {
  videoId: string
  channelTitle: string
  playedAt: number
}

export function usePlayHistory() {
  const [history, setHistory] = useLocalStorage<PlayHistoryEntry[]>(STORAGE_KEY, [])

  const recordPlay = useCallback(
    (videoId: string, channelTitle?: string) => {
      if (!channelTitle) return
      setHistory((prev) => {
        const next = [{ videoId, channelTitle, playedAt: Date.now() }, ...prev]
        return next.slice(0, MAX_ENTRIES)
      })
    },
    [setHistory]
  )

  return { history, recordPlay }
}
