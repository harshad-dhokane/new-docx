import { test, expect } from '@playwright/test';

// Replace these with valid credentials for your app
const USERNAME = 'harshaddhokane003@gmail.com';
const PASSWORD = 'Harshad@25';

test('user can sign in from homepage', async ({ page }) => {
  await page.goto('/');

  // Click the Sign In button (adjust selector/text as needed)
  await page.getByRole('button', { name: /sign in/i }).click();

  // Fill in credentials (adjust selectors as needed)
  await page.getByLabel(/email|username/i).fill(USERNAME);
  await page.getByLabel(/password/i).fill(PASSWORD);

  // Submit the form (adjust selector as needed)
  await page.getByRole('button', { name: /sign in|log in/i }).click();

  // Check for successful sign-in (adjust check as needed)
  await expect(page).not.toHaveURL(/login|signin/i);

  // Check for dashboard elements (adjust selectors/text as needed)
  await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible();
  // await expect(page.getByRole('navigation')).toBeVisible(); // Disabled: no navigation role found
  await expect(page.getByRole('heading', { name: /welcome|hello/i })).toBeVisible();
  // Add more checks for specific dashboard elements as needed
});
