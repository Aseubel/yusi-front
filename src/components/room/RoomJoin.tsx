import { Button, Input, toast, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { joinRoom, useRequireAuth } from '../../lib'
import { useNavigate } from 'react-router-dom'

export const RoomJoin = () => {
  const { t } = useTranslation()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const { requireAuth, user } = useRequireAuth()
  const navigate = useNavigate()
  const userId = user?.userId || ''

  const handleJoin = async () => {
    if (!requireAuth(t('roomJoin.requireAuth'))) {
      return
    }
    if (!code.trim()) {
      toast.error(t('roomJoin.enterCode'))
      return
    }
    setLoading(true)
    try {
      await joinRoom({ code: code.toUpperCase(), userId })
      toast.success(t('roomJoin.joinSuccess'))
      navigate(`/room/${code.toUpperCase()}`)
    } catch {
      toast.error(t('roomJoin.joinFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle>{t('roomJoin.title')}</CardTitle>
        <CardDescription>{t('roomJoin.description')}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
        <div className="space-y-2">
          <div className="flex items-center justify-between h-[20px]">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{t('roomJoin.inviteCodeLabel')}</label>
          </div>
          <Input
            value={code}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value.toUpperCase())}
            placeholder={t('roomJoin.inviteCodePlaceholder')}
            maxLength={6}
          />
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 sm:p-6 sm:pt-0">
        <Button isLoading={loading} onClick={handleJoin} className="w-full" variant="secondary">
          {t('roomJoin.joinButton')}
        </Button>
      </CardFooter>
    </Card>
  )
}
