import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { SearchResultItem } from '@/lib/youtubeDataApi'

interface ClipCardProps {
  clip: SearchResultItem
  index: number
  onPick: (clip: SearchResultItem) => void
}

export function ClipCard({ clip, index, onPick }: ClipCardProps) {
  return (
    <div
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
      className="group flex flex-col overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-black/5 transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-backwards"
    >
      <div className="relative aspect-video overflow-hidden bg-muted">
        <img
          src={clip.thumbnail}
          alt={clip.title}
          className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        <Link
          to={`/watch/${clip.videoId}`}
          className="absolute inset-0"
          aria-label={`ดู ${clip.title}`}
        />

        <Button
          type="button"
          size="sm"
          onClick={() => onPick(clip)}
          className="absolute top-2 right-2 gap-1.5 rounded-full opacity-0 shadow-md transition-all duration-150 group-hover:opacity-100"
        >
          <Plus className="size-3.5" />
          เพิ่ม
        </Button>
      </div>

      <Link to={`/watch/${clip.videoId}`} className="flex flex-col gap-1 p-3">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
          {clip.title}
        </p>
        <p className="truncate text-xs text-muted-foreground">{clip.channelTitle}</p>
      </Link>
    </div>
  )
}
