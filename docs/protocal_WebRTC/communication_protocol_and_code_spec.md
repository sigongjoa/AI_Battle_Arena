# WebRTC 통신 프로토콜 및 코드 명세서

이 문서는 AI Battle Arena 프로젝트의 WebRTC 기반 통신 프로토콜과 관련 코드 구현에 대한 상세 명세입니다. 시그널링 서버와 클라이언트 간의 메시지 구조, WebRTC 클라이언트의 동작 방식, 데이터 채널을 통한 데이터 교환 방식 등을 다룹니다.

---

## 1. 전체 통신 아키텍처 개요

AI Battle Arena는 저지연 온라인 대전을 위해 WebRTC P2P 데이터 채널과 롤백 넷코드를 활용합니다. 통신은 크게 두 단계로 나뉩니다.

1.  **시그널링 (Signaling):** 플레이어들이 P2P 연결을 수립하기 전, 시그널링 서버를 통해 서로의 네트워크 정보(SDP, ICE Candidate)를 교환하고 매치메이킹을 진행합니다. 이 과정에서 PeerJS PeerServer가 사용됩니다.
2.  **P2P 데이터 채널 (P2P Data Channel):** 시그널링 과정을 통해 P2P 연결이 수립되면, 클라이언트들은 시그널링 서버의 중개 없이 직접 데이터 채널을 통해 게임 데이터를 교환합니다.

### PeerJS의 역할

`PeerJS`는 WebRTC의 복잡한 Offer/Answer, ICE Candidate 교환 과정을 추상화하여 P2P 연결 설정을 간소화합니다. 별도의 PeerJS PeerServer 인스턴스(`backend/peerjs_server.js`)를 운영하여 PeerJS 클라이언트 간의 시그널링을 처리합니다.

---

## 2. 시그널링 서버 프로토콜 (백엔드: `backend/signaling/server.py`)

시그널링 서버는 플레이어 간의 P2P 연결을 협상하고 매치메이킹을 중개하는 역할을 합니다. WebSocket 프로토콜을 사용하여 클라이언트와 통신합니다.

### 2.1. WebSocket API 엔드포인트 및 메시지 구조

*   **엔드포인트:** `/ws/signal`
*   **프로토콜:** WebSocket Secure (WSS)

#### 2.1.1. 클라이언트 -> 서버 메시지 (요청)

| 메시지 타입 (`type`) | 설명 | 페이로드 (`payload`) |
| :------------------- | :--- | :------------------- |
| `register` | 플레이어 등록 요청 | `{ "playerId": string }` |
| `join_lobby` | 로비에 참여 요청 | `{ "playerName": string }` |
| `leave_lobby` | 로비에서 나가기 요청 | `{ "playerId": string }` |
| `request_match` | 특정 플레이어에게 매치 요청 | `{ "targetId": string }` |
| `accept_match` | 매치 요청 수락 | `{ "sessionId": string }` |
| `decline_match` | 매치 요청 거절 | `{ "sessionId": string }` |
| `send_peer_id` | PeerJS 피어 ID 전송 | `{ "targetId": string, "peerId": string }` |
| `send_peerjs_signal` | PeerJS 시그널링 데이터 전송 | `{ "senderId": string, "receiverId": string, "signal": any }` |
| `cancel_match_request` | 매치 요청 취소 | `{ "requesterId": string, "targetId": string, "sessionId": string }` |

#### 2.1.2. 서버 -> 클라이언트 메시지 (응답/알림)

#### 2.1.3. 통신 프로토콜 순서도 (Flowchart)

```
[클라이언트 A]                               [시그널링 서버]                               [클라이언트 B]
      |                                       |                                       |
      | --- connect(playerId) --------------->|                                       |
      | <--- registered(playerId) ------------|                                       |
      |                                       |                                       |
      | --- join_lobby(playerName) ----------->|                                       |
      | <--- lobby_update(players) -----------|------------------------------------->|
      |                                       |                                       |
      | --- request_match(targetId) --------->|                                       |
      |                                       | <--- match_request_received(reqId, reqName, sessionId) ---|
      |                                       |                                       |
      |                                       | --- accept_match(sessionId) --------->|
      | <--- match_request_accepted(accId, sessionId) ---|                                       |
      |                                       |                                       |
      | --- WebRtcClient(initiator=true) ---->|                                       |
      | --- PeerJS.on('open') --------------->|                                       |
      | --- send_peer_id(targetId, localPeerJsId) ->|                                       |
      |                                       | <--- peerId(senderId, remotePeerJsId) ---|
      |                                       |                                               |
      |                                       | --- WebRtcClient(initiator=false) ---->|
      |                                       | --- PeerJS.on('open') --------------->|
      |                                       | --- send_peer_id(targetId, localPeerJsId) ->|
      | <--- peerId(senderId, remotePeerJsId) ---|                                       |
      |                                       |                                       |
      | --- PeerJS.connect(remotePeerJsId) --->|                                       |
      |                                       | <--- PeerJS.on('connection') ----------|
      |                                       |                                       |
      | --- DataChannel.on('open') ----------->|                                       |
      | <--- DataChannel.on('open') -----------|                                       |
      |                                       |                                       |
      | <--- match_started(opponentId, opponentName, sessionId) ---|------------------------------------->|
      |                                       |                                       |
      | <--- P2P Data Channel Communication (GameInput, GameStateSync, Metadata) --->|
      |                                       |                                       |
```

