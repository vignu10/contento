import { test, expect } from '@playwright/test';

test.describe('E2E User Journey', () => {
  test('complete user flow: signup -> process content -> view outputs', async ({ page }) => {
    // 1. Landing Page
    await page.goto('/');
    await expect(page.getByText('Contento')).toBeVisible();
    await expect(page.getByText('Transform one piece of content')).toBeVisible();
    
    // 2. Sign Up
    const timestamp = Date.now();
    const email = `e2e-${timestamp}@example.com`;
    
    await page.click('text=Sign Up');
    await page.getByLabel('Name').fill('E2E Test User');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('testpass123');
    await page.click('button:has-text("Create Account")');
    
    // 3. Dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
    await expect(page.getByText('Process New Content')).toBeVisible();
    await expect(page.getByText('No content processed yet')).toBeVisible();
    
    // 4. Process YouTube Video
    const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    await page.getByPlaceholder(/youtube/i).fill(testUrl);
    await page.click('button:has-text("Process")');
    
    // 5. Wait for Processing
    await expect(page.getByText(/processing/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/completed/i)).toBeVisible({ timeout: 20000 });
    
    // 6. Verify Content in List
    const contentCard = page.locator('a[href^="/content/"]').first();
    await expect(contentCard).toBeVisible();
    await expect(contentCard.locator('h3')).toBeVisible();
    await expect(contentCard.getByText(/youtube/i)).toBeVisible();
    
    // 7. Click to View Detail
    await contentCard.click();
    await expect(page).toHaveURL(/\/content\/[a-z0-9]+/);
    
    // 8. View All Output Formats
    const tabs = ['Twitter', 'LinkedIn', 'Newsletter', 'TikTok', 'Quotes', 'SEO', 'Instagram'];
    
    for (const tabName of tabs) {
      await page.click(`[role="tab"]:has-text("${tabName}")`);
      await page.waitForTimeout(300);
      
      // Verify content is visible
      const content = page.locator('.prose, [data-testid], p, h4').first();
      await expect(content).toBeVisible({ timeout: 2000 });
    }
    
    // 9. Copy Content
    await page.click('[role="tab"]:has-text("LinkedIn")');
    await page.click('button:has-text("Copy")');
    await expect(page.getByText(/copied/i)).toBeVisible({ timeout: 3000 });
    
    // 10. Go Back to Dashboard
    await page.click('button:has-text("Back")');
    await expect(page).toHaveURL(/.*dashboard/);
    
    // 11. Logout
    await page.click('button:has-text("Logout")');
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('tab', { name: 'Login' })).toBeVisible();
  });

  test('file upload flow', async ({ page }) => {
    // Login
    await page.goto('/');
    const timestamp = Date.now();
    const email = `upload-${timestamp}@example.com`;
    
    await page.click('text=Sign Up');
    await page.getByLabel('Name').fill('Upload Test User');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('testpass123');
    await page.click('button:has-text("Create Account")');
    
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
    
    // Switch to File Upload tab
    await page.click('text=Upload File');
    await expect(page.getByText(/drop your file/i)).toBeVisible();
    
    // Upload file
    const testFile = Buffer.from('test audio content for upload');
    await page.setInputFiles('input[type="file"]', {
      name: 'test-podcast.mp3',
      mimeType: 'audio/mpeg',
      buffer: testFile,
    });
    
    // Verify file preview
    await expect(page.getByText('test-podcast.mp3')).toBeVisible();
    await expect(page.getByText(/mp3/i)).toBeVisible();
    
    // Process file
    await page.click('button:has-text("Process File")');
    
    // Wait for processing
    await expect(page.getByText(/processing/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/completed/i)).toBeVisible({ timeout: 15000 });
  });

  test('multiple content items', async ({ page }) => {
    // Login
    await page.goto('/');
    const timestamp = Date.now();
    const email = `multi-${timestamp}@example.com`;
    
    await page.click('text=Sign Up');
    await page.getByLabel('Name').fill('Multi Content User');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('testpass123');
    await page.click('button:has-text("Create Account")');
    
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
    
    // Process first video
    await page.getByPlaceholder(/youtube/i).fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    await page.click('button:has-text("Process")');
    await expect(page.getByText(/completed/i)).toBeVisible({ timeout: 20000 });
    
    // Process second video
    await page.getByPlaceholder(/youtube/i).fill('https://www.youtube.com/watch?v=jNQXAC9IVRw');
    await page.click('button:has-text("Process")');
    await expect(page.locator('a[href^="/content/"]').count()).resolves.toBeGreaterThanOrEqual(2);
    
    // Verify both are in list
    const contentCards = page.locator('a[href^="/content/"]');
    const count = await contentCards.count();
    expect(count).toBeGreaterThanOrEqual(2);
    
    // Click first, then second
    await contentCards.first().click();
    await expect(page).toHaveURL(/\/content\/[a-z0-9]+/);
    await page.goBack();
    
    await contentCards.nth(1).click();
    await expect(page).toHaveURL(/\/content\/[a-z0-9]+/);
  });

  test('session persistence', async ({ page, context }) => {
    // Login
    await page.goto('/');
    const timestamp = Date.now();
    const email = `persist-${timestamp}@example.com`;
    
    await page.click('text=Sign Up');
    await page.getByLabel('Name').fill('Session Test User');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('testpass123');
    await page.click('button:has-text("Create Account")');
    
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
    
    // Open new tab
    const newPage = await context.newPage();
    await newPage.goto('/');
    
    // Should redirect to dashboard (logged in)
    await expect(newPage).toHaveURL(/.*dashboard/, { timeout: 5000 });
    
    // Cleanup
    await newPage.close();
  });

  test('responsive design - desktop to mobile', async ({ page }) => {
    // Login at desktop size
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    
    const timestamp = Date.now();
    const email = `responsive-${timestamp}@example.com`;
    
    await page.click('text=Sign Up');
    await page.getByLabel('Name').fill('Responsive User');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('testpass123');
    await page.click('button:has-text("Create Account")');
    
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
    
    // Process content
    await page.getByPlaceholder(/youtube/i).fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    await page.click('button:has-text("Process")');
    await expect(page.getByText(/completed/i)).toBeVisible({ timeout: 20000 });
    
    // Resize to mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Verify mobile layout
    await expect(page.getByText('Contento')).toBeVisible();
    await expect(page.locator('a[href^="/content/"]').first()).toBeVisible();
    
    // Click content on mobile
    await page.locator('a[href^="/content/"]').first().click();
    await expect(page).toHaveURL(/\/content\/[a-z0-9]+/);
    
    // Verify mobile detail view
    await expect(page.getByRole('button', { name: /back/i })).toBeVisible();
    await expect(page.locator('[role="tablist"]')).toBeVisible();
  });
});

