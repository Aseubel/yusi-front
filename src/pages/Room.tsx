import { useParams } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { Layout } from '../components/Layout'
import { RoomSubmit, RoomReport } from '../components/room'
import { getReport, getRoom, cancelRoom, startRoom, voteCancelRoom, getScenarios } from '../lib'
import { useRoomStore } from '../stores'
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '../components/ui'
import { toast } from 'sonner'
import type { PersonalSketch, PairCompatibility, Scenario } from '../lib'
import { Play, Copy, Users, CheckCircle2, Clock, AlertCircle, Shuffle, CheckSquare, Square, Sparkles } from 'lucide-react'
import * as Tabs from '@radix-ui/react-tabs'
import { cn } from '../utils'

export const Room = () => {
  const { code } = useParams<{ code: string }>()
  const room = useRoomStore((s) => s.rooms[code!])
  const setRoom = useRoomStore((s) => s.setRoom)
  const [report, setReport] = useState<{
    personal: PersonalSketch[];
    pairs: PairCompatibility[];
    publicSubmissions?: { userId: string; content: string }[];
  } | null>(null)
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const userId = localStorage.getItem('yusi-user-id') || ''
  const timerRef = useRef<any>(null)
  const [starting, setStarting] = useState(false)
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('')
  const [randomPool, setRandomPool] = useState<string[]>([])

  const fetchRoom = async () => {
    if (!code) return
    try {
      const data = await getRoom(code)
      setRoom(code, data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    getScenarios().then((data) => {
      setScenarios(data)
      if (data.length > 0) {
        setRandomPool(data.map(s => s.id))
        setSelectedScenarioId(data[0].id)
      }
    }).catch(console.error)
  }, [])

  useEffect(() => {
    fetchRoom()
    // Only poll if room is not completed or cancelled, OR if completed but report is missing (analyzing)
    if ((room?.status !== 'COMPLETED' && room?.status !== 'CANCELLED') || (room?.status === 'COMPLETED' && !report)) {
      timerRef.current = setInterval(fetchRoom, 2000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [code, room?.status, report])

  useEffect(() => {
    if (!code) return
    if (room?.status === 'COMPLETED' && !report) {
      getReport(code).then((r) => setReport({
        personal: r.personal,
        pairs: r.pairs,
        publicSubmissions: r.publicSubmissions
      }))
    }
  }, [code, room?.status])

  const handleCancel = async () => {
    if (!code || !userId) return
    if (!confirm('确定要解散房间吗？')) return

    try {
      await cancelRoom(code, userId)
      toast.success('房间已解散')
      window.location.href = '/'
    } catch (e) {
      // handled
    }
  }

  const handleVoteCancel = async () => {
    if (!code || !userId) return
    if (!confirm('确定要投票解散房间吗？')) return
    try {
      await voteCancelRoom(code, userId)
      toast.success('已投票')
      fetchRoom()
    } catch (e) {
      // handled
    }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(code || '')
    toast.success('房间号已复制')
  }

  const handleStart = async (targetScenarioId?: string) => {
    if (!code || !userId) return
    if (room.members.length < 2) {
      toast.error('至少需要2人才能开始')
      return
    }
    if (scenarios.length === 0) {
      toast.error('没有可用的情景')
      return
    }
    const finalId = targetScenarioId || selectedScenarioId
    if (!finalId) {
      toast.error('请选择一个情景')
      return
    }

    setStarting(true)
    try {
      await startRoom({ code, scenarioId: finalId, ownerId: userId })
      toast.success('房间已开始')
      fetchRoom()
    } catch (e) {
      // handled
    } finally {
      setStarting(false)
    }
  }

  const handleRandomStart = () => {
    if (randomPool.length === 0) {
      toast.error('随机池为空，请至少选择一个情景')
      return
    }
    const randomId = randomPool[Math.floor(Math.random() * randomPool.length)]
    handleStart(randomId)
  }

  const toggleFromPool = (id: string) => {
    setRandomPool(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  const toggleAllPool = () => {
    if (randomPool.length === scenarios.length) {
      setRandomPool([])
    } else {
      setRandomPool(scenarios.map(s => s.id))
    }
  }


  if (!room) {
    return (
      <Layout>
        <div className="flex h-[50vh] flex-col items-center justify-center text-muted-foreground gap-4">
          <div className="text-lg">正在寻找房间信息...</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    )
  }

  // Polling / Waiting State
  if (room.status === 'COMPLETED' && !report) {
    return (
      <Layout>
        <div className="container mx-auto max-w-4xl py-8 px-4">
          <Card className="border-2 border-dashed border-primary/20">
            <CardContent className="flex flex-col items-center justify-center py-20 space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
                <Sparkles className="relative w-16 h-16 text-primary animate-pulse" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">全员已提交，正在生成分析报告...</h2>
                <p className="text-muted-foreground">AI 正在阅读大家的故事，请稍候（预计 30秒）</p>
              </div>
              <Button variant="outline" onClick={fetchRoom}>手动刷新</Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    )
  }

  if (room.status === 'CANCELLED') {
    return (
      <Layout>
        <div className="flex h-[50vh] flex-col items-center justify-center text-muted-foreground gap-4">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <div className="text-lg">房间已被解散</div>
          <Button onClick={() => window.location.href = '/'}>返回首页</Button>
        </div>
      </Layout>
    )
  }

  const submitted = room.submissions[userId]

  const isOwner = room.ownerId === userId

  return (
    <Layout>
      <div className="space-y-4 md:space-y-6 max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center gap-2 md:gap-3">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">房间 {code}</h2>
              <Button variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10" onClick={copyCode} title="复制房间号">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            {/* Mobile Status Badge */}
            <div className="md:hidden">
              <Badge
                variant={
                  room.status === 'WAITING' ? 'secondary' :
                    room.status === 'IN_PROGRESS' ? 'default' :
                      'outline'
                }
                className="text-xs px-2 py-0.5"
              >
                {room.status === 'WAITING' && '等待中'}
                {room.status === 'IN_PROGRESS' && '进行中'}
                {room.status === 'COMPLETED' && '已完成'}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
            {room.status === 'WAITING' && isOwner && (
              <div className="grid grid-cols-1 w-full md:flex md:w-auto">
                <Button variant="danger" size="sm" onClick={handleCancel} className="w-full md:w-auto">
                  解散房间
                </Button>
              </div>
            )}

            {room.status === 'IN_PROGRESS' && (
              <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
                {isOwner ? (
                  <Button variant="danger" size="sm" onClick={handleCancel} className="flex-1 md:flex-none">
                    强制解散
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={handleVoteCancel} disabled={room.cancelVotes?.includes(userId)} className="flex-1 md:flex-none">
                    {room.cancelVotes?.includes(userId) ? '已投票' : '投票解散'}
                  </Button>
                )}
                {room.cancelVotes && room.cancelVotes.length > 0 && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-auto md:ml-0">
                    解散投票: {room.cancelVotes.length}/{Math.floor(room.members.length / 2) + 1}
                  </span>
                )}
              </div>
            )}

            {/* Desktop Status Badge */}
            <div className="hidden md:block">
              <Badge
                variant={
                  room.status === 'WAITING' ? 'secondary' :
                    room.status === 'IN_PROGRESS' ? 'default' :
                      'outline'
                }
                className="text-sm px-3 py-1"
              >
                {room.status === 'WAITING' && '等待中'}
                {room.status === 'IN_PROGRESS' && '进行中'}
                {room.status === 'COMPLETED' && '已完成'}
              </Badge>
            </div>
          </div>
        </div>

        {room.status === 'IN_PROGRESS' && room.scenario && (
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-lg md:text-xl">{room.scenario.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
              <p className="whitespace-pre-wrap text-sm md:text-base leading-relaxed">{room.scenario.description}</p>
            </CardContent>
          </Card>
        )}

        {room.status === 'WAITING' && isOwner && (
          <Card>
            <CardHeader className="p-4 md:p-6 pb-2 md:pb-4">
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <Play className="w-4 h-4 md:w-5 md:h-5" />
                游戏设置
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0">
              <Tabs.Root defaultValue="select" className="w-full">
                <Tabs.List className="flex w-full rounded-lg bg-secondary p-1 text-muted-foreground mb-4">
                  <Tabs.Trigger value="select" className="flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                    指定情景
                  </Tabs.Trigger>
                  <Tabs.Trigger value="random" className="flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                    随机抽取
                  </Tabs.Trigger>
                </Tabs.List>

                <Tabs.Content value="select" className="space-y-4">
                  <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-1">
                    {scenarios.map(s => (
                      <div
                        key={s.id}
                        onClick={() => setSelectedScenarioId(s.id)}
                        className={cn(
                          "flex flex-col gap-1 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 text-left",
                          selectedScenarioId === s.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-transparent bg-secondary/30"
                        )}
                      >
                        <div className="font-medium text-sm">{s.title}</div>
                        <div className="text-xs text-muted-foreground line-clamp-2">{s.description}</div>
                      </div>
                    ))}
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => handleStart()}
                    disabled={room.members.length < 2 || !selectedScenarioId}
                    isLoading={starting}
                  >
                    <Play className="w-4 h-4 mr-2" /> 开始游戏
                  </Button>
                </Tabs.Content>

                <Tabs.Content value="random" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">随机池 ({randomPool.length}/{scenarios.length})</span>
                    <Button variant="ghost" size="sm" onClick={toggleAllPool} className="h-8 text-xs">
                      {randomPool.length === scenarios.length ? '全不选' : '全选'}
                    </Button>
                  </div>
                  <div className="grid gap-2 max-h-[250px] overflow-y-auto pr-1">
                    {scenarios.map(s => {
                      const isSelected = randomPool.includes(s.id)
                      return (
                        <div
                          key={s.id}
                          onClick={() => toggleFromPool(s.id)}
                          className="flex items-center gap-3 p-3 rounded-lg border border-transparent bg-secondary/30 cursor-pointer hover:bg-muted/50"
                        >
                          {isSelected ?
                            <CheckSquare className="w-4 h-4 text-primary shrink-0" /> :
                            <Square className="w-4 h-4 text-muted-foreground shrink-0" />
                          }
                          <div className="flex flex-col min-w-0 text-left">
                            <div className="font-medium text-sm truncate">{s.title}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleRandomStart}
                    disabled={room.members.length < 2 || randomPool.length === 0}
                    isLoading={starting}
                  >
                    <Shuffle className="w-4 h-4 mr-2" /> 随机开始
                  </Button>
                </Tabs.Content>
              </Tabs.Root>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="p-4 md:p-6 pb-2 md:pb-6">
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <Users className="w-4 h-4 md:w-5 md:h-5" />
              成员 ({room.members.length}/8)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-2 md:pt-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap gap-2 md:gap-4">
              {room.members.map((m) => {
                const hasSubmitted = !!room.submissions[m]
                const name = room.memberNames?.[m] || m
                const isHost = m === room.ownerId
                return (
                  <div key={m} className="flex items-center gap-2 bg-secondary/50 px-2 py-1.5 md:px-3 md:py-2 rounded-lg border overflow-hidden">
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs md:text-sm font-medium flex items-center gap-1 truncate">
                        <span className="truncate">{name}</span>
                        {isHost && <Badge variant="outline" className="text-[10px] h-3 px-1 shrink-0">房主</Badge>}
                      </span>
                    </div>
                    {room.status === 'IN_PROGRESS' && (
                      <div className="ml-auto shrink-0">
                        {hasSubmitted ?
                          <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-green-500" /> :
                          <Clock className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground" />
                        }
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {room.status === 'IN_PROGRESS' && !submitted && (
          <RoomSubmit code={code!} userId={userId} />
        )}

        {room.status === 'IN_PROGRESS' && submitted && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500/50" />
              <p>你已提交，请耐心等待其他成员...</p>
            </CardContent>
          </Card>
        )}

        {room.status === 'COMPLETED' && report && (
          <RoomReport
            personal={report.personal}
            pairs={report.pairs}
            publicSubmissions={report.publicSubmissions}
            memberNames={room.memberNames}
            scenario={room.scenario}
          />
        )}
      </div>
    </Layout>
  )
}