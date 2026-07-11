import { useEffect } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EpisodeCard } from '@/components/EpisodeCard'
import { usePlayback } from '@/contexts/PlaybackContext'
import { confirmDestructive, notifySuccess } from '@/lib/swal'
import type { LayoutOutletContext } from '@/components/AppLayout'

export function PlaylistView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { onAddEpisode } = useOutletContext<LayoutOutletContext>()
  const { playlists, currentEpisode, isPlaying, removeEpisode } = usePlayback()

  const playlist = playlists.find((p) => p.id === id) ?? null

  useEffect(() => {
    if (!playlist) {
      navigate('/', { replace: true })
    }
  }, [playlist, navigate])

  if (!playlist) return null

  const handleRemoveEpisode = async (episodeId: string, episodeTitle: string) => {
    const confirmed = await confirmDestructive({
      title: 'ลบ episode นี้?',
      text: episodeTitle,
    })
    if (!confirmed) return

    removeEpisode(playlist.id, episodeId)
    notifySuccess('ลบ episode แล้ว')
  }

  return (
    <div className="px-8 py-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            {playlist.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {playlist.episodes.length} episode
            {playlist.episodes.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          onClick={onAddEpisode}
          className="shrink-0 gap-1.5 rounded-full transition-transform active:scale-95"
        >
          <Plus className="size-4" />
          Add Clip
        </Button>
      </div>

      {playlist.episodes.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center animate-in fade-in-0 zoom-in-95 duration-300">
          <button
            type="button"
            onClick={onAddEpisode}
            aria-label="เพิ่ม Episode แรกให้ playlist นี้"
            className="group flex size-24 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform duration-200 hover:scale-110 hover:shadow-xl hover:shadow-primary/40 active:scale-95"
          >
            <Plus className="size-10 transition-transform duration-200 group-hover:rotate-90" />
          </button>
          <div>
            <p className="text-base font-semibold text-foreground">Playlist นี้ยังไม่มี episode</p>
            <p className="mt-1 text-sm text-muted-foreground">
              กดปุ่ม + เพื่อวาง URL หรือค้นหาวิดีโอเพิ่ม
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {playlist.episodes.map((episode, index) => (
            <EpisodeCard
              key={episode.id}
              episode={episode}
              index={index}
              isCurrent={currentEpisode?.id === episode.id}
              isPlaying={isPlaying}
              onRemove={() => handleRemoveEpisode(episode.id, episode.title)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
