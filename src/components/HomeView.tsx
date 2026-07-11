import { useEffect, useState } from 'react'
import { Search, Sparkles, RotateCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { notifyError } from '@/lib/swal'
import { ClipRow } from '@/components/ClipRow'
import type { SearchResultItem } from '@/lib/youtubeDataApi'
import { usePlayHistory } from '@/hooks/usePlayHistory'
import { getRecommendedClips } from '@/lib/recommendation'

interface HomeViewProps {
  onPickClip: (clip: SearchResultItem) => void
}

export function HomeView({ onPickClip }: HomeViewProps) {
  const { history } = usePlayHistory()
  const [recommended, setRecommended] = useState<SearchResultItem[]>([])
  const [isLoadingRecommended, setIsLoadingRecommended] = useState(false)

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

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col px-8 py-10">
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

      {isLoadingRecommended &&
        Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex animate-pulse items-center gap-4 rounded-xl p-3"
            style={{ animationDelay: `${i * 75}ms` }}
          >
            <div className="h-14 w-24 shrink-0 rounded-lg bg-muted" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="h-4 w-3/4 rounded bg-muted" />
              <div className="h-3 w-1/3 rounded bg-muted" />
            </div>
          </div>
        ))}

      {!isLoadingRecommended && recommended.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
          <Search className="size-8 opacity-40" />
          <p className="text-sm">ยังแนะนำคลิปไม่ได้ ลองค้นหาด้วยตัวเองก่อนนะ</p>
        </div>
      )}

      {!isLoadingRecommended && recommended.length > 0 && (
        <div className="flex flex-col gap-1">
          {recommended.map((clip, index) => (
            <ClipRow key={clip.videoId} clip={clip} index={index} onPick={onPickClip} />
          ))}
        </div>
      )}
    </div>
  )
}
