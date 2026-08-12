import { useState } from 'react'
import { Search, RotateCcw, Plus, Maximize2, Filter } from 'lucide-react'
import { cn } from '../../utils'
import { useTranslation } from 'react-i18next'

const TYPE_COLORS: Record<string, string> = {
  Person: '#3B82F6',
  Event: '#F97316',
  Place: '#22C55E',
  Emotion: '#EC4899',
  Topic: '#8B5CF6',
  Item: '#6B7280',
}

interface GraphToolbarProps {
  onSearch: (query: string) => void
  onResetView: () => void
  onToggleFullscreen: () => void
  onFilterType: (type: string | null) => void
  onOpenCreatePanel: () => void
  activeFilter: string | null
  nodeCount: number
  linkCount: number
  totalNodes: number
}

export const GraphToolbar = ({
  onSearch, onResetView, onToggleFullscreen, onFilterType,
  onOpenCreatePanel, activeFilter, nodeCount, linkCount, totalNodes,
}: GraphToolbarProps) => {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const handleSearch = () => {
    onSearch(searchQuery.trim())
  }

  return (
    <div className="pointer-events-none absolute left-3 right-3 top-3 z-40 flex flex-col items-stretch gap-2 sm:left-4 sm:right-5 sm:top-4 sm:flex-row sm:items-start sm:gap-3">
      {/* Search bar */}
      <div className={cn(
        "pointer-events-auto flex min-h-11 w-full items-center gap-2 rounded-xl border border-border/50 bg-background/80 px-3 py-2 shadow-lg backdrop-blur-xl sm:max-w-sm"
      )}>
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder={t('lifegraph3d.searchPlaceholder')}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none"
        />
      </div>

      {/* Stats badge */}
      <div className={cn(
        "pointer-events-auto flex min-h-11 items-center self-start rounded-xl border border-border/50 bg-background/80 px-3 py-2 text-xs text-muted-foreground shadow-lg backdrop-blur-xl sm:shrink-0"
      )}>
        {nodeCount}/{totalNodes} {t('lifegraph3d.nodes')} · {linkCount} {t('lifegraph3d.links')}
      </div>

      {/* Spacer */}
      <div className="hidden flex-1 sm:block" />

      {/* Action buttons */}
      <div className={cn(
        "pointer-events-auto flex min-h-11 items-center gap-1 self-start rounded-xl border border-border/50 bg-background/80 px-2 py-1.5 shadow-lg sm:shrink-0"
      )}>
        <button type="button" aria-label={t('lifegraph3d.filter')} onClick={() => setShowFilters(!showFilters)} title={t('lifegraph3d.filter')}
          className={cn("flex h-11 w-11 items-center justify-center rounded-lg transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:h-10 sm:w-10", showFilters && "bg-muted")}>
          <Filter className="w-4 h-4" />
        </button>
        <button type="button" aria-label={t('lifegraph3d.resetView')} onClick={onResetView} title={t('lifegraph3d.resetView')}
          className="flex h-11 w-11 items-center justify-center rounded-lg transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:h-10 sm:w-10">
          <RotateCcw className="w-4 h-4" />
        </button>
        <button type="button" aria-label={t('lifegraph3d.fullscreen')} onClick={onToggleFullscreen} title={t('lifegraph3d.fullscreen')}
          className="flex h-11 w-11 items-center justify-center rounded-lg transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:h-10 sm:w-10">
          <Maximize2 className="w-4 h-4" />
        </button>
        <div className="w-px h-5 bg-border/50 mx-1" />
        <button type="button" aria-label={t('lifegraph3d.addNode')} onClick={onOpenCreatePanel} title={t('lifegraph3d.addNode')}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:h-10 sm:w-10">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Filter dropdown */}
      {showFilters && (
        <div className={cn(
          "absolute right-0 top-[10rem] min-w-[180px] rounded-xl p-2 sm:top-12",
          "bg-background/95 backdrop-blur-xl border border-border/50",
          "shadow-xl pointer-events-auto space-y-1"
        )}>
          <button
            onClick={() => { onFilterType(null); setShowFilters(false) }}
            type="button"
            className={cn("min-h-11 w-full rounded-lg px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:min-h-9",
              !activeFilter ? "bg-primary/10 text-primary" : "hover:bg-muted")}
          >
            {t('lifegraph3d.allTypes')}
          </button>
          {Object.entries(TYPE_COLORS).map(([type, color]) => (
            <button
              type="button"
              key={type}
              onClick={() => { onFilterType(type); setShowFilters(false) }}
              className={cn("flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:min-h-9",
                activeFilter === type ? "bg-primary/10 text-primary" : "hover:bg-muted")}
            >
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
              {t(`lifegraph3d.types.${type}`, type)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
