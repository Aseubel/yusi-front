import { Button, toast, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createRoom, useRequireAuth } from '../../lib'
import { useNavigate } from 'react-router-dom'

export const RoomCreate = () => {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [maxMembers, setMaxMembers] = useState(4)
  const { requireAuth, user } = useRequireAuth()
  const navigate = useNavigate()
  const ownerId = user?.userId || ''

  const handleCreate = async () => {
    if (!requireAuth(t('roomCreate.requireAuth'))) {
      return
    }
    setLoading(true)
    try {
      const room = await createRoom({ ownerId, maxMembers })
      toast.success(t('roomCreate.createSuccess', { code: room.code }))
      navigate(`/room/${room.code}`)
    } catch {
      toast.error(t('roomCreate.createFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>{t('roomCreate.title')}</CardTitle>
        <CardDescription>{t('roomCreate.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 flex-1">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{t('roomCreate.maxMembers')}</label>
            <span className="text-sm text-muted-foreground">{t('roomCreate.memberCount', { count: maxMembers })}</span>
          </div>
          <div className="h-10 flex items-center">
            <input
              type="range"
              min={2}
              max={8}
              value={maxMembers}
              onChange={(e) => setMaxMembers(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button isLoading={loading} onClick={handleCreate} className="w-full">
          {t('roomCreate.createButton')}
        </Button>
      </CardFooter>
    </Card>
  )
}
