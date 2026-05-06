import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { api } from '@/composables/useApi'

describe('useApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('configure sends POST with correct body', async () => {
    const srcKcfg = 'apiVersion: v1\nkind: Config\nclusters:\n- name: src'
    const tgtKcfg = 'apiVersion: v1\nkind: Config\nclusters:\n- name: tgt'

    const mock = vi.fn()
    mock.mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue(JSON.stringify({ source: {}, target: {}, sourceServer: '', targetServer: '' })),
    })
    globalThis.fetch = mock

    await api.configure(srcKcfg, tgtKcfg, false)

    expect(mock).toHaveBeenCalledTimes(1)
    const [url, opts] = mock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/config')
    expect(opts.method).toBe('POST')
    expect(opts.headers).toEqual({ 'Content-Type': 'application/json' })
    const body = JSON.parse(opts.body as string)
    expect(body.sourceKubeconfig).toBe(srcKcfg)
    expect(body.targetKubeconfig).toBe(tgtKcfg)
    expect(body.insecureSkipVerify).toBe(false)
  })

  it('configure sends insecureSkipVerify when true', async () => {
    const srcKcfg = 'apiVersion: v1\nkind: Config\nclusters:\n- name: src'
    const tgtKcfg = 'apiVersion: v1\nkind: Config\nclusters:\n- name: tgt'

    const mock = vi.fn()
    mock.mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue(JSON.stringify({ source: {}, target: {}, sourceServer: '', targetServer: '' })),
    })
    globalThis.fetch = mock

    await api.configure(srcKcfg, tgtKcfg, true)

    const body = JSON.parse((mock.mock.calls[0][1] as RequestInit).body as string)
    expect(body.insecureSkipVerify).toBe(true)
  })

  it('throws error on non-ok response with JSON error body', async () => {
    const mock = vi.fn()
    mock.mockResolvedValue({
      ok: false,
      status: 400,
      text: vi.fn().mockResolvedValue(JSON.stringify({ error: 'bad kubeconfig' })),
    })
    globalThis.fetch = mock

    await expect(api.configure('{}', '{}')).rejects.toThrow('bad kubeconfig')
  })

  it('throws network error message when fetch rejects', async () => {
    const mock = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'))
    globalThis.fetch = mock

    await expect(api.getResources()).rejects.toThrow('Network error')
  })

  it('throws empty response error when body is empty', async () => {
    const mock = vi.fn()
    mock.mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue(''),
    })
    globalThis.fetch = mock

    await expect(api.getResources()).rejects.toThrow('Empty response')
  })

  it('getResources sends GET to /api/resources', async () => {
    const mock = vi.fn()
    mock.mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue(JSON.stringify([])),
    })
    globalThis.fetch = mock

    await api.getResources()
    expect(mock).toHaveBeenCalledWith('/api/resources', { method: 'GET', headers: undefined, body: undefined })
  })

  it('startMigration sends plan in body', async () => {
    const mock = vi.fn()
    mock.mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue(JSON.stringify({ id: '123', status: 'pending' })),
    })
    globalThis.fetch = mock

    const plan = { resources: [], defaultConflict: 'skip' }
    await api.startMigration(plan)
    expect(mock).toHaveBeenCalledWith('/api/migrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
  })

  it('cancelJob sends DELETE', async () => {
    const mock = vi.fn()
    mock.mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue(JSON.stringify({ status: 'cancelled' })),
    })
    globalThis.fetch = mock

    await api.cancelJob('job-123')
    expect(mock).toHaveBeenCalledWith(
      '/api/migrate/job-123',
      { method: 'DELETE', headers: undefined, body: undefined },
    )
  })
})
