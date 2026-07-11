import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Menu, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface TopbarProps {
  onToggleSidebar: () => void
}

export function Topbar({ onToggleSidebar }: TopbarProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') ?? '')

  const handleSearch = () => {
    if (!query.trim()) return
    navigate(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border bg-card px-5">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onToggleSidebar}
        aria-label="เปิด/ปิดเมนูด้านข้าง"
        className="shrink-0 rounded-full"
      >
        <Menu className="size-5" />
      </Button>

      <div className="mx-auto flex w-full max-w-xl items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleSearch()
              }
            }}
            placeholder="ค้นหาวิดีโอ, พอดแคสต์, หรือช่องที่ชอบ..."
            className="h-10 rounded-full pl-10 text-sm"
            aria-label="ค้นหา"
          />
        </div>
        <Button
          type="button"
          onClick={handleSearch}
          disabled={!query.trim()}
          size="icon"
          className="h-10 w-10 shrink-0 rounded-full transition-transform active:scale-95"
          aria-label="ค้นหา"
        >
          <Search className="size-4" />
        </Button>
      </div>

      <div className="w-9 shrink-0" />
    </header>
  )
}
