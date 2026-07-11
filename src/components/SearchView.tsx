import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SearchX } from 'lucide-react'
import { ClipRow } from '@/components/ClipRow'
import { notifyError } from '@/lib/swal'
import { searchVideos, type SearchResultItem } from '@/lib/youtubeDataApi'

export function SearchView({ onPickClip }: { onPickClip: (clip: SearchResultItem) => void }) {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''

  const [results, setResults] = useState<SearchResultItem[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    let cancelled = false
    setIsSearching(true)
    setResults([])
    searchVideos(query.trim())
      .then((found) => {
        if (!cancelled) setResults(found)
      })
      .catch((err) => {
        if (!cancelled) notifyError(err instanceof Error ? err.message : 'ค้นหาไม่สำเร็จ')
      })
      .finally(() => {
        if (!cancelled) setIsSearching(false)
      })
    return () => {
      cancelled = true
    }
  }, [query])

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col px-8 py-7">
      <h1 className="font-heading text-lg font-semibold text-foreground">
        ผลการค้นหา “{query}”
      </h1>

      <div className="mt-4 flex-1">
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

        {!isSearching && results.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center animate-in fade-in-0 duration-200">
            <SearchX className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">ไม่พบวิดีโอที่ตรงกับ "{query}"</p>
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
