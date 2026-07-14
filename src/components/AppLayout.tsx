import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'
import { PlayerBar } from '@/components/PlayerBar'
import { AddEpisodeDialog } from '@/components/AddEpisodeDialog'
import { OfficeModeOverlay } from '@/components/OfficeModeOverlay'
import { usePlayback } from '@/contexts/PlaybackContext'

export interface LayoutOutletContext {
  onAddEpisode: () => void
}

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isOfficeMode, setIsOfficeMode] = useState(false)
  const {
    playlists,
    selectedPlaylistId,
    createPlaylist,
    addEpisode,
    addEpisodeFromSearchResult,
    importYouTubePlaylist,
  } = usePlayback()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'O' || e.key === 'o')) {
        e.preventDefault()
        setIsOfficeMode((prev) => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      {isOfficeMode && <OfficeModeOverlay />}
      <div className="flex min-h-0 flex-1">
        <Sidebar collapsed={sidebarCollapsed} onAddEpisode={() => setDialogOpen(true)} />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)} />

          <main className="min-w-0 flex-1 overflow-y-auto">
            <Outlet context={{ onAddEpisode: () => setDialogOpen(true) }} />
          </main>
        </div>
      </div>

      <PlayerBar />

      <AddEpisodeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        playlists={playlists}
        defaultPlaylistId={selectedPlaylistId}
        onCreatePlaylist={createPlaylist}
        onAddEpisode={addEpisode}
        onAddEpisodeFromSearchResult={addEpisodeFromSearchResult}
        onImportPlaylist={importYouTubePlaylist}
      />
    </div>
  )
}
