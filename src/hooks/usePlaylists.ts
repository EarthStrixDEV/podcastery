import { useCallback, useState } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import type { Episode, Playlist } from '@/types/playlist'
import { extractYouTubeVideoId, fetchYouTubeOEmbed, getYouTubeThumbnail } from '@/lib/youtube'
import {
  fetchVideoDetails,
  fetchChannelInfo,
  fetchVideoDetailsBatch,
  fetchPlaylistVideoIds,
  type VideoDetails,
  type SearchResultItem,
} from '@/lib/youtubeDataApi'

const STORAGE_KEY = 'podcastery:playlists'

async function buildEpisodeFromVideoId(videoId: string, rawUrl: string): Promise<Episode> {
  const [dataApiResult, oembedResult] = await Promise.allSettled([
    fetchVideoDetails(videoId),
    fetchYouTubeOEmbed(videoId),
  ])

  const details: VideoDetails | null = dataApiResult.status === 'fulfilled' ? dataApiResult.value : null
  const oembed = oembedResult.status === 'fulfilled' ? oembedResult.value : null

  let channelThumbnail: string | undefined
  if (details?.channelId) {
    const channel = await fetchChannelInfo(details.channelId)
    channelThumbnail = channel?.thumbnail
  }

  return {
    id: crypto.randomUUID(),
    url: rawUrl.trim(),
    videoId,
    title: details?.title ?? oembed?.title ?? `Episode ${videoId}`,
    thumbnail: getYouTubeThumbnail(videoId),
    addedAt: Date.now(),
    durationSeconds: details?.durationSeconds,
    channelTitle: details?.channelTitle,
    channelThumbnail,
  }
}

async function buildEpisodeFromVideoDetails(details: VideoDetails): Promise<Episode> {
  const channel = await fetchChannelInfo(details.channelId)
  return {
    id: crypto.randomUUID(),
    url: `https://www.youtube.com/watch?v=${details.videoId}`,
    videoId: details.videoId,
    title: details.title,
    thumbnail: getYouTubeThumbnail(details.videoId),
    addedAt: Date.now(),
    durationSeconds: details.durationSeconds,
    channelTitle: details.channelTitle,
    channelThumbnail: channel?.thumbnail,
  }
}

export function usePlaylists() {
  const [playlists, setPlaylists] = useLocalStorage<Playlist[]>(STORAGE_KEY, [])
  const [nowPlaying, setNowPlaying] = useState<{ playlistId: string; episodeId: string } | null>(
    null
  )

  const createPlaylist = useCallback(
    (name: string) => {
      const playlist: Playlist = {
        id: crypto.randomUUID(),
        name,
        episodes: [],
        createdAt: Date.now(),
      }
      setPlaylists((prev) => [...prev, playlist])
      return playlist.id
    },
    [setPlaylists]
  )

  const deletePlaylist = useCallback(
    (playlistId: string) => {
      setPlaylists((prev) => prev.filter((p) => p.id !== playlistId))
    },
    [setPlaylists]
  )

  const addEpisode = useCallback(
    async (playlistId: string, rawUrl: string): Promise<string | null> => {
      const videoId = extractYouTubeVideoId(rawUrl)
      if (!videoId) {
        return 'ลิงก์ YouTube ไม่ถูกต้อง กรุณาวางลิงก์รูปแบบ youtube.com/watch?v=... หรือ youtu.be/...'
      }

      const episode = await buildEpisodeFromVideoId(videoId, rawUrl)
      setPlaylists((prev) =>
        prev.map((p) => (p.id === playlistId ? { ...p, episodes: [...p.episodes, episode] } : p))
      )
      return null
    },
    [setPlaylists]
  )

  const addEpisodeFromSearchResult = useCallback(
    async (playlistId: string, result: SearchResultItem) => {
      const rawUrl = `https://www.youtube.com/watch?v=${result.videoId}`
      const episode = await buildEpisodeFromVideoId(result.videoId, rawUrl)
      setPlaylists((prev) =>
        prev.map((p) => (p.id === playlistId ? { ...p, episodes: [...p.episodes, episode] } : p))
      )
    },
    [setPlaylists]
  )

  const importYouTubePlaylist = useCallback(
    async (
      playlistId: string,
      youtubePlaylistId: string,
      onProgress?: (done: number, total: number) => void
    ) => {
      const videoIds = await fetchPlaylistVideoIds(youtubePlaylistId)
      if (videoIds.length === 0) {
        throw new Error('ไม่พบวิดีโอใน playlist นี้ หรือ playlist ไม่ใช่สาธารณะ')
      }

      const allDetails = await fetchVideoDetailsBatch(videoIds)
      const episodes: Episode[] = []
      for (let i = 0; i < allDetails.length; i++) {
        const episode = await buildEpisodeFromVideoDetails(allDetails[i])
        episodes.push(episode)
        onProgress?.(i + 1, allDetails.length)
      }

      setPlaylists((prev) =>
        prev.map((p) =>
          p.id === playlistId ? { ...p, episodes: [...p.episodes, ...episodes] } : p
        )
      )
    },
    [setPlaylists]
  )

  const removeEpisode = useCallback(
    (playlistId: string, episodeId: string) => {
      setPlaylists((prev) =>
        prev.map((p) =>
          p.id === playlistId ? { ...p, episodes: p.episodes.filter((e) => e.id !== episodeId) } : p
        )
      )
    },
    [setPlaylists]
  )

  return {
    playlists,
    createPlaylist,
    deletePlaylist,
    addEpisode,
    addEpisodeFromSearchResult,
    importYouTubePlaylist,
    removeEpisode,
    nowPlaying,
    setNowPlaying,
  }
}
