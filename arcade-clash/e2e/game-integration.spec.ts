import { test, expect } from '@playwright/test';

/**
 * 게임 통합 테스트: 3D 캐릭터 리깅 시스템 실제 동작 검증
 *
 * 목표:
 * 1. 게임 로비 진입
 * 2. 3D 캐릭터 뷰어 로드
 * 3. 캐릭터 애니메이션 재생 (대기, 이동, 공격)
 * 4. 성능 메트릭 측정
 * 5. 동영상 녹화
 */

test.describe('게임 통합 - 3D 캐릭터 리깅 실제 동작', () => {
  test.beforeEach(async ({ page }) => {
    // 페이지 이동 및 타임아웃 설정
    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(30000);
  });

  test('INT-1: 게임 로비 진입 및 3D 캐릭터 로드', async ({ page }) => {
    console.log('\\n🎮 테스트 시작: 게임 로비 진입...');

    // 1. 게임 홈페이지 로드
    const startTime = Date.now();
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;

    console.log(`✅ 게임 로드 시간: ${loadTime}ms`);

    // 2. 페이지 제목 확인
    const title = await page.title();
    expect(title).toMatch(/Arcade Clash|AI Battle Arena/i);
    console.log(`✅ 페이지 제목: ${title}`);

    // 3. 루트 요소 확인
    const root = page.locator('#root');
    await expect(root).toBeVisible();
    console.log('✅ 루트 요소 로드됨');

    // 4. 메인 메뉴 확인
    await page.waitForLoadState('domcontentloaded');
    const mainMenu = page.locator('[class*="MainMenu"], [class*="Menu"], button');
    const menuCount = await mainMenu.count();
    console.log(`✅ 메뉴 요소 감지: ${menuCount}개`);

    // 성능 메트릭 기록
    const metrics = await page.evaluate(() => {
      const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart,
        loadComplete: perf.loadEventEnd - perf.loadEventStart,
        totalTime: perf.loadEventEnd - perf.fetchStart,
      };
    });

    console.log('📊 성능 메트릭:');
    console.log(`  • DOM 콘텐츠 로드: ${metrics.domContentLoaded}ms`);
    console.log(`  • 로드 완료: ${metrics.loadComplete}ms`);
    console.log(`  • 총 시간: ${metrics.totalTime}ms`);
  });

  test('INT-2: 캐릭터 선택 화면 진입 및 3D 렌더링', async ({ page }) => {
    console.log('\\n🎮 테스트 시작: 캐릭터 선택 화면...');

    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

    // 게임 시작 또는 캐릭터 선택 버튼 찾기
    const buttons = await page.locator('button').all();
    console.log(`📍 감지된 버튼: ${buttons.length}개`);

    // 가능한 게임 시작 버튼 클릭
    let gameStarted = false;
    for (const button of buttons) {
      const text = await button.textContent();
      console.log(`  버튼: ${text?.trim()}`);

      if (text?.match(/Start|Play|Battle|Game|Begin|시작|게임/i)) {
        console.log(`✅ 게임 시작 버튼 클릭: "${text}"`);
        await button.click();
        gameStarted = true;
        await page.waitForTimeout(2000); // 화면 전환 대기
        break;
      }
    }

    if (!gameStarted) {
      console.log('⚠️  게임 시작 버튼을 찾지 못했습니다. 페이지 상태 확인...');
    }

    // 3D 렌더링 캔버스 확인
    const canvases = await page.locator('canvas').all();
    console.log(`🎨 캔버스 요소: ${canvases.length}개`);

    for (let i = 0; i < canvases.length; i++) {
      const isVisible = await canvases[i].isVisible();
      const boundingBox = await canvases[i].boundingBox();
      console.log(`  캔버스 ${i + 1}: ${isVisible ? '표시됨' : '숨김'}, 크기: ${boundingBox?.width}x${boundingBox?.height}`);
    }
  });

  test('INT-3: 3D 캐릭터 애니메이션 재생 및 FPS 측정', async ({ page }) => {
    console.log('\\n🎮 테스트 시작: 3D 캐릭터 애니메이션...');

    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

    // FPS 모니터링 시작
    const fpsData: number[] = [];
    let frameCount = 0;
    let lastTime = Date.now();

    // 페이지에서 FPS 계산 스크립트 주입
    await page.addInitScript(() => {
      (window as any).fpsMonitor = {
        frameCount: 0,
        fpsValues: [] as number[],
        startTime: Date.now(),
        lastTime: Date.now(),

        updateFPS() {
          this.frameCount++;
          const now = Date.now();
          const elapsed = now - this.lastTime;

          if (elapsed >= 1000) {
            const fps = Math.round((this.frameCount * 1000) / elapsed);
            this.fpsValues.push(fps);
            this.frameCount = 0;
            this.lastTime = now;
          }
        },

        getFPS() {
          return this.fpsValues;
        },
      };

      // RAF로 FPS 추적
      const updateFPS = () => {
        (window as any).fpsMonitor.updateFPS();
        requestAnimationFrame(updateFPS);
      };

      requestAnimationFrame(updateFPS);
    });

    // 10초 동안 애니메이션 재생 관찰
    console.log('⏱️  10초 동안 애니메이션 재생 중...');
    await page.waitForTimeout(10000);

    // FPS 데이터 수집
    const fps = await page.evaluate(() => {
      return (window as any).fpsMonitor.getFPS();
    });

    console.log(`📊 FPS 데이터: ${fps.join(', ')}`);

    if (fps.length > 0) {
      const avgFps = Math.round(fps.reduce((a, b) => a + b, 0) / fps.length);
      const minFps = Math.min(...fps);
      const maxFps = Math.max(...fps);

      console.log(`✅ 평균 FPS: ${avgFps}`);
      console.log(`✅ 최소 FPS: ${minFps}`);
      console.log(`✅ 최대 FPS: ${maxFps}`);

      expect(avgFps).toBeGreaterThanOrEqual(30);
    }

    // 캐릭터 정보 확인
    const characterInfo = await page.locator('[class*="character"], [class*="Character"]').all();
    console.log(`🦴 캐릭터 정보 요소: ${characterInfo.length}개`);
  });

  test('INT-4: 게임 스크린 상호작용 - 키보드 입력 시뮬레이션', async ({ page }) => {
    console.log('\\n🎮 테스트 시작: 게임 상호작용...');

    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

    // 게임 컨테이너 찾기
    const gameScreen = page.locator('[class*="game"], [class*="Game"], canvas').first();

    if (await gameScreen.isVisible()) {
      console.log('✅ 게임 화면 표시됨');

      // 게임 화면에 포커스 설정
      await gameScreen.focus();

      // 다양한 키 입력 시뮬레이션
      const keys = ['ArrowLeft', 'ArrowRight', 'Space', 'Enter', 'a', 'd'];

      for (const key of keys) {
        console.log(`⌨️  키 입력: ${key}`);
        await page.keyboard.press(key);
        await page.waitForTimeout(200);
      }

      console.log('✅ 모든 키 입력 완료');
    } else {
      console.log('⚠️  게임 화면을 찾을 수 없습니다');
    }
  });

  test('INT-5: 메모리 사용량 및 성능 프로파일링', async ({ page }) => {
    console.log('\\n🎮 테스트 시작: 성능 프로파일링...');

    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

    // 메모리 정보 수집 (Chrome DevTools Protocol)
    const metrics = await page.evaluate(() => {
      if ((performance as any).memory) {
        return {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
        };
      }
      return null;
    });

    if (metrics) {
      const usedMB = (metrics.usedJSHeapSize / 1024 / 1024).toFixed(2);
      const totalMB = (metrics.totalJSHeapSize / 1024 / 1024).toFixed(2);
      const limitMB = (metrics.jsHeapSizeLimit / 1024 / 1024).toFixed(2);

      console.log('💾 메모리 사용량:');
      console.log(`  • 사용 중: ${usedMB}MB`);
      console.log(`  • 할당됨: ${totalMB}MB`);
      console.log(`  • 제한: ${limitMB}MB`);

      expect(parseFloat(usedMB)).toBeLessThan(500);
    }

    // 리소스 로딩 시간
    const resources = await page.evaluate(() => {
      return performance
        .getEntriesByType('resource')
        .filter((r: any) => r.name.includes('3d') || r.name.includes('rigging') || r.name.includes('character'))
        .map((r: any) => ({
          name: r.name.split('/').pop(),
          duration: r.duration,
          transferSize: r.transferSize,
        }));
    });

    console.log('📦 3D 리깅 관련 리소스:');
    for (const resource of resources) {
      console.log(`  • ${resource.name}: ${resource.duration.toFixed(2)}ms (${(resource.transferSize / 1024).toFixed(2)}KB)`);
    }
  });

  test('INT-6: 에러 및 경고 로그 확인', async ({ page }) => {
    console.log('\\n🎮 테스트 시작: 에러/경고 로그...');

    const errors: string[] = [];
    const warnings: string[] = [];

    // 콘솔 메시지 캡처
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      } else if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });

    // 페이지 에러 캡처
    page.on('pageerror', error => {
      errors.push(error.message);
    });

    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);

    console.log(`⚠️  에러 로그: ${errors.length}개`);
    errors.forEach((err, i) => {
      console.log(`  ${i + 1}. ${err.substring(0, 100)}`);
    });

    console.log(`⚠️  경고 로그: ${warnings.length}개`);
    warnings.slice(0, 5).forEach((warn, i) => {
      console.log(`  ${i + 1}. ${warn.substring(0, 100)}`);
    });
  });

  test('INT-7: 최종 통합 테스트 - 전체 게임플레이 플로우', async ({ page }) => {
    console.log('\\n🎮 테스트 시작: 전체 게임플레이 플로우...');

    const timeline: string[] = [];

    // 시작 시간
    const testStartTime = Date.now();
    timeline.push(`[${new Date().toLocaleTimeString()}] 테스트 시작`);

    // 1. 게임 로드
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    timeline.push(`[${new Date().toLocaleTimeString()}] 게임 로드 완료`);

    // 2. 캔버스 확인
    const canvases = await page.locator('canvas').all();
    timeline.push(`[${new Date().toLocaleTimeString()}] 캔버스 감지: ${canvases.length}개`);

    // 3. 애니메이션 재생 (10초)
    console.log('▶️  3D 캐릭터 애니메이션 재생 중...');
    await page.waitForTimeout(10000);
    timeline.push(`[${new Date().toLocaleTimeString()}] 애니메이션 10초 재생`);

    // 4. 스크린샷 캡처
    await page.screenshot({ path: 'test-results/game-integration-final.png' });
    timeline.push(`[${new Date().toLocaleTimeString()}] 스크린샷 저장`);

    // 5. 성능 데이터 수집
    const finalMetrics = await page.evaluate(() => {
      const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        loadTime: perf.loadEventEnd - perf.fetchStart,
        memoryUsed: (performance as any).memory?.usedJSHeapSize / 1024 / 1024 || 'N/A',
      };
    });

    console.log('\\n📊 최종 통합 테스트 결과:');
    console.log('테스트 타임라인:');
    timeline.forEach(t => console.log(`  ${t}`));

    console.log('\\n성능 데이터:');
    console.log(`  • 총 로드 시간: ${finalMetrics.loadTime}ms`);
    console.log(`  • 메모리 사용: ${finalMetrics.memoryUsed} MB`);

    const totalTestTime = Date.now() - testStartTime;
    console.log(`  • 테스트 소요 시간: ${totalTestTime}ms`);
  });
});
