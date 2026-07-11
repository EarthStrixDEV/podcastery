import { NavLink, useNavigate } from 'react-router-dom'
import { Plus, Trash2, ListMusic, Headphones, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { usePlayback } from '@/contexts/PlaybackContext'
import { confirmDestructive, notifySuccess } from '@/lib/swal'

interface SidebarProps {
  collapsed: boolean
  onAddEpisode: () => void
}

export function Sidebar({ collapsed, onAddEpisode }: SidebarProps) {
  const { playlists, deletePlaylist } = usePlayback()
  const navigate = useNavigate()

  const handleDeletePlaylist = async (playlistId: string, playlistName: string) => {
    const confirmed = await confirmDestructive({
      title: `ลบ "${playlistName}"?`,
      text: `episode ทั้งหมด ${
        playlists.find((p) => p.id === playlistId)?.episodes.length ?? 0
      } รายการใน playlist นี้จะถูกลบไปด้วย`,
    })
    if (!confirmed) return

    deletePlaylist(playlistId)
    navigate('/')
    notifySuccess(`ลบ "${playlistName}" แล้ว`)
  }

  return (
    <aside
      className={cn(
        'flex shrink-0 flex-col overflow-y-auto bg-sidebar py-6 text-sidebar-foreground transition-[width] duration-200 ease-out',
        collapsed ? 'w-20 px-2 items-center' : 'w-72 px-5'
      )}
    >
      <div className={cn('flex items-center gap-2.5 pb-8', collapsed && 'justify-center')}>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
          <Headphones className="size-4.5" />
        </div>
        {!collapsed && <span className="font-heading text-lg font-bold tracking-tight">Podcastery</span>}
      </div>

      <NavLink
        to="/"
        end
        title="Home"
        className={({ isActive }) =>
          cn(
            'mb-4 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ease-out',
            collapsed && 'justify-center px-0',
            isActive
              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
              : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:translate-x-0.5'
          )
        }
      >
        <Home className="size-4 shrink-0" />
        {!collapsed && 'Home'}
      </NavLink>

      <div className={cn('flex items-center justify-between pb-3', collapsed && 'flex-col gap-2')}>
        {!collapsed && (
          <span className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
            My Playlists
          </span>
        )}
        <Button
          size="icon-sm"
          className="rounded-full bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/85"
          onClick={onAddEpisode}
          aria-label="เพิ่ม Episode"
        >
          <Plus className="size-4" />
        </Button>
      </div>

      {playlists.length === 0 ? (
        !collapsed && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-sidebar-border py-10 text-center">
            <ListMusic className="size-7 text-sidebar-foreground/40" />
            <p className="px-4 text-sm text-sidebar-foreground/60">
              ยังไม่มี playlist กดปุ่ม + เพื่อเริ่มต้น
            </p>
          </div>
        )
      ) : (
        <div className="flex w-full flex-col gap-1">
          {playlists.map((playlist) => (
            <NavLink
              key={playlist.id}
              to={`/playlist/${playlist.id}`}
              title={playlist.name}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition-all duration-150 ease-out',
                  collapsed && 'justify-center px-0',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:translate-x-0.5'
                )
              }
            >
              <ListMusic className="size-4 shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 truncate font-medium">{playlist.name}</span>
                  <span className="shrink-0 text-xs opacity-50">{playlist.episodes.length}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      handleDeletePlaylist(playlist.id, playlist.name)
                    }}
                    className="shrink-0 opacity-0 hover:text-destructive group-hover:opacity-100"
                    aria-label={`ลบ ${playlist.name}`}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </>
              )}
            </NavLink>
          ))}
        </div>
      )}
    </aside>
  )
}
