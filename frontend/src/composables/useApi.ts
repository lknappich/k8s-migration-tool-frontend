import type {
  ClusterInfo, DiscoveredResource, ResourceGroupSummary, BundleAnalysis, Bundle,
  PreflightCheck, ResourceSelection, BundleMigrationRequest,
  OllamaStatus, BundleAnalysisProgress, BundleFeedback,
} from '@/types'

const BASE = '/api'

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new Error('Network error — backend may be down. Start the backend server first.')
  }

  const text = await res.text()
  if (!res.ok) {
    try {
      const err = JSON.parse(text)
      throw new Error(err.error || err.detail || `Server error (${res.status})`)
    } catch (e: unknown) {
      const errMsg = (e as { message?: string }).message || ''
      if (errMsg && !errMsg.includes('JSON')) throw e
      throw new Error(`Server error: ${res.status} ${res.statusText}. ${text.slice(0, 200)}`)
    }
  }

  if (!text) {
    throw new Error('Empty response from server — backend may have crashed.')
  }

  return JSON.parse(text) as T
}

export const api = {
  configure(sourceKubeconfig: string, targetKubeconfig: string, insecureSkipVerify: boolean = false): Promise<{ source: ClusterInfo; target: ClusterInfo; sourceServer: string; targetServer: string }> {
    return request<{ source: ClusterInfo; target: ClusterInfo; sourceServer: string; targetServer: string }>(
      'POST', '/config', { sourceKubeconfig, targetKubeconfig, insecureSkipVerify }
    )
  },
  getResources() {
    return request<DiscoveredResource[]>('GET', '/resources')
  },
  startMigration(plan: unknown) {
    return request<{ id: string; status: string }>('POST', '/migrate', { plan })
  },
  getJob(id: string) {
    return request<unknown>('GET', `/migrate/${id}`)
  },
  cancelJob(id: string) {
    return request<unknown>('DELETE', `/migrate/${id}`)
  },
  getGroups(): Promise<ResourceGroupSummary[]> {
    return request<ResourceGroupSummary[]>('GET', '/groups')
  },
  getReport(id: string, format: string = 'json') {
    return fetch(`${BASE}/migrate/${id}/report?format=${format}`).then(r => {
      if (format === 'yaml') return r.text()
      return r.json()
    })
  },
  getBundles(selections: ResourceSelection[]): Promise<BundleAnalysis> {
    return request<BundleAnalysis>('POST', '/bundles/resolve', { resources: selections })
  },
  resolveBundles(selections: ResourceSelection[]): Promise<BundleAnalysis> {
    return request<BundleAnalysis>('POST', '/bundles/resolve', { resources: selections })
  },
  getBundle(id: string): Promise<Bundle> {
    return request<Bundle>('GET', `/bundles/${id}`)
  },
  migrateBundles(req: BundleMigrationRequest): Promise<{ id: string; status: string }> {
    return request<{ id: string; status: string }>('POST', '/migrate/bundles', req)
  },
  preflightCheck(): Promise<PreflightCheck[]> {
    return request<PreflightCheck[]>('GET', '/preflight')
  },
  getDiff(): Promise<{ diff: unknown; summary: unknown }> {
    return request<{ diff: unknown; summary: unknown }>('GET', '/diff')
  },
  getMigrationHistory(): Promise<unknown[]> {
    return request<unknown[]>('GET', '/migrate')
  },
  getOllamaStatus(): Promise<OllamaStatus> {
    return request<OllamaStatus>('GET', '/ai/ollama/status')
  },
  getOllamaModels(): Promise<string[]> {
    return request<string[]>('GET', '/ai/ollama/models')
  },
  startBundleAnalysis(config?: { batchSize?: number; model?: string; namespaceFilter?: string[] }): Promise<{ jobId: string }> {
    return request<{ jobId: string }>('POST', '/ai/bundles/analyze', config || {})
  },
  getBundleAnalysisStatus(jobId: string): Promise<BundleAnalysisProgress> {
    return request<BundleAnalysisProgress>('GET', `/ai/bundles/analyze/${jobId}`)
  },
  getBundleResult(jobId: string): Promise<BundleAnalysis> {
    return request<BundleAnalysis>('GET', `/ai/bundles/result/${jobId}`)
  },
  reanalyzeBundle(bundleName: string): Promise<{ jobId: string }> {
    return request<{ jobId: string }>('POST', `/ai/bundles/reanalyze/${encodeURIComponent(bundleName)}`)
  },
  sendBundleFeedback(feedback: BundleFeedback): Promise<void> {
    return request<void>('POST', '/ai/bundles/feedback', feedback)
  },
}