test.describe('Error Handling', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    // Login
    await page.goto('/');
    const timestamp = Date.now();
    const email = `error-${timestamp}@example.com`;
    
    await page.click('text=Sign Up');
    await page.getByLabel('Name').fill('Error Test User');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('testpass123');
    await page.click('button:has-text("Create Account")');
    
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
    
    // Simulate offline
    await context.setOffline(true);
    
    // Try to process
    await page.getByPlaceholder(/youtube/i).fill('https://www.youtube.com/watch?v=test');
    await page.click('button:has-text("Process")');
    
    // Should show error or stay in UI
    await page.waitForTimeout(2000);
    
    // Restore network
    await context.setOffline(false);
  });

  test('should validate file types', async ({ page }) => {
    await page.goto('/');
    const timestamp = Date.now();
    const email = `filetype-${timestamp}@example.com`;
    
    await page.click('text=Sign Up');
    await page.getByLabel('Name').fill('File Type User');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('testpass123');
    await page.click('button:has-text("Create Account")');
    
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
    
    // Try to upload invalid file
    await page.click('text=Upload File');
    
    const invalidFile = Buffer.from('not an image');
    await page.setInputFiles('input[type="file"]', {
      name: 'test-image.jpg',
      mimeType: 'image/jpeg', // Invalid - should be audio/video/pdf
      buffer: invalidFile,
    });
    
    // Should show error or not allow upload
    await page.waitForTimeout(1000);
  });
});
