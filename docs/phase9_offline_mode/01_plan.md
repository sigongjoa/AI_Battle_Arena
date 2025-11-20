# Phase 9: Offline Mode 게임 플로우 구현

**프로젝트**: AI Battle Arena
**목표**: 메인메뉴 → 캐릭터선택 → 게임플레이의 완전한 Offline Mode 게임 플로우 구현
**상태**: 🔵 계획 수립 (2025-11-20)

---

## 📋 목표 및 범위

### 목표
Offline Mode에서 1vs1 로컬 게임을 플레이할 수 있는 완전한 게임 플로우 구축

### 범위
1. **MainMenu.tsx 수정**
   - "Offline Mode" 버튼 클릭 → CharacterSelect 화면으로 정상 이동
   - 네비게이션 Props 문제 해결

2. **CharacterSelect.tsx 개선**
   - 캐릭터 목록 표시 (constants.ts에서 CHARACTERS 사용)
   - 2명의 캐릭터 순차 선택 UI
   - 선택 완료 후 GameScreen으로 이동

3. **GameScreen.tsx 구현**
   - 선택된 두 캐릭터 정보 표시
   - 기본 게임 렌더링 (캔버스)
   - HUD (체력바, 점수 등) 표시
   - 게임 일시정지/재개 기능

4. **App.tsx 통합**
   - 상태 관리: selectedPlayer1, selectedPlayer2
   - 네비게이션 로직: Menu → CharSelect → GameScreen → Results
   - Props 타입 정의 및 통일

### 아웃 오브 스코프
- 3D 캐릭터 렌더링 (Phase 8과 통합은 별도)
- AI 플레이어 구현
- 네트워크 대전 (Online Mode)
- 복잡한 게임 로직 (이미 있는 것 사용)

---

## 🎯 구현 상세 계획

### STEP 1: App.tsx 정리 (타입 및 상태 통일)
**파일**: `App.tsx`

**할 일**:
1. `Screen` enum 확인
2. `Character` 타입 import
3. 상태 추가:
   - `selectedPlayer1: Character | null`
   - `selectedPlayer2: Character | null`
4. 핸들러 함수:
   - `handleCharacterSelectionComplete(p1, p2)`
5. renderScreen()에서 각 Screen별 props 정확히 전달

**체크포인트**:
- TypeScript 컴파일 에러 없음
- 각 컴포넌트에 필요한 props 전달됨

---

### STEP 2: MainMenu.tsx 수정 (네비게이션 타입 통일)
**파일**: `components/MainMenu.tsx`

**현재 상태**:
```typescript
interface MainMenuProps {
  onNavigate: (screen: Screen, subScreen?: 'main' | 'lobby') => void;
  // ... 기타 props
}
```

**문제**:
- App.tsx의 `navigateTo` 시그니처와 불일치 가능성

**할 일**:
1. Props 인터페이스 확인 및 정리
2. 불필요한 props 제거 (playerId, lobbyPlayers 등 Offline에서 불필요)
3. "Offline Mode" 버튼 클릭 → `onNavigate(Screen.CharacterSelect)` 호출 확인

**체크포인트**:
- 버튼 클릭 시 CharacterSelect 화면으로 이동

---

### STEP 3: CharacterSelect.tsx 개선
**파일**: `components/CharacterSelect.tsx`

**현재 상태**:
- 캐릭터 목록이 비어있음
- Props: `characters: Character[]`, `onSelectionComplete` 콜백

**할 일**:
1. Props 수정:
   ```typescript
   interface CharacterSelectProps {
     characters: Character[];
     onSelectionComplete: (player1: Character, player2: Character) => void;
     onNavigate: (screen: Screen) => void;
   }
   ```
2. UI 개선:
   - "Select Player 1" 상태에서 캐릭터 카드 표시
   - 첫 번째 선택 후 "Select Player 2" 상태 표시
   - 두 번째 선택 후 자동으로 GameScreen으로 이동
