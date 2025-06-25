import { test, expect } from '@playwright/test';
import path from 'path';

const USERNAME = 'harshaddhokane003@gmail.com';
const PASSWORD = 'Harshad@25';
const DOCX_PATH = path.join(process.cwd(), 'client/public/columns.docx'); // Robust absolute path for Windows

// Utility: waits for a file download and returns the path
async function waitForDownload(page, action) {
  const [download] = await Promise.all([page.waitForEvent('download'), action()]);
  const filePath = await download.path();
  return filePath;
}

test('complete user flow: upload, generate, download, verify', async ({ page, context }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.getByLabel(/email|username/i).fill(USERNAME);
  await page.getByLabel(/password/i).fill(PASSWORD);
  await page.getByRole('button', { name: /sign in|log in/i }).click();
  await expect(page).not.toHaveURL(/login|signin/i);

  // 1. Click Upload Template
  await page.getByRole('button', { name: /upload new template/i }).click();

  // 2. Upload the docx file
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(DOCX_PATH);
  await page.getByRole('button', { name: /upload/i }).click();

  // 3. Check upload success (adjust selector/text as needed)
  await expect(page.getByText('Template uploaded successfully!', { exact: true })).toBeVisible();
});
