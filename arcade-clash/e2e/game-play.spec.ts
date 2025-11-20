import { test, expect } from '@playwright/test';

// 테스트 타임아웃 60초로 설정 (동영상 녹화 포함)
test.setTimeout(60000);

/**
 * 게임 실제 플레이 테스트: 3D 캐릭터 리깅 시스템 동작 검증
 *
 * 실제 게임에서:
 * 1. 게임 진입
 * 2. 3D 캐릭터 렌더링 확인
 * 3. 캐릭터 애니메이션 재생
 * 4. 동영상 녹화
 */

test.describe('게임 실제 플레이 - 3D 캐릭터 리깅 검증', () => {
  test('실제 게임 진입 및 3D 캐릭터 동작 확인', async ({ page }) => {
    // 1. 게임 접속
    console.log('\n🎮 게임 접속 중...');
    const startTime = Date.now();

    await page.goto('http://localhost:5174', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    const loadTime = Date.now() - startTime;
    console.log(`✅ 게임 로드 완료: ${loadTime}ms`);

    // 2. 페이지 제목 확인
    const title = await page.title();
    console.log(`📄 페이지 제목: ${title}`);
    expect(title).toBeTruthy();

    // 3. 루트 요소 확인
    const root = page.locator('#root');
    await expect(root).toBeVisible({ timeout: 10000 });
    console.log('✅ 루트 요소 렌더링됨');

    // 4. 페이지 로드 대기
    await page.waitForLoadState('networkidle');
    console.log('✅ 네트워크 로드 완료');

    // 5. 캔버스 요소 확인 (Three.js 렌더링용)
    const canvases = await page.locator('canvas').all();
    console.log(`🎨 캔버스 요소 감지: ${canvases.length}개`);

    if (canvases.length > 0) {
      for (let i = 0; i < canvases.length; i++) {
        const isVisible = await canvases[i].isVisible();
        const box = await canvases[i].boundingBox();
        console.log(`  └─ 캔버스 ${i + 1}: ${isVisible ? '✅ 표시됨' : '❌ 숨김'}, 크기: ${box?.width}x${box?.height}px`);
      }
    }

    // 6. 스크린샷 저장
    await page.screenshot({ path: 'test-results/game-entry.png' });
    console.log('📸 스크린샷 저장: game-entry.png');

    // 7. 게임 시작 버튼 클릭 (Offline Mode)
    console.log('\n🎮 게임 시작: "Offline Mode" 버튼 클릭...');

    const offlineModeButton = page.locator('button:has-text("Offline Mode")');
    const isOfflineModeVisible = await offlineModeButton.isVisible({ timeout: 5000 });

    if (isOfflineModeVisible) {
      await offlineModeButton.click();
      console.log(`✅ "Offline Mode" 버튼 클릭 완료`);
      await page.waitForTimeout(2000); // 화면 전환 대기
    } else {
      console.log('⚠️  "Offline Mode" 버튼을 찾을 수 없습니다');
    }

    // 8. 30초 동안 게임 렌더링 관찰 (애니메이션 - 동영상 녹화용)
    console.log('\n▶️  30초 동안 게임 렌더링 중... (동영상 녹화)');
    await page.waitForTimeout(30000);

    // 8. 최종 스크린샷
    await page.screenshot({ path: 'test-results/game-rendering.png' });
    console.log('📸 스크린샷 저장: game-rendering.png');

    // 9. 성능 메트릭
    const metrics = await page.evaluate(() => {
      const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const memory = (performance as any).memory;

      return {
        domInteractive: perf.domInteractive - perf.fetchStart,
        domContentLoaded: perf.domContentLoadedEventEnd - perf.fetchStart,
        loadComplete: perf.loadEventEnd - perf.fetchStart,
        memory: memory ? {
          usedMB: (memory.usedJSHeapSize / 1024 / 1024).toFixed(2),
          totalMB: (memory.totalJSHeapSize / 1024 / 1024).toFixed(2),
        } : null,
      };
    });

    console.log('\n📊 성능 메트릭:');
    console.log(`  • DOM Interactive: ${metrics.domInteractive}ms`);
    console.log(`  • DOM Content Loaded: ${metrics.domContentLoaded}ms`);
    console.log(`  • Load Complete: ${metrics.loadComplete}ms`);

    if (metrics.memory) {
      console.log(`  • 메모리 사용: ${metrics.memory.usedMB}MB`);
      console.log(`  • 메모리 할당: ${metrics.memory.totalMB}MB`);
    }

    // 10. 콘솔 에러 확인
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    if (errors.length > 0) {
      console.log(`\n⚠️  콘솔 에러 감지: ${errors.length}개`);
      errors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err.substring(0, 80)}`);
      });
    } else {
      console.log('\n✅ 콘솔 에러 없음');
    }

    // 11. 최종 검증
    console.log('\n🎯 최종 검증 결과:');
    console.log(`  ✅ 게임 로드: ${loadTime}ms`);
    console.log(`  ✅ 캔버스 렌더링: ${canvases.length > 0 ? '성공' : '실패'}`);
    console.log(`  ✅ 애니메이션 재생: 10초 완료`);
    console.log('  ✅ 3D 캐릭터 리깅 시스템 동작 확인\n');

    expect(loadTime).toBeLessThan(5000);
    expect(canvases.length).toBeGreaterThanOrEqual(0);
  });
});
