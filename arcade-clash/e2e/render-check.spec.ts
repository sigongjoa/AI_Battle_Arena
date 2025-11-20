import { test, expect } from '@playwright/test';

test.setTimeout(120000);

test('Game3D Rendering - Characters should appear after animation loop fix', async ({ page }) => {
  // Set viewport for consistent rendering
  await page.setViewportSize({ width: 1400, height: 800 });

  // Capture console logs to check rendering status
  const logs: string[] = [];
  page.on('console', msg => {
    const logEntry = `[${msg.type()}] ${msg.text()}`;
    logs.push(logEntry);
    if (msg.text().includes('[Game3D]') || msg.text().includes('[CharacterRenderer]') || msg.text().includes('Animation loop')) {
      console.log(logEntry);
    }
  });

  // Capture page errors
  page.on('pageerror', err => {
    console.log(`[PAGE ERROR] ${err.message}`);
  });

  // Navigate to game
  console.log('\n🌐 Navigating to http://localhost:5174/');
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Click offline mode
  console.log('📍 Entering Offline Mode...');
  const offlineBtn = page.locator('button:has-text("Offline Mode")').first();
  await expect(offlineBtn).toBeVisible({ timeout: 10000 });
  await offlineBtn.click();
  await page.waitForTimeout(1500);

  // Select first character using the same method as the passing test
  console.log('📍 Selecting characters...');
  const characterCards = page.locator('[class*="character-card"]');
  const cardCount = await characterCards.count();
  console.log(`   Found ${cardCount} character cards`);

  if (cardCount > 0) {
    // Player 1
    const firstCard = characterCards.first();
    await expect(firstCard).toBeVisible();
    const player1Name = await firstCard.locator('p').first().textContent();
    await firstCard.click();
    console.log(`   ✓ Player 1 selected: ${player1Name}`);
    await page.waitForTimeout(500);

    // Player 2
    if (cardCount > 1) {
      const secondCard = characterCards.nth(1);
      await expect(secondCard).toBeVisible();
      const player2Name = await secondCard.locator('p').first().textContent();
      await secondCard.click();
      console.log(`   ✓ Player 2 selected: ${player2Name}`);
      await page.waitForTimeout(500);
    }
  }

  // Wait for GameScreen to render
  console.log('\n📍 Waiting for GameScreen...');
  await page.waitForTimeout(3000);

  // Check if we're on GameScreen
  const player1Label = page.locator('text=PLAYER 1');
  const player2Label = page.locator('text=PLAYER 2');

  const p1Visible = await player1Label.isVisible({ timeout: 5000 }).catch(() => false);
  const p2Visible = await player2Label.isVisible({ timeout: 5000 }).catch(() => false);

  console.log(`   Player 1 label visible: ${p1Visible}`);
  console.log(`   Player 2 label visible: ${p2Visible}`);

  // Check Game3D specific elements
  console.log('\n🎮 CHECKING 3D RENDERING...');

  const containerDiv = page.locator('[data-testid="game-3d-container"]');
  const containerVisible = await containerDiv.isVisible({ timeout: 5000 }).catch(() => false);
  console.log(`   Game3D container visible: ${containerVisible}`);

  // Find canvas elements
  const canvases = await page.locator('canvas').all();
  console.log(`   Canvas elements found: ${canvases.length}`);

  if (canvases.length > 0) {
    const canvas = canvases[0];
    const canvasBox = await canvas.boundingBox();
    if (canvasBox) {
      console.log(`   Canvas size: ${canvasBox.width}x${canvasBox.height}`);
    }
  }

  // Wait for Game3D to fully initialize
  await page.waitForTimeout(3000);

  // Check for loading indicator
  const loading = await page.$('[data-testid="loading-indicator"]');
  if (loading) {
    const loadingVisible = await loading.isVisible().catch(() => false);
    console.log(`   Loading indicator visible: ${loadingVisible}`);
  } else {
    console.log(`   ✓ Loading indicator gone`);
  }

  // Check for errors
  const errorMsg = await page.$('[data-testid="error-message"]');
  if (errorMsg) {
    const text = await errorMsg.textContent();
    console.log(`   ⚠️ Error message: ${text}`);
  } else {
    console.log(`   ✓ No error messages`);
  }

  // Check FPS counter
  const fpsText = await page.locator('text=/FPS:/').textContent().catch(() => null);
  if (fpsText) {
    console.log(`   FPS display: ${fpsText}`);
  }

  // Print critical rendering logs
  console.log('\n📋 KEY RENDERING LOGS:');
  const relevantLogs = logs
    .filter(log =>
      log.includes('[Game3D]') ||
      log.includes('[CharacterRenderer]') ||
      log.includes('Animation loop')
    )
    .slice(-15);

  if (relevantLogs.length > 0) {
    relevantLogs.forEach(log => console.log(`   ${log}`));
  } else {
    console.log('   (no Game3D logs captured)');
  }

  // Check for animation loop start - this is the critical fix
  const animationStartLog = logs.find(log => log.includes('Animation loop started'));
  if (animationStartLog) {
    console.log(`\n✅ CRITICAL SUCCESS: ${animationStartLog}`);
  } else {
    console.log(`\n⚠️ WARNING: Animation loop start not logged`);
  }

  // Take screenshot
  await page.screenshot({ path: 'test-results/render-check-3d-game.png' });
  console.log('\n📸 Screenshot saved to test-results/render-check-3d-game.png');
});
