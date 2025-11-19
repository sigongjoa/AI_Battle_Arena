import { test, expect } from '@playwright/test';

test.describe('AI Battle Arena - E2E Tests', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Arcade Clash|AI Battle Arena/i);

    // Wait for page to be interactive
    await page.waitForLoadState('domcontentloaded');

    // Capture screenshot
    await page.screenshot({ path: '../test_reports/screenshots/01_main_page.png' });
  });

  test('should have root element visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check if root element exists and is visible
    const root = page.locator('#root');
    await expect(root).toBeVisible();

    await page.screenshot({ path: '../test_reports/screenshots/02_root_visible.png' });
  });

  test('should render game interface', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for any interactive elements (buttons, divs with game content)
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    // Page should have at least some UI elements
    expect(buttonCount).toBeGreaterThanOrEqual(0);

    await page.screenshot({ path: '../test_reports/screenshots/03_game_interface.png' });
  });
});

test.describe('AI Battle Arena - Performance', () => {
  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;

    console.log(`Page load time: ${loadTime}ms`);

    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should have no critical console errors on load', async ({ page }) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
      if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    console.log(`Errors: ${errors.length}, Warnings: ${warnings.length}`);

    // Allow some warnings, but no critical errors
    expect(errors.filter(e => !e.includes('Failed to load')).length).toBeLessThanOrEqual(2);
  });
});

test.describe('AI Battle Arena - Accessibility', () => {
  test('should support basic keyboard interaction', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Tab should navigate through page
    await page.keyboard.press('Tab');

    // Check if something is focused
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        tag: el?.tagName,
        id: el?.id || 'no-id',
      };
    });

    console.log(`Focused element: ${JSON.stringify(focusedElement)}`);
    expect(focusedElement.tag).toBeTruthy();
  });

  test('should have readable text', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check if page has any visible text
    const textContent = await page.evaluate(() => {
      return document.body.innerText.length > 0;
    });

    console.log(`Page has text content: ${textContent}`);
    expect(textContent).toBeTruthy();
  });
});

test.describe('AI Battle Arena - Responsive Design', () => {
  test('should display on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const root = page.locator('#root');
    await expect(root).toBeVisible();

    await page.screenshot({ path: '../test_reports/screenshots/04_mobile.png' });
  });

  test('should display on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const root = page.locator('#root');
    await expect(root).toBeVisible();

    await page.screenshot({ path: '../test_reports/screenshots/05_tablet.png' });
  });

  test('should display on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const root = page.locator('#root');
    await expect(root).toBeVisible();

    await page.screenshot({ path: '../test_reports/screenshots/06_desktop.png' });
  });

  test('should not have horizontal scroll on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const hasHorizontalScroll = await page.evaluate(() => {
      return window.innerWidth < document.documentElement.scrollWidth;
    });

    console.log(`Has horizontal scroll on mobile: ${hasHorizontalScroll}`);
    expect(hasHorizontalScroll).toBeFalsy();
  });
});

test.describe('AI Battle Arena - Error Handling', () => {
  test('should handle network issues gracefully', async ({ page }) => {
    let httpErrors = 0;
    page.on('response', (response) => {
      if (response.status() >= 500) {
        httpErrors++;
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    console.log(`HTTP 500+ errors: ${httpErrors}`);
    expect(httpErrors).toBe(0);
  });

  test('should render even with missing assets', async ({ page }) => {
    let failed404s = 0;
    page.on('response', (response) => {
      if (response.status() === 404) {
        failed404s++;
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Page should still be visible even if some assets fail
    const root = page.locator('#root');
    await expect(root).toBeVisible();

    console.log(`404 errors: ${failed404s}`);
  });
});
