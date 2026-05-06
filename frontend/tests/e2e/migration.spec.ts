import { test, expect } from '@playwright/test'

test.describe('K8s Migration Tool E2E', () => {

  test('full migration flow — connect, discover, migrate, report', async ({ page }) => {
    await page.goto('http://localhost:5173')

    // Step 1: Dashboard loads with setup prompt
    await expect(page.locator('text=Connect your clusters to begin')).toBeVisible({ timeout: 10000 })

    // Step 2: Navigate to Setup
    await page.click('text=Setup')
    await expect(page.locator('text=Cluster Setup')).toBeVisible()

    // Step 3: Skip TLS verification
    const tlsCheckboxes = page.locator('text=Skip TLS')
    if (await tlsCheckboxes.count() > 0) {
      await tlsCheckboxes.first().click()
    }

    // Step 4: Paste source kubeconfig
    const sourceArea = page.locator('textarea').first()
    await sourceArea.fill('PLACEHOLDER_SOURCE_KUBECONFIG')

    // Step 5: Paste target kubeconfig
    const targetArea = page.locator('textarea').nth(1)
    await targetArea.fill('PLACEHOLDER_TARGET_KUBECONFIG')

    // Step 6: Click Connect
    await page.click('text=Connect & Discover')

    // Step 7: Wait for dashboard
    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 15000 })
    await expect(page.locator('text=Ready to Migrate')).toBeVisible({ timeout: 5000 })

    // Step 8: Navigate to Resources
    await page.click('text=Resources')
    await expect(page.locator('text=Resource Explorer')).toBeVisible({ timeout: 10000 })

    // Step 9: Select All and review
    await page.click('text=Select All')
    await page.click('text=Review Migration Plan')

    // Step 10: Start migration
    await page.click('text=Start Migration')
    await expect(page.locator('text=Migration Progress')).toBeVisible({ timeout: 5000 })

    // Step 11: Wait for completion
    await expect(page.locator('text=View Report')).toBeVisible({ timeout: 60000 })

    // Step 12: View report
    await page.click('text=View Report')
    await expect(page.locator('text=Migration Report')).toBeVisible({ timeout: 5000 })
  })
})
