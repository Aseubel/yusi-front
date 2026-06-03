import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { soulReportApi, type SoulReport } from '../lib/api'
import { Button } from '../components/ui'

/** Simple inline Markdown renderer — handles H1-H3, **bold**, *italic*, - lists, paragraphs */
function renderMarkdown(text: string): string {
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // headings
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-6 mb-2 text-foreground">$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mt-8 mb-3 text-foreground">$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-8 mb-4 text-foreground">$1</h1>')

  // bold / italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // unordered list items
  html = html.replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-muted-foreground">$1</li>')

  // paragraphs (double newlines)
  html = html.replace(/\n\n+/g, '</p><p class="mb-4 leading-relaxed text-muted-foreground">')

  return '<p class="mb-4 leading-relaxed text-muted-foreground">' + html + '</p>'
}

export default function SoulReportPage() {
  const { t } = useTranslation()
  const [report, setReport] = useState<SoulReport | null>(null)
  const [history, setHistory] = useState<SoulReport[]>([])
  const [loading, setLoading] = useState(true)
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    loadLatest()
  }, [])

  const loadLatest = async () => {
    setLoading(true)
    try {
      const res = await soulReportApi.getLatest()
      setReport(res.data.data ?? null)
      setShowHistory(false)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const loadHistory = async () => {
    try {
      const res = await soulReportApi.getHistory(0, 20)
      setHistory(res.data.data ?? [])
      setShowHistory(true)
    } catch {
      // ignore
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!report) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <div className="text-6xl">🌙</div>
        <h2 className="text-xl font-semibold">{t('soulReport.emptyTitle')}</h2>
        <p className="text-muted-foreground text-center max-w-md">{t('soulReport.emptyHint')}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen max-w-2xl mx-auto px-4 py-8">
      {/* header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <span className="text-sm text-muted-foreground">
            {t('soulReport.period', {
              start: report.periodStart,
              end: report.periodEnd,
            })}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => (showHistory ? loadLatest() : loadHistory())}>
          {showHistory ? t('soulReport.backToLatest') : t('soulReport.viewHistory')}
        </Button>
      </div>

      {/* report content */}
      {showHistory ? (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">{t('soulReport.historyTitle')}</h2>
          {history.length === 0 ? (
            <p className="text-muted-foreground">{t('soulReport.noHistory')}</p>
          ) : (
            history.map((r) => (
              <div key={r.id} className="p-4 rounded-lg border bg-card">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{r.title}</h3>
                  <span className="text-xs text-muted-foreground">
                    {r.periodStart} ~ {r.periodEnd}
                  </span>
                </div>
                <div
                  className="prose prose-sm dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(r.content) }}
                />
              </div>
            ))
          )}
        </div>
      ) : (
        <div
          className="prose dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(report.content) }}
        />
      )}
    </div>
  )
}
