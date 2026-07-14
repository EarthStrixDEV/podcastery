import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { usePlaylists } from '@/hooks/usePlaylists'
import { usePlayHistory } from '@/hooks/usePlayHistory'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { YouTubePlayer, type YouTubePlayerHandle } from '@/components/YouTubePlayer'
import { getYouTubeThumbnail } from '@/lib/youtube'
import type { Episode, Playlist } from '@/types/playlist'

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const

/** เขียน localStorage ของ continue-watching ทุกๆ กี่ ms อย่างน้อย (throttle จาก progressTimer 500ms) */
const CONTINUE_WATCHING_WRITE_INTERVAL_MS = 7000

export interface ContinueWatchingRecord {
  videoId: string
  title: string
  channelTitle?: string
  thumbnail: string
  playlistId?: string
  episodeId?: string
  positionSeconds: number
  savedAt: number
}

interface PlaybackContextValue {
  playlists: Playlist[]
  createPlaylist: (name: string) => string
  deletePlaylist: (playlistId: string) => void
  addEpisode: (playlistId: string, url: string) => Promise<string | null>
  addEpisodeFromSearchResult: ReturnType<typeof usePlaylists>['addEpisodeFromSearchResult']
  importYouTubePlaylist: ReturnType<typeof usePlaylists>['importYouTubePlaylist']
  removeEpisode: (playlistId: string, episodeId: string) => void

  selectedPlaylistId: string | null
  currentEpisode: Episode | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isShuffled: boolean
  playbackRate: number
  isStableVolume: boolean
  isVoiceBoost: boolean

  playerRef: React.RefObject<YouTubePlayerHandle | null>
  playEpisode: (playlistId: string, episodeId: string, videoId: string, channelTitle?: string) => void
  /** เล่นวิดีโอที่ยังไม่ได้อยู่ใน playlist ไหน (เช่น เข้าจากผลค้นหาโดยตรง) — ไม่ผูก selectedPlaylistId */
  playStandaloneVideo: (videoId: string, title: string, channelTitle?: string) => void
  /** อัปเดต title/channel/thumbnail ของวิดีโอ standalone ที่กำลังเล่นอยู่ หลังโหลดข้อมูลจริงจาก API เสร็จ */
  updateStandaloneMetadata: (videoId: string, patch: Partial<Pick<Episode, 'title' | 'channelTitle' | 'thumbnail'>>) => void
  handleTogglePlay: () => void
  handleNext: () => void
  handlePrev: () => void
  handleVolumeChange: (volume: number) => void
  handleToggleShuffle: () => void
  handleCyclePlaybackRate: () => void
  handleSeek: (seconds: number) => void
  handleToggleStableVolume: () => void
  handleToggleVoiceBoost: () => void

  continueWatching: ContinueWatchingRecord | null
  resumeContinueWatching: () => void
}

const PlaybackContext = createContext<PlaybackContextValue | null>(null)

