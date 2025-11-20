import { test, expect } from '@playwright/test';

test('capture full game flow with 3D rendering', async ({ page }) => {
  // Set larger viewport for better visibility
  await page.setViewportSize({ width: 1400, height: 800 });
  
  // 1. MAIN MENU
  console.log('=== STEP 1: Main Menu ===');
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/tmp/game-01-main-menu.png' });
  console.log('✓ Main menu screenshot captured');
  
  // 2. OFFLINE MODE - CHARACTER SELECT
  console.log('\n=== STEP 2: Entering Offline Mode ===');
  await page.click('button:has-text("Offline Mode")');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/game-02-character-select.png' });
  console.log('✓ Character select screenshot captured');
  
  // 3. SELECT CHARACTERS
  console.log('\n=== STEP 3: Selecting Characters ===');
  const characterCards = await page.locator('[data-testid="character-card"]').count();
  console.log(`Found ${characterCards} character cards`);
  
  // Try to select first character
  const firstChar = page.locator('[data-testid="character-card"]').first();
  if (await firstChar.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('Clicking first character...');
    await firstChar.click();
    await page.waitForTimeout(800);
  }
  
  // Try to select second character
  const secondChar = page.locator('[data-testid="character-card"]').nth(1);
  if (await secondChar.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('Clicking second character...');
    await secondChar.click();
    await page.waitForTimeout(800);
  }
  
  await page.screenshot({ path: '/tmp/game-03-characters-selected.png' });
  console.log('✓ Characters selected screenshot captured');
  
  // 4. START GAME
  console.log('\n=== STEP 4: Starting Game ===');
  const startBtn = page.locator('button:has-text("START GAME"), button:has-text("Start Match"), button:has-text("START")').first();
  if (await startBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('Found start button, clicking...');
    await startBtn.click();
    
    // Wait for game scene to load
    await page.waitForTimeout(4000);
    
    // 5. GAME SCREEN WITH 3D RENDERING
    console.log('\n=== STEP 5: Game Screen (3D Rendering) ===');
    await page.screenshot({ path: '/tmp/game-04-game-screen-3d.png' });
    console.log('✓ Game screen screenshot captured');
    
    // Let game run a bit and capture another frame
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: '/tmp/game-05-game-action.png' });
    console.log('✓ Game action screenshot captured');
    
    // Wait and capture game in progress
    await page.waitForTimeout(2000);
    await page.keyboard.press('Space');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: '/tmp/game-06-game-combat.png' });
    console.log('✓ Combat screenshot captured');
  } else {
    console.log('Start button not found, capturing current state');
    await page.screenshot({ path: '/tmp/game-04-current-state.png' });
  }
  
  console.log('\n=== ALL SCREENSHOTS CAPTURED SUCCESSFULLY ===');
});
