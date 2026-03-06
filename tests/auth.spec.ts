import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display landing page with auth form', async ({ page }) => {
    // Check branding
    await expect(page.locator('h1')).toContainText('Contento');
    await expect(page.getByText('Transform one piece of content')).toBeVisible();
    
    // Check feature pills
    await expect(page.getByText('YouTube Videos')).toBeVisible();
    await expect(page.getByText('Podcasts')).toBeVisible();
    await expect(page.getByText('Blogs & PDFs')).toBeVisible();
    
    // Check auth form
    await expect(page.getByRole('tab', { name: 'Login' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Sign Up' })).toBeVisible();
  });

  test('should switch between login and signup tabs', async ({ page }) => {
    // Default is login
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    
    // Switch to signup
    await page.click('text=Sign Up');
    await expect(page.getByLabel('Name')).toBeVisible();
    
    // Switch back to login
    await page.click('text=Login');
    await expect(page.getByLabel('Name')).not.toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.click('button:has-text("Sign In")');
    
    // Should show error message
    await expect(page.getByText(/invalid/i)).toBeVisible({ timeout: 5000 });
  });

  test('should signup new user successfully', async ({ page }) => {
    const timestamp = Date.now();
    const email = `test-${timestamp}@example.com`;
    
    await page.click('text=Sign Up');
    await page.getByLabel('Name').fill('Test User');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('testpass123');
    await page.click('button:has-text("Create Account")');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
    await expect(page.getByText('Process New Content')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.click('button:has-text("Sign In")');
    
    // HTML5 validation should prevent submission
    await expect(page).toHaveURL('/');
  });

  test('should validate password length', async ({ page }) => {
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('12345'); // Only 5 chars
    await page.click('button:has-text("Sign In")');
    
    // Should stay on page (validation error)
    await expect(page).toHaveURL('/');
  });
});

test.describe('Authentication - Logged In', () => {
  test.beforeEach(async ({ page }) => {
    // Signup a new user for each test
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

  test('should logout successfully', async ({ page }) => {
    await page.click('button:has-text("Logout")');
    
    // Should redirect to home
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('tab', { name: 'Login' })).toBeVisible();
  });
});
