### **WebRTC 및 롤백 넷코드 아키텍처 구현 명세 및 정의서 - 백엔드**

**목표:** WebRTC P2P 데이터 채널 및 롤백 넷코드 기반의 저지연 격투 게임 아키텍처 구현을 위한 백엔드(시그널링 서버)의 핵심 API, 인터페이스, 클래스, 함수들을 정의합니다.

---

#### **1. 시그널링 서버 (백엔드)**

시그널링 서버는 플레이어 간의 P2P 연결을 협상하고 매치메이킹을 중개하는 역할을 합니다. WebSocket 프로토콜을 사용하여 클라이언트와 통신합니다.

**1.1. WebSocket API 엔드포인트 및 메시지 구조**

*   **엔드포인트:** `/ws/signal`
*   **프로토콜:** WebSocket Secure (WSS)

**1.1.1. 클라이언트 -> 서버 메시지 (요청)**

| 메시지 타입 (`type`) | 설명 | 페이로드 (`payload`) |
| :------------------- | :--- | :------------------- |
| `join_lobby` | 로비에 참여 요청 | `{ "playerId": string, "playerName": string }` |
| `leave_lobby` | 로비에서 나가기 요청 | `{ "playerId": string }` |
| `request_match` | 특정 플레이어에게 매치 요청 | `{ "requesterId": string, "targetId": string }` |
| `accept_match` | 매치 요청 수락 | `{ "accepterId": string, "requesterId": string }` |
| `decline_match` | 매치 요청 거절 | `{ "declinerId": string, "requesterId": string }` |
| `send_sdp_offer` | WebRTC SDP Offer 전송 | `{ "senderId": string, "receiverId": string, "sdp": string }` |
| `send_sdp_answer` | WebRTC SDP Answer 전송 | `{ "senderId": string, "receiverId": string, "sdp": string }` |
| `send_ice_candidate` | WebRTC ICE Candidate 전송 | `{ "senderId": string, "receiverId": string, "candidate": RTCIceCandidate }` |
| `cancel_match_request` | 매치 요청 취소 | `{ "requesterId": string, "targetId": string, "sessionId": string }` |

**추가 고려사항:**
*   **세션 ID (Nonce):** 각 매치 요청 및 관련 SDP/ICE 메시지에는 고유한 `sessionId`를 포함하여 메시지 라우팅 및 순서 경합 문제를 방지합니다.
*   **상태 전이 검증:** 매치 요청 (`request_match`), 수락 (`accept_match`), 거절 (`decline_match`) 등의 메시지는 시그널링 서버의 내부 상태 머신에 따라 유효한 전이인지 검증되어야 합니다 (예: `Requested` 상태에서만 `Accepted` 또는 `Declined`로 전이 가능).

**1.1.2. 서버 -> 클라이언트 메시지 (응답/알림)**

| 메시지 타입 (`type`) | 설명 | 페이로드 (`payload`) |
| :------------------- | :--- | :------------------- |
| `lobby_update` | 로비 플레이어 목록 업데이트 | `{ "players": [{ "playerId": string, "playerName": string, "status": "available" | "in_match" }] }` |
| `match_request_received` | 매치 요청 수신 알림 | `{ "requesterId": string, "requesterName": string, "sessionId": string }` |
| `match_request_accepted` | 매치 요청 수락 알림 | `{ "accepterId": string, "accepterName": string, "sessionId": string }` |
| `match_request_declined` | 매치 요청 거절 알림 | `{ "declinerId": string, "declinerName": string, "sessionId": string }` |
| `sdp_offer_received` | SDP Offer 수신 알림 | `{ "senderId": string, "sdp": string, "sessionId": string }` |
| `sdp_answer_received` | SDP Answer 수신 알림 | `{ "senderId": string, "sdp": string, "sessionId": string }` |
| `ice_candidate_received` | ICE Candidate 수신 알림 | `{ "senderId": string, "candidate": RTCIceCandidate, "sessionId": string }` |
| `match_started` | 매치 시작 알림 (P2P 연결 성공) | `{ "opponentId": string, "opponentName": string, "sessionId": string }` |
| `error` | 서버 오류 알림 | `{ "code": number, "message": string, "sessionId"?: string }` |

**1.2. 시그널링 서버 클래스/함수 (Python/Node.js)**

*   **`WebSocketServer` 클래스:**
    *   **목적:** WebSocket 연결을 관리하고 메시지를 라우팅합니다.
    *   **속성:**
        *   `connections: Map<string, WebSocket>`: `playerId`를 키로 하는 활성 WebSocket 연결 맵.
        *   `lobby: Map<string, PlayerInfo>`: 로비에 있는 플레이어 정보 맵.
        *   `matchSessions: Map<string, MatchSession>`: `sessionId`를 키로 하는 활성 매치 세션 맵.
        *   `playerAuthTokens: Map<string, string>`: `playerId`별 인증 토큰 (예: JWT).
    *   **메서드:**
        *   `handle_new_connection(ws: WebSocket, request: Request)`: 새 WebSocket 연결 처리. `playerId` 추출 및 `connections`에 추가. **(인증 토큰 검증 로직 포함)**
        *   `handle_message(ws: WebSocket, message: string)`: 클라이언트 메시지 파싱 및 해당 핸들러 호출. **(메시지 유효성 및 권한 검증 포함)**
        *   `handle_close(ws: WebSocket, playerId: string)`: WebSocket 연결 종료 처리. `connections` 및 `lobby`에서 제거.
        *   `send_to_player(playerId: string, message: object)`: 특정 플레이어에게 메시지 전송.
        *   `broadcast_lobby_update()`: 로비에 있는 모든 플레이어에게 `lobby_update` 메시지 브로드캐스트. **(오류/혼잡 제어: 디바운스, 스냅샷 주기 제한, 연결별 백프레셔 큐 및 드롭 정책 구현)**
        *   `validate_match_transition(sessionId: string, playerId: string, action: string): boolean`: 매치 세션의 상태 전이를 검증합니다.
