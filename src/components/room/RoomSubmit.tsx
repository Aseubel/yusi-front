import { Button, Textarea, toast, Card, CardHeader, CardTitle, CardContent, CardFooter, Checkbox } from '../ui'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { submitNarrative } from '../../lib'
import { countChars } from '../../utils'

export const RoomSubmit = ({ code, userId }: { code: string; userId: string }) => {
  const { t } = useTranslation()
  const [narrative, setNarrative] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!narrative.trim()) {
      toast.error(t('roomSubmit.inputRequired'))
      return
    }
    if (countChars(narrative) > 1000) {
      toast.error(t('roomSubmit.tooLong'))
      return
    }
    setLoading(true)
    try {
      await submitNarrative({ code, userId, narrative, isPublic })
      toast.success(t('roomSubmit.submitSuccess'))
      window.location.reload()
    } catch {
      toast.error(t('roomSubmit.submitFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="p-4 md:p-6 pb-2 md:pb-6">
        <CardTitle className="text-base md:text-lg">{t('roomSubmit.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-4 md:p-6 pt-2 md:pt-0">
        <Textarea
          value={narrative}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNarrative(e.target.value)}
          rows={8}
          placeholder={t('roomSubmit.placeholder')}
          className="min-h-[150px]"
        />
        <div className="flex flex-col md:flex-row md:justify-between md:items-center text-sm text-muted-foreground gap-2">
          <label className="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors">
            <Checkbox
              checked={isPublic}
              onCheckedChange={(checked) => setIsPublic(checked === true)}
            />
            {t('roomSubmit.allowPublic')}
          </label>
          <span className="text-right">
            {t('roomSubmit.charCount', { count: countChars(narrative) })}
          </span>
        </div>
      </CardContent>
      <CardFooter className="p-4 md:p-6 pt-0 md:pt-0">
        <Button isLoading={loading} onClick={handleSubmit} className="w-full md:w-auto">
          {t('roomSubmit.submitNarrative')}
        </Button>
      </CardFooter>
    </Card>
  )
}
