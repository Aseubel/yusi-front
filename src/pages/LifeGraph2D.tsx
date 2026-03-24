import { useEffect, useState, useCallback } from 'react'
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  Handle,
  Position,
  type Node,
  type Edge
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import dagre from 'dagre'
import { lifegraphApi, type GraphNode, type GraphSnapshot } from '../lib/lifegraph'
import { GraphEditPanel } from '../components/lifegraph/GraphEditPanel'
import { GraphToolbar } from '../components/lifegraph/GraphToolbar'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const TYPE_COLORS_CSS: Record<string, string> = {
  Person: '#3B82F6',
  Event: '#F97316',
  Place: '#22C55E',
  Emotion: '#EC4899',
  Topic: '#8B5CF6',
  Item: '#6B7280',
  User: '#A855F7',
}

// Custom Node design
const CustomNode = ({ data }: { data: any }) => {
  const color = TYPE_COLORS_CSS[data.type] || '#888888'
  return (
    <div
      className="flex flex-col items-center justify-center p-2 rounded-full border-4 shadow-lg transition-transform hover:scale-105 bg-background"
      style={{ borderColor: color, width: '100px', height: '100px' }}
    >
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-none" />
      <span className="text-sm font-bold text-center line-clamp-2" style={{ color }}>
        {data.label}
      </span>
      <span className="text-[10px] text-muted-foreground">{data.type}</span>
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-none" />
    </div>
  )
}

const nodeTypes = {
  custom: CustomNode,
}

const getDagreLayout = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))

  dagreGraph.setGraph({ rankdir: direction })

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 120, height: 120 })
  })

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 120 / 2,
        y: nodeWithPosition.y - 120 / 2,
      },
    }
  })

  return { nodes: newNodes, edges }
}

