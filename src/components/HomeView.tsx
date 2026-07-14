import { useEffect, useState } from 'react'
import { Play, Search, Sparkles, RotateCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { notifyError } from '@/lib/swal'
import { ClipCard } from '@/components/ClipCard'
import { CategoryRow } from '@/components/CategoryRow'
import { searchVideos, type SearchResultItem } from '@/lib/youtubeDataApi'
import { usePlayHistory } from '@/hooks/usePlayHistory'
import { usePlayback } from '@/contexts/PlaybackContext'
import { getRecommendedClips } from '@/lib/recommendation'
import { formatTime } from '@/lib/format'

const CATEGORIES = ['เพลง', 'ข่าว', 'พอดแคสต์', 'ตลก', 'สารคดี', 'ทอล์คโชว์']

interface HomeViewProps {
  onPickClip: (clip: SearchResultItem) => void
}

export function HomeView({ onPickClip }: HomeViewProps) {
  const { history } = usePlayHistory()
  const { continueWatching, resumeContinueWatching } = usePlayback()
  const [recommended, setRecommended] = useState<SearchResultItem[]>([])
  const [isLoadingRecommended, setIsLoadingRecommended] = useState(false)
  const [categoryClips, setCategoryClips] = useState<Record<string, SearchResultItem[]>>({})

  const loadRecommendations = async () => {
    setIsLoadingRecommended(true)
    try {
      const { clips } = await getRecommendedClips(history)
      setRecommended(clips)
    } catch (err) {
      notifyError(err instanceof Error ? err.message : 'โหลดคลิปแนะนำไม่สำเร็จ')
    } finally {
      setIsLoadingRecommended(false)
    }
  }

  useEffect(() => {
    loadRecommendations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    let cancelled = false
    CATEGORIES.forEach((category) => {
      searchVideos(category)
        .then((clips) => {
          if (!cancelled) setCategoryClips((prev) => ({ ...prev, [category]: clips }))
        })
        .catch(() => {
          // เงียบไว้ — category เป็น best-effort เท่านั้น
        })
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="flex w-full flex-col px-8 py-10">
      {continueWatching && (
        <div className="mb-8 flex items-center gap-4 rounded-2xl bg-muted/60 p-4">
          <div className="relative h-20 w-36 shrink-0 overflow-hidden rounded-xl bg-muted">
            <img
              src={continueWatching.thumbnail}
              alt={continueWatching.title}
              className="size-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-primary">เล่นต่อ</p>
            <p className="mt-0.5 truncate text-sm font-medium text-foreground">
              {continueWatching.title}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {continueWatching.channelTitle}
              {continueWatching.channelTitle ? ' · ' : ''}
              ค้างไว้ที่ {formatTime(continueWatching.positionSeconds)}
            </p>
          </div>
          <button
            type="button"
            onClick={resumeContinueWatching}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform active:scale-95"
          >
            <Play className="size-4 fill-current" />
            เล่นต่อ
          </button>
        </div>
      )}

      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Sparkles className="size-4 text-primary" />
          แนะนำสำหรับคุณ
        </div>
        <button
          type="button"
          onClick={loadRecommendations}
          disabled={isLoadingRecommended}
          aria-label="สุ่มคลิปแนะนำใหม่"
          className="text-muted-foreground transition-transform duration-300 hover:text-foreground disabled:opacity-40"
        >
          <RotateCw className={cn('size-4', isLoadingRecommended && 'animate-spin')} />
        </button>
      </div>

      {isLoadingRecommended && (
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex animate-pulse flex-col gap-2 rounded-2xl"
              style={{ animationDelay: `${i * 75}ms` }}
            >
              <div className="aspect-video w-full rounded-2xl bg-muted" />
              <div className="h-4 w-3/4 rounded bg-muted" />
              <div className="h-3 w-1/3 rounded bg-muted" />
            </div>
          ))}
        </div>
      )}

      {!isLoadingRecommended && recommended.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
          <Search className="size-8 opacity-40" />
          <p className="text-sm">ยังแนะนำคลิปไม่ได้ ลองค้นหาด้วยตัวเองก่อนนะ</p>
        </div>
      )}

      {!isLoadingRecommended && recommended.length > 0 && (
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {recommended.map((clip, index) => (
            <ClipCard key={clip.videoId} clip={clip} index={index} onPick={onPickClip} />
          ))}
        </div>
      )}

      {CATEGORIES.map((category) => (
        <CategoryRow
          key={category}
          label={category}
          clips={categoryClips[category] ?? []}
          onPickClip={onPickClip}
        />
      ))}
    </div>
  )
}
