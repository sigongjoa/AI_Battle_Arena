# 프론트엔드 RL-WebRTC 연동 상세 명세

## 1. 목표

`arcade-clash` 프론트엔드에 강화학습 에이전트(백엔드)와의 WebRTC 연동 기능을 추가하기 위한 파일 구조, 컴포넌트 책임, 그리고 명확한 `import/export` 전략을 정의한다. 이를 통해 코드의 모듈성을 높이고 경로 관련 오류를 사전에 방지한다.

## 2. 파일 및 폴더 구조

`arcade-clash` 디렉토리 내의 주요 변경 및 추가 파일은 다음과 같다.

```
arcade-clash/
├── components/
│   ├── GameScreen.tsx          # (수정) RL 컨트롤러를 렌더링
│   └── RLAgentController.tsx   # (신규) RL 에이전트 통신 담당
├── package.json
├── shared_game_logic/
│   └── engine.ts               # (수정) 외부 액션 적용 및 상태 반환 함수 추가
├── tsconfig.json
└── ...
```

## 3. 신규/수정 파일 명세

### 3.1. `components/RLAgentController.tsx` (신규)

*   **역할**: 백엔드 Python RL 에이전트와의 WebRTC 연결 및 데이터 통신을 총괄하는 **Headless 컴포넌트** (UI 없음).
    *   PeerJS를 사용하여 백엔드 Peer에 연결한다.
    *   데이터 채널을 통해 백엔드로부터 `action` 및 `reset` 메시지를 수신한다.
    *   수신된 `action`을 `engine.ts`의 함수를 통해 게임에 적용한다.
    *   게임의 `step` 또는 `reset` 후 결과(`observation`, `reward`, `done`)를 백엔드로 전송한다.
*   **주요 로직**:
    *   `useEffect`를 사용하여 컴포넌트 마운트 시 PeerJS 객체를 생성하고 시그널링 서버에 연결한다.
    *   백엔드 Peer ID를 props 또는 URL 파라미터로 받아 연결을 시도한다.
    *   `dataConnection.on('data', ...)` 이벤트 리스너에서 수신 메시지 타입(`action`, `reset`)에 따라 분기 처리를 수행한다.
*   **Export**:
    ```typescript
    export default RLAgentController;
    ```

### 3.2. `components/GameScreen.tsx` (수정)

*   **역할**: 게임의 메인 화면을 렌더링하며, 현재 게임 모드에 따라 `RLAgentController`를 활성화한다.
*   **주요 로직**:
    *   URL 쿼리 스트링(예: `?mode=rl_training`)이나 다른 상태 값을 확인하여 AI 학습 모드인지 판단한다.
    *   학습 모드일 경우, `RLAgentController` 컴포넌트를 렌더링에 포함시킨다.
    ```tsx
    // 예시
    const isRLMode = new URLSearchParams(window.location.search).get('mode') === 'rl_training';

    return (
      <div>
        {/* ... 기존 게임 렌더링 ... */}
        {isRLMode && <RLAgentController />}
      </div>
    );
    ```
*   **Import**:
    ```typescript
    import RLAgentController from '@/components/RLAgentController';
    ```

### 3.3. `shared_game_logic/engine.ts` (수정)

*   **역할**: 기존 게임 로직에 더해, 외부(RL 에이전트)로부터의 제어를 허용하는 인터페이스를 제공한다.
*   **추가/수정 함수**:
    *   `applyExternalAction(action: number)`: RL 에이전트로부터 받은 숫자 형식의 `action`을 실제 게임 입력으로 변환하여 적용한다.
    *   `getObservationForAgent(): number[]`: 현재 게임 상태(플레이어/상대 위치, 체력, 상태 등)를 RL 에이전트가 사용할 숫자 배열(numpy array) 형태로 수집하여 반환한다.
*   **Export**:
    ```typescript
    export {
      // ... 기존 export 항목들 ...
      applyExternalAction,
      getObservationForAgent
    };
    ```

## 4. Import/Export 전략

**오류 방지를 위해 다음 규칙을 엄격히 준수한다.**

1.  **Alias 사용**: `tsconfig.json`에 정의된 `@/*` alias를 사용하여 모든 `import` 경로를 작성한다. `@`는 `arcade-clash/` 루트 디렉토리를 가리킨다. **상대 경로(`../`, `./`) 사용을 금지한다.**

2.  **명시적 경로 사용 예시**:

    *   `RLAgentController`를 `GameScreen`에서 가져올 때:
        ```typescript
        // GOOD
        import RLAgentController from '@/components/RLAgentController';

        // BAD
        import RLAgentController from './RLAgentController';
        ```

    *   `engine`의 함수를 `RLAgentController`에서 사용할 때:
        ```typescript
        // GOOD
        import { applyExternalAction, getObservationForAgent } from '@/shared_game_logic/engine';

        // BAD
        import { applyExternalAction, getObservationForAgent } from '../shared_game_logic/engine';
        ```

3.  **`index.ts`를 통한 Export 지양**: 각 파일은 필요한 모듈을 직접 `export`하고, `import`하는 측에서도 해당 파일 경로를 명시적으로 사용한다. 이는 경로 추적을 용이하게 한다.

이 명세를 통해 프론트엔드 개발 시 발생할 수 있는 경로 문제를 최소화하고, 코드의 일관성과 가독성을 확보할 수 있다.