3. 캐릭터 카드 렌더링:
   - 이미지, 이름, 설명 표시
   - 선택된 캐릭터 하이라이트
   - 클릭 가능한 상태 관리

**체크포인트**:
- 캐릭터 목록 표시됨
- 2개 캐릭터 선택 가능
- 선택 완료 시 onSelectionComplete 콜백 호출

---

### STEP 4: GameScreen.tsx 기본 구현
**파일**: `components/GameScreen.tsx`

**현재 상태**:
- Props에 webRtcClient, onNavigate만 있음
- 더미 플레이어 데이터 사용

**할 일**:
1. Props 수정:
   ```typescript
   interface GameScreenProps {
     player1: Character;  // 필수
     player2: Character;  // 필수
     onNavigate: (screen: Screen) => void;
     webRtcClient?: any;  // 선택
   }
   ```
2. 선택된 캐릭터 정보 표시:
   - 이름, 이미지, 설명
3. 게임 UI 구현:
   - HUD (체력바, 점수)
   - 캔버스 렌더링 영역
   - 게임 상태 표시
4. 기본 게임 상호작용:
   - 키보드 입력 감지
   - 일시정지/재개 기능

**체크포인트**:
- 선택된 두 캐릭터 이름 표시
- 게임 화면이 렌더링됨
- HUD가 정상 작동

---

## 📊 구현 순서

```
STEP 1: App.tsx 정리
  ↓
STEP 2: MainMenu.tsx 수정
  ↓
STEP 3: CharacterSelect.tsx 개선
  ↓
STEP 4: GameScreen.tsx 기본 구현
  ↓
테스트 및 통합
```

---

## 🧪 테스트 전략

### 단위 테스트 (Vitest)
- [ ] CharacterSelect: 캐릭터 선택 로직
- [ ] GameScreen: Props 렌더링
- [ ] App: 네비게이션 상태 변화

### E2E 테스트 (Playwright)
- [ ] 메인 → CharSelect → GameScreen 플로우
- [ ] 캐릭터 선택 동작
- [ ] 게임 화면 렌더링

### 수동 테스트 체크리스트
- [ ] "Offline Mode" 버튼 클릭 시 CharacterSelect 화면 나타남
- [ ] 캐릭터 2개 선택 가능
- [ ] 선택 완료 후 GameScreen으로 이동
- [ ] 두 캐릭터 이름이 게임 화면에 표시됨

---

## 📈 성공 기준

| 항목 | 기준 |
|------|------|
| **네비게이션** | MainMenu → CharSelect → GameScreen 흐름 완벽 작동 |
| **캐릭터 선택** | 2개 캐릭터 순차 선택 가능 |
| **데이터 전달** | 선택된 캐릭터 정보가 GameScreen에 정확히 전달 |
| **UI 렌더링** | 모든 화면이 정상 렌더링됨 |
| **타입 안정성** | TypeScript 컴파일 에러 0개 |

---

## 📝 예상 소요 시간

| STEP | 항목 | 예상 시간 |
|------|------|---------|
| 1 | App.tsx 정리 | 1시간 |
| 2 | MainMenu.tsx 수정 | 30분 |
| 3 | CharacterSelect.tsx 개선 | 1시간 |
| 4 | GameScreen.tsx 기본 구현 | 1.5시간 |
| - | 테스트 및 버그 수정 | 1시간 |
| **합계** | - | **5시간** |

---

## 🎯 다음 단계 (Phase 10 이후)

1. **Phase 10**: 3D 캐릭터 렌더링 통합 (Phase 8과 통합)
2. **Phase 11**: 게임 로직 완성 (전투, 점수 계산)
3. **Phase 12**: 결과 화면 및 리플레이

---

**작성자**: Claude Code
**작성일**: 2025-11-20
**상태**: 🔵 계획 수립 완료
