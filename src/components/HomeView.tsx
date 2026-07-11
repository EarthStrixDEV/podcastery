import { useEffect, useState } from 'react'
import { Search, Loader2, SearchX, Plus, Headphones, Sparkles, RotateCw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { notifyError } from '@/lib/swal'
import { searchVideos, type SearchResultItem } from '@/lib/youtubeDataApi'
import { usePlayHistory } from '@/hooks/usePlayHistory'
import { getRecommendedClips } from '@/lib/recommendation'

interface ClipRowProps {
  clip: SearchResultItem
  index: number
  onPick: (clip: SearchResultItem) => void
}

function ClipRow({ clip, index, onPick }: ClipRowProps) {
  return (
    <div
      style={{ animationDelay: `${Math.min(index, 10) * 30}ms` }}
      className="group flex items-center gap-4 rounded-xl p-3 transition-colors duration-150 hover:bg-muted animate-in fade-in-0 slide-in-from-bottom-1 fill-mode-backwards"
    >
      <img
        src={clip.thumbnail}
        alt={clip.title}
        className="h-14 w-24 shrink-0 rounded-lg object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
          {clip.title}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{clip.channelTitle}</p>
      </div>
      <Button
        type="button"
        size="sm"
        onClick={() => onPick(clip)}
        className="shrink-0 gap-1.5 rounded-full opacity-0 transition-all duration-150 group-hover:opacity-100"
      >
        <Plus className="size-3.5" />
        เพิ่ม
      </Button>
    </div>
  )
}

interface HomeViewProps {
  onPickClip: (clip: SearchResultItem) => void
}

export function HomeView({ onPickClip }: HomeViewProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResultItem[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

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

  const handleSearch = async () => {
    if (!query.trim()) return
    setIsSearching(true)
    setResults([])
    try {
      const found = await searchVideos(query.trim())
      setResults(found)
      setHasSearched(true)
    } catch (err) {
      notifyError(err instanceof Error ? err.message : 'ค้นหาไม่สำเร็จ')
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col px-8 py-10">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Headphones className="size-6" />
        </div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          ค้นหาคลิปจาก YouTube
        </h1>
        <p className="text-sm text-muted-foreground">
          พิมพ์คำค้นหา แล้วเลือกคลิปที่อยากฟังเพิ่มเข้า playlist ได้ทันที
        </p>
      </div>

      <div className="mt-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleSearch()
              }
            }}
            placeholder="ค้นหาวิดีโอ, พอดแคสต์, หรือช่องที่ชอบ..."
            className="h-11 rounded-full pl-10 text-sm"
          />
        </div>
        <Button
          type="button"
          onClick={handleSearch}
          disabled={isSearching || !query.trim()}
          className="h-11 shrink-0 rounded-full px-5 transition-transform active:scale-95"
        >
          {isSearching ? <Loader2 className="size-4 animate-spin" /> : 'ค้นหา'}
        </Button>
      </div>

      <div className="mt-8 flex-1 overflow-y-auto">
        {isSearching &&
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

        {!isSearching && hasSearched && results.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center animate-in fade-in-0 duration-200">
            <SearchX className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">ไม่พบวิดีโอที่ตรงกับ "{query}"</p>
          </div>
        )}

        {!isSearching && !hasSearched && (
          <div>
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
        )}

        {!isSearching && results.length > 0 && (
          <div className="flex flex-col gap-1">
            {results.map((result, index) => (
              <ClipRow key={result.videoId} clip={result} index={index} onPick={onPickClip} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
