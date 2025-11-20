# Phase 8 - 테스트 계획 및 성공 기준

**작성일**: 2025-11-20
**최종 수정**: 2025-11-20
**상태**: 🟢 완료

---

## 📋 개요

Phase 8 (3D 리깅 시스템) POC의 테스트 전략 및 성공 기준을 정의합니다.

---

## 🎯 테스트 목표

1. **기술 검증**: Three.js FBX 로더가 정상 작동하는지 확인
2. **기능 검증**: 본 매핑, 애니메이션 재생이 정상인지 확인
3. **성능 검증**: 로드 시간, FPS, 메모리 사용량 측정
4. **통합 검증**: React 컴포넌트와 Three.js 엔진의 통합 확인

---

## 🧪 백엔드 테스트 (Python - 선택사항)

Phase 8은 프론트엔드 중심 POC이므로 Python 테스트는 최소화합니다.

### 테스트 실행 명령
```bash
cd /path/to/AI_Battle_Arena
PYTHONPATH=. python -m pytest tests/ -v --tb=short
```

### 테스트 항목 (예정)
- WebRTC 데이터 전송 형식 검증
- 3D 본 위치 데이터 계산 (향후)

---

## 🌐 API 테스트 (curl/HTTP - 선택사항)

현재 단계에서는 API 테스트 불필요합니다.

---

## 📱 프론트엔드 테스트 (npm/Vitest)

### 테스트 실행 명령

```bash
cd arcade-clash

# 모든 테스트 실행
npm test

# watch 모드
npm run test:watch

# 커버리지 리포트
npm run test:coverage
```

### 테스트 케이스

#### TC-1: CharacterLoader 초기화

**목표**: FBX 로더가 정상적으로 초기화되는지 확인

```typescript
describe('CharacterLoader', () => {
  it('should initialize FBX loader', () => {
    const loader = new CharacterLoader();
    expect(loader).toBeDefined();
  });

  it('should load FBX file', async () => {
    const loader = new CharacterLoader();
    // Mixamo 테스트 캐릭터 로드
    const character = await loader.loadCharacter('/assets/models/mixamo/character.fbx');

    expect(character.mesh).toBeDefined();
    expect(character.skeleton).toBeDefined();
    expect(character.animations).toBeDefined();
  });
});
```

**성공 기준**:
- FBX 파일 로드 성공
- SkinnedMesh 객체 생성 확인
- Skeleton 및 Animation 데이터 포함

#### TC-2: BoneMapper 자동 매핑

**목표**: Mixamo 본이 표준 본으로 자동 매핑되는지 확인

```typescript
describe('BoneMapper', () => {
  it('should auto-map Mixamo bones', () => {
    // Mixamo 본 목록
    const bones = [
      { name: 'mixamorig:Hips' },
      { name: 'mixamorig:Spine' },
      { name: 'mixamorig:LeftArm' }
    ] as THREE.Bone[];

    const mapping = BoneMapper.autoMapBones(bones);

    expect(mapping.get('mixamorig:Hips')).toBe('Hips');
    expect(mapping.get('mixamorig:Spine')).toBe('Spine');
    expect(mapping.get('mixamorig:LeftArm')).toBe('LeftArm');
  });

  it('should handle unmapped bones gracefully', () => {
    const bones = [
      { name: 'UnknownBone' }
    ] as THREE.Bone[];

    const mapping = BoneMapper.autoMapBones(bones);
    expect(mapping.has('UnknownBone')).toBe(false);
  });
});
```

**성공 기준**:
- 주요 본(Hips, Spine, etc.) 매핑 성공률 90% 이상
- 매핑 실패한 본에 대한 로그 기록

#### TC-3: CharacterRenderer 렌더링

**목표**: OrthographicCamera를 이용한 정면 렌더링 확인

```typescript
describe('CharacterRenderer', () => {
  it('should create renderer with OrthographicCamera', () => {
    const container = document.createElement('div');
    const renderer = new CharacterRenderer(container, 800, 600);

    // 카메라 설정 확인
    expect(renderer['camera']).toBeInstanceOf(THREE.OrthographicCamera);
  });

  it('should render mesh without errors', (done) => {
    const container = document.createElement('div');
    const renderer = new CharacterRenderer(container, 800, 600);

    // 메시 생성 및 추가
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    const mesh = new THREE.Mesh(geometry, material);

    renderer.addCharacterMesh(mesh as any);

    setTimeout(() => {
      expect(renderer['scene'].children.length).toBeGreaterThan(0);
      done();
    }, 100);
  });
});
```

**성공 기준**:
- 렌더러 초기화 성공
- 메시 추가 및 렌더링 성공
- 캔버스 생성 확인

#### TC-4: CharacterViewer3D 컴포넌트

**목표**: React 컴포넌트가 정상 작동하는지 확인

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { CharacterViewer3D } from '../CharacterViewer3D';

