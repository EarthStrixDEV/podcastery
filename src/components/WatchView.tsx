import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronDown, ChevronUp, ExternalLink, ListPlus, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePlayback } from '@/contexts/PlaybackContext'
import { fetchVideoDetails, searchVideos, type SearchResultItem, type VideoDetails } from '@/lib/youtubeDataApi'
import { formatDuration, formatRelativeDate, formatTime, formatViewCount } from '@/lib/format'
import { fetchYouTubeOEmbed, getYouTubeThumbnail } from '@/lib/youtube'
import type { Episode } from '@/types/playlist'

const RELATED_COUNT = 10

interface WatchViewProps {
  onSaveClip: (clip: SearchResultItem) => void
}

export function WatchView({ onSaveClip }: WatchViewProps) {
  const { videoId } = useParams<{ videoId: string }>()
  const navigate = useNavigate()
  const {
    playlists,
    currentEpisode,
    isPlaying,
    currentTime,
    duration,
    playerRef,
    playEpisode,
    playStandaloneVideo,
    updateStandaloneMetadata,
    continueWatching,
  } = usePlayback()

  const [details, setDetails] = useState<VideoDetails | null>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(true)
  const [descExpanded, setDescExpanded] = useState(false)
  const [related, setRelated] = useState<Array<Episode | SearchResultItem>>([])

  const owningPlaylist = useMemo(
    () => playlists.find((p) => p.episodes.some((e) => e.videoId === videoId)) ?? null,
    [playlists, videoId]
  )

  useEffect(() => {
    if (!videoId) {
      navigate('/', { replace: true })
      return
    }

    if (owningPlaylist) {
      const episode = owningPlaylist.episodes.find((e) => e.videoId === videoId)!
      playEpisode(owningPlaylist.id, episode.id, episode.videoId, episode.channelTitle)
    } else {
      playStandaloneVideo(videoId, 'กำลังโหลด...')
    }

    // ถ้ามี record เล่นค้างไว้ตรงกับวิดีโอนี้ ให้ seek กลับไปตำแหน่งเดิมทันที (ไม่ต้องผ่าน banner)
    if (continueWatching?.videoId === videoId && continueWatching.positionSeconds > 0) {
      const targetSeconds = continueWatching.positionSeconds
      const start = Date.now()
      const trySeek = setInterval(() => {
        const ready = (playerRef.current?.getDuration() ?? 0) > 0
        if (ready) {
          playerRef.current?.seekTo(targetSeconds)
          clearInterval(trySeek)
        } else if (Date.now() - start > 8000) {
          clearInterval(trySeek)
        }
      }, 200)
      return () => clearInterval(trySeek)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId])

  useEffect(() => {
    if (!videoId || owningPlaylist) return
    let cancelled = false
    fetchYouTubeOEmbed(videoId).then((oembed) => {
      if (cancelled || !oembed) return
      updateStandaloneMetadata(videoId, { title: oembed.title, channelTitle: oembed.authorName })
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, owningPlaylist])

  useEffect(() => {
    if (!videoId) return
    let cancelled = false
    setIsLoadingDetails(true)
    setDescExpanded(false)
    fetchVideoDetails(videoId)
      .then((result) => {
        if (cancelled) return
        setDetails(result)
        if (result && !owningPlaylist) {
          updateStandaloneMetadata(videoId, {
            title: result.title,
            channelTitle: result.channelTitle,
            thumbnail: result.thumbnail,
          })
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingDetails(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, owningPlaylist])

  useEffect(() => {
    if (!videoId) return
    let cancelled = false

    async function loadRelated() {
      const fromPlaylist = (owningPlaylist?.episodes ?? []).filter((e) => e.videoId !== videoId)
      const combined: Array<Episode | SearchResultItem> = [...fromPlaylist]

      if (combined.length < RELATED_COUNT) {
        const keyword = details?.channelTitle ?? details?.title
        if (keyword) {
          try {
            const searched = await searchVideos(keyword)
            const seen = new Set(combined.map((c) => c.videoId))
            for (const item of searched) {
              if (item.videoId === videoId || seen.has(item.videoId)) continue
              seen.add(item.videoId)
              combined.push(item)
              if (combined.length >= RELATED_COUNT) break
            }
          } catch {
            // เงียบไว้ — related เป็น best-effort เท่านั้น
          }
        }
      }

      if (!cancelled) setRelated(combined.slice(0, RELATED_COUNT))
    }

    loadRelated()
    return () => {
      cancelled = true
    }
  }, [videoId, owningPlaylist, details?.channelTitle, details?.title])

  if (!videoId) return null

  const title = details?.title ?? currentEpisode?.title ?? ''
  const channelTitle = details?.channelTitle ?? currentEpisode?.channelTitle ?? ''
  const thumbnail = getYouTubeThumbnail(videoId)
  const progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0

  const handlePickRelated = (item: Episode | SearchResultItem) => {
    navigate(`/watch/${item.videoId}`)
  }

  const handleSave = () => {
    onSaveClip({
      videoId,
      title,
      channelTitle,
      thumbnail: details?.thumbnail ?? thumbnail,
    })
  }

  return (
    <div className="flex flex-col gap-6 px-8 py-7 lg:flex-row">
      <div className="min-w-0 flex-1">
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-muted shadow-sm">
          <img src={thumbnail} alt={title} className="size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          {isPlaying && (
            <span className="absolute bottom-4 left-4 flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 text-xs font-medium text-white">
              <Play className="size-3 fill-current" />
              กำลังเล่น
            </span>
          )}
          <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="mt-4 flex items-start justify-between gap-4">
          <h1 className="font-heading text-xl font-bold leading-snug text-foreground">
            {isLoadingDetails && !details ? (
              <span className="inline-block h-6 w-2/3 animate-pulse rounded bg-muted" />
            ) : (
              title
            )}
          </h1>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              onClick={() =>
                window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank', 'noopener,noreferrer')
              }
              variant="outline"
              className="gap-1.5 rounded-full transition-transform active:scale-95"
              aria-label="ดูบน YouTube"
            >
              <ExternalLink className="size-4" />
              Watch on YouTube
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              variant="outline"
              className="gap-1.5 rounded-full transition-transform active:scale-95"
            >
              <ListPlus className="size-4" />
              Save
            </Button>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3">
          {isLoadingDetails && !details ? (
            <div className="h-4 w-40 animate-pulse rounded bg-muted" />
          ) : (
            <>
              <span className="text-sm font-medium text-foreground">{channelTitle}</span>
              {typeof details?.viewCount === 'number' && (
                <span className="text-sm text-muted-foreground">
                  {formatViewCount(details.viewCount)} ครั้ง
                </span>
              )}
              {details?.publishedAt && (
                <span className="text-sm text-muted-foreground">
                  {formatRelativeDate(details.publishedAt)}
                </span>
              )}
            </>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>/</span>
          <span>{formatTime(duration)}</span>
        </div>

        {details?.description && (
          <div className="mt-4 rounded-xl bg-muted/60 p-3.5">
            <p className={descExpanded ? 'whitespace-pre-line text-sm text-foreground' : 'line-clamp-3 whitespace-pre-line text-sm text-foreground'}>
              {details.description}
            </p>
            <button
              type="button"
              onClick={() => setDescExpanded((prev) => !prev)}
              className="mt-2 flex items-center gap-1 text-xs font-semibold text-foreground hover:text-primary"
            >
              {descExpanded ? (
                <>
                  แสดงน้อยลง <ChevronUp className="size-3.5" />
                </>
              ) : (
                <>
                  แสดงเพิ่มเติม <ChevronDown className="size-3.5" />
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <aside className="flex w-full shrink-0 flex-col gap-2 lg:w-80">
        <h2 className="mb-1 text-sm font-semibold text-foreground">แนะนำถัดไป</h2>
        {related.map((item) => (
          <button
            key={item.videoId}
            type="button"
            onClick={() => handlePickRelated(item)}
            className="flex items-center gap-3 rounded-xl p-2 text-left transition-colors duration-150 hover:bg-muted"
          >
            <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-muted">
              <img src={item.thumbnail} alt={item.title} className="size-full object-cover" />
              {'durationSeconds' in item && item.durationSeconds ? (
                <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[10px] font-medium text-white">
                  {formatDuration(item.durationSeconds)}
                </span>
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
                {item.title}
              </p>
              <p className="mt-1 truncate text-xs text-muted-foreground">{item.channelTitle}</p>
            </div>
          </button>
        ))}
        {related.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">ยังไม่มีคลิปแนะนำ</p>
        )}
      </aside>
    </div>
  )
}
