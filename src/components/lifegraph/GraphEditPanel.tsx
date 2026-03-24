import { useState, useEffect } from 'react'
import { X, Save, Trash2, Plus } from 'lucide-react'
import { cn } from '../../utils'
import { motion, AnimatePresence } from 'framer-motion'
import type { GraphNode, GraphLink } from '../../lib/lifegraph'
import { useTranslation } from 'react-i18next'

const ENTITY_TYPES = ['Person', 'Event', 'Place', 'Emotion', 'Topic', 'Item']

interface GraphEditPanelProps {
  selectedNode: GraphNode | null
  selectedLink: GraphLink | null
  allNodes: GraphNode[]
  onClose: () => void
  onSaveNode: (id: number, data: { displayName?: string; type?: string; summary?: string; props?: string; version: number }) => void
  onDeleteNode: (id: number) => void
  onCreateNode: (data: { displayName: string; type: string; summary?: string }) => void
  onSaveLink: (id: number, data: { type?: string; confidence?: number; weight?: number; version: number }) => void
  onDeleteLink: (id: number) => void
  onCreateLink: (data: { sourceId: number; targetId: number; type: string; confidence?: number; weight?: number }) => void
}

export const GraphEditPanel = ({
  selectedNode, selectedLink, allNodes, onClose,
  onSaveNode, onDeleteNode, onCreateNode,
  onSaveLink, onDeleteLink, onCreateLink,
}: GraphEditPanelProps) => {
  const { t } = useTranslation()
  const isOpen = selectedNode !== null || selectedLink !== null
  const [mode, setMode] = useState<'view' | 'create-node' | 'create-link'>('view')

  // Node form state
  const [nodeName, setNodeName] = useState('')
  const [nodeType, setNodeType] = useState('Person')
  const [nodeSummary, setNodeSummary] = useState('')

  // Link form state
  const [linkType, setLinkType] = useState('')
  const [linkConfidence, setLinkConfidence] = useState(0.8)
  const [linkWeight, setLinkWeight] = useState(1)
  const [linkSourceId, setLinkSourceId] = useState<number | null>(null)
  const [linkTargetId, setLinkTargetId] = useState<number | null>(null)

  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (selectedNode) {
      setMode('view')
      setNodeName(selectedNode.displayName)
      setNodeType(selectedNode.type)
      setNodeSummary(selectedNode.summary || '')
      setConfirmDelete(false)
    }
  }, [selectedNode])

  useEffect(() => {
    if (selectedLink) {
      setMode('view')
      setLinkType(selectedLink.type)
      setLinkConfidence(selectedLink.confidence)
      setLinkWeight(selectedLink.weight)
      setConfirmDelete(false)
    }
  }, [selectedLink])

  const handleSaveNode = () => {
    if (mode === 'create-node') {
      if (!nodeName.trim()) return
      onCreateNode({ displayName: nodeName.trim(), type: nodeType, summary: nodeSummary || undefined })
    } else if (selectedNode) {
      onSaveNode(selectedNode.id, {
        displayName: nodeName.trim() || undefined,
        type: nodeType,
        summary: nodeSummary || undefined,
        version: selectedNode.version,
      })
    }
  }

  const handleSaveLink = () => {
    if (mode === 'create-link') {
      if (!linkSourceId || !linkTargetId || !linkType.trim()) return
      onCreateLink({
        sourceId: linkSourceId, targetId: linkTargetId,
        type: linkType.trim(), confidence: linkConfidence, weight: linkWeight,
      })
    } else if (selectedLink) {
      onSaveLink(selectedLink.id, {
        type: linkType.trim() || undefined,
        confidence: linkConfidence, weight: linkWeight,
        version: selectedLink.version,
      })
    }
  }

  const resetCreateForm = () => {
    setNodeName('')
    setNodeType('Person')
    setNodeSummary('')
    setLinkType('')
    setLinkConfidence(0.8)
    setLinkWeight(1)
    setLinkSourceId(null)
    setLinkTargetId(null)
  }

  return (
    <AnimatePresence>
      {(isOpen || mode !== 'view') && (
        <motion.div
          initial={{ x: 360, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 360, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={cn(
            "fixed right-0 top-16 h-[calc(100vh-64px)] w-[360px] z-[60]",
            "bg-background/95 backdrop-blur-xl border-l border-border/50",
            "shadow-2xl shadow-black/20 flex flex-col"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <h3 className="font-bold text-lg">
              {mode === 'create-node' ? t('lifegraph3d.createNode') :
               mode === 'create-link' ? t('lifegraph3d.createLink') :
               selectedNode ? t('lifegraph3d.editNode') : t('lifegraph3d.editLink')}
            </h3>
            <button onClick={() => { onClose(); setMode('view'); resetCreateForm() }}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Create buttons when no selection */}
            {!isOpen && mode === 'view' && (
              <div className="space-y-3">
                <button onClick={() => { setMode('create-node'); resetCreateForm() }}
                  className="w-full flex items-center gap-2 px-4 py-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary transition-colors">
                  <Plus className="w-5 h-5" /> {t('lifegraph3d.createNode')}
                </button>
                <button onClick={() => { setMode('create-link'); resetCreateForm() }}
                  className="w-full flex items-center gap-2 px-4 py-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary transition-colors">
                  <Plus className="w-5 h-5" /> {t('lifegraph3d.createLink')}
                </button>
              </div>
            )}

            {/* Node Form */}
            {(selectedNode || mode === 'create-node') && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">{t('lifegraph3d.name')}</label>
                  <input value={nodeName} onChange={e => setNodeName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border/50 focus:border-primary outline-none transition-colors text-sm" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">{t('lifegraph3d.type')}</label>
                  <select value={nodeType} onChange={e => setNodeType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border/50 focus:border-primary outline-none transition-colors text-sm">
                    {ENTITY_TYPES.map(typeVal => <option key={typeVal} value={typeVal}>{t(`lifegraph3d.types.${typeVal}`, typeVal)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">{t('lifegraph3d.summary')}</label>
                  <textarea value={nodeSummary} onChange={e => setNodeSummary(e.target.value)} rows={3}
                    className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border/50 focus:border-primary outline-none transition-colors text-sm resize-none" />
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

            {/* Link Form */}
            {(selectedLink || mode === 'create-link') && (
              <div className="space-y-4">
                {mode === 'create-link' && (
                  <>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1.5 block">{t('lifegraph3d.source')}</label>
                      <select value={linkSourceId ?? ''} onChange={e => setLinkSourceId(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border/50 focus:border-primary outline-none transition-colors text-sm">
                        <option value="">{t('lifegraph3d.selectNode')}</option>
                        {allNodes.map(n => <option key={n.id} value={n.id}>{n.displayName}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1.5 block">{t('lifegraph3d.target')}</label>
                      <select value={linkTargetId ?? ''} onChange={e => setLinkTargetId(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border/50 focus:border-primary outline-none transition-colors text-sm">
                        <option value="">{t('lifegraph3d.selectNode')}</option>
                        {allNodes.filter(n => n.id !== linkSourceId).map(n => <option key={n.id} value={n.id}>{n.displayName}</option>)}
                      </select>
                    </div>
                  </>
                )}
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">{t('lifegraph3d.relationType')}</label>
                  <input value={linkType} onChange={e => setLinkType(e.target.value)}
                    placeholder={t('lifegraph3d.relationTypePlaceholder')}
                    className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border/50 focus:border-primary outline-none transition-colors text-sm" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">
                    {t('lifegraph3d.confidence')}: {(linkConfidence * 100).toFixed(0)}%
                  </label>
                  <input type="range" min="0" max="1" step="0.01" value={linkConfidence}
                    onChange={e => setLinkConfidence(parseFloat(e.target.value))}
                    className="w-full accent-primary" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">{t('lifegraph3d.weight')}</label>
                  <input type="number" min="1" value={linkWeight} onChange={e => setLinkWeight(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border/50 focus:border-primary outline-none transition-colors text-sm" />
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-border/50 space-y-2">
            <button
              onClick={selectedNode ? handleSaveNode : handleSaveLink}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
            >
              <Save className="w-4 h-4" /> {t('lifegraph3d.save')}
            </button>
            {mode === 'view' && (selectedNode || selectedLink) && (
              confirmDelete ? (
                <div className="flex gap-2">
                  <button onClick={() => {
                    if (selectedNode) onDeleteNode(selectedNode.id)
                    else if (selectedLink) onDeleteLink(selectedLink.id)
                  }} className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-medium">
                    {t('lifegraph3d.confirmDelete')}
                  </button>
                  <button onClick={() => setConfirmDelete(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-muted hover:bg-muted/80 transition-colors text-sm">
                    {t('lifegraph3d.cancel')}
                  </button>
                </div>
              ) : (
                <button onClick={() => setConfirmDelete(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors text-sm">
                  <Trash2 className="w-4 h-4" /> {t('lifegraph3d.delete')}
                </button>
              )
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
