import { useState } from 'react'
import { X, Save, Trash2, Plus, Minus } from 'lucide-react'
import { cn } from '../../utils'
import { motion, AnimatePresence } from 'framer-motion'
import type { GraphNode, GraphLink } from '../../lib/lifegraph'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { Button, Input, Select } from '../ui'

const ENTITY_TYPES = ['Person', 'Event', 'Place', 'Emotion', 'Topic', 'Item']

interface GraphEditPanelProps {
  selectedNode: GraphNode | null
  selectedLink: GraphLink | null
  allNodes: GraphNode[]
  forceOpen?: boolean
  onClose: () => void
  onSaveNode: (id: number, data: { displayName?: string; type?: string; summary?: string; props?: string; version: number }) => void
  onDeleteNode: (id: number) => void
  onCreateNode: (data: { displayName: string; type: string; summary?: string }) => void
  onSaveLink: (id: number, data: { type?: string; confidence?: number; weight?: number; version: number }) => void
  onDeleteLink: (id: number) => void
  onCreateLink: (data: { sourceId: number; targetId: number; type: string; confidence?: number; weight?: number }) => void
}

type PanelMode = 'view' | 'create-node' | 'create-link'

const GraphEditPanelContent = ({
  selectedNode,
  selectedLink,
  allNodes,
  mode,
  setMode,
  onClose,
  onSaveNode,
  onDeleteNode,
  onCreateNode,
  onSaveLink,
  onDeleteLink,
  onCreateLink,
  t,
}: {
  selectedNode: GraphNode | null
  selectedLink: GraphLink | null
  allNodes: GraphNode[]
  mode: PanelMode
  setMode: (next: PanelMode) => void
  onClose: () => void
  onSaveNode: GraphEditPanelProps['onSaveNode']
  onDeleteNode: GraphEditPanelProps['onDeleteNode']
  onCreateNode: GraphEditPanelProps['onCreateNode']
  onSaveLink: GraphEditPanelProps['onSaveLink']
  onDeleteLink: GraphEditPanelProps['onDeleteLink']
  onCreateLink: GraphEditPanelProps['onCreateLink']
  t: TFunction
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false)

  const [nodeName, setNodeName] = useState(() => selectedNode?.displayName ?? '')
  const [nodeType, setNodeType] = useState(() => selectedNode?.type ?? 'Person')
  const [nodeSummary, setNodeSummary] = useState(() => selectedNode?.summary ?? '')

  const [linkType, setLinkType] = useState(() => selectedLink?.type ?? '')
  const [linkConfidence, setLinkConfidence] = useState(() => selectedLink?.confidence ?? 0.8)
  const [linkWeight, setLinkWeight] = useState(() => selectedLink?.weight ?? 1)
  const [linkSourceId, setLinkSourceId] = useState<number | null>(null)
  const [linkTargetId, setLinkTargetId] = useState<number | null>(null)

  const handleClose = () => {
    onClose()
    setMode('view')
  }

  const handleSaveNode = () => {
    if (mode === 'create-node') {
      if (!nodeName.trim()) return
      onCreateNode({ displayName: nodeName.trim(), type: nodeType, summary: nodeSummary || undefined })
      handleClose()
      return
    }
    if (!selectedNode) return
    onSaveNode(selectedNode.id, {
      displayName: nodeName.trim() || undefined,
      type: nodeType,
      summary: nodeSummary || undefined,
      version: selectedNode.version,
    })
  }

  const handleSaveLink = () => {
    if (mode === 'create-link') {
      if (!linkSourceId || !linkTargetId || !linkType.trim()) return
      onCreateLink({
        sourceId: linkSourceId,
        targetId: linkTargetId,
        type: linkType.trim(),
        confidence: linkConfidence,
        weight: linkWeight,
      })
      handleClose()
      return
    }
    if (!selectedLink) return
    onSaveLink(selectedLink.id, {
      type: linkType.trim() || undefined,
      confidence: linkConfidence,
      weight: linkWeight,
      version: selectedLink.version,
    })
  }

  const title =
    mode === 'create-node' ? t('lifegraph3d.createNode') :
      mode === 'create-link' ? t('lifegraph3d.createLink') :
        selectedNode ? t('lifegraph3d.editNode') :
          selectedLink ? t('lifegraph3d.editLink') :
            t('lifegraph3d.createNode')

  const showFooter = Boolean(selectedNode || selectedLink || mode !== 'view')

  return (
    <>
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <h3 className="font-bold text-lg">{title}</h3>
        <button
          type="button"
          onClick={handleClose}
          aria-label={t('common.close')}
          className="flex h-11 w-11 items-center justify-center rounded-xl transition-colors hover:bg-muted sm:h-10 sm:w-10"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!selectedNode && !selectedLink && mode === 'view' && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => { setMode('create-node') }}
              className="flex min-h-12 w-full items-center gap-2 rounded-xl bg-primary/10 px-4 py-3 text-primary transition-colors hover:bg-primary/20"
            >
              <Plus className="w-5 h-5" /> {t('lifegraph3d.createNode')}
            </button>
            <button
              type="button"
              onClick={() => { setMode('create-link') }}
              className="flex min-h-12 w-full items-center gap-2 rounded-xl bg-primary/10 px-4 py-3 text-primary transition-colors hover:bg-primary/20"
            >
              <Plus className="w-5 h-5" /> {t('lifegraph3d.createLink')}
            </button>
          </div>
        )}

        {(selectedNode || mode === 'create-node') && (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">{t('lifegraph3d.name')}</label>
              <Input
                value={nodeName}
                onChange={e => setNodeName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">{t('lifegraph3d.type')}</label>
              <Select
                value={nodeType}
                onValueChange={setNodeType}
                options={ENTITY_TYPES.map(typeVal => ({ value: typeVal, label: t(`lifegraph3d.types.${typeVal}`, typeVal) }))}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">{t('lifegraph3d.summary')}</label>
              <textarea
                value={nodeSummary}
                onChange={e => setNodeSummary(e.target.value)}
                rows={3}
                className="min-h-24 w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-base outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
              />
            </div>
            {selectedNode && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{t('lifegraph3d.mentions')}: {selectedNode.mentionCount}</span>
                <span>•</span>
                <span>v{selectedNode.version}</span>
              </div>
            )}
          </div>
        )}

        {(selectedLink || mode === 'create-link') && (
          <div className="space-y-4">
            {mode === 'create-link' && (
              <>
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">{t('lifegraph3d.source')}</label>
                  <Select
                    value={linkSourceId == null ? '' : String(linkSourceId)}
                    onValueChange={value => setLinkSourceId(value ? Number(value) : null)}
                    options={[{ value: '', label: t('lifegraph3d.selectNode') }, ...allNodes.map(n => ({ value: String(n.id), label: n.displayName }))]}
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">{t('lifegraph3d.target')}</label>
                  <Select
                    value={linkTargetId == null ? '' : String(linkTargetId)}
                    onValueChange={value => setLinkTargetId(value ? Number(value) : null)}
                    options={[{ value: '', label: t('lifegraph3d.selectNode') }, ...allNodes.filter(n => n.id !== linkSourceId).map(n => ({ value: String(n.id), label: n.displayName }))]}
                  />
                </div>
              </>
            )}
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">{t('lifegraph3d.relationType')}</label>
              <Input
                value={linkType}
                onChange={e => setLinkType(e.target.value)}
                placeholder={t('lifegraph3d.relationTypePlaceholder')}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">
                {t('lifegraph3d.confidence')}: {(linkConfidence * 100).toFixed(0)}%
              </label>
              <NumberStepper
                value={linkConfidence}
                min={0}
                max={1}
                step={0.01}
                onChange={setLinkConfidence}
                ariaLabel={t('lifegraph3d.confidence')}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">{t('lifegraph3d.weight')}</label>
              <NumberStepper
                value={linkWeight}
                min={1}
                step={1}
                onChange={setLinkWeight}
                ariaLabel={t('lifegraph3d.weight')}
              />
            </div>
          </div>
        )}
      </div>

      {showFooter && (
        <div className="p-4 border-t border-border/50 space-y-2">
          <button
            type="button"
            onClick={selectedNode || mode === 'create-node' ? handleSaveNode : handleSaveLink}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Save className="w-4 h-4" /> {t('lifegraph3d.save')}
          </button>
          {mode === 'view' && (selectedNode || selectedLink) && (
            confirmDelete ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedNode) onDeleteNode(selectedNode.id)
                    else if (selectedLink) onDeleteLink(selectedLink.id)
                  }}
                  className="min-h-11 flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
                >
                  {t('lifegraph3d.confirmDelete')}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="min-h-11 flex-1 rounded-xl bg-muted px-4 py-2.5 text-sm transition-colors hover:bg-muted/80"
                >
                  {t('lifegraph3d.cancel')}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 px-4 py-2.5 text-sm text-red-500 transition-colors hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4" /> {t('lifegraph3d.delete')}
              </button>
            )
          )}
        </div>
      )}
    </>
  )
}

