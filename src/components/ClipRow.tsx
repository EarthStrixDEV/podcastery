import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { SearchResultItem } from '@/lib/youtubeDataApi'

interface ClipRowProps {
  clip: SearchResultItem
  index: number
  onPick: (clip: SearchResultItem) => void
}

export function ClipRow({ clip, index, onPick }: ClipRowProps) {
  return (
    <div
      style={{ animationDelay: `${Math.min(index, 10) * 30}ms` }}
      className="group flex items-center gap-4 rounded-xl p-3 transition-colors duration-150 hover:bg-muted animate-in fade-in-0 slide-in-from-bottom-1 fill-mode-backwards"
    >
      <Link to={`/watch/${clip.videoId}`} className="flex min-w-0 flex-1 items-center gap-4">
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
      </Link>
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
