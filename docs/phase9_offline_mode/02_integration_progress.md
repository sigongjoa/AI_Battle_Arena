# Phase 9: Offline Mode 게임 플로우 구현 - 통합 진행상황

**프로젝트**: AI Battle Arena
**목표**: Phase 8 3D 리깅 시스템을 게임에 통합
**상태**: 🟡 **진행 중** (2025-11-20)

---

## 📋 완료된 작업

### 1. ✅ Game3D.tsx 리팩토링 (3D 리깅 시스템 통합)

**변경사항**:
- @react-three/fiber 기반 구현 → Three.js 직접 사용
- 임시 박스 캐릭터 → CharacterLoader/CharacterRenderer 사용
- 자동 본 매핑 (BoneMapper) 통합
- 오류 발생 시 플레이스홀더 박스로 폴백

**주요 기능**:
```typescript
// Phase 8 컴포넌트 통합
import { CharacterLoader } from '../src/3d-rigging/CharacterLoader';
import { CharacterRenderer } from '../src/3d-rigging/CharacterRenderer';
import { BoneMapper } from '../src/3d-rigging/BoneMapper';

// 캐릭터별 로드 및 렌더링
for (const characterName of characterNames) {
  const loader = new CharacterLoader();
  const character = await loader.loadCharacter(fbxUrl);
  const boneMapping = BoneMapper.autoMapBones(character.skeleton.bones);
  BoneMapper.applyMapping(character.mesh, boneMapping);
  rendererRef.current.addCharacterMesh(character.mesh);
}

// 게임 상태와 3D 렌더링 동기화
updateCharacterPositions(gameState);
```

**주요 개선사항**:
- 🎮 정면 2D 뷰 (OrthographicCamera) 사용
- 🔄 게임 상태 업데이트 시 캐릭터 위치/애니메이션 동기화
- 📊 FPS 모니터링 및 로드 타임 측정
- ⚙️ 에러 핸들링 및 로딩 상태 표시
- 🎨 개선된 HUD (체력바, 타이머, 성능 정보)

---

### 2. ✅ CharacterRenderer.ts 확장

**추가된 메서드**:
```typescript
getScene(): THREE.Scene {
  return this.scene;
}
```

**목적**: Game3D에서 씬에 직접 접근 필요 시 사용

---

### 3. ✅ GameScreen.tsx 통합

**변경사항**:
```typescript
{/* Use Game3D (Phase 8 3D rigging system) for 3D rendering */}
<Game3D
  gameState={gameState}
  player1={player1}
  player2={player2}
  characterFbxUrls={{}}
/>
{/* <GameArena gameState={gameState} player1={player1} player2={player2} /> */}
```

**특징**:
- Game3D와 GameArena 간 간단한 토글 가능
- 기존 GameScreen 로직 유지 (키보드 입력, 게임 루프 등)
- 기존 HUD 유지 (캐릭터 정보 바)

---

## 🔧 기술 세부사항

### Game3D 렌더링 파이프라인

```
GameScreen (게임 상태 관리)
    ↓
Game3D (3D 렌더링)
    ├─ CharacterLoader (FBX 로드)
    ├─ BoneMapper (본 자동 매핑)
    ├─ CharacterRenderer (Three.js 렌더링)
    └─ updateCharacterPositions (게임 상태 동기화)
```

### Props 구조

```typescript
interface Game3DProps {
  gameState: {
    timer: number;
    players: GamePlayer[];
  };
  player1: CharacterType;
  player2: CharacterType;
  characterFbxUrls?: { [key: string]: string };
}
```

### 캐릭터 로딩 플로우

1. 게임 상태에서 필요한 캐릭터 목록 추출
2. CharacterLoader로 FBX 파일 로드
3. BoneMapper로 자동 본 매핑
4. CharacterRenderer에 메시 추가
5. 애니메이션 루프 시작 및 게임 상태 동기화

---

## ⚠️ 현재 알려진 문제 및 제한사항

### 1. FBX 파일 경로
- 현재: `/models/{characterName}.fbx` (플레이스홀더)
- 필요: 실제 Mixamo FBX 파일 URL 또는 로컬 경로 제공
- 해결: `characterFbxUrls` prop으로 매핑 가능

### 2. 애니메이션 재생
- 현재: 게임 상태의 action 값을 읽지만 애니메이션 클립을 재생하지 않음
- 필요: `CharacterLoader.playAnimation()` 메서드 호출
- 예정: Phase 10에서 구현

