import { Link } from 'react-router-dom'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Volume1,
  VolumeX,
  Shuffle,
  Gauge,
  Mic2,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatTime } from '@/lib/format'
import { usePlayback } from '@/contexts/PlaybackContext'

export function PlayerBar() {
  const {
    currentEpisode,
    playlists,
    selectedPlaylistId,
    isPlaying,
    currentTime,
    duration,
    volume,
    isShuffled,
    playbackRate,
    isStableVolume,
    isVoiceBoost,
    handleTogglePlay,
    handleNext,
    handlePrev,
    handleVolumeChange,
    handleToggleShuffle,
    handleCyclePlaybackRate,
    handleSeek,
    handleToggleStableVolume,
    handleToggleVoiceBoost,
  } = usePlayback()

  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId) ?? null
  const VolumeIcon = volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2

  return (
    <div className="flex shrink-0 items-center gap-6 border-t border-border bg-card px-8 py-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="size-12 shrink-0 overflow-hidden rounded-xl bg-muted">
          {currentEpisode && (
            <img
              src={currentEpisode.thumbnail}
              alt={currentEpisode.title}
              className="size-full object-cover"
            />
          )}
        </div>
        <div className="min-w-0">
          {currentEpisode ? (
            <Link
              to={`/watch/${currentEpisode.videoId}`}
              className="truncate text-sm font-semibold text-foreground hover:underline"
            >
              {currentEpisode.title}
            </Link>
          ) : (
            <p className="truncate text-sm font-semibold text-foreground">ยังไม่ได้เล่น episode</p>
          )}
          <p className="truncate text-xs text-muted-foreground">
            {selectedPlaylist ? selectedPlaylist.name : '—'}
          </p>
        </div>
      </div>

      <div className="flex flex-[1.4] flex-col items-center gap-1.5">
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={handleToggleShuffle}
            aria-pressed={isShuffled}
            aria-label={isShuffled ? 'ปิดสุ่มเพลง' : 'เปิดสุ่มเพลง'}
            className={cn(
              'relative text-muted-foreground transition-colors hover:text-foreground',
              isShuffled && 'text-primary hover:text-primary'
            )}
          >
            <Shuffle className="size-4" />
            {isShuffled && (
              <span className="absolute -bottom-1.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-primary" />
            )}
          </button>
          <button
            className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
            onClick={handlePrev}
            disabled={!currentEpisode}
            aria-label="ตอนก่อนหน้า"
          >
            <SkipBack className="size-4.5 fill-current" />
          </button>
          <button
            type="button"
            onClick={handleTogglePlay}
            disabled={!currentEpisode}
            className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md shadow-primary/30 transition-transform hover:scale-105 disabled:opacity-30 disabled:hover:scale-100"
            aria-label={isPlaying ? 'หยุดชั่วคราว' : 'เล่น'}
          >
            {isPlaying ? (
              <Pause className="size-4.5 fill-current" />
            ) : (
              <Play className="size-4.5 translate-x-0.5 fill-current" />
            )}
          </button>
          <button
            className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
            onClick={handleNext}
            disabled={!currentEpisode}
            aria-label="ตอนถัดไป"
          >
            <SkipForward className="size-4.5 fill-current" />
          </button>
          <button
            type="button"
            onClick={handleCyclePlaybackRate}
            aria-label={`ความเร็วเล่น ${playbackRate}x กดเพื่อเปลี่ยน`}
            className="flex h-6 min-w-10 items-center justify-center rounded-full border border-border px-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            {playbackRate}x
          </button>
        </div>
        <div className="flex w-full max-w-lg items-center gap-2 text-[11px] font-medium text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 1}
            value={currentTime}
            onChange={(e) => handleSeek(Number(e.target.value))}
            className="h-1 flex-1 accent-primary"
            disabled={!currentEpisode}
            aria-label="ตำแหน่งเล่น"
          />
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-end gap-3">
        <button
          type="button"
          onClick={handleToggleStableVolume}
          aria-pressed={isStableVolume}
          aria-label={isStableVolume ? 'ปิด Stable Volume' : 'เปิด Stable Volume'}
          title="Stable Volume"
          className={cn(
            'text-muted-foreground transition-colors hover:text-foreground',
            isStableVolume && 'text-primary hover:text-primary'
          )}
        >
          <Gauge className="size-4" />
        </button>
        <button
          type="button"
          onClick={handleToggleVoiceBoost}
          aria-pressed={isVoiceBoost}
          aria-label={isVoiceBoost ? 'ปิด Voice Boost' : 'เปิด Voice Boost'}
          title="Voice Boost"
          className={cn(
            'text-muted-foreground transition-colors hover:text-foreground',
            isVoiceBoost && 'text-primary hover:text-primary'
          )}
        >
          <Mic2 className="size-4" />
        </button>
        <button
          type="button"
          onClick={() =>
            currentEpisode &&
            window.open(
              `https://www.youtube.com/watch?v=${currentEpisode.videoId}`,
              '_blank',
              'noopener,noreferrer'
            )
          }
          disabled={!currentEpisode}
          aria-label="ดูบน YouTube"
          title="ดูบน YouTube"
          className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
        >
          <ExternalLink className="size-4" />
        </button>
        <VolumeIcon className="size-4 text-muted-foreground" />
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={(e) => handleVolumeChange(Number(e.target.value))}
          className="h-1 w-24 accent-primary"
          aria-label="ระดับเสียง"
        />
      </div>
    </div>
  )
}
