import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BrainCircuit,
  Check,
  ChevronDown,
  CircleAlert,
  Globe2,
  Loader2,
  Search,
  UserRoundCog,
  Wrench,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { cn } from '../utils'

export type AgentRunActivityStatus = 'running' | 'completed' | 'failed' | 'cancelled'
export type AgentToolActivityStatus = 'running' | 'completed' | 'failed'

export interface AgentToolActivity {
  id: string
  name: string
  source?: string
  status: AgentToolActivityStatus
  durationMs?: number
}

export interface AgentRunActivityState {
  runId?: string
  stage?: string
  status: AgentRunActivityStatus
  tools: AgentToolActivity[]
}

const TOOL_ICONS: Record<string, LucideIcon> = {
  searchMemories: BrainCircuit,
  searchLifeGraph: Search,
  updateUserPersona: UserRoundCog,
  web_search: Globe2,
}

const TOOL_KEYS: Record<string, string> = {
  searchMemories: 'searchMemories',
  searchLifeGraph: 'searchLifeGraph',
  updateUserPersona: 'updateUserPersona',
  web_search: 'webSearch',
}

function formatDuration(durationMs?: number): string | null {
  if (durationMs === undefined || durationMs < 0) return null
  if (durationMs < 1000) return `${durationMs}ms`
  return `${(durationMs / 1000).toFixed(1)}s`
}

interface AgentRunActivityProps {
  activity: AgentRunActivityState
}

export function AgentRunActivity({ activity }: AgentRunActivityProps) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(activity.status === 'running' && activity.tools.length > 0)

  useEffect(() => {
    if (activity.status === 'running' && activity.tools.length > 0) {
      const timer = setTimeout(() => setExpanded(true), 0)
      return () => clearTimeout(timer)
    }
  }, [activity.status, activity.tools.length])

  const currentTool = [...activity.tools].reverse().find((tool) => tool.status === 'running')
  const hasDetails = activity.tools.length > 0

  if (activity.status === 'completed' && !hasDetails) return null

  const summary = activity.status === 'cancelled'
    ? t('chat.run.cancelled')
    : activity.status === 'failed'
      ? t('chat.run.failed')
      : activity.status === 'completed'
        ? t('chat.run.completedWithTools', { count: activity.tools.length })
        : currentTool
          ? t('chat.run.toolRunning', { tool: getToolLabel(currentTool.name, t) })
          : t(`chat.run.stage.${activity.stage || 'thinking'}`)

  const StatusIcon = activity.status === 'failed'
    ? CircleAlert
    : activity.status === 'completed'
      ? Check
      : activity.status === 'cancelled'
        ? CircleAlert
        : Loader2

  return (
    <div
      className={cn(
        'mb-2 overflow-hidden rounded-xl border text-xs',
        activity.status === 'failed'
          ? 'border-destructive/25 bg-destructive/5'
          : 'border-border/50 bg-background/35',
      )}
      role="status"
      aria-live="polite"
    >
      <button
        type="button"
        className={cn(
          'flex min-h-11 w-full items-center gap-2 px-2.5 py-2 text-left transition-colors touch-manipulation',
          hasDetails && 'hover:bg-muted/40',
        )}
        onClick={() => hasDetails && setExpanded((value) => !value)}
        aria-expanded={hasDetails ? expanded : undefined}
        disabled={!hasDetails}
      >
        <StatusIcon className={cn(
          'h-3.5 w-3.5 shrink-0',
          activity.status === 'running' && 'animate-spin text-primary',
          activity.status === 'completed' && 'text-emerald-500',
          activity.status === 'failed' && 'text-destructive',
          activity.status === 'cancelled' && 'text-muted-foreground',
        )} />
        <span className="min-w-0 flex-1 truncate font-medium text-foreground/80">{summary}</span>
        {hasDetails && (
          <ChevronDown className={cn(
            'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform',
            expanded && 'rotate-180',
          )} />
        )}
      </button>

      <AnimatePresence initial={false}>
        {expanded && hasDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border/40 px-2.5 py-1.5"
          >
            {activity.tools.map((tool) => {
              const ToolIcon = TOOL_ICONS[tool.name] || Wrench
              const duration = formatDuration(tool.durationMs)
              const label = getToolLabel(tool.name, t)

              return (
                <div key={tool.id} className="flex min-h-7 items-center gap-2 py-1 text-muted-foreground">
                  <ToolIcon className={cn(
                    'h-3.5 w-3.5 shrink-0',
                    tool.status === 'running' && 'animate-pulse text-primary',
                    tool.status === 'completed' && 'text-emerald-500',
                    tool.status === 'failed' && 'text-destructive',
                  )} />
                  <span className="min-w-0 flex-1 truncate">{label}</span>
                  {tool.source === 'mcp' && (
                    <span className="shrink-0 text-[9px] uppercase tracking-[0.08em] text-primary/70">MCP</span>
                  )}
                  <span className="shrink-0 text-[10px]">
                    {tool.status === 'running'
                      ? t('chat.run.toolStatus.running')
                      : tool.status === 'failed'
                        ? t('chat.run.toolStatus.failed')
                        : duration || t('chat.run.toolStatus.completed')}
                  </span>
                </div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function getToolLabel(toolName: string, t: TFunction): string {
  const translationKey = TOOL_KEYS[toolName]
  return translationKey
    ? t(`chat.run.tools.${translationKey}`)
    : toolName || t('chat.run.tools.unknown')
}