#### 2.1.2. 서버 -> 클라이언트 메시지 (응답/알림)

| 메시지 타입 (`type`) | 설명 | 페이로드 (`payload`) |
| :------------------- | :--- | :------------------- |
| `registered` | 플레이어 등록 완료 알림 | `{ "playerId": string }` |
| `lobby_update` | 로비 플레이어 목록 업데이트 | `{ "players": [{ "playerId": string, "playerName": string, "status": "available" | "in_match" }] }` |
| `match_request_received` | 매치 요청 수신 알림 | `{ "requesterId": string, "requesterName": string, "sessionId": string }` |
| `match_request_accepted` | 매치 요청 수락 알림 | `{ "accepterId": string, "accepterName": string, "sessionId": string }` |
| `match_request_declined` | 매치 요청 거절 알림 | `{ "declinerId": string, "declinerName": string, "sessionId": string }` |
| `peerId` | PeerJS 피어 ID 수신 알림 | `{ "senderId": string, "peerId": string }` |
| `peerjs_signal_received` | PeerJS 시그널링 데이터 수신 알림 | `{ "senderId": string, "signal": any, "sessionId": string }` |
| `match_started` | 매치 시작 알림 (P2P 연결 성공) | `{ "opponentId": string, "opponentName": string, "sessionId": string }` |
| `error` | 서버 오류 알림 | `{ "code": number, "message": string, "sessionId"?: string }` |

### 2.2. 시그널링 서버 주요 클래스/함수 (Python)

*   **`WebSocketServer` 클래스:** WebSocket 연결 관리, 메시지 라우팅, 플레이어 및 매치 세션 정보 관리.
*   **`PlayerInfo` 인터페이스/클래스:** 로비에 있는 플레이어 정보 저장 (`playerId`, `playerName`, `status`).
*   **`MatchSession` 인터페이스/클래스:** 진행 중인 매치 세션 상태 관리 (`sessionId`, `player1Id`, `player2Id`, `status`).

---

## 3. WebRTC 클라이언트 구현 (프론트엔드: `arcade-clash`)

프론트엔드 클라이언트는 `SignalingClient`를 통해 시그널링 서버와 통신하고, `WebRtcClient`를 통해 `PeerJS` 기반의 P2P 연결을 관리합니다.

### 3.1. `SignalingClient` 클래스 (`arcade-clash/src/webrtc/signaling.ts`)

*   **목적:** 시그널링 서버와의 WebSocket 통신을 관리합니다.
*   **속성:** `ws`, `playerId`, `signalingServerUrl`.
*   **메서드:**
    *   `connect(playerId: string)`: WebSocket 연결을 설정하고 플레이어를 등록합니다.
    *   `send(message: SignalingMessage)`: 시그널링 서버로 메시지를 전송합니다.
    *   `joinLobby(playerName: string)`: 로비 참여 메시지를 전송합니다.
    *   `requestMatch(targetId: string)`: 매치 요청 메시지를 전송합니다.
    *   `acceptMatch(sessionId: string)`: 매치 수락 메시지를 전송합니다.
    *   `declineMatch(sessionId: string)`: 매치 거절 메시지를 전송합니다.
    *   `sendPeerId(targetId: string, peerId: string)`: 상대방에게 로컬 PeerJS ID를 전송합니다.
    *   `sendPeerJSSignal(targetId: string, signalData: any)`: PeerJS 시그널링 데이터를 전송합니다.
    *   `disconnect()`: WebSocket 연결을 종료합니다.

### 3.2. `WebRtcClient` 클래스 (`arcade-clash/src/webrtc/client.ts`)

