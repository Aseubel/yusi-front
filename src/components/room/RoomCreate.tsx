import { Button, toast, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Input } from '../ui'
import { Minus, Plus } from 'lucide-react'
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
      <CardHeader className="p-4 sm:p-6">
        <CardTitle>{t('roomCreate.title')}</CardTitle>
        <CardDescription>{t('roomCreate.description')}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{t('roomCreate.maxMembers')}</label>
            <span className="text-sm text-muted-foreground">{t('roomCreate.memberCount', { count: maxMembers })}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="icon" className="h-11 w-11 sm:h-9 sm:w-9" onClick={() => setMaxMembers(value => Math.max(2, value - 1))} disabled={maxMembers <= 2} aria-label={t('roomCreate.maxMembers') + ' -'}>
              <Minus className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Input type="number" min={2} max={8} value={maxMembers} onChange={(e) => setMaxMembers(Math.min(8, Math.max(2, parseInt(e.target.value, 10) || 2)))} aria-label={t('roomCreate.maxMembers')} className="text-center tabular-nums" />
            <Button type="button" variant="outline" size="icon" className="h-11 w-11 sm:h-9 sm:w-9" onClick={() => setMaxMembers(value => Math.min(8, value + 1))} disabled={maxMembers >= 8} aria-label={t('roomCreate.maxMembers') + ' +'}>
              <Plus className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 sm:p-6 sm:pt-0">
        <Button isLoading={loading} onClick={handleCreate} className="w-full">
          {t('roomCreate.createButton')}
        </Button>
      </CardFooter>
    </Card>
  )
}
