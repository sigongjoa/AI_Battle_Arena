import { test, expect } from '@playwright/test';

/**
 * Phase 9: Offline Mode 게임 플로우 검증
 *
 * 플로우:
 * 1. 메인 페이지 진입
 * 2. "Offline Mode" 클릭 → CharacterSelect 화면
 * 3. 캐릭터 2개 선택 → GameScreen 진입
 * 4. 게임 화면에서 선택된 캐릭터 표시 확인
 * 5. UI 요소 확인 (Character Info Bar, HUD 등)
 */

test.setTimeout(60000);

test('Phase 9: Offline Mode 완전한 게임 플로우', async ({ page }) => {
  console.log('\n========== Phase 9: Offline Mode 테스트 시작 ==========\n');

  // 브라우저 콘솔 메시지 캡처
  page.on('console', (msg) => {
    console.log(`[BROWSER] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });

  // 페이지 에러 캡처
  page.on('pageerror', (err) => {
    console.log(`[PAGE ERROR]: ${err.message}`);
    console.log(err.stack);
  });

  // ===== STEP 1: 메인 페이지 진입 =====
  console.log('📍 STEP 1: 메인 페이지 진입');
  const startTime = Date.now();
  await page.goto('http://localhost:5174', { waitUntil: 'networkidle' });
  const loadTime = Date.now() - startTime;
  console.log(`  ✅ 로드 완료: ${loadTime}ms`);

  // 페이지 렌더링 대기
  await page.waitForTimeout(2000);

  // "Arcade Clash" 제목 확인
  const title = page.locator('h1');
  await expect(title).toBeVisible({ timeout: 10000 });
  console.log('  ✅ "Arcade Clash" 제목 표시됨\n');

  // ===== STEP 2: "Offline Mode" 버튼 클릭 =====
  console.log('📍 STEP 2: "Offline Mode" 클릭');
  const offlineModeButton = page.locator('button:has-text("Offline Mode")');
  await expect(offlineModeButton).toBeVisible({ timeout: 5000 });
  console.log('  ✅ "Offline Mode" 버튼 발견');

  await page.screenshot({ path: 'test-results/phase9-1-main-menu.png' });
  console.log('  📸 메인 메뉴 스크린샷 저장');

  await offlineModeButton.click();
  console.log('  ✅ "Offline Mode" 클릭됨');

  // CharacterSelect 화면 대기
  await page.waitForTimeout(1000);
  console.log('  ⏳ 캐릭터 선택 화면으로 이동 중...\n');

  // ===== STEP 3: 캐릭터 선택 =====
  console.log('📍 STEP 3: 캐릭터 2개 선택');

  // 캐릭터 선택 화면 확인
  const selectFighterText = page.locator('h2:has-text("Select Your Fighter")');
  await expect(selectFighterText).toBeVisible({ timeout: 10000 });
  console.log('  ✅ "Select Your Fighter" 화면 표시됨');

  // 첫 번째 캐릭터 클릭 (player1)
  const characterCards = page.locator('[class*="character-card"]');
  const cardCount = await characterCards.count();
  console.log(`  🦴 감지된 캐릭터: ${cardCount}개`);

  if (cardCount > 0) {
    // Player 1 선택
    const firstCharacter = characterCards.first();
    await expect(firstCharacter).toBeVisible();
    const player1Name = await firstCharacter.locator('p').first().textContent();
    await firstCharacter.click();
    console.log(`  ✅ Player 1 선택: ${player1Name}`);

    await page.waitForTimeout(500);

    // Player 2 선택
    if (cardCount > 1) {
      const secondCharacter = characterCards.nth(1);
      await expect(secondCharacter).toBeVisible();
      const player2Name = await secondCharacter.locator('p').first().textContent();
      await secondCharacter.click();
      console.log(`  ✅ Player 2 선택: ${player2Name}`);
    }

    await page.screenshot({ path: 'test-results/phase9-2-character-select.png' });
    console.log('  📸 캐릭터 선택 화면 스크린샷 저장\n');
  }

  // ===== STEP 4: 게임 화면 진입 =====
  console.log('📍 STEP 4: 게임 화면 진입');

  // GameScreen 확인
  await page.waitForTimeout(2000);

  // Character Info Bar 확인
  const characterInfoBar = page.locator('.bg-surface-bg\\/80');
  const infoBarVisible = await characterInfoBar.isVisible({ timeout: 10000 }).catch(() => false);
  console.log(`  ${infoBarVisible ? '✅' : '⚠️'} Character Info Bar: ${infoBarVisible ? '표시됨' : '미표시'}`);

  // Player 이름 확인
  const player1Label = page.locator('text=PLAYER 1');
  const player2Label = page.locator('text=PLAYER 2');

  const p1Visible = await player1Label.isVisible({ timeout: 5000 }).catch(() => false);
  const p2Visible = await player2Label.isVisible({ timeout: 5000 }).catch(() => false);

  console.log(`  ${p1Visible ? '✅' : '⚠️'} Player 1 레이블: ${p1Visible ? '표시됨' : '미표시'}`);
  console.log(`  ${p2Visible ? '✅' : '⚠️'} Player 2 레이블: ${p2Visible ? '표시됨' : '미표시'}`);

  // HUD 요소 확인
  const hud = page.locator('[class*="hud"], [class*="HUD"]');
  const hudVisible = await hud.first().isVisible({ timeout: 5000 }).catch(() => false);
  console.log(`  ${hudVisible ? '✅' : '⚠️'} HUD: ${hudVisible ? '표시됨' : '미표시'}`);

  // 캔버스 요소 확인 (게임 렌더링)
  const canvases = await page.locator('canvas').all();
  console.log(`  🎨 캔버스 요소: ${canvases.length}개`);

  // Character 컴포넌트 확인 - DOM에 실제로 있는지
  const character1 = page.locator('[data-testid="character-ryu"]');
  const character2 = page.locator('[data-testid="character-ken"]');
  const char1Count = await character1.count();
  const char2Count = await character2.count();
  console.log(`  🎮 Character 1 (Ryu) DOM 요소: ${char1Count}개`);
  console.log(`  🎮 Character 2 (Ken) DOM 요소: ${char2Count}개`);

  // 모든 div with style 요소 count
  const allDivs = await page.locator('div[style]').count();
  console.log(`  📦 Style이 있는 div 요소: ${allDivs}개`);

  await page.screenshot({ path: 'test-results/phase9-3-game-screen.png' });
  console.log('  📸 게임 화면 스크린샷 저장\n');

  // ===== STEP 5: 게임 플레이 검증 =====
  console.log('📍 STEP 5: 게임 플레이 (15초 렌더링)');
  console.log('  ▶️  게임 렌더링 중...');

  // 키 입력 시뮬레이션
  const gameKeys = ['ArrowLeft', 'ArrowRight', 'Space'];
  const playStartTime = Date.now();

  let keyIndex = 0;
  while (Date.now() - playStartTime < 15000) {
    if ((Date.now() - playStartTime) % 2000 < 100) {
      const key = gameKeys[keyIndex % gameKeys.length];
      await page.keyboard.press(key);
      keyIndex++;
    }
    await page.waitForTimeout(100);
  }

  console.log('  ✅ 15초 게임 플레이 완료\n');

  // ===== STEP 6: 최종 검증 =====
  console.log('📍 STEP 6: 최종 검증');

  const allTestsPassed = p1Visible && p2Visible && hudVisible;

  console.log('📋 검증 결과:');
  console.log(`  ${p1Visible ? '✅' : '❌'} Player 1 표시`);
  console.log(`  ${p2Visible ? '✅' : '❌'} Player 2 표시`);
  console.log(`  ${hudVisible ? '✅' : '❌'} HUD 표시`);
  console.log(`  ${canvases.length > 0 ? '✅' : '⚠️'} 캔버스 렌더링`);
  console.log(`\n========== Phase 9 테스트 ${allTestsPassed ? '✅ 성공' : '⚠️ 부분완료'} ==========\n`);

  // 최종 검증
  expect(p1Visible).toBe(true);
  expect(p2Visible).toBe(true);
});