*   **목적:** `PeerJS` 라이브러리를 사용하여 WebRTC P2P 연결 및 `DataConnection`을 관리합니다.
*   **속성:** `peer`, `signalingClient`, `remotePlayerId`, `localPlayerId`, `conn`, `initiator`.
*   **메서드:**
    *   `constructor(options: WebRtcClientOptions)`: `PeerJS` 피어 인스턴스를 생성하고 이벤트 리스너를 설정합니다. (이 과정에서 `this.initPeer()` 호출은 제거됨)
    *   `setupPeerListeners()`: `PeerJS` 피어 이벤트(`open`, `connection`, `disconnected`, `error`)를 처리합니다.
    *   `handleRemotePeerId(remotePeerId: string)`: 시그널링 서버로부터 원격 PeerJS ID를 수신했을 때 처리합니다.
    *   `connectToRemotePeer(remotePeerId: string)`: 원격 피어에게 데이터 연결을 요청합니다.
    *   `setupDataConnectionListeners(conn: DataConnection)`: 데이터 연결 이벤트(`open`, `data`, `close`, `error`)를 처리합니다.
    *   `send(data: string | Buffer | ArrayBuffer | Blob)`: 현재 활성화된 데이터 연결을 통해 데이터를 전송합니다.
    *   `destroy()`: PeerJS 피어 및 데이터 연결을 종료합니다.

---

## 4. 데이터 채널 프로토콜

WebRTC 데이터 채널을 통해 교환되는 주요 데이터 구조는 다음과 같습니다.

### 4.1. `GameInput` 채널

*   **목적:** 플레이어의 입력 데이터를 실시간으로 전송합니다.
*   **특징:** 비신뢰성, 비순서 (`ordered: false, maxRetransmits: 0`)로 설정하여 지연을 최소화합니다.
*   **데이터 구조 (`PlayerInput`):**
    ```typescript
    interface PlayerInput {
      frame: number; // 입력이 발생한 게임 프레임 번호
      playerId: string; // 입력 플레이어 ID
      inputs: { [key: string]: boolean }; // 버튼 상태 (예: { "punch": true, "kick": false, "left": true })
    }
    ```

### 4.2. `GameStateSync` 채널

*   **목적:** 초기 게임 상태, 주기적인 상태 체크섬, 중요 게임 이벤트 등을 전송하여 게임 상태의 동기화를 돕습니다.
*   **특징:** 신뢰성, 순서 (`ordered: true`)로 설정하여 데이터 무결성을 보장합니다.
*   **데이터 구조 (`GameStateSnapshot`):**
    ```typescript
    interface GameStateSnapshot {
      frame: number; // 스냅샷/이벤트가 발생한 게임 프레임 번호
      checksum: string; // 게임 상태의 결정론적 체크섬 (비동기화 감지용)
      initialGameState?: any; // (선택적) 초기 게임 상태 (캐릭터 선택, 스테이지 등)
      event?: "round_start" | "ko" | "rematch_request"; // (선택적) 중요 게임 이벤트
    }
    ```

### 4.3. `Metadata` 채널

*   **목적:** 채팅 메시지, 연결 상태 알림 등 게임 플레이에 직접적이지 않은 부가 정보를 전송합니다.
*   **특징:** 신뢰성, 순서 (`ordered: true`)로 설정합니다.
*   **데이터 구조 (예시):**
    ```typescript
    interface ChatMessage {
      senderId: string;
      message: string;
      timestamp: number;
    }

    interface ConnectionStatus {
      playerId: string;
      status: "connected" | "disconnected";
    }
    ```

---

## 5. 주요 코드 변경 사항 요약

구현 과정에서 발생한 주요 코드 변경 사항은 다음과 같습니다.

*   **`arcade-clash/src/webrtc/client.ts`**:
    *   `WebRtcClient` 생성자에서 `this.initPeer()` 호출이 제거되었습니다. `PeerJS` 인스턴스 초기화는 생성자 내부에서 직접 처리됩니다.
*   **`arcade-clash/components/GameScreen.tsx`**:
    *   `webRtcClient.sendData` 호출이 `webRtcClient.send`로 변경되었습니다.
    *   `webRtcClient.on('dataChannelMessage', ...)` 이벤트 리스너가 `webRtcClient.on('data', ...)`로 변경되었습니다.

---

## 6. E2E 테스트를 통한 검증

위에서 정의된 프로토콜과 구현은 E2E 테스트를 통해 검증되었습니다. 두 명의 플레이어가 로비에 입장하고, 매치 요청 및 수락 과정을 거쳐 WebRTC P2P 연결이 성공적으로 수립되었으며, 게임 입력 데이터가 데이터 채널을 통해 정상적으로 송수신됨을 확인했습니다.
