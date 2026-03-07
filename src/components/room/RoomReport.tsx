import type { PersonalSketch, PairCompatibility } from '../../lib'
import * as Tabs from '@radix-ui/react-tabs'
import { Card, CardHeader, CardTitle, CardContent, Badge } from '../ui'
import { useTranslation } from 'react-i18next'

export const RoomReport = ({ 
  personal, 
  pairs,
  publicSubmissions,
  memberNames,
  scenario
}: { 
  personal: PersonalSketch[]; 
  pairs: PairCompatibility[];
  publicSubmissions?: { userId: string; content: string }[];
  memberNames?: Record<string, string>;
  scenario?: { title: string; description: string };
}) => {
  const { t } = useTranslation()

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t('roomReport.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs.Root defaultValue="personal" className="w-full">
          <Tabs.List className="flex w-full rounded-lg bg-secondary p-1 text-muted-foreground mb-6 overflow-x-auto">
            <Tabs.Trigger 
              value="scenario" 
              className="flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              {t('roomReport.originalScenario')}
            </Tabs.Trigger>
            <Tabs.Trigger 
              value="personal" 
              className="flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              {t('roomReport.personalSketch')}
            </Tabs.Trigger>
            <Tabs.Trigger 
              value="pairs" 
              className="flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              {t('roomReport.compatibilityMatrix')}
            </Tabs.Trigger>
            <Tabs.Trigger 
              value="public" 
              className="flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              {t('roomReport.publicAnswers')}
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="scenario" className="space-y-4">
            <div className="rounded-lg border p-4 bg-muted/50">
                <h3 className="font-semibold text-lg mb-2">{scenario?.title || t('roomReport.unknownScenario')}</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{scenario?.description || t('roomReport.noContent')}</p>
            </div>
          </Tabs.Content>

          <Tabs.Content value="personal" className="space-y-4">
            {personal.map((p) => (
              <div key={p.userId} className="flex flex-col gap-2 rounded-lg border p-4 bg-muted/50">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{memberNames?.[p.userId] || p.userId}</Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.sketch}</p>
              </div>
            ))}
          </Tabs.Content>

          <Tabs.Content value="pairs" className="space-y-4">
            {pairs.map((pair) => (
              <div key={`${pair.userA}-${pair.userB}`} className="space-y-2 rounded-lg border p-4 bg-muted/50">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">
                    {memberNames?.[pair.userA] || pair.userA} 
                    <span className="text-muted-foreground mx-1">↔</span> 
                    {memberNames?.[pair.userB] || pair.userB}
                  </span>
                  <Badge variant="outline" className="font-mono">{pair.score} {t('roomReport.score')}</Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{pair.reason}</p>
              </div>
            ))}
          </Tabs.Content>

          <Tabs.Content value="public" className="space-y-4">
            {!publicSubmissions || publicSubmissions.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                    {t('roomReport.noPublicAnswers')}
                </div>
            ) : (
                publicSubmissions.map((s) => (
                    <div key={s.userId} className="flex flex-col gap-2 rounded-lg border p-4 bg-muted/50">
                        <div className="flex items-center gap-2">
                        <Badge variant="outline">{memberNames?.[s.userId] || s.userId}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{s.content}</p>
                    </div>
                ))
            )}
          </Tabs.Content>
        </Tabs.Root>
      </CardContent>
    </Card>
  )
}
