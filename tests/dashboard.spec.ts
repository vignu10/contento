import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/');
    const timestamp = Date.now();
    const email = `test-${timestamp}@example.com`;
    
    await page.click('text=Sign Up');
    await page.getByLabel('Name').fill('Test User');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('testpass123');
    await page.click('button:has-text("Create Account")');
    
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
  });

  test('should display dashboard elements', async ({ page }) => {
    // Header
    await expect(page.getByText('Contento')).toBeVisible();
    await expect(page.getByText('Transform Your Content')).toBeVisible();
    
    // Process section
    await expect(page.getByText('Process New Content')).toBeVisible();
    await expect(page.getByRole('tab', { name: /youtube/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /upload/i })).toBeVisible();
    
    // Content section
    await expect(page.getByText('Your Content')).toBeVisible();
    await expect(page.getByText('No content processed yet')).toBeVisible();
  });

  test('should switch between YouTube and File tabs', async ({ page }) => {
    // Default is YouTube tab
    await expect(page.getByPlaceholder(/youtube/i)).toBeVisible();
    
    // Switch to File Upload
    await page.click('text=Upload File');
    await expect(page.getByText(/drop your file/i)).toBeVisible();
    
    // Switch back to YouTube
    await page.click('text=YouTube URL');
    await expect(page.getByPlaceholder(/youtube/i)).toBeVisible();
  });

  test('should show validation for empty YouTube URL', async ({ page }) => {
    await page.click('button:has-text("Process")');
    
    // Button should be disabled or show validation
    await expect(page.getByPlaceholder(/youtube/i)).toBeVisible();
  });

  test('should process YouTube URL', async ({ page }) => {
    const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    
    await page.getByPlaceholder(/youtube/i).fill(testUrl);
    await page.click('button:has-text("Process")');
    
    // Should show processing state
    await expect(page.getByText(/processing/i)).toBeVisible({ timeout: 5000 });
    
    // Wait for completion (mock data returns quickly)
    await expect(page.getByText(/completed/i)).toBeVisible({ timeout: 15000 });
    
    // Content should appear in list
    const contentCard = page.locator('[data-testid="content-card"], a[href^="/content/"]').first();
    await expect(contentCard).toBeVisible({ timeout: 5000 });
  });

  test('should show file upload interface', async ({ page }) => {
    await page.click('text=Upload File');
    
    // Check upload interface
    await expect(page.getByText(/drop your file/i)).toBeVisible();
    await expect(page.getByText(/mp3.*wav.*m4a/i)).toBeVisible();
    await expect(page.getByText(/100mb/i)).toBeVisible();
  });

  test('should upload and process audio file', async ({ page }) => {
    await page.click('text=Upload File');
    
    // Create test file
    const testFile = Buffer.from('test audio content');
    
    // Upload file (note: actual file validation happens server-side)
    await page.setInputFiles('input[type="file"]', {
      name: 'test-audio.mp3',
      mimeType: 'audio/mpeg',
      buffer: testFile,
    });
    
    // Should show file preview
    await expect(page.getByText('test-audio.mp3')).toBeVisible();
    await expect(page.getByText(/process file/i)).toBeVisible();
  });

  test('should display content list with correct information', async ({ page }) => {
    // Process some content first
    const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    await page.getByPlaceholder(/youtube/i).fill(testUrl);
    await page.click('button:has-text("Process")');
    
    await page.waitForTimeout(2000);
    
    // Check content card
    const firstCard = page.locator('a[href^="/content/"]').first();
    await expect(firstCard).toBeVisible();
    
    // Should have title
    await expect(firstCard.locator('h3')).toBeVisible();
    
    // Should have metadata
    await expect(firstCard.getByText(/youtube/i)).toBeVisible();
    await expect(firstCard.getByText(/outputs/i)).toBeVisible();
  });

  test('should navigate to content detail on click', async ({ page }) => {
    // Process content
    const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    await page.getByPlaceholder(/youtube/i).fill(testUrl);
    await page.click('button:has-text("Process")');
    
    await page.waitForTimeout(3000);
    
    // Click content card
    const firstCard = page.locator('a[href^="/content/"]').first();
    await firstCard.click();
    
    // Should navigate to detail page
    await expect(page).toHaveURL(/\/content\/[a-z0-9]+/);
  });

  test('should show status badges correctly', async ({ page }) => {
    // Process content
    const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    await page.getByPlaceholder(/youtube/i).fill(testUrl);
    await page.click('button:has-text("Process")');
    
    // Should show processing badge
    await expect(page.getByText(/processing/i)).toBeVisible({ timeout: 5000 });
    
    // Should eventually show completed badge
    await expect(page.getByText(/completed/i)).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Dashboard - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const timestamp = Date.now();
    const email = `test-${timestamp}@example.com`;
    
    await page.click('text=Sign Up');
    await page.getByLabel('Name').fill('Test User');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('testpass123');
    await page.click('button:has-text("Create Account")');
    
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
  });

  test('should display mobile-friendly layout', async ({ page }) => {
    // Header should be visible
    await expect(page.getByText('Contento')).toBeVisible();
    
    // Tabs should be stackable
    await expect(page.getByRole('tab', { name: /youtube/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /upload/i })).toBeVisible();
    
    // Process button should be accessible
    await expect(page.getByRole('button', { name: /process/i })).toBeVisible();
  });
});