*   **`PlayerInfo` 인터페이스/클래스:**
    *   **목적:** 로비에 있는 플레이어 정보를 저장합니다.
    *   **속성:**
        *   `playerId: string`
        *   `playerName: string`
        *   `status: "available" | "in_match"`
*   **`MatchSession` 인터페이스/클래스:**
    *   **목적:** 진행 중인 매치 세션의 상태를 관리합니다.
    *   **속성:**
        *   `sessionId: string`
        *   `player1Id: string`
        *   `player2Id: string`
        *   `status: "requested" | "accepted" | "declined" | "connecting" | "connected" | "failed"`
        *   `createdAt: Date`

**1.3. 기술 스택 및 라이브러리 권장 사항**

시그널링 서버는 주로 I/O 바운드 작업이므로, 비동기 처리에 강점이 있는 프레임워크를 사용하는 것이 중요합니다. 기존 백엔드가 Python 기반이므로 Python을 우선 고려하되, Node.js도 강력한 대안이 될 수 있습니다.

**1.3.1. Python 기반 시그널링 서버**

*   **언어:** Python 3.8+ (현재 프로젝트의 `backend/requirements.txt`에 명시된 Python 버전과 호환성 확인)
*   **웹소켓 라이브러리:** `websockets`
    *   **권장 버전:** `~=10.0` (최신 안정 버전 사용 권장)
    *   **호환성:** Python의 `asyncio`와 완벽하게 통합되어 비동기 웹소켓 서버 구현에 적합합니다. 현재 백엔드 환경과 호환됩니다.
    *   **공식 문서:** [https://websockets.readthedocs.io/en/stable/](https://websockets.readthedocs.io/en/stable/)
*   **비동기 프레임워크:** `asyncio` (Python 내장)
    *   **권장 버전:** Python 버전에 포함된 버전 사용.
    *   **호환성:** `websockets` 라이브러리의 기반이 되며, Python의 표준 비동기 처리 방식입니다.
    *   **공식 문서:** [https://docs.python.org/3/library/asyncio.html](https://docs.python.org/3/library/asyncio.html)
*   **인증/권한:** `PyJWT` (JWT 토큰 생성 및 검증)
    *   **권장 버전:** `~=2.0.0`
    *   **공식 문서:** [https://pyjwt.readthedocs.io/en/stable/](https://pyjwt.readthedocs.io/en/stable/)
*   **STUN/TURN 서버:** `coturn` (별도 설치 및 운영 필요)
    *   **권장 버전:** 최신 안정 버전 (예: `4.5.2` 이상)
    *   **호환성:** WebRTC 표준을 따르므로 언어/프레임워크에 독립적입니다. 서버 OS (Linux)에 설치됩니다.
    *   **공식 문서:** [https://github.com/coturn/coturn](https://github.com/coturn/coturn)

**1.3.2. Node.js 기반 시그널링 서버 (대안)**

*   **언어:** Node.js 16+ (LTS 버전 권장)
*   **웹소켓 라이브러리:** `ws` 또는 `socket.io`
    *   **`ws` (경량, 순수 WebSocket):**
        *   **권장 버전:** `~=8.0.0`
        *   **호환성:** Node.js 환경에서 고성능 WebSocket 서버 구현에 적합합니다.
        *   **공식 문서:** [https://github.com/websockets/ws](https://github.com/websockets/ws)
    *   **`socket.io` (추상화된 WebSocket, 재연결 등 편의 기능 제공):**
        *   **권장 버전:** `~=4.0.0`
        *   **호환성:** `ws`보다 높은 수준의 추상화를 제공하며, 자동 재연결, 폴링 대체 등 추가 기능이 필요할 때 유용합니다.
        *   **공식 문서:** [https://socket.io/docs/v4/](https://socket.io/docs/v4/)
*   **인증/권한:** `jsonwebtoken` (JWT 토큰 생성 및 검증)
    *   **권장 버전:** `~=9.0.0`
    *   **공식 문서:** [https://github.com/auth0/node-jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)
*   **STUN/TURN 서버:** `coturn` (Python 기반과 동일)

**1.3.3. 데이터 직렬화/역직렬화 (선택 사항)**

시그널링 메시지는 일반적으로 JSON을 사용하지만, 더 효율적인 바이너리 직렬화가 필요하다면 다음을 고려할 수 있습니다.

*   **Python:** `msgpack`
    *   **권장 버전:** `~=1.0.0`
    *   **공식 문서:** [https://msgpack.org/](https://msgpack.org/)
*   **Node.js:** `msgpack-lite`
    *   **권장 버전:** `~=0.1.0`
    *   **공식 문서:** [https://github.com/kawanet/msgpack-lite](https://github.com/kawanet/msgpack-lite)

---
