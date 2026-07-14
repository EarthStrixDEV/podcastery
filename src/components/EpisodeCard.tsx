import { Link } from 'react-router-dom'
import { Trash2, Play, Pause } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDuration } from '@/lib/format'
import { SoundwaveIcon } from '@/components/SoundwaveIcon'
import type { Episode } from '@/types/playlist'

interface EpisodeCardProps {
  episode: Episode
  index: number
  isCurrent: boolean
  isPlaying: boolean
  onRemove?: () => void
}

export function EpisodeCard({ episode, index, isCurrent, isPlaying, onRemove }: EpisodeCardProps) {
  return (
    <div
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
      className={cn(
        'group flex flex-col overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-black/5 transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-backwards',
        isCurrent && 'ring-2 ring-primary'
      )}
    >
      <div className="relative aspect-video overflow-hidden bg-muted">
        <img
          src={episode.thumbnail}
          alt={episode.title}
          className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        <Link
          to={`/watch/${episode.videoId}`}
          className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-150 group-hover:bg-black/30 group-hover:opacity-100"
          aria-label={`ดู ${episode.title}`}
        >
          <span className="flex size-11 items-center justify-center rounded-full bg-white text-foreground shadow-xl">
            {isCurrent && isPlaying ? (
              <Pause className="size-4.5 fill-current" />
            ) : (
              <Play className="size-4.5 translate-x-0.5 fill-current" />
            )}
          </span>
        </Link>

        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/60 group-hover:opacity-100"
            aria-label={`ลบ ${episode.title}`}
          >
            <Trash2 className="size-3.5" />
          </button>
        )}

        {episode.durationSeconds ? (
          <span className="absolute bottom-2 right-2 rounded-md bg-black/80 px-1.5 py-0.5 text-[11px] font-medium text-white">
            {formatDuration(episode.durationSeconds)}
          </span>
        ) : null}

        {isCurrent && isPlaying && (
          <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-black/80 px-1.5 py-1">
            <SoundwaveIcon />
          </span>
        )}
      </div>

      <Link to={`/watch/${episode.videoId}`} className="flex gap-2.5 p-3">
        {episode.channelThumbnail ? (
          <img
            src={episode.channelThumbnail}
            alt={episode.channelTitle}
            className="mt-0.5 size-8 shrink-0 rounded-full"
          />
        ) : (
          <div className="mt-0.5 size-8 shrink-0 rounded-full bg-muted" />
        )}
        <div className="min-w-0">
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
            {episode.title}
          </p>
          {episode.channelTitle ? (
            <p className="mt-1 truncate text-xs text-muted-foreground">{episode.channelTitle}</p>
          ) : null}
        </div>
      </Link>
    </div>
  )
}
