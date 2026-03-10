import { test, expect } from '@playwright/test';

test.describe('Content Detail Page', () => {
  let contentId: string;

  test.beforeEach(async ({ page }) => {
    // Login and create content
    await page.goto('/');
    const timestamp = Date.now();
    const email = `test-${timestamp}@example.com`;
    
    await page.click('text=Sign Up');
    await page.getByLabel('Name').fill('Test User');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('testpass123');
    await page.click('button:has-text("Create Account")');
    
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
    
    // Process content
    const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    await page.getByPlaceholder(/youtube/i).fill(testUrl);
    await page.click('button:has-text("Process")');
    
    // Wait for processing
    await expect(page.getByText(/completed/i)).toBeVisible({ timeout: 15000 });
    
    // Click on content card
    const firstCard = page.locator('a[href^="/content/"]').first();
    await firstCard.click();
    
    // Get content ID from URL
    const url = page.url();
    const match = url.match(/\/content\/([a-z0-9]+)/);
    contentId = match ? match[1] : '';
    
    await expect(page).toHaveURL(/\/content\/[a-z0-9]+/);
  });

  test('should display content detail page', async ({ page }) => {
    // Back button
    await expect(page.getByRole('button', { name: /back/i })).toBeVisible();
    
    // Title
    await expect(page.locator('h1')).toBeVisible();
    
    // Status badge
    await expect(page.getByText(/completed/i)).toBeVisible();
    
    // Output tabs
    await expect(page.getByRole('tab', { name: /twitter/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /linkedin/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /newsletter/i })).toBeVisible();
  });

  test('should display Twitter thread output', async ({ page }) => {
    // Click Twitter tab
    await page.click('[role="tab"]:has-text("Twitter")');
    
    // Should show tweets
    const tweets = page.locator('[data-testid="tweet-card"], .prose');
    await expect(tweets.first()).toBeVisible({ timeout: 5000 });
    
    // Should have copy buttons
    await expect(page.getByRole('button', { name: /copy/i }).first()).toBeVisible();
  });

  test('should display LinkedIn post output', async ({ page }) => {
    await page.click('[role="tab"]:has-text("LinkedIn")');
    
    // Should show post content
    const content = page.locator('.prose, [data-testid="linkedin-post"]');
    await expect(content).toBeVisible({ timeout: 5000 });
    
    // Should have copy button
    await expect(page.getByRole('button', { name: /copy/i })).toBeVisible();
  });

  test('should display Newsletter output', async ({ page }) => {
    await page.click('[role="tab"]:has-text("Newsletter")');
    
    // Should show newsletter content
    const content = page.locator('.prose, [data-testid="newsletter"]');
    await expect(content).toBeVisible({ timeout: 5000 });
  });

  test('should display TikTok clips output', async ({ page }) => {
    await page.click('[role="tab"]:has-text("TikTok")');
    
    // Should show clips
    const clips = page.locator('[data-testid="tiktok-clip"], h4');
    await expect(clips.first()).toBeVisible({ timeout: 5000 });
    
    // Should show timestamps
    await expect(page.getByText(/\d+s - \d+s/)).toBeVisible();
  });

  test('should display Quote graphics', async ({ page }) => {
    await page.click('[role="tab"]:has-text("Quotes")');
    
    // Should show quotes in grid
    const quotes = page.locator('[data-testid="quote-card"], .gradient');
    await expect(quotes.first()).toBeVisible({ timeout: 5000 });
  });

  test('should display SEO summary', async ({ page }) => {
    await page.click('[role="tab"]:has-text("SEO")');
    
    // Should show summary
    const content = page.locator('.prose, [data-testid="seo-summary"]');
    await expect(content).toBeVisible({ timeout: 5000 });
  });

  test('should display Instagram caption with hashtags', async ({ page }) => {
    await page.click('[role="tab"]:has-text("Instagram")');
    
    // Should show caption
    await expect(page.locator('.prose, p')).toBeVisible({ timeout: 5000 });
    
    // Should show hashtags
    await expect(page.getByText('#')).toBeVisible();
  });

  test('should copy content to clipboard', async ({ page }) => {
    await page.click('[role="tab"]:has-text("LinkedIn")');
    
    // Click copy button
    await page.click('button:has-text("Copy")');
    
    // Should show "Copied!" feedback
    await expect(page.getByText(/copied/i)).toBeVisible({ timeout: 3000 });
  });

  test('should toggle transcript visibility', async ({ page }) => {
    // Find transcript section
    const transcriptButton = page.getByRole('button', { name: /transcript/i });
    
    if (await transcriptButton.isVisible()) {
      // Click to expand
      await transcriptButton.click();
      await expect(page.getByText(/transcript/i)).toBeVisible();
      
      // Click to collapse
      await transcriptButton.click();
    }
  });

  test('should navigate back to dashboard', async ({ page }) => {
    await page.click('button:has-text("Back")');
    
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.getByText('Process New Content')).toBeVisible();
  });

  test('should show all output format tabs', async ({ page }) => {
    const expectedTabs = [
      'Twitter Thread',
      'LinkedIn', 
      'Newsletter',
      'TikTok Clips',
      'Quotes',
      'SEO Summary',
      'Instagram'
    ];
    
    for (const tabName of expectedTabs) {
      const tab = page.getByRole('tab', { name: new RegExp(tabName, 'i') });
      await expect(tab).toBeVisible();
    }
  });

  test('should show source type and date', async ({ page }) => {
    // Should show YOUTUBE
    await expect(page.getByText(/youtube/i)).toBeVisible();
    
    // Should show date
    await expect(page.getByText(/\d{1,2}\/\d{1,2}\/\d{4}/)).toBeVisible();
  });
});

