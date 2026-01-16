import { Button, Input, toast, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui'
import { useState } from 'react'
import { joinRoom, useRequireAuth } from '../../lib'
import { useNavigate } from 'react-router-dom'

export const RoomJoin = () => {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const { requireAuth, user } = useRequireAuth()
  const navigate = useNavigate()
  const userId = user?.userId || ''

  const handleJoin = async () => {
    if (!requireAuth('加入房间需要登录')) {
      return
    }
    if (!code.trim()) {
      toast.error('请输入邀请码')
      return
    }
    setLoading(true)
    try {
      await joinRoom({ code: code.toUpperCase(), userId })
      toast.success('加入成功')
      navigate(`/room/${code.toUpperCase()}`)
    } catch (e) {
      // error handled by interceptor
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>加入情景室</CardTitle>
        <CardDescription>输入邀请码，加入朋友的房间。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 flex-1">
        <div className="space-y-2">
          <div className="flex items-center justify-between h-[20px]">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">邀请码（6位）</label>
          </div>
          <Input
            value={code}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value.toUpperCase())}
            placeholder="ABC123"
            maxLength={6}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button isLoading={loading} onClick={handleJoin} className="w-full" variant="secondary">
          加入房间
        </Button>
      </CardFooter>
    </Card>
  )
}