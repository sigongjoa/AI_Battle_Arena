# 로비 기능 상세 설계 명세서 (Lobby Feature Design Spec)

이 문서는 `MainMenu.tsx`에 통합되어 있는 로비 관련 기능을 별도의 `LobbyPage.tsx` 컴포넌트로 분리하고, 관련 하위 컴포넌트들을 설계하기 위한 상세 명세입니다.

---

### 1. 와이어프레임 (Wireframe)

텍스트 기반으로 로비 UI의 두 가지 주요 상태(로비 입장 전, 로비 입장 후)와 매치 요청 모달을 표현합니다.

**상태 1: 로비 입장 전**

```
+----------------------------------------------------+
|                                                    |
|                    Online Lobby                    |
|               Status: Disconnected                 |
|                                                    |
|   +----------------------------------------------+   |
|   | Enter your name...                           |   |
|   +----------------------------------------------+   |
|                                                    |
|   +----------------------------------------------+   |
|   |                  Join Lobby                  |   |
|   +----------------------------------------------+   |
|                                                    |
|   <-- Back to Main Menu                            |
|                                                    |
+----------------------------------------------------+
```

**상태 2: 로비 입장 후**

```
+----------------------------------------------------+
|                                                    |
|                    Online Lobby                    |
|                Status: Connected                   |
|                                                    |
|   Available Players:                               |
|   +----------------------------------------------+   |
|   | Player A (available)         [Request Match] |   |
|   | Player B (in_match)          [Unavailable]   |   |
|   | Player C (available)         [Request Match] |   |
|   +----------------------------------------------+   |
|                                                    |
|   <-- Back to Main Menu                            |
|                                                    |
+----------------------------------------------------+
```

**팝업: 매치 요청 수신 시**

```
+----------------------------------------------------+
|                                                    |
|   +--------------------------------------------+   |
|   |                                            |   |
|   |               Match Request                |   |
|   |                                            |   |
|   |        'Player A' wants to fight!          |   |
|   |                                            |   |
|   |   +-----------------+ +------------------+   |   |
|   |   |     Accept      | |     Decline    |   |   |
|   |   +-----------------+ +------------------+   |   |
|   |                                            |   |
|   +--------------------------------------------+   |
|                                                    |
+----------------------------------------------------+
```

---

### 2. 기능 명세 및 사용자 플로우

1.  **로비 진입:**
    *   사용자가 메인 메뉴에서 'Online Lobby'를 선택하면 로비 페이지로 이동합니다.
    *   시그널링 서버에 연결되어 있지 않으면, '이름 입력 필드'와 'Join Lobby' 버튼이 표시됩니다.
    *   사용자가 이름을 입력하고 'Join Lobby'를 클릭하면, `join_lobby` 메시지를 서버로 전송합니다.
2.  **로비 상태 표시:**
    *   서버로부터 `lobby_update` 메시지를 받으면, 플레이어 목록이 화면에 갱신됩니다.
    *   자신을 제외한 다른 플레이어들이 목록에 표시됩니다.
3.  **매치 요청:**
    *   'available' 상태인 다른 플레이어 옆의 'Request Match' 버튼을 클릭합니다.
    *   `request_match` 메시지가 대상 플레이어 ID와 함께 서버로 전송됩니다.
4.  **매치 수신 및 응답:**
    *   다른 플레이어로부터 매치 요청을 받으면 `match_request_received` 메시지가 수신되고, 'Match Request' 모달이 화면에 표시됩니다.
    *   'Accept' 버튼 클릭 시 `accept_match` 메시지를, 'Decline' 버튼 클릭 시 `decline_match` 메시지를 서버로 전송합니다.

---

### 3. 컴포넌트 설계

| 컴포넌트 파일명 | 역할 | Props (속성) | 주요 책임 |
| :--- | :--- | :--- | :--- |
| `LobbyPage.tsx` | 로비 기능 전체를 감싸는 컨테이너 | `(App.tsx로부터 상태와 핸들러 함수들)` | - 로비 관련 상태에 따라 `JoinLobbyForm` 또는 `PlayerList`를 조건부 렌더링<br>- `MatchRequestModal`을 조건부 렌더링 |
| `PlayerList.tsx` | 플레이어 목록 UI | `players: Player[]`, `onRequestMatch: (playerId) => void` | - 플레이어 배열을 순회하며 `PlayerListItem`을 렌더링 |
| `PlayerListItem.tsx` | 목록의 개별 플레이어 항목 | `player: Player`, `onRequestMatch: (playerId) => void` | - 플레이어 이름, 상태 표시<br>- 'Request Match' 버튼 및 클릭 이벤트 처리 |
| `LobbyStatus.tsx` | 서버 연결 상태 UI | `connectionStatus: string` | - 'Connecting...', 'Connected' 등의 상태 텍스트 표시 |
| `JoinLobbyForm.tsx` | 로비 입장 폼 UI | `onJoinLobby: (playerName) => void` | - 이름 입력 필드와 'Join Lobby' 버튼 렌더링 |
| `MatchRequestModal.tsx` | 매치 요청 수신 팝업 UI | `request: MatchRequest`, `onAccept: () => void`, `onDecline: () => void` | - 요청자 이름 표시<br>- 'Accept', 'Decline' 버튼 및 이벤트 처리 |

