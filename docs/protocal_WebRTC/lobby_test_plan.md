# 로비 페이지 기능 테스트 계획서 (Lobby Page Feature Test Plan)

이 문서는 `lobby_design_spec.md`에 정의된 로비 페이지 및 관련 하위 컴포넌트들의 기능과 UI가 올바르게 작동하는지 검증하기 위한 테스트 계획을 정의합니다.

---

### 1. 테스트 환경 (Test Environment)

*   **애플리케이션 환경:**
    *   **프론트엔드:** Vite 개발 서버
    *   **백엔드:** Python WebRTC 시그널링 서버
*   **테스트 프레임워크:**
    *   **컴포넌트 테스트:** `Vitest`와 `@testing-library/react`
    *   **E2E 테스트:** `chrome-devtools` (MCP)

---

### 2. 테스트 진행 방향 (Test Procedure)

테스트는 개별 컴포넌트의 동작을 확인하는 단위/통합 테스트와, 전체 사용자 흐름을 검증하는 E2E 테스트로 나누어 진행합니다.

#### 1단계: 컴포넌트 단위 테스트

각 컴포넌트를 독립적으로 렌더링하여 기능이 정확히 동작하는지 확인합니다.

*   **`JoinLobbyForm.tsx` 테스트:**
    1.  초기 렌더링 시, 이름 입력 필드와 'Join Lobby' 버튼이 표시되는지 확인합니다.
    2.  입력 필드에 텍스트를 입력했을 때, 값이 올바르게 변경되는지 확인합니다.
    3.  이름을 입력하고 버튼을 클릭하면, `onJoinLobby` 함수가 해당 이름과 함께 호출되는지 검증합니다.

*   **`PlayerList.tsx` / `PlayerListItem.tsx` 테스트:**
    1.  `players` 속성으로 플레이어 배열을 전달했을 때, 모든 플레이어의 이름과 상태가 화면에 렌더링되는지 확인합니다.
    2.  `players` 배열이 비어있을 때, "No other players..."와 같은 안내 메시지가 표시되는지 확인합니다.
    3.  플레이어 상태가 `in_match`일 경우, 'Request Match' 버튼이 비활성화되는지 확인합니다.
    4.  'Request Match' 버튼을 클릭하면, `onRequestMatch` 함수가 정확한 `playerId`와 함께 호출되는지 검증합니다.

*   **`MatchRequestModal.tsx` 테스트:**
    1.  `matchRequest` 속성이 `null`일 때, 모달이 화면에 보이지 않는 것을 확인합니다.
    2.  `matchRequest` 객체가 전달되었을 때, 모달이 화면에 나타나고 요청자의 이름이 올바르게 표시되는지 확인합니다.
    3.  'Accept' 버튼 클릭 시 `onAccept` 함수가, 'Decline' 버튼 클릭 시 `onDecline` 함수가 호출되는지 검증합니다.

#### 2단계: E2E(End-to-End) 테스트

`chrome-devtools`를 사용하여 실제 사용자의 전체 흐름을 시뮬레이션하고 검증합니다.

1.  **사용자 1, 로비 입장:**
    *   `navigate_page`로 메인 페이지 접속 후 `take_snapshot`으로 UI 확인.
    *   `click`으로 'Online Lobby' 버튼 클릭.
    *   `take_snapshot`으로 `JoinLobbyForm`이 보이는지 확인.
    *   `fill`로 이름('Player 1') 입력 후, `click`으로 'Join Lobby' 버튼 클릭.
    *   `take_snapshot`으로 플레이어 목록이 비어있는 로비 화면을 확인.

2.  **사용자 2, 로비 입장:**
    *   `new_page`로 새 탭을 열고 메인 페이지 접속.
    *   `select_page`로 제어 대상을 새 탭으로 변경.
    *   위와 동일하게 'Player 2'라는 이름으로 로비에 입장.

3.  **상태 동기화 확인:**
    *   `select_page`로 사용자 1의 탭을 다시 선택.
    *   `take_snapshot`으로 사용자 1의 화면에 'Player 2'가 보이는지 확인.

4.  **매치 요청 및 수락:**
    *   사용자 1의 화면에서 'Player 2' 옆의 'Request Match' 버튼을 `click`.
    *   `select_page`로 사용자 2의 탭을 선택.
    *   `take_snapshot`으로 `MatchRequestModal`이 나타났는지 확인.
    *   모달의 'Accept' 버튼을 `click`.

5.  **최종 확인:**
    *   매치 수락 후, 두 사용자의 화면이 모두 게임 화면(또는 VS 화면)으로 전환되는지 `take_snapshot`으로 최종 확인.

---

### 3. 테스트 성공 판단 기준 (Success Criteria)

*   **컴포넌트 기능:**
    *   위에 명시된 모든 컴포넌트 단위 테스트 케이스를 통과해야 합니다.
    *   UI는 `lobby_design_spec.md`의 와이어프레임과 일치해야 합니다.

*   **상태 동기화:**
    *   새로운 플레이어가 로비에 입장하거나 퇴장했을 때, 1초 이내에 모든 클라이언트의 플레이어 목록이 정확하게 업데이트되어야 합니다.
    *   한 클라이언트의 매치 요청이 상대 클라이언트에게 즉시 모달 팝업으로 표시되어야 합니다.

*   **E2E 흐름:**
    *   2단계에 기술된 E2E 테스트 시나리오 전체가 중간에 오류 없이 성공적으로 완료되어야 합니다.
    *   최종적으로 매치가 성사되어 다음 화면으로 정상적으로 전환되어야 합니다.
