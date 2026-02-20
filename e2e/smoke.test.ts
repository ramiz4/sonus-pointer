import { test, expect } from '@playwright/test'

test('app loads and shows canvas', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('[data-testid="canvas"]')).toBeVisible()
  await expect(page.locator('h1')).toContainText('sonus-pointer')
})
