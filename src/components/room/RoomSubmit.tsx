import { Button, Textarea, toast, Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui'
import { useState } from 'react'
import { submitNarrative } from '../../lib'
import { countChars } from '../../utils'

export const RoomSubmit = ({ code, userId }: { code: string; userId: string }) => {
  const [narrative, setNarrative] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!narrative.trim()) {
      toast.error('请输入你的叙事')
      return
    }
    if (countChars(narrative) > 1000) {
      toast.error('叙事过长（>1000字符）')
      return
    }
    setLoading(true)
    try {
      await submitNarrative({ code, userId, narrative, isPublic })
      toast.success('提交成功')
      window.location.reload()
    } catch (e) {
      // error handled by interceptor
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>写下你的叙事</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={narrative}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNarrative(e.target.value)}
          rows={8}
          placeholder="描述你在该情景下会采取的行动与想法..."
        />
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <label className="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors">
            <input 
              type="checkbox" 
              checked={isPublic} 
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            允许公开我的回答
          </label>
          <span>
            已输入 {countChars(narrative)} / 1000 字符
          </span>
        </div>
      </CardContent>
      <CardFooter>
        <Button isLoading={loading} onClick={handleSubmit}>
          提交叙事
        </Button>
      </CardFooter>
    </Card>
  )
}