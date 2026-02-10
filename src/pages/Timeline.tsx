import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Calendar, Star } from 'lucide-react'
import { cn } from '../utils'

interface TimelineNode {
  entityId: number
  title: string
  date: string
  summary: string
  importance: number
  emotion?: string
  relatedPeople?: string[]
}

interface LifeChapter {
  title: string
  startDate: string
  endDate: string
  keywords: string[]
  nodes: TimelineNode[]
  summary: string
}

export const Timeline = () => {
  const [chapters, setChapters] = useState<LifeChapter[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const res = await api.get('/lifegraph/timeline')
        if (res.data.success) {
          setChapters(res.data.data)
        }
      } catch (error) {
        console.error('Failed to fetch timeline', error)
      } finally {
        setLoading(false)
      }
    }
    fetchTimeline()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!chapters.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <Calendar className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold">暂无人生时间线</h2>
        <p className="text-muted-foreground max-w-sm">
          随着你记录更多日记，AI 将自动为你梳理出人生重要节点。
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <header className="text-center space-y-4 mb-16">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
          人生时光轴
        </h1>
        <p className="text-muted-foreground">
          你的每一个重要瞬间，都值得被铭记
        </p>
      </header>

      <div className="relative space-y-24 before:absolute before:inset-0 before:ml-5 md:before:ml-[50%] before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
        {chapters.map((chapter, chapterIdx) => (
          <div key={chapterIdx} className="relative">
            {/* Chapter Header */}
            <div className="sticky top-20 z-10 flex justify-center mb-12">
              <div className="bg-background/80 backdrop-blur-xl border border-primary/20 px-6 py-2 rounded-full shadow-lg shadow-primary/5">
                <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                  {chapter.title}
                  <span className="text-xs font-normal text-muted-foreground px-2 py-0.5 bg-muted rounded-full">
                    {chapter.keywords.join(' · ')}
                  </span>
                </h2>
              </div>
            </div>

            {/* Timeline Nodes */}
            <div className="space-y-12">
              {chapter.nodes.map((node, nodeIdx) => (
                <div 
                  key={node.entityId} 
                  className={cn(
                    "relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group",
                    "before:absolute before:left-5 md:before:left-1/2 before:w-3 before:h-3 before:bg-background before:border-2 before:border-primary before:rounded-full before:z-10 before:-translate-x-1.5 md:before:translate-x-[-5px]",
                    node.importance > 0.8 && "before:w-4 before:h-4 before:bg-primary before:border-4 before:border-background before:shadow-[0_0_0_4px_rgba(var(--primary),0.2)]"
                  )}
                >
                  <div className={cn(
                    "flex w-full md:w-[calc(50%-2rem)] pl-12 md:pl-0",
                    nodeIdx % 2 === 0 ? "md:pr-8 md:text-right" : "md:pl-8"
                  )}>
                    <Card className={cn(
                      "w-full p-5 hover:shadow-lg transition-all duration-300 border-primary/10 group-hover:border-primary/30",
                      node.importance > 0.8 && "bg-primary/5 border-primary/20"
                    )}>
                      <div className={cn(
                        "flex flex-col gap-2 mb-3",
                        nodeIdx % 2 === 0 ? "md:items-end" : "md:items-start"
                      )}>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {node.date}
                          {node.importance > 0.8 && (
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                        <h3 className="text-lg font-bold">{node.title}</h3>
                      </div>
                      
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                        {node.summary || "暂无摘要"}
                      </p>

                      <div className={cn(
                        "flex flex-wrap gap-2",
                        nodeIdx % 2 === 0 ? "md:justify-end" : "md:justify-start"
                      )}>
                        {node.relatedPeople?.map(person => (
                          <Badge key={person} variant="secondary" className="text-xs">
                            @{person}
                          </Badge>
                        ))}
                        {node.emotion && (
                          <Badge variant="outline" className="text-xs border-primary/20 text-primary">
                            #{node.emotion}
                          </Badge>
                        )}
                      </div>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
