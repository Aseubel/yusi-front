import { useState } from 'react'
import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Input, Textarea, toast } from '../ui'
import { submitScenario } from '../../lib/room'
import { useRequireAuth } from '../../lib'

export const ScenarioSubmit = () => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const { requireAuth } = useRequireAuth()

  const handleSubmit = async () => {
    if (!requireAuth('投稿情景需要登录')) {
      return
    }
    if (!title || !description) {
      toast.error('请填写完整信息')
      return
    }
    setLoading(true)
    try {
      await submitScenario({ title, description })
      toast.success('投稿成功，等待审核')
      setTitle('')
      setDescription('')
    } catch (e) {
      // error handled by interceptor
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>投稿情景</CardTitle>
        <CardDescription>分享你的创意情景，审核通过后将展示给所有人。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 flex-1">
        <div className="space-y-2">
          <label className="text-sm font-medium">标题</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="请输入情景标题" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">描述</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="请输入情景描述（背景、冲突、角色等）"
            className="min-h-[100px]"
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button isLoading={loading} onClick={handleSubmit} className="w-full">
          提交审核
        </Button>
      </CardFooter>
    </Card>
  )
}