const NumberStepper = ({
  value,
  min,
  max,
  step,
  onChange,
  ariaLabel,
}: {
  value: number
  min: number
  max?: number
  step: number
  onChange: (value: number) => void
  ariaLabel: string
}) => {
  const normalize = (next: number) => {
    const bounded = max == null ? Math.max(min, next) : Math.min(max, Math.max(min, next))
    return Number(bounded.toFixed(4))
  }
  return (
    <div className="flex items-center gap-2">
      <Button type="button" variant="outline" size="icon" className="h-11 w-11 sm:h-9 sm:w-9" onClick={() => onChange(normalize(value - step))} disabled={value <= min} aria-label={`${ariaLabel} -`}>
        <Minus className="h-4 w-4" aria-hidden="true" />
      </Button>
      <Input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => {
          const next = Number(event.target.value)
          if (Number.isFinite(next)) onChange(normalize(next))
        }}
        aria-label={ariaLabel}
        className="text-center tabular-nums"
      />
      <Button type="button" variant="outline" size="icon" className="h-11 w-11 sm:h-9 sm:w-9" onClick={() => onChange(normalize(value + step))} disabled={max != null && value >= max} aria-label={`${ariaLabel} +`}>
        <Plus className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  )
}

export const GraphEditPanel = ({
  selectedNode, selectedLink, allNodes, forceOpen, onClose,
  onSaveNode, onDeleteNode, onCreateNode,
  onSaveLink, onDeleteLink, onCreateLink,
}: GraphEditPanelProps) => {
  const { t } = useTranslation()
  const hasSelection = selectedNode !== null || selectedLink !== null
  const isOpen = Boolean(forceOpen || hasSelection)
  const [mode, setMode] = useState<PanelMode>('view')
  const effectiveMode: PanelMode = hasSelection ? 'view' : mode
  const key = hasSelection
    ? (selectedNode ? `node-${selectedNode.id}` : `link-${selectedLink!.id}`)
    : effectiveMode

  return (
    <AnimatePresence>
      {(isOpen || effectiveMode !== 'view') && (
        <motion.div
          key={key}
          initial={{ x: 360, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 360, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={cn(
            "fixed right-0 top-[calc(3.5rem+env(safe-area-inset-top))] z-[60] h-[calc(100dvh-3.5rem-env(safe-area-inset-top))] w-[min(360px,calc(100vw-0.75rem))] pb-safe",
            "flex flex-col border-l border-border/50 bg-background/95 shadow-2xl shadow-black/20 backdrop-blur-xl",
            "md:top-16 md:h-[calc(100vh-64px)] md:w-[360px]"
          )}
        >
          <GraphEditPanelContent
            selectedNode={selectedNode}
            selectedLink={selectedLink}
            allNodes={allNodes}
            mode={effectiveMode}
            setMode={setMode}
            onClose={onClose}
            onSaveNode={onSaveNode}
            onDeleteNode={onDeleteNode}
            onCreateNode={onCreateNode}
            onSaveLink={onSaveLink}
            onDeleteLink={onDeleteLink}
            onCreateLink={onCreateLink}
            t={t}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
