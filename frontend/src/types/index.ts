export type ConflictStrategy = 'skip' | 'overwrite' | 'rename'

export type ResourceKind =
  | 'Namespace' | 'ServiceAccount' | 'Role' | 'RoleBinding'
  | 'ClusterRole' | 'ClusterRoleBinding' | 'ConfigMap' | 'Secret'
  | 'PersistentVolume' | 'PersistentVolumeClaim'
  | 'Deployment' | 'StatefulSet' | 'DaemonSet' | 'Job' | 'CronJob'
  | 'Service' | 'Ingress' | 'NetworkPolicy'
  | 'CustomResourceDefinition' | 'CustomResource' | 'HelmRelease'

export interface DiscoveredResource {
  kind: ResourceKind
  name: string
  namespace: string
  apiVersion: string
  raw: string
  labels: Record<string, string>
  annotations: Record<string, string>
}

export interface ResourceSelection {
  kind: ResourceKind
  name: string
  namespace: string
  targetNamespace?: string
  conflict: ConflictStrategy
}

export interface MigrationPlan {
  resources: ResourceSelection[]
  defaultConflict: ConflictStrategy
  imageRegistryRewrite?: Record<string, string>
}

export interface ClusterInfo {
  name: string
  version: string
  nodeCount: number
}

export interface MigrationProgress {
  total: number
  completed: number
  success: number
  skipped: number
  failed: number
}

export interface ResourceResult {
  kind: ResourceKind
  name: string
  namespace: string
  status: string
  message: string
}

export interface MigrationJob {
  id: string
  status: string
  plan: MigrationPlan
  createdAt: string
  results: ResourceResult[]
  progress: MigrationProgress
}

export interface WSEvent {
  event: string
  resource: string
  namespace: string
  kind: ResourceKind
  status: string
  message: string
  progress: MigrationProgress | null
  timestamp: string
}

export interface APIError {
  error: string
  detail: string
}

export interface ResourceGroupSummary {
  name: string
  resourceCount: number
  kindBreakdown: Record<string, number>
}

export type DependencyType =
  | 'volume' | 'configmap' | 'secret' | 'serviceAccount' | 'service'
  | 'ingress' | 'crd' | 'storageClass' | 'ingressClass' | 'hpa' | 'pdb'
  | 'networkPolicy' | 'imagePullSecret' | 'rbac' | 'tlsSecret'

export interface Dependency {
  resourceKind: ResourceKind
  name: string
  namespace: string
  type: DependencyType
  required: boolean
  description: string
  migratable: boolean
  confidence?: 'high' | 'medium' | 'low'
}

export interface Bundle {
  id: string
  name: string
  primaryResource: string
  primaryKind: ResourceKind
  namespace: string
  resources: ResourceSelection[]
  dependencies: Dependency[]
  externalDependencies: Dependency[]
  warnings: string[]
  status: string
  reasoning?: string
  confidenceBreakdown?: { high: number; medium: number; low: number }
}

export interface BundleAnalysis {
  bundles: Bundle[]
  missingDependencies: Dependency[]
  warnings: string[]
}

export interface DiffResult {
  source: DiscoveredResource[]
  target: DiscoveredResource[]
  onlySource: DiscoveredResource[]
  onlyTarget: DiscoveredResource[]
  drift: DiscoveredResource[]
  match: DiscoveredResource[]
  bundleMap: Record<string, string>
}

export interface DiffSummary {
  sourceOnlyCount: number
  targetOnlyCount: number
  driftCount: number
  matchCount: number
  sourceTotal: number
  targetTotal: number
}

export interface MigrationHistoryItem {
  id: string
  startedAt: string
  sourceCluster: string
  targetCluster: string
  status: string
  bundleCount: number
  resourceCount: number
  successRate: number
  duration: string
}

export interface PreflightCheck {
  check: string
  status: 'pass' | 'warn' | 'fail'
  message: string
  bundleId: string
}

export interface BundleMigrationRequest {
  bundleIds: string[]
  defaultConflict?: ConflictStrategy
  namespaceRemap?: Record<string, string>
  registryRewrite?: Record<string, string>
}

export interface DiffResource extends DiscoveredResource {
  _selected: boolean
  diffStatus?: 'sourceOnly' | 'targetOnly' | 'drift' | 'match'
  bundleBundle?: string
}

export interface OllamaStatus {
  mode: 'local' | 'cloud'
  baseUrl: string
  model: string
  connected: boolean
  error?: string
  modelsAvailable: string[]
}

export interface BundleAnalysisProgress {
  jobId: string
  phase: string
  detail: string
  pct: number
  status: 'running' | 'completed' | 'failed'
  bundleCount?: number
  ungroupedCount?: number
  warningCount?: number
}

export interface BundleFeedback {
  bundleName: string
  action: 'merge' | 'split' | 'add_resource' | 'remove_resource'
  details: Record<string, any>
}
