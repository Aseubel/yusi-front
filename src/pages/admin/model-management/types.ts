import type {
  ModelGovernanceSnapshot,
  ModelMetricSummary,
  ModelRoutePreview,
  ModelRuntimeState,
} from '../../../lib/api'
import type { GovernanceDraft, ModelDraft, RouteDraft, TierDraft } from '../../../lib/modelRouting'

export type ModelGovernanceTab = 'overview' | 'models' | 'routes' | 'activity'
export interface ModelGovernanceState {
  snapshot: ModelGovernanceSnapshot
  draft: GovernanceDraft
  runtimeStates: ModelRuntimeState[]
  metrics: ModelMetricSummary
}

export interface ModelEditorProps {
  model: ModelDraft
  tiers: TierDraft[]
  onSave: (model: ModelDraft) => void
  onCancel: () => void
}

export interface RouteEditorProps {
  route: RouteDraft
  tiers: TierDraft[]
  models: ModelDraft[]
  onChange: (route: RouteDraft) => void
  onPreview: (route: RouteDraft) => void
}

export interface RoutePreviewProps {
  preview: ModelRoutePreview | null
  loading: boolean
  stale: boolean
}