const LifeGraph2DInner = () => {
  const { t } = useTranslation()
  const { fitView, setCenter } = useReactFlow()
  
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [totalNodes, setTotalNodes] = useState(0)
  const [loading, setLoading] = useState(true)

  // Raw Graph Data
  const [rawNodes, setRawNodes] = useState<GraphNode[]>([])
  
  // Selection & Editing
  const [selectedNodeData, setSelectedNodeData] = useState<any>(null)
  const [selectedLinkData, setSelectedLinkData] = useState<any>(null)
  const [showEditPanel, setShowEditPanel] = useState(false)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)

  // Layout function
  const applyLayout = useCallback((currentNodes: Node[], currentEdges: Edge[]) => {
    const layouted = getDagreLayout(currentNodes, currentEdges)
    setNodes([...layouted.nodes])
    setEdges([...layouted.edges])
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 800 })
    }, 100)
  }, [setNodes, setEdges, fitView])

  // Load Initial Graph
  const loadGraph = useCallback(async () => {
    setLoading(true)
    try {
      const res = await lifegraphApi.getGraphData(0, 300)
      if (res.data.code === 200) {
        const snapshot: GraphSnapshot = res.data.data
        setRawNodes(snapshot.nodes)
        setTotalNodes(snapshot.totalNodeCount)

        const initialNodes: Node[] = snapshot.nodes.map(n => ({
          id: n.id.toString(),
          type: 'custom',
          position: { x: 0, y: 0 },
          data: { ...n, label: n.displayName } as any,
        }))

        const initialEdges: Edge[] = snapshot.links.map(l => ({
          id: l.id.toString(),
          source: l.sourceId.toString(),
          target: l.targetId.toString(),
          label: l.type,
          animated: true,
          style: { stroke: TYPE_COLORS_CSS[snapshot.nodes.find(n => n.id === l.sourceId)?.type || 'User'] || '#666', strokeWidth: Math.max(1, l.weight || 1) },
          data: l as any
        }))

        applyLayout(initialNodes as Node[], initialEdges as Edge[])
      }
    } catch (err) {
      console.error('Failed to load React Flow graph data', err)
    } finally {
      setLoading(false)
    }
  }, [applyLayout])

  useEffect(() => { loadGraph() }, [loadGraph])

  // Filter functionality
  useEffect(() => {
    if (!activeFilter || nodes.length === 0) {
      setNodes((nds: Node[]) => nds.map(n => ({ ...n, hidden: false })))
      setEdges((eds: Edge[]) => eds.map(e => ({ ...e, hidden: false })))
      return
    }
    setNodes((nds: Node[]) => nds.map(n => ({ ...n, hidden: n.data.type !== activeFilter })))
    setEdges((eds: Edge[]) => eds.map(e => {
      const srcNode = nodes.find(n => n.id === e.source)
      const tgtNode = nodes.find(n => n.id === e.target)
      return { 
        ...e, 
        hidden: Boolean(srcNode?.data.type !== activeFilter || tgtNode?.data.type !== activeFilter)
      }
    }))
  }, [activeFilter, setNodes, setEdges]) // nodes omitted intentionally to avoid loops if needed, though safely added back


  // Handlers
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeData(node.data)
    setSelectedLinkData(null)
    setShowEditPanel(true)
    setCenter(node.position.x + 50, node.position.y + 50, { zoom: 1.2, duration: 800 })
  }, [setCenter])

  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedLinkData(edge.data)
    setSelectedNodeData(null)
    setShowEditPanel(true)
  }, [])

  const onNodeContextMenu = useCallback(async (event: React.MouseEvent, node: Node) => {
    event.preventDefault()
    try {
      const res = await lifegraphApi.getGraphBfs(Number(node.id), 2, 200)
      if (res.data.code === 200) {
        const snapshot = res.data.data
        const existingNodeIds = new Set(nodes.map(n => n.id))
        const existingEdgeIds = new Set(edges.map(e => e.id))

        const newNodes = snapshot.nodes.filter((n: GraphNode) => !existingNodeIds.has(n.id.toString())).map((n: GraphNode) => ({
          id: n.id.toString(),
          type: 'custom',
          position: { x: node.position.x + Math.random() * 100 - 50, y: node.position.y + Math.random() * 100 - 50 },
          data: { ...n, label: n.displayName } as any,
        }))

        const newEdges = snapshot.links.filter((l: any) => !existingEdgeIds.has(l.id.toString())).map((l: any) => ({
          id: l.id.toString(),
          source: l.sourceId.toString(),
          target: l.targetId.toString(),
          label: l.type,
          animated: true,
          style: { stroke: TYPE_COLORS_CSS[snapshot.nodes.find((n: any) => n.id === l.sourceId)?.type || 'User'] || '#666', strokeWidth: Math.max(1, l.weight || 1) },
          data: l
        }))

        if (newNodes.length > 0 || newEdges.length > 0) {
          const updatedNodes = [...nodes, ...newNodes]
          const updatedEdges = [...edges, ...newEdges]
          setRawNodes(prev => {
            const ids = new Set(prev.map(p => p.id))
            const addition = snapshot.nodes.filter((n: GraphNode) => !ids.has(n.id))
            return [...prev, ...addition]
          })
          applyLayout(updatedNodes, updatedEdges)
          toast.success(`Expanded ${newNodes.length} nodes`)
        } else {
          toast.info("No new connections found")
        }
      }
    } catch (err) {
      console.error(err)
    }
  }, [nodes, edges, applyLayout])

  // CRUD events passing down to EditPanel
  const handleSaveNode = async (id: number, data: any) => {
    try {
      const res = await lifegraphApi.updateEntity(id, data)
      if (res.data.code === 200) {
        const returnedEntity = res.data.data
        if (returnedEntity.id !== id) {
          toast.success('检测到同名同类型节点，已自动执行合并！')
          setShowEditPanel(false)
          loadGraph()
        } else {
          setNodes((nds: Node[]) => nds.map(n => n.id === id.toString() ? { ...n, data: { ...n.data, ...returnedEntity, label: returnedEntity.displayName } } : n))
          setSelectedNodeData(returnedEntity)
          toast.success(t('lifegraph3d.saved'))
        }
      } else if (res.data.code === 409) {
        toast.error(t('lifegraph3d.versionConflict'))
        loadGraph()
      }
    } catch {}
  }
  const handleDeleteNode = async (id: number) => {
    try {
      await lifegraphApi.deleteEntity(id)
      setNodes((nds: Node[]) => nds.filter(n => n.id !== id.toString()))
      setEdges((eds: Edge[]) => eds.filter(e => e.source !== id.toString() && e.target !== id.toString()))
      setShowEditPanel(false)
      toast.success(t('lifegraph3d.deleted'))
    } catch {}
  }
  const handleCreateNode = async (data: any) => {
    try {
      const res = await lifegraphApi.createEntity(data)
      if (res.data.code === 200) {
        const n = res.data.data
        const newNode: Node = { id: n.id.toString(), type: 'custom', position: { x: 0, y: 0 }, data: { ...n, label: n.displayName } as any }
        const updatedNodes = [...nodes, newNode]
        setRawNodes(prev => [...prev, n])
        applyLayout(updatedNodes, edges)
        setShowEditPanel(false)
        toast.success(t('lifegraph3d.created'))
      }
    } catch {}
  }
  const handleSaveLink = async (id: number, data: any) => {
    try {
      const res = await lifegraphApi.updateRelation(id, data)
      if (res.data.code === 200) {
        setEdges((eds: Edge[]) => eds.map(e => e.id === id.toString() ? { ...e, data: { ...e.data, ...res.data.data }, label: res.data.data.type } : e))
        setSelectedLinkData(res.data.data)
        toast.success(t('lifegraph3d.saved'))
      } else if (res.data.code === 409) {
        toast.error(t('lifegraph3d.versionConflict'))
        loadGraph()
      }
    } catch {}
  }
  const handleDeleteLink = async (id: number) => {
    try {
      await lifegraphApi.deleteRelation(id)
      setEdges((eds: Edge[]) => eds.filter(e => e.id !== id.toString()))
      setShowEditPanel(false)
      toast.success(t('lifegraph3d.deleted'))
    } catch {}
  }
  const handleCreateLink = async (data: any) => {
    try {
      const res = await lifegraphApi.createRelation(data)
      if (res.data.code === 200) {
        const l = res.data.data
        const newEdge: Edge = {
          id: l.id.toString(),
          source: l.sourceId.toString(),
          target: l.targetId.toString(),
          label: l.type,
          animated: true,
          style: { stroke: TYPE_COLORS_CSS[rawNodes.find(n => n.id === l.sourceId)?.type || 'User'] || '#666', strokeWidth: Math.max(1, l.weight || 1) },
          data: l as any
        }
        const updatedEdges = [...edges, newEdge]
        applyLayout(nodes, updatedEdges)
        setShowEditPanel(false)
        toast.success(t('lifegraph3d.created'))
      }
    } catch {}
  }

  // Search
  const handleSearch = (query: string) => {
    if (!query) return
    const targetNode = nodes.find(n => String((n.data as any).label || '').toLowerCase().includes(query.toLowerCase()))
    if (targetNode) {
      setCenter(targetNode.position.x + 50, targetNode.position.y + 50, { zoom: 1.5, duration: 1000 })
      setSelectedNodeData(targetNode.data)
      setShowEditPanel(true)
    } else {
      toast.error(t('lifegraph3d.nodeNotFound'))
    }
  }

  const handleResetView = () => {
    setActiveFilter(null)
    applyLayout(nodes.map(n => ({...n, hidden: false})), edges.map(e => ({...e, hidden: false})))
  }

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
        <p className="text-muted-foreground">{t('lifegraph3d.loading')}</p>
      </motion.div>
    )
  }

  return (
    <div className="relative w-full h-[calc(100vh-64px)]">
      <GraphToolbar
        onSearch={handleSearch}
        onResetView={handleResetView}
        onToggleFullscreen={() => {}}
        onFilterType={setActiveFilter}
        onOpenCreatePanel={() => setShowEditPanel(true)}
        activeFilter={activeFilter}
        nodeCount={nodes.filter(n => !n.hidden).length}
        linkCount={edges.filter(e => !e.hidden).length}
        totalNodes={totalNodes}
      />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onNodeContextMenu={onNodeContextMenu}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
        className="bg-background/95"
      >
        <Background gap={16} size={1} color="#aaa" />
        <Controls showInteractive={false} className="bg-background border shadow-md" />
        <MiniMap nodeStrokeColor={(n) => TYPE_COLORS_CSS[n.data.type as string] || '#888'} zoomable pannable className="bg-background border shadow-md" />
      </ReactFlow>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex flex-wrap gap-2 pointer-events-none z-10">
        {Object.entries(TYPE_COLORS_CSS).filter(([k]) => k !== 'User').map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-background/80 backdrop-blur-sm text-xs border shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
            <span className="text-muted-foreground">{type}</span>
          </div>
        ))}
      </div>

      <GraphEditPanel
        selectedNode={showEditPanel ? selectedNodeData : null}
        selectedLink={showEditPanel ? selectedLinkData : null}
        allNodes={rawNodes}
        onClose={() => { setShowEditPanel(false); setSelectedNodeData(null); setSelectedLinkData(null) }}
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

export const LifeGraph2D = () => {
  return (
    <ReactFlowProvider>
      <LifeGraph2DInner />
    </ReactFlowProvider>
  )
}
