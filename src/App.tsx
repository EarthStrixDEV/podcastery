import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { PlaybackProvider } from '@/contexts/PlaybackContext'
import { AppLayout } from '@/components/AppLayout'
import { HomeView } from '@/components/HomeView'
import { SearchView } from '@/components/SearchView'
import { PlaylistView } from '@/components/PlaylistView'
import { WatchView } from '@/components/WatchView'
import { SelectPlaylistDialog } from '@/components/SelectPlaylistDialog'
import { usePlayback } from '@/contexts/PlaybackContext'
import type { SearchResultItem } from '@/lib/youtubeDataApi'

function AppRoutes() {
  const { playlists, createPlaylist, addEpisodeFromSearchResult } = usePlayback()
  const [pickedClip, setPickedClip] = useState<SearchResultItem | null>(null)
  const [selectPlaylistOpen, setSelectPlaylistOpen] = useState(false)

  const handlePickClip = (clip: SearchResultItem) => {
    setPickedClip(clip)
    setSelectPlaylistOpen(true)
  }

  return (
    <>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomeView onPickClip={handlePickClip} />} />
          <Route path="/search" element={<SearchView onPickClip={handlePickClip} />} />
          <Route path="/playlist/:id" element={<PlaylistView />} />
          <Route path="/watch/:videoId" element={<WatchView onSaveClip={handlePickClip} />} />
        </Route>
      </Routes>

      <SelectPlaylistDialog
        open={selectPlaylistOpen}
        onOpenChange={setSelectPlaylistOpen}
        playlists={playlists}
        clip={pickedClip}
        onCreatePlaylist={createPlaylist}
        onAddEpisodeFromSearchResult={addEpisodeFromSearchResult}
      />
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <PlaybackProvider>
        <AppRoutes />
      </PlaybackProvider>
    </BrowserRouter>
  )
}

export default App
