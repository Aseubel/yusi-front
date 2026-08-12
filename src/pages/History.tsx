import { useEffect, useState } from 'react'
import { getHistory } from '../lib'
import type { Room } from '../lib'
import { Card, CardContent, Badge } from '../components/ui'
import { Link } from 'react-router-dom'
import { Clock, Users, CheckCircle2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export const History = () => {
  const { t } = useTranslation()
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
            <div className="text-lg">{t('history.loading')}</div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5 sm:space-y-6">
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{t('history.title')}</h2>
        
        {rooms.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground bg-muted/20 rounded-lg">
            {t('history.empty')}
          </div>
        ) : (
          <div className="grid gap-4">
            {rooms.map((room) => (
              <Link key={room.code} to={`/room/${room.code}`}>
                <Card className="cursor-pointer transition-colors hover:bg-muted/50">
                  <CardContent className="flex items-start justify-between gap-3 p-4 sm:items-center sm:p-6">
                    <div className="min-w-0 flex flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono font-bold text-lg">{room.code}</span>
                            <Badge variant={
                                room.status === 'COMPLETED' ? 'outline' : 
                                room.status === 'CANCELLED' ? 'destructive' : 'default'
                            }>
                                {room.status === 'WAITING' && t('history.status.waiting')}
                                {room.status === 'IN_PROGRESS' && t('history.status.inProgress')}
                                {room.status === 'COMPLETED' && t('history.status.completed')}
                                {room.status === 'CANCELLED' && t('history.status.cancelled')}
                            </Badge>
                        </div>
                        {room.scenario && (
                            <div className="text-sm font-medium">{room.scenario.title}</div>
                        )}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" /> {t('history.memberCount', { count: room.members.length })}
                            </span>
                            {room.scenario && (
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {room.scenario.summary || room.scenario.description.substring(0, 20) + '...'}
                                </span>
                            )}
                        </div>
                    </div>
                    
                    {room.status === 'COMPLETED' && (
                        <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-green-500 sm:h-6 sm:w-6" />
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
