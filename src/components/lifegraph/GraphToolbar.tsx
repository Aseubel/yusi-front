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
    <div className="absolute top-4 left-4 right-[20px] z-40 flex items-start gap-3 pointer-events-none">
      {/* Search bar */}
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-xl",
        "bg-background/80 backdrop-blur-xl border border-border/50",
        "shadow-lg pointer-events-auto max-w-sm"
      )}>
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder={t('lifegraph3d.searchPlaceholder')}
          className="bg-transparent outline-none text-sm flex-1 min-w-0"
        />
      </div>

      {/* Stats badge */}
      <div className={cn(
        "px-3 py-2 rounded-xl text-xs",
        "bg-background/80 backdrop-blur-xl border border-border/50",
        "shadow-lg pointer-events-auto text-muted-foreground whitespace-nowrap"
      )}>
        {nodeCount}/{totalNodes} {t('lifegraph3d.nodes')} · {linkCount} {t('lifegraph3d.links')}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Action buttons */}
      <div className={cn(
        "flex items-center gap-1 px-2 py-1.5 rounded-xl",
        "bg-background/80 backdrop-blur-xl border border-border/50",
        "shadow-lg pointer-events-auto"
      )}>
        <button onClick={() => setShowFilters(!showFilters)} title={t('lifegraph3d.filter')}
          className={cn("p-2 rounded-lg hover:bg-muted transition-colors", showFilters && "bg-muted")}>
          <Filter className="w-4 h-4" />
        </button>
        <button onClick={onResetView} title={t('lifegraph3d.resetView')}
          className="p-2 rounded-lg hover:bg-muted transition-colors">
          <RotateCcw className="w-4 h-4" />
        </button>
        <button onClick={onToggleFullscreen} title={t('lifegraph3d.fullscreen')}
          className="p-2 rounded-lg hover:bg-muted transition-colors">
          <Maximize2 className="w-4 h-4" />
        </button>
        <div className="w-px h-5 bg-border/50 mx-1" />
        <button onClick={onOpenCreatePanel} title={t('lifegraph3d.addNode')}
          className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Filter dropdown */}
      {showFilters && (
        <div className={cn(
          "absolute top-12 right-0 p-2 rounded-xl min-w-[180px]",
          "bg-background/95 backdrop-blur-xl border border-border/50",
          "shadow-xl pointer-events-auto space-y-1"
        )}>
          <button
            onClick={() => { onFilterType(null); setShowFilters(false) }}
            className={cn("w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
              !activeFilter ? "bg-primary/10 text-primary" : "hover:bg-muted")}
          >
            {t('lifegraph3d.allTypes')}
          </button>
          {Object.entries(TYPE_COLORS).map(([type, color]) => (
            <button
              key={type}
              onClick={() => { onFilterType(type); setShowFilters(false) }}
              className={cn("w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2",
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