export function PlaybackProvider({ children }: { children: ReactNode }) {
  const {
    playlists,
    createPlaylist,
    deletePlaylist,
    addEpisode,
    addEpisodeFromSearchResult,
    importYouTubePlaylist,
    removeEpisode,
  } = usePlaylists()
  const { recordPlay } = usePlayHistory()

  const [isPlaying, setIsPlaying] = useState(false)
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null)
  const [currentEpisodeId, setCurrentEpisodeId] = useState<string | null>(null)
  const [standaloneEpisode, setStandaloneEpisode] = useState<Episode | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(70)
  const [isShuffled, setIsShuffled] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isStableVolume, setIsStableVolume] = useState(false)
  const [isVoiceBoost, setIsVoiceBoost] = useState(false)

  const playerRef = useRef<YouTubePlayerHandle>(null)
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const [continueWatching, setContinueWatching] = useLocalStorage<ContinueWatchingRecord | null>(
    'podcastery:continue-watching',
    null
  )
  const lastContinueWatchingWriteAt = useRef(0)

  /** volume ที่ส่งเข้า player จริง — Voice Boost ดันเป็น 100, ไม่งั้นใช้ volume ที่ user ตั้ง */
  const effectiveVolume = isVoiceBoost ? 100 : volume

  const selectedPlaylist = useMemo(
    () => playlists.find((p) => p.id === selectedPlaylistId) ?? null,
    [playlists, selectedPlaylistId]
  )

  const currentEpisode = useMemo(() => {
    if (standaloneEpisode) return standaloneEpisode
    return selectedPlaylist?.episodes.find((e) => e.id === currentEpisodeId) ?? null
  }, [standaloneEpisode, selectedPlaylist, currentEpisodeId])

  // ref เก็บค่าล่าสุดไว้ให้ beforeunload/interval callback อ่านได้โดยไม่ต้อง re-bind ทุกครั้งที่ currentTime เปลี่ยน
  const latestRef = useRef({ currentEpisode, currentTime, selectedPlaylistId, currentEpisodeId })
  latestRef.current = { currentEpisode, currentTime, selectedPlaylistId, currentEpisodeId }

  const saveContinueWatching = (force: boolean) => {
    const { currentEpisode: ep, currentTime: time, selectedPlaylistId: plId, currentEpisodeId: epId } =
      latestRef.current
    if (!ep) return
    const now = Date.now()
    if (!force && now - lastContinueWatchingWriteAt.current < CONTINUE_WATCHING_WRITE_INTERVAL_MS) return
    lastContinueWatchingWriteAt.current = now
    setContinueWatching({
      videoId: ep.videoId,
      title: ep.title,
      channelTitle: ep.channelTitle,
      thumbnail: ep.thumbnail,
      playlistId: plId ?? undefined,
      episodeId: epId ?? undefined,
      positionSeconds: time,
      savedAt: now,
    })
  }

  useEffect(() => {
    if (isPlaying) {
      progressTimer.current = setInterval(() => {
        setCurrentTime(playerRef.current?.getCurrentTime() ?? 0)
        setDuration(playerRef.current?.getDuration() ?? 0)
        if (isStableVolume) playerRef.current?.setVolume(effectiveVolume)
        saveContinueWatching(false)
      }, 500)
    } else if (progressTimer.current) {
      clearInterval(progressTimer.current)
      progressTimer.current = null
    }
    return () => {
      if (progressTimer.current) clearInterval(progressTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, isStableVolume, effectiveVolume])

  useEffect(() => {
    const onBeforeUnload = () => saveContinueWatching(true)
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    playerRef.current?.setVolume(effectiveVolume)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveVolume])

  const playEpisode = (
    playlistId: string,
    episodeId: string,
    videoId: string,
    channelTitle?: string
  ) => {
    setStandaloneEpisode(null)
    setSelectedPlaylistId(playlistId)
    setCurrentEpisodeId(episodeId)
    setCurrentTime(0)
    setDuration(0)
    playerRef.current?.loadVideo(videoId)
    playerRef.current?.setVolume(effectiveVolume)
    playerRef.current?.setPlaybackRate(playbackRate)
    setIsPlaying(true)
    recordPlay(videoId, channelTitle)
  }

  const playStandaloneVideo = (videoId: string, title: string, channelTitle?: string) => {
    setSelectedPlaylistId(null)
    setCurrentEpisodeId(null)
    setStandaloneEpisode({
      id: `standalone-${videoId}`,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      videoId,
      title,
      thumbnail: getYouTubeThumbnail(videoId),
      addedAt: Date.now(),
      channelTitle,
    })
    setCurrentTime(0)
    setDuration(0)
    playerRef.current?.loadVideo(videoId)
    playerRef.current?.setVolume(effectiveVolume)
    playerRef.current?.setPlaybackRate(playbackRate)
    setIsPlaying(true)
    recordPlay(videoId, channelTitle)
  }

  const updateStandaloneMetadata = (
    videoId: string,
    patch: Partial<Pick<Episode, 'title' | 'channelTitle' | 'thumbnail'>>
  ) => {
    setStandaloneEpisode((prev) => (prev && prev.videoId === videoId ? { ...prev, ...patch } : prev))
  }

  const handleTogglePlay = () => {
    if (!currentEpisode) return
    if (isPlaying) {
      playerRef.current?.pause()
      setIsPlaying(false)
    } else {
      playerRef.current?.play()
      setIsPlaying(true)
    }
  }

  const handleNext = () => {
    if (!selectedPlaylist || !currentEpisode) return
    const idx = selectedPlaylist.episodes.findIndex((e) => e.id === currentEpisode.id)

    if (isShuffled) {
      const candidates = selectedPlaylist.episodes.filter((e) => e.id !== currentEpisode.id)
      if (candidates.length === 0) return
      const next = candidates[Math.floor(Math.random() * candidates.length)]
      playEpisode(selectedPlaylist.id, next.id, next.videoId, next.channelTitle)
      return
    }

    const next = selectedPlaylist.episodes[idx + 1]
    if (next) playEpisode(selectedPlaylist.id, next.id, next.videoId, next.channelTitle)
  }

  const handlePrev = () => {
    if (!selectedPlaylist || !currentEpisode) return
    const idx = selectedPlaylist.episodes.findIndex((e) => e.id === currentEpisode.id)
    const prev = selectedPlaylist.episodes[idx - 1]
    if (prev) playEpisode(selectedPlaylist.id, prev.id, prev.videoId, prev.channelTitle)
  }

  const handleVolumeChange = (next: number) => {
    setVolumeState(next)
    if (!isVoiceBoost) playerRef.current?.setVolume(next)
  }

  const handleToggleShuffle = () => {
    setIsShuffled((prev) => !prev)
  }

  const handleToggleStableVolume = () => {
    setIsStableVolume((prev) => !prev)
  }

  const handleToggleVoiceBoost = () => {
    setIsVoiceBoost((prev) => !prev)
  }

  const handleCyclePlaybackRate = () => {
    const currentIndex = PLAYBACK_RATES.indexOf(playbackRate as (typeof PLAYBACK_RATES)[number])
    const nextRate = PLAYBACK_RATES[(currentIndex + 1) % PLAYBACK_RATES.length]
    setPlaybackRate(nextRate)
    playerRef.current?.setPlaybackRate(nextRate)
  }

  const handleSeek = (seconds: number) => {
    playerRef.current?.seekTo(seconds)
  }

  const handleRemoveEpisode = (playlistId: string, episodeId: string) => {
    removeEpisode(playlistId, episodeId)
    if (currentEpisodeId === episodeId) {
      setCurrentEpisodeId(null)
      setIsPlaying(false)
    }
    setContinueWatching((prev) =>
      prev && prev.playlistId === playlistId && prev.episodeId === episodeId ? null : prev
    )
  }

  /** episode เล่นจบ — เคลียร์ continue-watching record ของตัวที่เพิ่งจบ แล้วค่อยไปตอนถัดไปตามปกติ */
  const handleEnded = () => {
    setContinueWatching((prev) =>
      prev && prev.videoId === latestRef.current.currentEpisode?.videoId ? null : prev
    )
    handleNext()
  }

  const resumeContinueWatching = () => {
    if (!continueWatching) return
    const { videoId, title, channelTitle, playlistId, episodeId, positionSeconds } = continueWatching
    if (playlistId && episodeId) {
      playEpisode(playlistId, episodeId, videoId, channelTitle)
    } else {
      playStandaloneVideo(videoId, title, channelTitle)
    }
    seekWhenReady(positionSeconds)
  }

  /** loadVideo เป็น async ฝั่ง YT iframe — ต้องรอ duration > 0 (แปลว่าโหลดวิดีโอใหม่เสร็จแล้ว) ก่อนถึง seekTo จะมีผล */
  const seekWhenReady = (seconds: number) => {
    if (seconds <= 0) return
    const start = Date.now()
    const tryClear = setInterval(() => {
      const ready = (playerRef.current?.getDuration() ?? 0) > 0
      if (ready) {
        playerRef.current?.seekTo(seconds)
        clearInterval(tryClear)
      } else if (Date.now() - start > 8000) {
        // กันเคส network ช้าจนไม่มี duration เลย — เลิกพยายามหลัง 8 วิ
        clearInterval(tryClear)
      }
    }, 200)
  }

  const handleDeletePlaylist = (playlistId: string) => {
    deletePlaylist(playlistId)
    if (selectedPlaylistId === playlistId) {
      setSelectedPlaylistId(null)
      setCurrentEpisodeId(null)
      setIsPlaying(false)
    }
  }

  const value: PlaybackContextValue = {
    playlists,
    createPlaylist,
    deletePlaylist: handleDeletePlaylist,
    addEpisode,
    addEpisodeFromSearchResult,
    importYouTubePlaylist,
    removeEpisode: handleRemoveEpisode,

    selectedPlaylistId,
    currentEpisode,
    isPlaying,
    currentTime,
    duration,
    volume,
    isShuffled,
    playbackRate,
    isStableVolume,
    isVoiceBoost,

    playerRef,
    playEpisode,
    playStandaloneVideo,
    updateStandaloneMetadata,
    handleTogglePlay,
    handleNext,
    handlePrev,
    handleVolumeChange,
    handleToggleShuffle,
    handleCyclePlaybackRate,
    handleSeek,
    handleToggleStableVolume,
    handleToggleVoiceBoost,

    continueWatching,
    resumeContinueWatching,
  }

  return (
    <PlaybackContext.Provider value={value}>
      <YouTubePlayer
        ref={playerRef}
        onStateChange={(state) => {
          if (state === 1) setIsPlaying(true)
          if (state === 2) setIsPlaying(false)
        }}
        onEnded={handleEnded}
      />
      {children}
    </PlaybackContext.Provider>
  )
}

export function usePlayback() {
  const ctx = useContext(PlaybackContext)
  if (!ctx) throw new Error('usePlayback must be used within PlaybackProvider')
  return ctx
}
