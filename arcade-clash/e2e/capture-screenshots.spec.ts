import { test, expect } from '@playwright/test';

test('capture game screenshots', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Set viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Go to main menu
    console.log('Navigating to http://localhost:5174/');
    await page.goto('http://localhost:5174/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    // Capture main menu
    console.log('Capturing main menu...');
    await page.screenshot({ path: '/tmp/01-main-menu.png', fullPage: false });
    
    // Click play button
    const playButton = page.locator('button:has-text("PLAY")').first();
    if (await playButton.isVisible()) {
      console.log('Clicking play button...');
      await playButton.click();
      await page.waitForTimeout(2000);
      
      // Capture character select
      console.log('Capturing character select...');
      await page.screenshot({ path: '/tmp/02-character-select.png', fullPage: false });
      
      // Select first character
      const char1 = page.locator('[data-testid="character-card"]').first();
      if (await char1.isVisible()) {
        console.log('Selecting character 1...');
        await char1.click();
        await page.waitForTimeout(500);
      }
      
      // Select second character
      const char2 = page.locator('[data-testid="character-card"]').nth(1);
      if (await char2.isVisible()) {
        console.log('Selecting character 2...');
        await char2.click();
        await page.waitForTimeout(500);
      }
      
      // Start game
      const startButton = page.locator('button:has-text("START GAME")').first();
      if (await startButton.isVisible()) {
        console.log('Starting game...');
        await startButton.click();
        await page.waitForTimeout(4000);
        
        // Capture game screen with 3D rendering
        console.log('Capturing game screen...');
        await page.screenshot({ path: '/tmp/03-game-screen-3d.png', fullPage: false });
        
        // Wait a bit more and capture another frame
        await page.waitForTimeout(2000);
        console.log('Capturing game screen 2...');
        await page.screenshot({ path: '/tmp/04-game-screen-3d-2.png', fullPage: false });
      }
    }
    
    console.log('Screenshots captured successfully!');
  } catch (error) {
    console.error('Error capturing screenshots:', error);
  } finally {
    await context.close();
  }
});
