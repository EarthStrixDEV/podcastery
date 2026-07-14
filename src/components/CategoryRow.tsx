import { ClipCard } from '@/components/ClipCard'
import type { SearchResultItem } from '@/lib/youtubeDataApi'

interface CategoryRowProps {
  label: string
  clips: SearchResultItem[]
  onPickClip: (clip: SearchResultItem) => void
}

export function CategoryRow({ label, clips, onPickClip }: CategoryRowProps) {
  if (clips.length === 0) return null

  return (
    <div className="mt-10 flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-border" />
        <h2 className="shrink-0 font-heading text-lg font-bold text-foreground">{label}</h2>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {clips.map((clip, index) => (
          <div key={clip.videoId} className="w-56 shrink-0">
            <ClipCard clip={clip} index={index} onPick={onPickClip} />
          </div>
        ))}
      </div>
    </div>
  )
}