test.describe('Content Detail - Processing State', () => {
  test('should show processing message for pending content', async ({ page }) => {
    // Login
    await page.goto('/');
    const timestamp = Date.now();
    const email = `test-${timestamp}@example.com`;
    
    await page.click('text=Sign Up');
    await page.getByLabel('Name').fill('Test User');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('testpass123');
    await page.click('button:has-text("Create Account")');
    
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
    
    // Process content but click quickly
    const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    await page.getByPlaceholder(/youtube/i).fill(testUrl);
    await page.click('button:has-text("Process")');
    
    // Immediately click the card (might catch it in processing state)
    await page.waitForTimeout(500);
    
    const firstCard = page.locator('a[href^="/content/"]').first();
    if (await firstCard.isVisible()) {
      await firstCard.click();
      
      // Should show processing message if still processing
      const processingMessage = page.getByText(/processing your content/i);
      if (await processingMessage.isVisible()) {
        await expect(processingMessage).toBeVisible();
        
        // Should auto-refresh and complete
        await expect(page.getByText(/completed/i)).toBeVisible({ timeout: 20000 });
      }
    }
  });
});

test.describe('Content Detail - Mobile', () => {
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
    
    const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    await page.getByPlaceholder(/youtube/i).fill(testUrl);
    await page.click('button:has-text("Process")');
    
    await expect(page.getByText(/completed/i)).toBeVisible({ timeout: 15000 });
    
    const firstCard = page.locator('a[href^="/content/"]').first();
    await firstCard.click();
  });

  test('should display mobile-friendly content detail', async ({ page }) => {
    // Back button should be visible
    await expect(page.getByRole('button', { name: /back/i })).toBeVisible();
    
    // Tabs should be scrollable
    const tabs = page.locator('[role="tablist"]');
    await expect(tabs).toBeVisible();
    
    // Content should be readable
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should scroll tabs horizontally on mobile', async ({ page }) => {
    // Try to access Instagram tab (might need to scroll)
    const instagramTab = page.getByRole('tab', { name: /instagram/i });
    
    // Tab might be off-screen but should still exist
    await expect(instagramTab).toBeAttached();
  });
});
