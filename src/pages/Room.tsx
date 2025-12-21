import { useParams } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { Layout } from '../components/Layout'
import { RoomSubmit, RoomReport } from '../components/room'
import { getReport, getRoom, cancelRoom, startRoom, voteCancelRoom } from '../lib'
import { useRoomStore } from '../stores'
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '../components/ui'
import { toast } from 'sonner'
import type { PersonalSketch, PairCompatibility } from '../lib'
import { Play, Copy, Users, CheckCircle2, Clock, AlertCircle } from 'lucide-react'

export const Room = () => {
  const { code } = useParams<{ code: string }>()
  const room = useRoomStore((s) => s.rooms[code!])
  const setRoom = useRoomStore((s) => s.setRoom)
  const [report, setReport] = useState<{ personal: PersonalSketch[]; pairs: PairCompatibility[] } | null>(null)
  const userId = localStorage.getItem('yusi-user-id') || ''
  const timerRef = useRef<any>(null)
  const [starting, setStarting] = useState(false)

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
    fetchRoom()
    timerRef.current = setInterval(fetchRoom, 2000)
    return () => {
        if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [code])

  useEffect(() => {
    if (!code) return
    if (room?.status === 'COMPLETED' && !report) {
      getReport(code).then((r) => setReport({ personal: r.personal, pairs: r.pairs }))
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

  const handleStart = async () => {
      if (!code || !userId) return
      if (room.members.length < 2) {
          toast.error('至少需要2人才能开始')
          return
      }
      setStarting(true)
      try {
          // TODO: Let user select scenario. For now use default '1'
          await startRoom({ code, scenarioId: '1', ownerId: userId })
          toast.success('房间已开始')
          fetchRoom()
      } catch (e) {
          // handled
      } finally {
          setStarting(false)
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
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight">房间 {code}</h2>
            <Button variant="ghost" size="icon" onClick={copyCode} title="复制房间号">
                <Copy className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex gap-2 items-center">
            {room.status === 'WAITING' && isOwner && (
                <>
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={handleStart}
                  isLoading={starting}
                  disabled={room.members.length < 2}
                >
                    <Play className="w-4 h-4 mr-1" /> 开始
                </Button>
                <Button variant="danger" size="sm" onClick={handleCancel}>
                    解散
                </Button>
                </>
            )}

            {room.status === 'IN_PROGRESS' && (
                <>
                    {isOwner ? (
                        <Button variant="danger" size="sm" onClick={handleCancel}>
                           强制解散
                        </Button>
                    ) : (
                        <Button variant="outline" size="sm" onClick={handleVoteCancel} disabled={room.cancelVotes?.includes(userId)}>
                           {room.cancelVotes?.includes(userId) ? '已投票' : '投票解散'}
                        </Button>
                    )}
                    {room.cancelVotes && room.cancelVotes.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                            解散投票: {room.cancelVotes.length}/{Math.floor(room.members.length / 2) + 1}
                        </span>
                    )}
                </>
            )}

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

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                成员 ({room.members.length}/8)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 flex-wrap">
              {room.members.map((m) => {
                  const hasSubmitted = !!room.submissions[m]
                  const name = room.memberNames?.[m] || m
                  const isHost = m === room.ownerId
                  return (
                    <div key={m} className="flex items-center gap-2 bg-secondary/50 px-3 py-2 rounded-lg border">
                        <div className="flex flex-col">
                            <span className="text-sm font-medium flex items-center gap-1">
                                {name}
                                {isHost && <Badge variant="outline" className="text-[10px] h-4 px-1">房主</Badge>}
                            </span>
                        </div>
                        {room.status === 'IN_PROGRESS' && (
                            hasSubmitted ? 
                            <CheckCircle2 className="w-4 h-4 text-green-500" /> : 
                            <Clock className="w-4 h-4 text-muted-foreground" />
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
          <RoomReport personal={report.personal} pairs={report.pairs} />
        )}
      </div>
    </Layout>
  )
}