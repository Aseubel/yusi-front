import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Input, Textarea, toast, ConfirmDialog } from '../ui'
import { submitScenario, getMyScenarios, updateScenario, deleteScenario, resubmitScenario, getStatusText, getStatusColor, STATUS_PENDING, STATUS_MANUAL_APPROVED, STATUS_AI_APPROVED, type MyScenario } from '../../lib/room'
import { useRequireAuth } from '../../lib'
import { Info, X, CheckCircle, AlertCircle, PenTool, Users, Trash2, RefreshCw, Edit2 } from 'lucide-react'

interface ScenarioSubmitProps {
  isModalMode?: boolean
}

export const ScenarioSubmit = ({ isModalMode = false }: ScenarioSubmitProps) => {
  const { t } = useTranslation()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [myScenarios, setMyScenarios] = useState<MyScenario[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [editingScenario, setEditingScenario] = useState<MyScenario | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    scenarioId: string | null;
    isLoading: boolean;
  }>({ isOpen: false, scenarioId: null, isLoading: false })
  const { requireAuth } = useRequireAuth()

  const fetchMyScenarios = async () => {
    setLoadingHistory(true)
    try {
      const scenarios = await getMyScenarios()
      setMyScenarios(scenarios)
    } catch {
      toast.error(t('scenarioSubmit.loadFailed'))
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    if (isModalMode) {
      fetchMyScenarios()
    }
  }, [isModalMode, t])

  const handleSubmit = async () => {
    if (!requireAuth(t('scenarioSubmit.requireAuth'))) {
      return
    }
    if (!title || !description) {
      toast.error(t('scenarioSubmit.fillRequired'))
      return
    }
    setLoading(true)
    try {
      if (editingScenario) {
        await updateScenario(editingScenario.id, { title, description })
        toast.success(t('scenarioSubmit.editSuccess'))
        setEditingScenario(null)
      } else {
        await submitScenario({ title, description })
        toast.success(t('scenarioSubmit.submitSuccess'))
      }
      setTitle('')
      setDescription('')
      fetchMyScenarios()
    } catch {
      toast.error(t('scenarioSubmit.submitFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (scenario: MyScenario) => {
    setEditingScenario(scenario)
    setTitle(scenario.title)
    setDescription(scenario.description)
  }

  const handleDelete = async (id: string) => {
    setConfirmDialog({ isOpen: true, scenarioId: id, isLoading: false })
  }

  const confirmDelete = async () => {
    if (!confirmDialog.scenarioId) return
    setConfirmDialog(prev => ({ ...prev, isLoading: true }))
    try {
      await deleteScenario(confirmDialog.scenarioId)
      toast.success(t('scenarioSubmit.deleteSuccess'))
      fetchMyScenarios()
    } catch {
      toast.error(t('scenarioSubmit.deleteFailed'))
    } finally {
      setConfirmDialog({ isOpen: false, scenarioId: null, isLoading: false })
    }
  }

  const handleResubmit = async (id: string) => {
    try {
      await resubmitScenario(id)
      toast.success(t('scenarioSubmit.resubmitSuccess'))
      fetchMyScenarios()
    } catch {
      toast.error(t('scenarioSubmit.resubmitFailed'))
    }
  }

  const handleCancelEdit = () => {
    setEditingScenario(null)
    setTitle('')
    setDescription('')
  }

  if (isModalMode) {
    return (
      <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
        {loadingHistory ? (
          <div className="text-center py-12 text-muted-foreground">{t('scenarioSubmit.loading')}</div>
        ) : myScenarios.length === 0 ? (
          <div className="text-center py-12">
            <FileTextIcon className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground mb-4">{t('scenarioSubmit.noSubmissions')}</p>
            <p className="text-sm text-muted-foreground">{t('scenarioSubmit.createFirst')}</p>
          </div>
        ) : (
          <div className="space-y-4 mb-8">
            {myScenarios.map((scenario) => (
              <div
                key={scenario.id}
                className="p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold truncate">{scenario.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${getStatusColor(scenario.status)}`}>
                        {getStatusText(scenario.status)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{scenario.description}</p>
                    {scenario.rejectReason && (
                      <p className="text-sm text-destructive mt-2">
                        {t('scenarioSubmit.rejectReason')}{scenario.rejectReason}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {scenario.status !== STATUS_PENDING && scenario.status !== STATUS_MANUAL_APPROVED && scenario.status !== STATUS_AI_APPROVED && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleResubmit(scenario.id)}
                        title={t('scenarioSubmit.resubmit')}
                      >
                        <RefreshCw className="w-4 h-4 text-muted-foreground hover:text-primary" />
                      </Button>
                    )}
                    {scenario.status !== STATUS_PENDING && scenario.status !== STATUS_MANUAL_APPROVED && scenario.status !== STATUS_AI_APPROVED && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(scenario)}
                        title={t('scenarioSubmit.edit')}
                      >
                        <Edit2 className="w-4 h-4 text-muted-foreground hover:text-primary" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(scenario.id)}
                      title={t('scenarioSubmit.delete')}
                    >
                      <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-border pt-6">
          <h3 className="font-semibold mb-4">{t('scenarioSubmit.createNew')}</h3>
          {editingScenario && (
            <div className="flex items-center justify-between p-2 bg-amber-50 dark:bg-amber-950/20 rounded-lg text-sm text-amber-600 dark:text-amber-400 mb-4">
              <span>{t('scenarioSubmit.editing')}{editingScenario.title}</span>
              <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                {t('scenarioSubmit.cancel')}
              </Button>
            </div>
          )}
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">{t('scenarioSubmit.titleLabel')}</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('scenarioSubmit.titlePlaceholder')}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t('scenarioSubmit.descriptionLabel')}</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('scenarioSubmit.descriptionPlaceholder')}
                className="min-h-[100px]"
              />
            </div>
            <Button
              isLoading={loading}
              onClick={handleSubmit}
              className="w-full"
              disabled={isModalMode}
            >
              {editingScenario ? t('scenarioSubmit.saveChanges') : t('scenarioSubmit.submitReview')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {t('scenarioSubmit.submitScenario')}
                <button
                  onClick={() => setShowGuide(true)}
                  className="p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
                  title={t('scenarioSubmit.viewGuide')}
                >
                  <Info className="w-4 h-4" />
                </button>
              </CardTitle>
              <CardDescription>{t('scenarioSubmit.description')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 flex-1">
          {editingScenario && (
            <div className="flex items-center justify-between p-2 bg-amber-50 dark:bg-amber-950/20 rounded-lg text-sm text-amber-600 dark:text-amber-400">
              <span>{t('scenarioSubmit.editing')}{editingScenario.title}</span>
              <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                {t('scenarioSubmit.cancel')}
              </Button>
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('scenarioSubmit.titleLabel')}</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('scenarioSubmit.titlePlaceholder')} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('scenarioSubmit.descriptionLabel')}</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('scenarioSubmit.descriptionPlaceholder')}
              className="min-h-[100px]"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button isLoading={loading} onClick={handleSubmit} className="w-full">
            {editingScenario ? t('scenarioSubmit.saveChanges') : t('scenarioSubmit.submitReview')}
          </Button>
        </CardFooter>
      </Card>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="bg-card w-full max-w-lg border border-border rounded-2xl shadow-xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  <PenTool className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold">{t('scenarioSubmit.guide.title')}</h2>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="p-1.5 hover:bg-muted rounded-md transition-colors"
                title={t('scenarioSubmit.guide.close')}
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-primary flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {t('scenarioSubmit.guide.goodScenario')}
                </h3>
                <ul className="text-sm text-muted-foreground space-y-2 pl-6">
                  <li>• {t('scenarioSubmit.guide.goodScenarioPoints[0]')}</li>
                  <li>• {t('scenarioSubmit.guide.goodScenarioPoints[1]')}</li>
                  <li>• {t('scenarioSubmit.guide.goodScenarioPoints[2]')}</li>
                  <li>• {t('scenarioSubmit.guide.goodScenarioPoints[3]')}</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-destructive flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {t('scenarioSubmit.guide.notes')}
                </h3>
                <ul className="text-sm text-muted-foreground space-y-2 pl-6">
                  <li>• {t('scenarioSubmit.guide.notesPoints[0]')}</li>
                  <li>• {t('scenarioSubmit.guide.notesPoints[1]')}</li>
                  <li>• {t('scenarioSubmit.guide.notesPoints[2]')}</li>
                  <li>• {t('scenarioSubmit.guide.notesPoints[3]')}</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-blue-500 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {t('scenarioSubmit.guide.examples')}
                </h3>
                <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3 space-y-1">
                  <p className="font-medium text-foreground">{t('scenarioSubmit.guide.exampleTitle')}</p>
                  <p>{t('scenarioSubmit.guide.exampleContent')}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end p-6 border-t border-border">
              <Button onClick={() => setShowGuide(false)}>
                {t('scenarioSubmit.guide.gotIt')}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={t('scenarioSubmit.confirmDelete.title')}
        description={t('scenarioSubmit.confirmDelete.description')}
        variant="danger"
        cancelText={t('common.cancel')}
        confirmText={t('scenarioSubmit.confirmDelete.confirm')}
        isLoading={confirmDialog.isLoading}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDialog({ isOpen: false, scenarioId: null, isLoading: false })}
      />
    </>
  )
}

function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  )
}
