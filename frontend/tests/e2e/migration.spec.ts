import { test, expect } from '@playwright/test'

test.describe('K8s Migration Tool — Smoke Tests', () => {
  test('dashboard loads with setup prompt', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=Connect your clusters to begin')).toBeVisible({ timeout: 10000 })
  })

  test('setup page has kubeconfig inputs', async ({ page }) => {
    await page.goto('/setup')
    await expect(page.locator('text=Cluster Setup')).toBeVisible()
    await expect(page.locator('textarea').first()).toBeVisible()
  })

  test('resources page shows empty state when not configured', async ({ page }) => {
    await page.goto('/resources')
    await expect(page.locator('text=clusters not configured')).toBeVisible({ timeout: 5000 })
  })

  test('settings page shows AI configuration', async ({ page }) => {
    await page.goto('/settings')
    await expect(page.locator('text=AI Bundle Analysis')).toBeVisible({ timeout: 5000 })
  })

  test('history page shows empty state', async ({ page }) => {
    await page.goto('/history')
    await expect(page.locator('text=No migrations yet')).toBeVisible({ timeout: 5000 })
  })
})