---

### 4. API 명세 (WebSocket Messages)

**Client -> Server**

*   `join_lobby`: 로비 참여 요청
    *   `{ "type": "join_lobby", "playerName": string }`
*   `request_match`: 특정 플레이어에게 매치 요청
    *   `{ "type": "request_match", "targetId": string }`
*   `accept_match`: 매치 요청 수락
    *   `{ "type": "accept_match", "sessionId": string }`
*   `decline_match`: 매치 요청 거절
    *   `{ "type": "decline_match", "sessionId": string }`

**Server -> Client**

*   `lobby_update`: 로비 플레이어 목록 업데이트
    *   `{ "type": "lobby_update", "players": [{ "playerId": string, "playerName": string, "status": "available" | "in_match" }] }`
*   `match_request_received`: 매치 요청 수신 알림
    *   `{ "type": "match_request_received", "requesterId": string, "requesterName": string, "sessionId": string }`
*   `match_request_accepted`: 매치 요청 수락 알림
    *   `{ "type": "match_request_accepted", "accepterId": string, "sessionId": string }`
*   `match_request_declined`: 매치 요청 거절 알림
    *   `{ "type": "match_request_declined", "declinerId": string, "sessionId": string }`

---

### 5. 테스트 케이스 (Vitest + Testing Library 예시)

`LobbyPage.test.tsx` 파일 예시입니다.

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import LobbyPage from './LobbyPage'; // 가상의 LobbyPage 컴포넌트

describe('LobbyPage', () => {
  const mockOnJoinLobby = vi.fn();
  const mockOnRequestMatch = vi.fn();

  it('should render JoinLobbyForm when disconnected', () => {
    render(<LobbyPage connectionStatus="Disconnected" onJoinLobby={mockOnJoinLobby} />);

    // 이름 입력 필드와 'Join Lobby' 버튼이 보이는지 확인
    expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Join Lobby/i })).toBeInTheDocument();
  });

  it('should call onJoinLobby when form is submitted', () => {
    render(<LobbyPage connectionStatus="Disconnected" onJoinLobby={mockOnJoinLobby} />);

    const input = screen.getByPlaceholderText('Enter your name');
    const button = screen.getByRole('button', { name: /Join Lobby/i });

    fireEvent.change(input, { target: { value: 'Zesky' } });
    fireEvent.click(button);

    // onJoinLobby 함수가 'Zesky'라는 인자와 함께 호출되었는지 확인
    expect(mockOnJoinLobby).toHaveBeenCalledWith('Zesky');
  });

  it('should render PlayerList when connected to lobby', () => {
    const mockPlayers = [
      { playerId: 'p1', playerName: 'Player One', status: 'available' },
      { playerId: 'p2', playerName: 'Player Two', status: 'in_match' },
    ];

    render(<LobbyPage connectionStatus="Connected to Lobby" players={mockPlayers} onRequestMatch={mockOnRequestMatch} />);

    // 플레이어 이름들이 보이는지 확인
    expect(screen.getByText('Player One (available)')).toBeInTheDocument();
    expect(screen.getByText('Player Two (in_match)')).toBeInTheDocument();
  });

  it('should call onRequestMatch when Request Match button is clicked', () => {
    const mockPlayers = [
      { playerId: 'p1', playerName: 'Player One', status: 'available' },
    ];

    render(<LobbyPage connectionStatus="Connected to Lobby" players={mockPlayers} onRequestMatch={mockOnRequestMatch} />);

    const requestButton = screen.getByRole('button', { name: /Request Match/i });
    fireEvent.click(requestButton);

    // onRequestMatch 함수가 'p1' ID와 함께 호출되었는지 확인
    expect(mockOnRequestMatch).toHaveBeenCalledWith('p1');
  });

  it('should render MatchRequestModal when a match request is received', () => {
    const mockMatchRequest = {
      requesterId: 'p99',
      requesterName: 'Challenger',
      sessionId: 'session123',
    };

    render(<LobbyPage matchRequest={mockMatchRequest} />);

    // 모달의 내용이 올바르게 표시되는지 확인
    expect(screen.getByText('Match Request')).toBeInTheDocument();
    expect(screen.getByText(/Challenger wants to fight!/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Accept/i })).toBeInTheDocument();
  });
});
```
