import { test, expect } from '@playwright/test';

const USERNAME = 'harshaddhokane003@gmail.com';
const PASSWORD = 'Harshad@25';

test('visit templates page, click top template, and generate', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.getByLabel(/email|username/i).fill(USERNAME);
  await page.getByLabel(/password/i).fill(PASSWORD);
  await page.getByRole('button', { name: /sign in|log in/i }).click();
  await expect(page).not.toHaveURL(/login|signin/i);

  // Go directly to templates page
  await page.goto('/templates');

  // Wait for at least one template card to be visible
  const firstTemplateName = page.locator('span.truncate.text-gray-800').first();
  await expect(firstTemplateName).toBeVisible();

  // Click the first visible Generate button (top template)
  const firstGenerateButton = page.getByRole('button', { name: /generate/i }).first();
  await firstGenerateButton.click();

  // Optionally, check that the generate page loads
  await expect(page).toHaveURL(/\/templates\/.+\/generate/);
});
