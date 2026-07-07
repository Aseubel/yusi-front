import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { soulReportApi, type SoulReport } from '../lib/api'
import { Button } from '../components/ui'
import { useNavigate } from 'react-router-dom'

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
  const navigate = useNavigate()
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
        <>
          <div
            className="prose dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(report.content) }}
          />

          {/* Action Cards Section */}
          <div className="mt-12 pt-8 border-t border-border/40">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              ✨ {t('soulReport.suggestedActions')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {false && <button
                onClick={() => {}} // deleted
                className="group p-5 rounded-2xl border border-border/50 bg-card hover:border-primary/40 hover:bg-primary/5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl group-hover:scale-110 transition-transform duration-300">📈</span>
                  <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {t('soulReport.actions.emotion.title')}
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t('soulReport.actions.emotion.desc')}
                </p>
              </button>}

              <button
                onClick={() => navigate('/agent-growth')}
                className="group p-5 rounded-2xl border border-border/50 bg-card hover:border-primary/40 hover:bg-primary/5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl group-hover:scale-110 transition-transform duration-300">🌱</span>
                  <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {t('soulReport.actions.growth.title')}
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t('soulReport.actions.growth.desc')}
                </p>
              </button>

              <button
                onClick={() => navigate('/match')}
                className="group p-5 rounded-2xl border border-border/50 bg-card hover:border-primary/40 hover:bg-primary/5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl group-hover:scale-110 transition-transform duration-300">🤝</span>
                  <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {t('soulReport.actions.match.title')}
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t('soulReport.actions.match.desc')}
                </p>
              </button>

              <button
                onClick={() => navigate('/diary')}
                className="group p-5 rounded-2xl border border-border/50 bg-card hover:border-primary/40 hover:bg-primary/5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl group-hover:scale-110 transition-transform duration-300">✍️</span>
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
