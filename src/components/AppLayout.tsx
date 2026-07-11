import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'
import { PlayerBar } from '@/components/PlayerBar'
import { AddEpisodeDialog } from '@/components/AddEpisodeDialog'
import { usePlayback } from '@/contexts/PlaybackContext'

export interface LayoutOutletContext {
  onAddEpisode: () => void
}

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const {
    playlists,
    selectedPlaylistId,
    createPlaylist,
    addEpisode,
    addEpisodeFromSearchResult,
    importYouTubePlaylist,
  } = usePlayback()

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <Topbar onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar collapsed={sidebarCollapsed} onAddEpisode={() => setDialogOpen(true)} />

        <main className="min-w-0 flex-1 overflow-y-auto">
          <Outlet context={{ onAddEpisode: () => setDialogOpen(true) }} />
        </main>
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