### 3. 플레이스홀더 폴백
- FBX 로드 실패 시 회색 박스로 표시
- 프로덕션 환경에서는 에러 로깅 및 사용자 알림 필요

---

## 📈 다음 단계

### Phase 9-B: 게임 상태 동기화 완성

1. **애니메이션 재생 구현**
   - `CharacterLoader.playAnimation()` 호출
   - 게임 액션(idle/walk/punch) → 애니메이션 클립 매핑

2. **카메라 제어**
   - OrthographicCamera 줌 조정
   - 캐릭터 거리에 따른 자동 초점

3. **이펙트 및 파티클**
   - 공격 이펙트 (펀치 시 파티클)
   - 체력 감소 이펙트
   - 게임 종료 이펙트

### Phase 10: 게임 로직 완성

1. **충돌 감지**
   - 현재 Python 게임 엔진에서 관리
   - 3D 메시에 영향 없음

2. **점수 계산**
   - 기존 로직 사용

3. **결과 화면**
   - 승자/패자 표시
   - 통계 표시

---

## 🧪 테스트 전략

### 단위 테스트
- [ ] Game3D 컴포넌트 렌더링
- [ ] 캐릭터 로딩 및 본 매핑
- [ ] 게임 상태 동기화

### E2E 테스트
- [ ] MainMenu → CharacterSelect → GameScreen (Game3D) 플로우
- [ ] 캐릭터 이동 및 위치 업데이트
- [ ] FBX 로드 오류 처리

### 수동 테스트 체크리스트
- [ ] Game3D 컴포넌트 렌더링 확인
- [ ] 캐릭터 표시 (또는 플레이스홀더 박스)
- [ ] FPS 모니터링 (50+ FPS)
- [ ] 게임 상태에 따른 위치 업데이트
- [ ] 오류 메시지 표시

---

## 📊 성능 지표 (목표)

| 항목 | 목표 | 상태 |
|------|------|------|
| 초기 로드 시간 | < 3초 | ⏳ 대기 |
| FPS | 50+ | ⏳ 대기 |
| 메모리 사용 | < 500MB | ⏳ 대기 |
| 본 매핑 성공률 | 90%+ | ⏳ 대기 |

---

## 📝 코드 변경사항 요약

### Game3D.tsx (완전 리팩토링)
- **변경 전**: @react-three/fiber + 임시 박스 모델 (189줄)
- **변경 후**: Three.js 직접 사용 + Phase 8 리깅 시스템 (294줄)
- **추가 기능**: CharacterLoader, BoneMapper, 에러 처리, FPS 모니터링

### CharacterRenderer.ts (확장)
- **추가**: `getScene()` 메서드

### GameScreen.tsx (통합)
- **추가**: Game3D 컴포넌트 사용
- **유지**: 기존 GameArena와 호환성 유지 (주석 처리)

---

## 🎯 성공 기준

| 항목 | 기준 |
|------|------|
| **컴포넌트 렌더링** | Game3D 컴포넌트가 정상적으로 렌더링됨 |
| **FBX 로딩** | 캐릭터 로딩 성공 또는 플레이스홀더 표시 |
| **게임 상태 동기화** | 캐릭터 위치가 gameState 변화에 따라 업데이트됨 |
| **TypeScript 안정성** | Game3D 관련 타입 오류 없음 |
| **에러 처리** | FBX 로드 실패 시 적절한 오류 메시지 표시 |

---

## 📚 참고 자료

- **Phase 8 문서**: `/docs/phase8_3d_rigging_system/README.md`
- **CharacterLoader**: `/arcade-clash/src/3d-rigging/CharacterLoader.ts`
- **CharacterRenderer**: `/arcade-clash/src/3d-rigging/CharacterRenderer.ts`
- **BoneMapper**: `/arcade-clash/src/3d-rigging/BoneMapper.ts`
- **CharacterViewer3D**: `/arcade-clash/src/3d-rigging/CharacterViewer3D.tsx`

---

## 🔄 Version History

| 날짜 | 상태 | 설명 |
|------|------|------|
| 2025-11-20 | 🟡 진행 중 | Game3D 리팩토링 및 통합 (CharacterLoader/Renderer/BoneMapper) |

---

**마지막 업데이트**: 2025-11-20
**다음 단계**: 개발 서버 테스트 및 FBX 로딩 검증