describe('CharacterViewer3D', () => {
  it('should render character viewer', async () => {
    render(
      <CharacterViewer3D
        characterFbxUrl="/assets/models/mixamo/character.fbx"
      />
    );

    // 로딩 상태 확인
    expect(screen.getByText(/로딩 중/)).toBeInTheDocument();
  });

  it('should display FPS counter', async () => {
    render(
      <CharacterViewer3D
        characterFbxUrl="/assets/models/mixamo/character.fbx"
      />
    );

    await waitFor(() => {
      // FPS 카운터가 표시되어야 함
      expect(screen.getByText(/FPS:/)).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});
```

**성공 기준**:
- 컴포넌트 렌더링 성공
- 로딩 상태 표시
- FPS 카운터 표시

### 커버리지 목표

| 파일 | 목표 커버리지 |
|------|-------------|
| CharacterLoader.ts | 85% |
| CharacterRenderer.ts | 80% |
| BoneMapper.ts | 90% |
| CharacterViewer3D.tsx | 75% |
| **평균** | **82.5%** |

---

## 🎭 E2E 테스트 (Playwright)

### Playwright 설정

```bash
cd arcade-clash

# E2E 테스트 실행
npm run test:e2e

# 특정 테스트만 실행
npx playwright test --grep "3d-character"

# UI 모드
npx playwright test --ui
```

### 테스트 케이스

#### E2E-1: 3D 캐릭터 뷰어 로드

**시나리오**: 사용자가 3D 캐릭터 뷰어 페이지에 접근할 수 있는가

```gherkin
시나리오: 3D 캐릭터 뷰어 로드
  주어진 조건: 앱이 실행 중
  언제: /3d-character 페이지 방문
  그러면:
    - 캐릭터 로드 완료 (3초 이내)
    - 캐릭터 메시 렌더링됨
    - FPS 카운터 표시됨 (30 FPS 이상)
    - 스크린샷 자동 캡처
```

**Playwright 코드**:
```typescript
import { test, expect } from '@playwright/test';

test('3D 캐릭터 뷰어 로드', async ({ page }) => {
  // 페이지 이동
  await page.goto('http://localhost:5173/3d-character');

  // 로딩 상태 대기 (3초)
  await page.waitForTimeout(3000);

  // 캐릭터 렌더링 확인
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();

  // FPS 표시 확인
  const fpsCounter = page.locator('[data-testid="fps-counter"]');
  await expect(fpsCounter).toBeVisible();

  // 스크린샷 캡처
  await page.screenshot({
    path: 'tests/e2e/screenshots/3d_character_loaded.png'
  });
});
```

**성공 기준**:
- ✅ 페이지 로드 성공
- ✅ 캐릭터 렌더링 (로드 시간 < 3초)
- ✅ FPS 30 이상 유지
- ✅ 스크린샷 자동 캡처

#### E2E-2: 애니메이션 재생

**시나리오**: 애니메이션이 정상적으로 재생되는가

```gherkin
시나리오: 애니메이션 재생
  주어진 조건: 캐릭터가 로드됨
  언제: Walking 애니메이션 드롭다운에서 선택
  그러면:
    - 캐릭터가 움직임
    - 30 FPS 이상 유지
    - 부드러운 재생 확인 (프레임 드롭 없음)
```

#### E2E-3: 본 매핑 검증

**시나리오**: 본이 올바르게 매핑되었는가

```typescript
test('본 매핑 검증', async ({ page }) => {
  await page.goto('http://localhost:5173/3d-character');

  // 본 목록 검사 (개발자 도구)
  const boneInfo = await page.evaluate(() => {
    // window.characterDebug 라는 디버그 정보가 있다고 가정
    return (window as any).characterDebug?.bones || [];
  });

  expect(boneInfo.length).toBeGreaterThan(0);
  expect(boneInfo.some(b => b.name === 'Hips')).toBe(true);
});
```

**성공 기준**:
- ✅ 주요 본 매핑 확인 (Hips, Spine, LeftArm, RightArm 등)
- ✅ 총 본 개수 20개 이상

### Playwright 아티팩트

모든 테스트 실행 후 다음 파일 자동 생성:
- `tests/e2e/screenshots/` - 각 테스트의 스크린샷
- `test-results/` - 테스트 결과 및 비디오
- `playwright-report/` - HTML 리포트

---

## 📊 성능 테스트

### 성능 측정 항목

#### PT-1: 로드 시간

```typescript
// CharacterLoader.test.tsx에서 측정
it('should load character within 3 seconds', async () => {
  const startTime = performance.now();
  const character = await loader.loadCharacter('/assets/models/mixamo/character.fbx');
  const loadTime = performance.now() - startTime;

  expect(loadTime).toBeLessThan(3000);  // 3초 이내
  console.log(`Load time: ${loadTime.toFixed(2)}ms`);
});
```

**성공 기준**: < 3초 (허용: 5초 이내)

#### PT-2: FPS (초당 프레임 수)

```typescript
// CharacterViewer3D에서 자동 측정
// FPS 계산: 초당 렌더링된 프레임 수

// 60 FPS 목표
// 허용: 30 FPS 이상
```

**성공 기준**: 60 FPS (허용: 30 FPS 이상)

#### PT-3: 메모리 사용량

```typescript
// Chrome DevTools Performance 탭에서 측정
// 또는 Playwright에서 자동 계산

it('should use less than 500MB memory', async () => {
  const memory = performance.memory;
  expect(memory.usedJSHeapSize).toBeLessThan(500 * 1024 * 1024);
});
```

**성공 기준**: < 500MB (허용: 1GB 이내)

---

## 📋 테스트 체크리스트

### 개발 완료 기준 (DoD 수준 2)

#### 코드 작성
- [ ] 모든 기능 구현 완료 (CharacterLoader, Renderer, Mapper, Component)
- [ ] 코드 스타일 가이드라인 준수 (linting 통과)
- [ ] 주석 및 문서화 포함
- [ ] 에러 처리 및 예외 처리 구현 (FBX 로드 실패, 본 매핑 실패 등)

#### 테스트
- [ ] 모든 Vitest 단위 테스트 작성 및 통과
- [ ] npm test 커버리지 80% 이상
- [ ] Playwright E2E 테스트 작성 및 통과 (3개 이상)
- [ ] 스크린샷 자동 캡처 확인
- [ ] 성능 테스트 완료 (로드 시간, FPS, 메모리)

#### 문서화
- [ ] CharacterLoader 클래스 주석 작성
- [ ] CharacterRenderer 설정 문서화
- [ ] BoneMapper 패턴 설명
- [ ] 테스트 결과 문서화

### 테스트 실행 순서

1. **npm test** - 단위 테스트 및 통합 테스트
2. **npm run test:coverage** - 커버리지 리포트 생성
3. **npm run test:e2e** - Playwright E2E 테스트
4. **성능 측정** - 로드 시간, FPS, 메모리
5. **문서화** - 모든 테스트 결과 기록

---

## 📊 성공 기준

### 종합 성공 기준

| 항목 | 목표 | 허용 범위 | 우선순위 |
|------|------|----------|---------|
| 로드 시간 | < 3초 | 5초 이내 | 🔴 필수 |
| FPS | 60 | 30+ | 🔴 필수 |
| 메모리 | < 500MB | 1GB 이내 | 🟡 높음 |
| 본 매핑 성공률 | 90% | 70%+ | 🔴 필수 |
| npm test 통과율 | 100% | 95%+ | 🔴 필수 |
| 커버리지 | 85% | 80%+ | 🟡 높음 |
| E2E 테스트 통과율 | 100% | 80%+ | 🔴 필수 |
| 스크린샷 캡처 | ✅ | - | 🔴 필수 |

### 최종 합격 조건

모든 테스트 통과 AND 다음 조건 만족:

```
✅ npm test: 모든 테스트 통과
✅ npm run test:coverage: 커버리지 80% 이상
✅ npm run test:e2e: 모든 E2E 테스트 통과
✅ 성능: 로드 시간 < 5초, FPS > 30
✅ 본 매핑: 성공률 70% 이상
✅ 문서화: 모든 테스트 결과 기록
```

---

## 🚨 알려진 위험 및 대응 방안

### 위험 1: FBX 로더 호환성

**증상**: FBX 파일을 로드할 수 없음
**대응**:
- GLTF 형식으로 변환
- Three.js GLTFLoader 사용

### 위험 2: 낮은 FPS

**증상**: 애니메이션 재생 시 프레임 드롭
**대응**:
- 메시 폴리곤 감소
- 본 개수 감소
- WebGL 렌더링 최적화

### 위험 3: 본 매핑 실패

**증상**: 자동 매핑된 본의 이름이 틀림
**대응**:
- 정규식 패턴 추가
- 수동 매핑 옵션 제공
- 매핑 실패한 본 로그 기록

---

## 📝 테스트 결과 문서화

모든 테스트 실행 후 다음 정보 기록:

```markdown
## 테스트 실행 결과 - [날짜]

### npm test 결과
```bash
PASS  Tests: XX passed, X failed
Coverage: XX%
Time: XXXms
```

### npm run test:e2e 결과
```bash
✓ E2E 테스트 1
✓ E2E 테스트 2
✓ E2E 테스트 3
```

### 성능 측정
- 로드 시간: XX.XXms
- 평균 FPS: XX
- 메모리 사용: XXMb

### 스크린샷
- tests/e2e/screenshots/...
```

---

**버전**: 1.0
**작성자**: Claude Code
**마지막 수정**: 2025-11-20
