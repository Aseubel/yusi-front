import { Button, Textarea, toast, Card, CardHeader, CardTitle, CardContent, CardFooter, Checkbox } from '../ui'
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
    } catch {
      toast.error('提交失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="p-4 md:p-6 pb-2 md:pb-6">
        <CardTitle className="text-base md:text-lg">写下你的叙事</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-4 md:p-6 pt-2 md:pt-0">
        <Textarea
          value={narrative}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNarrative(e.target.value)}
          rows={8}
          placeholder="描述你在该情景下会采取的行动与想法..."
          className="min-h-[150px]"
        />
        <div className="flex flex-col md:flex-row md:justify-between md:items-center text-sm text-muted-foreground gap-2">
          <label className="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors">
            <Checkbox
              checked={isPublic}
              onCheckedChange={(checked) => setIsPublic(checked === true)}
            />
            允许公开我的回答
          </label>
          <span className="text-right">
            已输入 {countChars(narrative)} / 1000 字符
          </span>
        </div>
      </CardContent>
      <CardFooter className="p-4 md:p-6 pt-0 md:pt-0">
        <Button isLoading={loading} onClick={handleSubmit} className="w-full md:w-auto">
          提交叙事
        </Button>
      </CardFooter>
    </Card>
  )
}
