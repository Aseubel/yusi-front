import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { soulReportApi, type SoulReport } from '../lib/api'
import { Button } from '../components/ui'
import { useNavigate } from 'react-router-dom'
import { Handshake, Moon, PenLine, Sparkles, Sprout } from 'lucide-react'

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

export default function SoulReportPage({ embedded = false }: { embedded?: boolean }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [report, setReport] = useState<SoulReport | null>(null)
  const [history, setHistory] = useState<SoulReport[]>([])
  const [loading, setLoading] = useState(true)
  const [showHistory, setShowHistory] = useState(false)

  const loadLatest = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadLatest()
    }, 0)
    return () => clearTimeout(timer)
  }, [loadLatest])

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
      <div className={embedded ? 'flex h-64 items-center justify-center' : 'min-h-screen flex items-center justify-center'}>
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!report) {
    return (
      <div className={embedded ? 'flex min-h-[20rem] flex-col items-center justify-center gap-4 px-4' : 'flex min-h-[60dvh] flex-col items-center justify-center gap-4 px-4'}>
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Moon className="h-8 w-8" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-semibold">{t('soulReport.emptyTitle')}</h2>
        <p className="text-muted-foreground text-center max-w-md">{t('soulReport.emptyHint')}</p>
      </div>
    )
  }

  return (
    <div className={embedded ? 'mx-auto max-w-3xl px-3 py-2 sm:px-0' : 'mx-auto min-h-screen max-w-2xl px-3 py-6 sm:px-4 sm:py-8'}>
      {/* header */}
      <div className="mb-6 flex flex-col items-start gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-sm text-muted-foreground">
            {t('soulReport.period', {
              start: report.periodStart,
              end: report.periodEnd,
            })}
          </span>
        </div>
        <Button variant="ghost" size="sm" className="w-full sm:w-auto" onClick={() => (showHistory ? loadLatest() : loadHistory())}>
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
              <div key={r.id} className="rounded-xl border bg-card p-4 sm:p-5">
                <div className="mb-3 flex flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="break-words font-semibold">{r.title}</h3>
                  <span className="text-xs text-muted-foreground sm:text-right">
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
        <>
          <div
            className="prose prose-sm max-w-none break-words dark:prose-invert sm:prose"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(report.content) }}
          />

          {/* Action Cards Section */}
          <div className="mt-10 border-t border-border/40 pt-6 sm:mt-12 sm:pt-8">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
              {t('soulReport.suggestedActions')}
            </h3>
            <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
              <button
                type="button"
                onClick={() => navigate('/agent-growth')}
                className="group min-h-28 rounded-2xl border border-border/50 bg-card p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:p-5"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Sprout className="h-6 w-6 text-primary transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
                  <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {t('soulReport.actions.growth.title')}
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t('soulReport.actions.growth.desc')}
                </p>
              </button>

              <button
                type="button"
                onClick={() => navigate('/match')}
                className="group min-h-28 rounded-2xl border border-border/50 bg-card p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:p-5"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Handshake className="h-6 w-6 text-primary transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
                  <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {t('soulReport.actions.match.title')}
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t('soulReport.actions.match.desc')}
                </p>
              </button>

              <button
                type="button"
                onClick={() => navigate('/diary')}
                className="group min-h-28 rounded-2xl border border-border/50 bg-card p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:p-5"
              >
                <div className="flex items-center gap-3 mb-2">
                  <PenLine className="h-6 w-6 text-primary transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
                  <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {t('soulReport.actions.diary.title')}
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t('soulReport.actions.diary.desc')}
                </p>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
