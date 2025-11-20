import { test } from '@playwright/test';

test('Debug Game3D Character Rendering', async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 800 });

  // Capture console logs
  const logs: string[] = [];
  page.on('console', msg => {
    const logEntry = `[${msg.type()}] ${msg.text()}`;
    logs.push(logEntry);
    console.log(logEntry);
  });

  // Go to offline mode
  console.log('Going to http://localhost:5174/');
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.click('button:has-text("Offline Mode")');
  await page.waitForTimeout(2000);

  // Select characters
  console.log('Selecting characters...');
  const char1 = page.locator('[data-testid="character-card"]').first();
  if (await char1.isVisible({ timeout: 2000 }).catch(() => false)) {
    await char1.click();
    await page.waitForTimeout(500);
  }

  const char2 = page.locator('[data-testid="character-card"]').nth(1);
  if (await char2.isVisible({ timeout: 2000 }).catch(() => false)) {
    await char2.click();
    await page.waitForTimeout(500);
  }

  // Start game
  console.log('Starting game...');
  const startBtn = page.locator('button:has-text("START GAME"), button:has-text("Start"), button:has-text("시작")').first();
  if (await startBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await startBtn.click();
    await page.waitForTimeout(4000);
  }

  // Inspect Game3D container
  console.log('\n=== 🔍 DEBUGGING GAME3D RENDERING ===\n');

  const containerVisible = await page.isVisible('[data-testid="game-3d-container"]');
  console.log(`Game3D container visible: ${containerVisible}`);

  const canvas = await page.$('canvas');
  console.log(`Canvas element found: ${canvas !== null}`);

  if (canvas) {
    const canvasBox = await canvas.boundingBox();
    console.log(`Canvas size: ${canvasBox?.width}x${canvasBox?.height}`);
  }

  // Check for error messages
  const errorMsg = await page.$('[data-testid="error-message"]');
  if (errorMsg) {
    const text = await errorMsg.textContent();
    console.log(`Error displayed: ${text}`);
  }

  // Check loading indicator
  const loading = await page.$('[data-testid="loading-indicator"]');
  console.log(`Loading indicator visible: ${loading !== null}`);

  // Print all captured logs
  console.log('\n=== 📋 CONSOLE LOGS ===');
  logs.forEach(log => console.log(log));

  // Take screenshot
  await page.screenshot({ path: '/tmp/debug-game3d.png' });
  console.log('\n✓ Screenshot saved to /tmp/debug-game3d.png');
});
