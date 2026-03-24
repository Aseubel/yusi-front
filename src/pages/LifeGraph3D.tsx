import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import ForceGraph3D from 'react-force-graph-3d'
import * as THREE from 'three'
import { lifegraphApi, type GraphNode, type GraphLink, type GraphSnapshot } from '../lib/lifegraph'
import { GraphEditPanel } from '../components/lifegraph/GraphEditPanel'
import { GraphToolbar } from '../components/lifegraph/GraphToolbar'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const TYPE_COLORS: Record<string, number> = {
  Person: 0x3B82F6,
  Event: 0xF97316,
  Place: 0x22C55E,
  Emotion: 0xEC4899,
  Topic: 0x8B5CF6,
  Item: 0x6B7280,
  User: 0xA855F7,
}

const TYPE_COLORS_CSS: Record<string, string> = {
  Person: '#3B82F6',
  Event: '#F97316',
  Place: '#22C55E',
  Emotion: '#EC4899',
  Topic: '#8B5CF6',
  Item: '#6B7280',
  User: '#A855F7',
}

interface GraphData {
  nodes: GraphNode[]
  links: Array<GraphLink & { source: number | GraphNode; target: number | GraphNode }>
}

export const LifeGraph3D = () => {
  const { t } = useTranslation()
  const fgRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] })
  const [totalNodes, setTotalNodes] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [selectedLink, setSelectedLink] = useState<GraphLink | null>(null)
  const [showEditPanel, setShowEditPanel] = useState(false)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight - 64 })

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight - 64 })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Load graph data
  const loadGraph = useCallback(async () => {
    setLoading(true)
    try {
      const res = await lifegraphApi.getGraphData(0, 300)
      if (res.data.code === 200) {
        const snapshot: GraphSnapshot = res.data.data
        const links = snapshot.links.map(l => ({
          ...l,
          source: l.sourceId,
          target: l.targetId,
        }))
        setGraphData({ nodes: snapshot.nodes, links })
        setTotalNodes(snapshot.totalNodeCount)
      }
    } catch (err) {
      console.error('Failed to load graph', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadGraph() }, [loadGraph])

  // Filtered data
  const filteredData = useMemo(() => {
    if (!activeFilter) return graphData
    const filteredNodes = graphData.nodes.filter(n => n.type === activeFilter)
    const nodeIds = new Set(filteredNodes.map(n => n.id))
    const filteredLinks = graphData.links.filter(l => {
      const srcId = typeof l.source === 'object' ? (l.source as GraphNode).id : l.source
      const tgtId = typeof l.target === 'object' ? (l.target as GraphNode).id : l.target
      return nodeIds.has(srcId) && nodeIds.has(tgtId)
    })
    return { nodes: filteredNodes, links: filteredLinks }
  }, [graphData, activeFilter])

  // Node click
  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(node)
    setSelectedLink(null)
    setShowEditPanel(true)

    // Fly camera to node
    if (fgRef.current) {
      const distance = 200
      const distRatio = 1 + distance / Math.hypot(node.x || 0, node.y || 0, node.z || 0)
      fgRef.current.cameraPosition(
        { x: (node.x || 0) * distRatio, y: (node.y || 0) * distRatio, z: (node.z || 0) * distRatio },
        { x: node.x, y: node.y, z: node.z },
        1000
      )
    }
  }, [])

  // Link click
  const handleLinkClick = useCallback((link: any) => {
    setSelectedLink(link)
    setSelectedNode(null)
    setShowEditPanel(true)
  }, [])

  // Node drag end - fix position
  const handleNodeDragEnd = useCallback((node: GraphNode) => {
    node.fx = node.x
    node.fy = node.y
    node.fz = node.z
  }, [])

  // Search
  const handleSearch = useCallback((query: string) => {
    if (!query) return
    const node = graphData.nodes.find(n =>
      n.displayName.toLowerCase().includes(query.toLowerCase())
    )
    if (node) {
      handleNodeClick(node)
    } else {
      toast.error(t('lifegraph3d.nodeNotFound'))
    }
  }, [graphData.nodes, handleNodeClick, t])

  // Reset view
  const handleResetView = useCallback(() => {
    if (fgRef.current) {
      fgRef.current.cameraPosition({ x: 0, y: 0, z: 600 }, { x: 0, y: 0, z: 0 }, 1000)
    }
    // Unfix all nodes
    graphData.nodes.forEach(n => { n.fx = undefined; n.fy = undefined; n.fz = undefined })
    setActiveFilter(null)
  }, [graphData.nodes])

  // Fullscreen
  const handleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }, [])

  // BFS expand from node
  const handleExpandNode = useCallback(async (nodeId: number) => {
    try {
      const res = await lifegraphApi.getGraphBfs(nodeId, 2, 200)
      if (res.data.code === 200) {
        const snapshot = res.data.data
        setGraphData(prev => {
          const existingIds = new Set(prev.nodes.map(n => n.id))
          const newNodes = snapshot.nodes.filter(n => !existingIds.has(n.id))
          const existingLinkIds = new Set(prev.links.map(l => l.id))
          const newLinks = snapshot.links
            .filter(l => !existingLinkIds.has(l.id))
            .map(l => ({ ...l, source: l.sourceId, target: l.targetId }))
          return {
            nodes: [...prev.nodes, ...newNodes],
            links: [...prev.links, ...newLinks],
          }
        })
        setTotalNodes(snapshot.totalNodeCount)
      }
    } catch (err) {
      console.error('BFS expand failed', err)
    }
  }, [])

  // ======================== CRUD Handlers ========================

  const handleSaveNode = useCallback(async (id: number, data: any) => {
    try {
      const res = await lifegraphApi.updateEntity(id, data)
      if (res.data.code === 200) {
        const updated = res.data.data
        setGraphData(prev => ({
          ...prev,
          nodes: prev.nodes.map(n => n.id === id ? { ...n, ...updated } : n),
        }))
        setSelectedNode(prev => prev?.id === id ? { ...prev, ...updated } : prev)
        toast.success(t('lifegraph3d.saved'))
      } else if (res.data.code === 409) {
        toast.error(t('lifegraph3d.versionConflict'))
        loadGraph()
      }
    } catch { /* handled by axios interceptor */ }
  }, [loadGraph, t])

  const handleDeleteNode = useCallback(async (id: number) => {
    try {
      await lifegraphApi.deleteEntity(id)
      setGraphData(prev => ({
        nodes: prev.nodes.filter(n => n.id !== id),
        links: prev.links.filter(l => {
          const srcId = typeof l.source === 'object' ? (l.source as GraphNode).id : l.source
          const tgtId = typeof l.target === 'object' ? (l.target as GraphNode).id : l.target
          return srcId !== id && tgtId !== id
        }),
      }))
      setSelectedNode(null)
      setShowEditPanel(false)
      toast.success(t('lifegraph3d.deleted'))
    } catch { /* handled by axios interceptor */ }
  }, [t])

  const handleCreateNode = useCallback(async (data: { displayName: string; type: string; summary?: string }) => {
    try {
      const res = await lifegraphApi.createEntity(data)
      if (res.data.code === 200) {
        const newNode = res.data.data
        setGraphData(prev => ({
          ...prev,
          nodes: [...prev.nodes, newNode],
        }))
        toast.success(t('lifegraph3d.created'))
        setShowEditPanel(false)
      }
    } catch { /* handled by axios interceptor */ }
  }, [t])

  const handleSaveLink = useCallback(async (id: number, data: any) => {
    try {
      const res = await lifegraphApi.updateRelation(id, data)
      if (res.data.code === 200) {
        const updated = res.data.data
        setGraphData(prev => ({
          ...prev,
          links: prev.links.map(l => l.id === id ? { ...l, ...updated } : l),
        }))
        setSelectedLink(prev => prev?.id === id ? { ...prev, ...updated } : prev)
        toast.success(t('lifegraph3d.saved'))
      } else if (res.data.code === 409) {
        toast.error(t('lifegraph3d.versionConflict'))
        loadGraph()
      }
    } catch { /* handled by axios interceptor */ }
  }, [loadGraph, t])

  const handleDeleteLink = useCallback(async (id: number) => {
    try {
      await lifegraphApi.deleteRelation(id)
      setGraphData(prev => ({
        ...prev,
        links: prev.links.filter(l => l.id !== id),
      }))
      setSelectedLink(null)
      setShowEditPanel(false)
      toast.success(t('lifegraph3d.deleted'))
    } catch { /* handled by axios interceptor */ }
  }, [t])

  const handleCreateLink = useCallback(async (data: { sourceId: number; targetId: number; type: string; confidence?: number; weight?: number }) => {
    try {
      const res = await lifegraphApi.createRelation(data)
      if (res.data.code === 200) {
        const newLink = res.data.data
        setGraphData(prev => ({
          ...prev,
          links: [...prev.links, { ...newLink, source: newLink.sourceId, target: newLink.targetId }],
        }))
        toast.success(t('lifegraph3d.created'))
        setShowEditPanel(false)
      }
    } catch { /* handled by axios interceptor */ }
  }, [t])

  // ======================== 3D Rendering ========================

  // Custom node rendering - spheres with size based on mentionCount
  const nodeThreeObject = useCallback((node: GraphNode) => {
    const color = TYPE_COLORS[node.type] || 0x888888
    const radius = Math.max(3, Math.min(12, 3 + Math.sqrt(node.mentionCount || 1) * 2))

    const group = new THREE.Group()

    // Sphere
    const geometry = new THREE.SphereGeometry(radius, 16, 16)
    const material = new THREE.MeshPhongMaterial({
      color,
      transparent: true,
      opacity: 0.85,
      shininess: 100,
    })
    const sphere = new THREE.Mesh(geometry, material)
    group.add(sphere)

    // Glow ring
    const ringGeometry = new THREE.RingGeometry(radius + 1, radius + 2.5, 32)
    const ringMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
    })
    const ring = new THREE.Mesh(ringGeometry, ringMaterial)
    group.add(ring)

    // Label sprite
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    canvas.width = 256
    canvas.height = 64
    ctx.font = 'bold 28px Inter, sans-serif'
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.fillText(node.displayName.slice(0, 10), 128, 40)
    const texture = new THREE.CanvasTexture(canvas)
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.9 })
    const sprite = new THREE.Sprite(spriteMaterial)
    sprite.scale.set(radius * 4, radius, 1)
    sprite.position.set(0, radius + 6, 0)
    group.add(sprite)

    return group
  }, [])

  // Link rendering
  const linkColor = useCallback((link: any) => {
    const srcNode = typeof link.source === 'object' ? link.source : graphData.nodes.find((n: GraphNode) => n.id === link.source)
    return TYPE_COLORS_CSS[srcNode?.type || ''] || '#666'
  }, [graphData.nodes])

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-[80vh] gap-4"
      >
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
        <p className="text-muted-foreground">{t('lifegraph3d.loading')}</p>
      </motion.div>
    )
  }

  if (!graphData.nodes.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-[80vh] gap-6 text-center px-4"
      >
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center">
          <svg className="w-12 h-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">{t('lifegraph3d.emptyTitle')}</h2>
          <p className="text-muted-foreground max-w-md">{t('lifegraph3d.emptyDescription')}</p>
        </div>
      </motion.div>
    )
  }

  return (
    <div ref={containerRef} className="relative w-full" style={{ height: dimensions.height }}>
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background/95" />

      {/* Toolbar */}
      <GraphToolbar
        onSearch={handleSearch}
        onResetView={handleResetView}
        onToggleFullscreen={handleFullscreen}
        onFilterType={setActiveFilter}
        onOpenCreatePanel={() => setShowEditPanel(true)}
        activeFilter={activeFilter}
        nodeCount={filteredData.nodes.length}
        linkCount={filteredData.links.length}
        totalNodes={totalNodes}
      />

      {/* 3D Force Graph */}
      <ForceGraph3D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={filteredData}
        nodeId="id"
        nodeLabel={(node: any) => `${node.displayName} (${node.type})`}
        nodeThreeObject={nodeThreeObject}
        nodeThreeObjectExtend={false}
        onNodeClick={handleNodeClick as any}
        onNodeDragEnd={handleNodeDragEnd as any}
        onNodeRightClick={(node: any) => handleExpandNode(node.id)}
        linkSource="source"
        linkTarget="target"
        linkLabel={(link: any) => link.type}
        linkColor={linkColor}
        linkWidth={(link: any) => Math.max(0.5, (link.weight || 1) * 0.5)}
        linkOpacity={0.4}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={1.5}
        linkDirectionalParticleSpeed={0.005}
        onLinkClick={handleLinkClick}
        backgroundColor="rgba(0,0,0,0)"
        showNavInfo={false}
        cooldownTicks={100}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        enableNavigationControls={true}
        controlType="orbit"
      />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex flex-wrap gap-2 pointer-events-none">
        {Object.entries(TYPE_COLORS_CSS).filter(([k]) => k !== 'User').map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-background/60 backdrop-blur-sm text-xs">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
            <span className="text-muted-foreground">{type}</span>
          </div>
        ))}
      </div>

      {/* Hint */}
      <div className="absolute bottom-4 right-4 text-xs text-muted-foreground/50 pointer-events-none">
        {t('lifegraph3d.hint')}
      </div>

      {/* Edit Panel */}
      <GraphEditPanel
        selectedNode={showEditPanel ? selectedNode : null}
        selectedLink={showEditPanel ? selectedLink : null}
        allNodes={graphData.nodes}
        onClose={() => { setShowEditPanel(false); setSelectedNode(null); setSelectedLink(null) }}
        onSaveNode={handleSaveNode}
        onDeleteNode={handleDeleteNode}
        onCreateNode={handleCreateNode}
        onSaveLink={handleSaveLink}
        onDeleteLink={handleDeleteLink}
        onCreateLink={handleCreateLink}
      />
    </div>
  )
}
