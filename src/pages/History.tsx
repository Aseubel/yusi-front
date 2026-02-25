import { useEffect, useState } from 'react'
import { getHistory } from '../lib'
import type { Room } from '../lib'
import { Card, CardContent, Badge } from '../components/ui'
import { Link } from 'react-router-dom'
import { Clock, Users, CheckCircle2 } from 'lucide-react'

export const History = () => {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getHistory()
      .then(setRooms)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center text-muted-foreground gap-4">
            <div className="text-lg">加载历史记录...</div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold tracking-tight">情景室历史</h2>
        
        {rooms.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground bg-muted/20 rounded-lg">
            暂无参与记录
          </div>
        ) : (
          <div className="grid gap-4">
            {rooms.map((room) => (
              <Link key={room.code} to={`/room/${room.code}`}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-lg">{room.code}</span>
                            <Badge variant={
                                room.status === 'COMPLETED' ? 'outline' : 
                                room.status === 'CANCELLED' ? 'destructive' : 'default'
                            }>
                                {room.status === 'WAITING' && '等待中'}
                                {room.status === 'IN_PROGRESS' && '进行中'}
                                {room.status === 'COMPLETED' && '已完成'}
                                {room.status === 'CANCELLED' && '已取消'}
                            </Badge>
                        </div>
                        {room.scenario && (
                            <div className="text-sm font-medium">{room.scenario.title}</div>
                        )}
                        <div className="text-xs text-muted-foreground flex items-center gap-4">
                            <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" /> {room.members.length} 人
                            </span>
                            {room.scenario && (
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {room.scenario.summary || room.scenario.description.substring(0, 20) + '...'}
                                </span>
                            )}
                        </div>
                    </div>
                    
                    {room.status === 'COMPLETED' && (
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
  )
}
