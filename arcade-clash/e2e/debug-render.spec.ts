import { test, expect } from '@playwright/test';

test.setTimeout(120000);

test('Debug 3D Rendering - Check FBX Loading and Scene', async ({ page }) => {
  // Capture all console logs
  const logs: string[] = [];
  page.on('console', msg => {
    const logEntry = `[${msg.type()}] ${msg.text()}`;
    logs.push(logEntry);
    // Print important logs immediately
    if (msg.text().includes('[CharacterRenderer]') ||
        msg.text().includes('[Game3D]') ||
        msg.text().includes('[CharacterLoader]') ||
        msg.text().includes('Scene') ||
        msg.text().includes('scale')) {
      console.log(logEntry);
    }
  });

  // Capture errors
  page.on('pageerror', err => {
    console.log(`[PAGE ERROR] ${err.message}`);
    console.log(err.stack);
  });

  // Navigate
  console.log('\n=== STARTING DEBUG RENDER TEST ===\n');
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Enter offline mode
  const offlineBtn = page.locator('button:has-text("Offline Mode")').first();
  await expect(offlineBtn).toBeVisible({ timeout: 10000 });
  await offlineBtn.click();
  await page.waitForTimeout(1500);

  // Select characters
  const characterCards = page.locator('[class*="character-card"]');
  const cardCount = await characterCards.count();
  console.log(`\n📍 Found ${cardCount} character cards\n`);

  if (cardCount > 0) {
    await characterCards.first().click();
    await page.waitForTimeout(500);
    if (cardCount > 1) {
      await characterCards.nth(1).click();
      await page.waitForTimeout(500);
    }
  }

  // Wait for Game3D to initialize
  console.log('\n📍 Waiting for Game3D initialization...\n');
  await page.waitForTimeout(5000);

  // Check for Three.js errors or renderer issues
  const containerDiv = page.locator('[data-testid="game-3d-container"]');
  const isVisible = await containerDiv.isVisible({ timeout: 5000 }).catch(() => false);
  console.log(`\n📍 Game3D container visible: ${isVisible}`);

  // Check canvas
  const canvases = await page.locator('canvas').all();
  console.log(`📍 Canvas elements found: ${canvases.length}`);

  if (canvases.length > 0) {
    const canvas = canvases[0];
    const canvasBox = await canvas.boundingBox();
    if (canvasBox) {
      console.log(`📍 Canvas size: ${canvasBox.width}x${canvasBox.height}`);
      console.log(`📍 Canvas position: (${canvasBox.x}, ${canvasBox.y})`);
    }
  }

  // Check if loading indicator is gone
  const loading = await page.$('[data-testid="loading-indicator"]');
  if (loading) {
    const isLoadingVisible = await loading.isVisible().catch(() => false);
    console.log(`📍 Loading indicator visible: ${isLoadingVisible}`);
  } else {
    console.log(`✓ Loading indicator gone`);
  }

  // Check for error messages
  const errorMsg = await page.$('[data-testid="error-message"]');
  if (errorMsg) {
    const errorText = await errorMsg.textContent();
    console.log(`⚠️ Error message: ${errorText}`);
  } else {
    console.log(`✓ No error messages`);
  }

  // Wait a bit more for rendering
  await page.waitForTimeout(2000);

  // Print all Character Renderer logs
  console.log('\n=== CRITICAL RENDERER LOGS ===');
  const rendererLogs = logs.filter(log =>
    log.includes('[CharacterRenderer]') ||
    log.includes('Loaded character') ||
    log.includes('Applied scale') ||
    log.includes('Centered mesh')
  );

  if (rendererLogs.length > 0) {
    rendererLogs.forEach(log => console.log(log));
  } else {
    console.log('(No CharacterRenderer logs found)');
  }

  // Print all Game3D loader logs
  console.log('\n=== GAME3D LOADER LOGS ===');
  const game3dLogs = logs.filter(log =>
    log.includes('[Game3D]') &&
    (log.includes('Loading') || log.includes('Loaded') || log.includes('✅'))
  );

  if (game3dLogs.length > 0) {
    game3dLogs.forEach(log => console.log(log));
  } else {
    console.log('(No Game3D loading logs found)');
  }

  // Take screenshot
  const screenshotPath = 'test-results/debug-render-check.png';
  await page.screenshot({ path: screenshotPath });
  console.log(`\n📸 Screenshot saved to ${screenshotPath}`);

  // Print FPS
  const fpsText = await page.locator('text=/FPS:/').textContent().catch(() => null);
  console.log(`\n📊 FPS: ${fpsText}`);

  // Final validation
  console.log('\n=== VALIDATION ===');
  console.log(`Canvas found: ${canvases.length > 0}`);
  console.log(`Container visible: ${isVisible}`);
  console.log(`No errors: ${!errorMsg}`);
  console.log(`Loading complete: ${!loading || !(await loading.isVisible().catch(() => true))}`);
});
