import { test, expect } from '@playwright/test';

test('Debug: 페이지 요소 확인', async ({ page }) => {
  console.log('\n========== 페이지 디버깅 ==========\n');

  // 에러 메시지 수집
  const errors: string[] = [];
  const logs: string[] = [];

  page.on('console', msg => {
    const log = `[${msg.type()}] ${msg.text()}`;
    logs.push(log);
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.log('❌', log);
    } else {
      console.log('ℹ️', log);
    }
  });

  page.on('pageerror', err => {
    console.log('❌ Page Error:', err);
    errors.push(err.toString());
  });

  await page.goto('http://localhost:5174', { waitUntil: 'networkidle' });

  // React 컴포넌트 렌더링 대기
  console.log('\nReact 컴포넌트 렌더링 대기 중...');
  await page.waitForTimeout(5000);

  // root 요소에 내용이 있을 때까지 대기
  const rootElement = page.locator('#root');
  try {
    await rootElement.waitFor({ state: 'visible', timeout: 10000 });
  } catch (e) {
    console.log('root 요소 대기 실패, 계속 진행...');
  }

  // 페이지 내용 출력
  const pageContent = await page.content();
  console.log('페이지 내용 첫 500자:');
  console.log(pageContent.substring(0, 500));

  // 모든 h1 요소 찾기
  const h1Elements = await page.locator('h1').all();
  console.log(`\nH1 요소 찾음: ${h1Elements.length}개`);

  for (let i = 0; i < h1Elements.length; i++) {
    const text = await h1Elements[i].textContent();
    console.log(`  H1 ${i}: ${text}`);
  }

  // 모든 button 요소 찾기
  const buttons = await page.locator('button').all();
  console.log(`\nButton 요소 찾음: ${buttons.length}개`);

  for (let i = 0; i < Math.min(buttons.length, 10); i++) {
    const text = await buttons[i].textContent();
    console.log(`  Button ${i}: ${text}`);
  }

  // 모든 div 요소 중 class가 있는 것
  const divs = await page.locator('div[class]').all();
  console.log(`\nDiv with class 요소 찾음: ${divs.length}개`);

  // main 요소 찾기
  const main = page.locator('main');
  const mainVisible = await main.isVisible().catch(() => false);
  console.log(`\nmain 요소 visible: ${mainVisible}`);

  // root div 내용 확인
  const root = page.locator('#root');
  const rootHTML = await root.innerHTML();
  console.log(`\n#root innerHTML 길이: ${rootHTML.length}자`);
  console.log('첫 300자:');
  console.log(rootHTML.substring(0, 300));

  // 스크린샷
  await page.screenshot({ path: 'test-results/debug-page.png' });
  console.log('\n스크린샷 저장: test-results/debug-page.png');
});
